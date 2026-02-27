import type { ReadingItem, UserStats, UserSettings } from './types';

// ─── Default Settings ───────────────────────────────────────────

export const DEFAULT_SETTINGS: UserSettings = {
  nudgeEnabled: true,
  nudgeFrequencyHours: 6,
  tabThreshold: 15,
  decayDays: 30,
  autoArchiveDays: 60,
  focusModeBlockList: [
    'twitter.com',
    'x.com',
    'reddit.com',
    'facebook.com',
    'instagram.com',
    'tiktok.com',
    'youtube.com',
    'news.ycombinator.com',
  ],
  focusModeEnabled: true,
  sessionDurationMinutes: 25,
};

export const DEFAULT_STATS: UserStats = {
  currentStreak: 0,
  longestStreak: 0,
  totalRead: 0,
  totalSaved: 0,
  lastReadDate: '',
  weeklyHistory: [],
};

// ─── Storage Keys ───────────────────────────────────────────────

const ITEMS_KEY = 'reading_items';
const STATS_KEY = 'reading_stats';
const SETTINGS_KEY = 'reading_settings';

// ─── Items ──────────────────────────────────────────────────────

export async function getItems(): Promise<ReadingItem[]> {
  const result = await chrome.storage.local.get(ITEMS_KEY);
  return (result[ITEMS_KEY] as ReadingItem[] | undefined) ?? [];
}

export async function saveItem(item: ReadingItem): Promise<void> {
  const items = await getItems();
  // Avoid duplicates by URL
  const exists = items.find((i) => i.url === item.url);
  if (exists) {
    // Update existing item instead of creating duplicate
    const updated = items.map((i) => (i.url === item.url ? { ...i, ...item } : i));
    await chrome.storage.local.set({ [ITEMS_KEY]: updated });
  } else {
    items.unshift(item); // newest first
    await chrome.storage.local.set({ [ITEMS_KEY]: items });
  }
}

export async function updateItem(
  id: string,
  updates: Partial<ReadingItem>,
): Promise<void> {
  const items = await getItems();
  const updated = items.map((item) =>
    item.id === id ? { ...item, ...updates } : item,
  );
  await chrome.storage.local.set({ [ITEMS_KEY]: updated });
}

export async function deleteItem(id: string): Promise<void> {
  const items = await getItems();
  const filtered = items.filter((item) => item.id !== id);
  await chrome.storage.local.set({ [ITEMS_KEY]: filtered });
}

export async function getItemsByStatus(
  status: ReadingItem['status'],
): Promise<ReadingItem[]> {
  const items = await getItems();
  return items.filter((item) => item.status === status);
}

export async function getStaleItems(decayDays: number): Promise<ReadingItem[]> {
  const items = await getItems();
  const cutoff = Date.now() - decayDays * 24 * 60 * 60 * 1000;
  return items.filter(
    (item) => item.status === 'unread' && item.savedAt < cutoff,
  );
}

// ─── Stats ──────────────────────────────────────────────────────

export async function getStats(): Promise<UserStats> {
  const result = await chrome.storage.local.get(STATS_KEY);
  return (result[STATS_KEY] as UserStats | undefined) ?? { ...DEFAULT_STATS };
}

export async function updateStats(
  updates: Partial<UserStats>,
): Promise<void> {
  const stats = await getStats();
  await chrome.storage.local.set({
    [STATS_KEY]: { ...stats, ...updates },
  });
}

export async function recordRead(): Promise<void> {
  const stats = await getStats();
  const today = new Date().toISOString().split('T')[0]!;

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]!;

  let newStreak = stats.currentStreak;
  if (stats.lastReadDate === yesterday) {
    newStreak += 1;
  } else if (stats.lastReadDate !== today) {
    newStreak = 1;
  }

  await updateStats({
    totalRead: stats.totalRead + 1,
    lastReadDate: today,
    currentStreak: newStreak,
    longestStreak: Math.max(stats.longestStreak, newStreak),
  });
}

export async function recordSave(): Promise<void> {
  const stats = await getStats();
  await updateStats({ totalSaved: stats.totalSaved + 1 });
}

// ─── Settings ───────────────────────────────────────────────────

export async function getSettings(): Promise<UserSettings> {
  const result = await chrome.storage.sync.get(SETTINGS_KEY);
  return (result[SETTINGS_KEY] as UserSettings | undefined) ?? {
    ...DEFAULT_SETTINGS,
  };
}

export async function updateSettings(
  updates: Partial<UserSettings>,
): Promise<void> {
  const settings = await getSettings();
  await chrome.storage.sync.set({
    [SETTINGS_KEY]: { ...settings, ...updates },
  });
}
