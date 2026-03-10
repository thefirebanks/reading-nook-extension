import {
  getItems,
  saveItem,
  updateItem,
  deleteItem,
  getStaleItems,
  getSettings,
  getStats,
  updateStats,
  recordRead,
  recordSave,
  updateSettings,
  batchUpdateItems,
} from '../../lib/storage';
import { pickNudgeItems, suggestSessionItems } from '../../lib/categories';
import { categorize } from '../../lib/categories';
import { generateId, getNudgeMessage } from '../../lib/utils';
import {
  enableBlocking,
  disableBlocking,
  clearAllBlockingRules,
} from '../../lib/blocking';
import type { ReadingItem, UserStats, WeekSummary } from '../../lib/types';

// Shared background state for the active focus-mode window.
let focusModeWindowId: number | null = null;
let focusModeItemId: string | null = null;

export default defineBackground(() => {
  // ─── Message handling ──────────────────────────────────────────

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    handleMessage(message)
      .then(sendResponse)
      .catch((err) => {
        console.error('Reading Nook: message handler error', err);
        sendResponse({ error: String(err) });
      });
    return true; // keep channel open for async response
  });

  // ─── Alarms ────────────────────────────────────────────────────

  chrome.alarms.create('nudge-check', { periodInMinutes: 60 });
  chrome.alarms.create('decay-check', { periodInMinutes: 60 * 24 }); // daily
  chrome.alarms.create('weekly-digest', { periodInMinutes: 60 * 24 * 7 }); // weekly

  chrome.alarms.onAlarm.addListener(async (alarm) => {
    switch (alarm.name) {
      case 'nudge-check':
        await handleNudgeCheck();
        break;
      case 'decay-check':
        await handleDecayCheck();
        break;
      case 'weekly-digest':
        await handleWeeklyDigest();
        break;
    }
  });

  // ─── Tab monitoring ────────────────────────────────────────────

  chrome.tabs.onCreated.addListener(async () => {
    const settings = await getSettings();
    if (!settings.nudgeEnabled) return;

    const tabs = await chrome.tabs.query({});
    if (tabs.length >= settings.tabThreshold) {
      const items = await getItems();
      const suggestions = pickNudgeItems(items);
      if (suggestions.length > 0) {
        await showNudgeNotification(suggestions);
      }
    }
  });

  // ─── Notification click handling ───────────────────────────────

  chrome.notifications.onClicked.addListener(async (notificationId) => {
    if (notificationId.startsWith('nudge-')) {
      const itemId = notificationId.replace('nudge-', '');
      const items = await getItems();
      const item = items.find((i) => i.id === itemId);
      if (item) {
        await openFocusMode(item);
      }
    }
  });

  // ─── Context menu ─────────────────────────────────────────────

  chrome.runtime.onInstalled.addListener(() => {
    // Clean up any leftover blocking rules from a previous session
    clearAllBlockingRules();

    // Reset any items stuck in "reading" status (e.g., from a crash or popup close)
    resetStuckReadingItems();

    chrome.contextMenus?.create({
      id: 'save-to-nook',
      title: 'Save to Reading Nook',
      contexts: ['page', 'link'],
    });
  });

  chrome.contextMenus?.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'save-to-nook') {
      const url = info.linkUrl || info.pageUrl;
      if (!url || !tab?.id) return;

      // Try to get metadata from content script
      try {
        const metadata = await chrome.tabs.sendMessage(tab.id, {
          type: 'EXTRACT_METADATA',
        });
        if (metadata) {
          const item: ReadingItem = {
            id: generateId(),
            ...metadata,
            status: 'unread',
            tags: [],
            nudgeCount: 0,
            savedAt: Date.now(),
          };
          item.category = categorize(item);
          await saveItem(item);
          await recordSave();
        }
      } catch {
        // Fallback: save with minimal metadata
        let siteName: string;
        try {
          siteName = new URL(url).hostname.replace(/^www\./, '');
        } catch {
          siteName = 'unknown';
        }
        const item: ReadingItem = {
          id: generateId(),
          url,
          title: tab.title || url,
          description: '',
          siteName,
          contentType: 'article',
          status: 'unread',
          tags: [],
          nudgeCount: 0,
          savedAt: Date.now(),
        };
        item.category = categorize(item);
        await saveItem(item);
        await recordSave();
      }
    }
  });

  // ─── Focus mode window close detection ─────────────────────────

  chrome.windows.onRemoved.addListener(async (windowId) => {
    if (windowId === focusModeWindowId) {
      focusModeWindowId = null;
      // Disable distraction blocking when focus mode window closes
      await disableBlocking();
      // Reset item from 'reading' back to 'unread' (user closed without finishing)
      if (focusModeItemId) {
        await updateItem(focusModeItemId, { status: 'unread' });
        focusModeItemId = null;
      }
    }
  });
});

// ─── Message Handler ──────────────────────────────────────────────

async function handleMessage(message: { type: string; payload?: unknown }) {
  switch (message.type) {
    case 'SAVE_PAGE': {
      const payload = message.payload as ReadingItem | undefined;
      if (!payload?.url) return { error: 'Missing payload for SAVE_PAGE' };
      const item = { ...payload };
      item.category = categorize(item);
      await saveItem(item);
      await recordSave();
      return { success: true };
    }

    case 'CHECK_SAVED': {
      const checkPayload = message.payload as { url?: string } | undefined;
      if (!checkPayload?.url) return { saved: false };
      const items = await getItems();
      // Only report as saved if the item is in an active state (not archived)
      const saved = items.some(
        (i) => i.url === checkPayload.url && i.status !== 'archived',
      );
      return { saved };
    }

    case 'GET_ITEMS': {
      const items = await getItems();
      return { items };
    }

    case 'UPDATE_ITEM': {
      const updatePayload = message.payload as (Partial<ReadingItem> & { id: string }) | undefined;
      if (!updatePayload?.id) return { error: 'Missing item ID for UPDATE_ITEM' };
      const { id, ...updates } = updatePayload;
      await updateItem(id, updates);
      if (updates.status === 'read') {
        await recordRead();
      }
      return { success: true };
    }

    case 'DELETE_ITEM': {
      const deletePayload = message.payload as { id?: string } | undefined;
      if (!deletePayload?.id) return { error: 'Missing item ID for DELETE_ITEM' };
      await deleteItem(deletePayload.id);
      return { success: true };
    }

    case 'OPEN_FOCUS_MODE': {
      const focusPayload = message.payload as { id?: string } | undefined;
      if (!focusPayload?.id) return { error: 'Missing item ID for OPEN_FOCUS_MODE' };
      const items = await getItems();
      const item = items.find((i) => i.id === focusPayload.id);
      if (item) {
        await openFocusMode(item);
      }
      return { success: true };
    }

    case 'START_SESSION': {
      const allItems = await getItems();
      const settings = await getSettings();
      const sessionItems = suggestSessionItems(
        allItems,
        settings.sessionDurationMinutes,
      );
      return { items: sessionItems };
    }

    case 'GET_STATS': {
      const stats = await getStats();
      return { stats };
    }

    case 'GET_SETTINGS': {
      const settings = await getSettings();
      return { settings };
    }

    case 'UPDATE_SETTINGS': {
      const settingsPayload = message.payload as Partial<import('../../lib/types').UserSettings> | undefined;
      if (!settingsPayload) return { error: 'Missing payload for UPDATE_SETTINGS' };
      await updateSettings(settingsPayload);
      return { success: true };
    }

    default:
      return { error: `Unknown message type: ${message.type}` };
  }
}

// ─── Focus Mode ─────────────────────────────────────────────────

async function openFocusMode(item: ReadingItem) {
  // Mark as reading
  await updateItem(item.id, { status: 'reading' });

  // Enable distraction blocking
  const settings = await getSettings();
  if (settings.focusModeEnabled && settings.focusModeBlockList.length > 0) {
    await enableBlocking(settings.focusModeBlockList);
  }

  // Open in a new maximized window
  const readerUrl = chrome.runtime.getURL(
    `/reader.html?id=${encodeURIComponent(item.id)}&url=${encodeURIComponent(item.url)}`,
  );

  const win = await chrome.windows.create({
    url: readerUrl,
    type: 'popup',
    state: 'maximized',
  });

  // Track the focus mode window ID and item ID for cleanup on close
  focusModeWindowId = win.id ?? null;
  focusModeItemId = item.id;
}

// ─── Nudge Notifications ────────────────────────────────────────

async function handleNudgeCheck() {
  const settings = await getSettings();
  if (!settings.nudgeEnabled) return;

  const items = await getItems();
  const unread = items.filter((i) => i.status === 'unread');

  if (unread.length === 0) return;

  // Check if any items are old enough to nudge
  const oldEnough = unread.filter(
    (i) =>
      Date.now() - i.savedAt > 3 * 24 * 60 * 60 * 1000 && // at least 3 days old
      (!i.lastNudgedAt ||
        Date.now() - i.lastNudgedAt >
          settings.nudgeFrequencyHours * 60 * 60 * 1000),
  );

  if (oldEnough.length > 0) {
    const suggestions = pickNudgeItems(oldEnough);
    await showNudgeNotification(suggestions);

    // Update nudge count for all suggested items in a single batch
    await batchUpdateItems(
      suggestions.map((item) => ({
        id: item.id,
        changes: {
          nudgeCount: item.nudgeCount + 1,
          lastNudgedAt: Date.now(),
        },
      })),
    );
  }
}

async function showNudgeNotification(items: ReadingItem[]) {
  const title = getNudgeMessage();
  const message = items
    .map((i) => `• ${i.title}`)
    .join('\n');

  // Use the first item for the notification click action
  const firstItem = items[0];
  if (!firstItem) return;

  await chrome.notifications.create(`nudge-${firstItem.id}`, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('/icons/icon-128.png'),
    title,
    message,
    requireInteraction: true,
  });
}

// ─── Decay / Auto-Archive ────────────────────────────────────────

async function handleDecayCheck() {
  const settings = await getSettings();
  const items = await getItems();

  // Flag stale items
  const staleItems = items.filter(
    (i) =>
      i.status === 'unread' &&
      Date.now() - i.savedAt > settings.decayDays * 24 * 60 * 60 * 1000,
  );

  // Auto-archive very old items in a single batch
  const toArchive = staleItems.filter(
    (item) =>
      Date.now() - item.savedAt >
      settings.autoArchiveDays * 24 * 60 * 60 * 1000,
  );
  const autoArchivedIds = new Set(toArchive.map((i) => i.id));

  if (toArchive.length > 0) {
    await batchUpdateItems(
      toArchive.map((item) => ({
        id: item.id,
        changes: { status: 'archived' as const },
      })),
    );
  }

  // Notify about stale items that weren't auto-archived
  const flagged = staleItems.filter((i) => !autoArchivedIds.has(i.id));
  if (flagged.length > 0) {
    await chrome.notifications.create('decay-check', {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('/icons/icon-128.png'),
      title: `${flagged.length} saved read${flagged.length > 1 ? 's' : ''} getting dusty`,
      message:
        'Some items in your nook have been waiting a while. Still interested?',
    });
  }
}

// ─── Weekly Digest ───────────────────────────────────────────────

async function handleWeeklyDigest() {
  const stats = await getStats();
  const items = await getItems();

  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

  const savedThisWeek = items.filter((i) => i.savedAt > weekAgo).length;
  const readThisWeek = items.filter(
    (i) => i.readAt && i.readAt > weekAgo,
  ).length;

  const reflections = items
    .filter((i) => i.reflection && i.readAt && i.readAt > weekAgo)
    .map((i) => i.reflection!.takeaway)
    .filter(Boolean);

  // Build week summary
  const weekSummary: WeekSummary = {
    weekStart: new Date(weekAgo).toISOString().split('T')[0]!,
    saved: savedThisWeek,
    read: readThisWeek,
    topTags: [],
    reflections: reflections.slice(0, 3),
  };

  // Update stats with this week's summary
  const history = [...(stats.weeklyHistory || []), weekSummary].slice(-12); // keep 12 weeks
  await updateStats({ weeklyHistory: history });

  // Show notification
  if (savedThisWeek > 0 || readThisWeek > 0) {
    await chrome.notifications.create('weekly-digest', {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('/icons/icon-128.png'),
      title: 'Your weekly reading digest',
      message: `You saved ${savedThisWeek} and read ${readThisWeek} item${readThisWeek !== 1 ? 's' : ''} this week.${stats.currentStreak > 1 ? ` ${stats.currentStreak}-day streak!` : ''}`,
    });
  }
}

// ─── Stuck Reading Items Cleanup ─────────────────────────────────

async function resetStuckReadingItems(): Promise<void> {
  const items = await getItems();
  const stuck = items.filter((i) => i.status === 'reading');
  if (stuck.length > 0) {
    await batchUpdateItems(
      stuck.map((item) => ({
        id: item.id,
        changes: { status: 'unread' as const },
      })),
    );
    console.log(`Reading Nook: reset ${stuck.length} item(s) stuck in "reading" status`);
  }
}
