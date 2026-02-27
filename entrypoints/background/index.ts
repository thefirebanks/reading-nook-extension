import {
  getItems,
  saveItem,
  updateItem,
  deleteItem,
  getStaleItems,
  getSettings,
  getStats,
  recordRead,
  recordSave,
  updateSettings,
} from '../../lib/storage';
import { pickNudgeItems, suggestSessionItems } from '../../lib/categories';
import { categorize } from '../../lib/categories';
import { getNudgeMessage } from '../../lib/utils';
import {
  enableBlocking,
  disableBlocking,
  clearAllBlockingRules,
} from '../../lib/blocking';
import type { ReadingItem, UserStats, WeekSummary } from '../../lib/types';

export default defineBackground(() => {
  // ─── Focus mode state tracking ─────────────────────────────────

  let focusModeWindowId: number | null = null;
  let focusModeBlockedDomainCount = 0;

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
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
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
        const item: ReadingItem = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          url,
          title: tab.title || url,
          description: '',
          siteName: new URL(url).hostname.replace(/^www\./, ''),
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
      if (focusModeBlockedDomainCount > 0) {
        await disableBlocking(focusModeBlockedDomainCount);
        focusModeBlockedDomainCount = 0;
      }
    }
  });
});

// ─── Message Handler ──────────────────────────────────────────────

async function handleMessage(message: { type: string; payload?: any }) {
  switch (message.type) {
    case 'SAVE_PAGE': {
      const item = message.payload as ReadingItem;
      item.category = categorize(item);
      await saveItem(item);
      await recordSave();
      return { success: true };
    }

    case 'CHECK_SAVED': {
      const items = await getItems();
      const saved = items.some((i) => i.url === message.payload?.url);
      return { saved };
    }

    case 'GET_ITEMS': {
      const items = await getItems();
      return { items };
    }

    case 'UPDATE_ITEM': {
      const { id, ...updates } = message.payload as Partial<ReadingItem> & {
        id: string;
      };
      await updateItem(id, updates);
      if (updates.status === 'read') {
        await recordRead();
      }
      return { success: true };
    }

    case 'DELETE_ITEM': {
      await deleteItem(message.payload.id);
      return { success: true };
    }

    case 'OPEN_FOCUS_MODE': {
      const items = await getItems();
      const item = items.find((i) => i.id === message.payload.id);
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
      await updateSettings(message.payload);
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
    focusModeBlockedDomainCount = settings.focusModeBlockList.length;
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

  // Track the focus mode window ID for cleanup on close
  focusModeWindowId = win.id ?? null;
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

    // Update nudge count
    for (const item of suggestions) {
      await updateItem(item.id, {
        nudgeCount: item.nudgeCount + 1,
        lastNudgedAt: Date.now(),
      });
    }
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

  // Auto-archive very old items
  for (const item of staleItems) {
    if (
      Date.now() - item.savedAt >
      settings.autoArchiveDays * 24 * 60 * 60 * 1000
    ) {
      await updateItem(item.id, { status: 'archived' });
    }
  }

  // Notify about stale items that aren't auto-archived yet
  const flagged = staleItems.filter((i) => i.status === 'unread');
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
  const { updateStats: doUpdate } = await import('../../lib/storage');
  await doUpdate({ weeklyHistory: history });

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
