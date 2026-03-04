import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── Mock chrome.storage ────────────────────────────────────────

const localStore: Record<string, unknown> = {};
const syncStore: Record<string, unknown> = {};

function makeStorageArea(store: Record<string, unknown>) {
  return {
    get: vi.fn(async (key: string) => {
      return { [key]: store[key] };
    }),
    set: vi.fn(async (items: Record<string, unknown>) => {
      Object.assign(store, items);
    }),
  };
}

// Set up the global chrome mock before importing storage module
const localArea = makeStorageArea(localStore);
const syncArea = makeStorageArea(syncStore);

vi.stubGlobal('chrome', {
  storage: {
    local: localArea,
    sync: syncArea,
  },
});

// Import after mocking chrome global
import {
  DEFAULT_SETTINGS,
  DEFAULT_STATS,
  getItems,
  saveItem,
  updateItem,
  deleteItem,
  getItemsByStatus,
  getStaleItems,
  getStats,
  updateStats,
  recordRead,
  recordSave,
  getSettings,
  updateSettings,
} from '../lib/storage';
import { makeItem } from './helpers';

function clearStores() {
  for (const key of Object.keys(localStore)) delete localStore[key];
  for (const key of Object.keys(syncStore)) delete syncStore[key];
}

// ─── Items CRUD ─────────────────────────────────────────────────

describe('Items CRUD', () => {
  beforeEach(() => {
    clearStores();
    vi.clearAllMocks();
  });

  it('getItems should return empty array when storage is empty', async () => {
    const items = await getItems();
    expect(items).toEqual([]);
  });

  it('saveItem should add a new item', async () => {
    const item = makeItem();
    await saveItem(item);
    const items = await getItems();
    expect(items.length).toBe(1);
    expect(items[0]!.id).toBe(item.id);
  });

  it('saveItem should prepend new items (newest first)', async () => {
    const item1 = makeItem({ title: 'First' });
    const item2 = makeItem({ title: 'Second' });
    await saveItem(item1);
    await saveItem(item2);
    const items = await getItems();
    expect(items.length).toBe(2);
    expect(items[0]!.title).toBe('Second');
    expect(items[1]!.title).toBe('First');
  });

  it('saveItem should update existing item with same URL instead of duplicating', async () => {
    const url = 'https://example.com/same-page';
    const item1 = makeItem({ url, title: 'Original Title' });
    const item2 = makeItem({ url, title: 'Updated Title' });
    await saveItem(item1);
    await saveItem(item2);
    const items = await getItems();
    expect(items.length).toBe(1);
    expect(items[0]!.title).toBe('Updated Title');
  });

  it('updateItem should update specific fields', async () => {
    const item = makeItem();
    await saveItem(item);
    await updateItem(item.id, { status: 'read', readAt: Date.now() });
    const items = await getItems();
    expect(items[0]!.status).toBe('read');
    expect(items[0]!.readAt).toBeDefined();
  });

  it('updateItem should not affect other items', async () => {
    const item1 = makeItem({ title: 'Keep Me' });
    const item2 = makeItem({ title: 'Update Me' });
    await saveItem(item1);
    await saveItem(item2);
    await updateItem(item2.id, { title: 'Updated' });
    const items = await getItems();
    const kept = items.find((i) => i.id === item1.id);
    const updated = items.find((i) => i.id === item2.id);
    expect(kept!.title).toBe('Keep Me');
    expect(updated!.title).toBe('Updated');
  });

  it('deleteItem should remove item by ID', async () => {
    const item = makeItem();
    await saveItem(item);
    await deleteItem(item.id);
    const items = await getItems();
    expect(items.length).toBe(0);
  });

  it('deleteItem should only remove the specified item', async () => {
    const item1 = makeItem();
    const item2 = makeItem();
    await saveItem(item1);
    await saveItem(item2);
    await deleteItem(item1.id);
    const items = await getItems();
    expect(items.length).toBe(1);
    expect(items[0]!.id).toBe(item2.id);
  });
});

// ─── Filtered queries ───────────────────────────────────────────

describe('Filtered queries', () => {
  beforeEach(() => {
    clearStores();
    vi.clearAllMocks();
  });

  it('getItemsByStatus should filter by status', async () => {
    await saveItem(makeItem({ status: 'unread' }));
    await saveItem(makeItem({ status: 'read' }));
    await saveItem(makeItem({ status: 'unread' }));

    const unread = await getItemsByStatus('unread');
    expect(unread.length).toBe(2);

    const read = await getItemsByStatus('read');
    expect(read.length).toBe(1);
  });

  it('getStaleItems should return unread items older than decay threshold', async () => {
    const oldItem = makeItem({
      status: 'unread',
      savedAt: Date.now() - 31 * 24 * 60 * 60 * 1000, // 31 days ago
    });
    const newItem = makeItem({
      status: 'unread',
      savedAt: Date.now(), // now
    });
    const readOldItem = makeItem({
      status: 'read',
      savedAt: Date.now() - 31 * 24 * 60 * 60 * 1000, // 31 days ago, but read
    });

    await saveItem(oldItem);
    await saveItem(newItem);
    await saveItem(readOldItem);

    const stale = await getStaleItems(30);
    expect(stale.length).toBe(1);
    expect(stale[0]!.id).toBe(oldItem.id);
  });

  it('getStaleItems should return empty when nothing is stale', async () => {
    await saveItem(makeItem({ status: 'unread', savedAt: Date.now() }));
    const stale = await getStaleItems(30);
    expect(stale.length).toBe(0);
  });
});

// ─── Stats ──────────────────────────────────────────────────────

describe('Stats', () => {
  beforeEach(() => {
    clearStores();
    vi.clearAllMocks();
  });

  it('getStats should return defaults when empty', async () => {
    const stats = await getStats();
    expect(stats.currentStreak).toBe(0);
    expect(stats.longestStreak).toBe(0);
    expect(stats.totalRead).toBe(0);
    expect(stats.totalSaved).toBe(0);
    expect(stats.lastReadDate).toBe('');
  });

  it('updateStats should merge with existing stats', async () => {
    await updateStats({ totalRead: 5 });
    const stats = await getStats();
    expect(stats.totalRead).toBe(5);
    expect(stats.currentStreak).toBe(0); // unchanged
  });

  it('recordSave should increment totalSaved', async () => {
    await recordSave();
    await recordSave();
    const stats = await getStats();
    expect(stats.totalSaved).toBe(2);
  });

  it('recordRead should start a new streak when no previous reads', async () => {
    await recordRead();
    const stats = await getStats();
    expect(stats.currentStreak).toBe(1);
    expect(stats.totalRead).toBe(1);
    expect(stats.lastReadDate).toBe(
      new Date().toISOString().split('T')[0],
    );
  });

  it('recordRead should continue streak when last read was yesterday', async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]!;

    await updateStats({
      currentStreak: 3,
      longestStreak: 5,
      totalRead: 10,
      lastReadDate: yesterday,
    });

    await recordRead();
    const stats = await getStats();
    expect(stats.currentStreak).toBe(4);
    expect(stats.totalRead).toBe(11);
  });

  it('recordRead should reset streak when gap is more than one day', async () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]!;

    await updateStats({
      currentStreak: 10,
      longestStreak: 10,
      totalRead: 20,
      lastReadDate: threeDaysAgo,
    });

    await recordRead();
    const stats = await getStats();
    expect(stats.currentStreak).toBe(1);
    expect(stats.longestStreak).toBe(10); // longest preserved
  });

  it('recordRead should not increment streak if already read today', async () => {
    const today = new Date().toISOString().split('T')[0]!;

    await updateStats({
      currentStreak: 5,
      longestStreak: 5,
      totalRead: 10,
      lastReadDate: today,
    });

    await recordRead();
    const stats = await getStats();
    expect(stats.currentStreak).toBe(5); // unchanged
    expect(stats.totalRead).toBe(11); // still incremented
  });

  it('recordRead should update longestStreak when current exceeds it', async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]!;

    await updateStats({
      currentStreak: 5,
      longestStreak: 5,
      totalRead: 10,
      lastReadDate: yesterday,
    });

    await recordRead();
    const stats = await getStats();
    expect(stats.currentStreak).toBe(6);
    expect(stats.longestStreak).toBe(6);
  });
});

// ─── Settings ───────────────────────────────────────────────────

describe('Settings', () => {
  beforeEach(() => {
    clearStores();
    vi.clearAllMocks();
  });

  it('getSettings should return defaults when empty', async () => {
    const settings = await getSettings();
    expect(settings.nudgeEnabled).toBe(true);
    expect(settings.nudgeFrequencyHours).toBe(6);
    expect(settings.focusModeBlockList.length).toBeGreaterThan(0);
  });

  it('updateSettings should merge with existing settings', async () => {
    await updateSettings({ nudgeEnabled: false });
    const settings = await getSettings();
    expect(settings.nudgeEnabled).toBe(false);
    expect(settings.nudgeFrequencyHours).toBe(6); // unchanged
  });

  it('updateSettings should preserve block list when updating other fields', async () => {
    await updateSettings({ sessionDurationMinutes: 45 });
    const settings = await getSettings();
    expect(settings.sessionDurationMinutes).toBe(45);
    expect(settings.focusModeBlockList).toEqual(
      DEFAULT_SETTINGS.focusModeBlockList,
    );
  });

  it('settings should use chrome.storage.sync', async () => {
    await getSettings();
    expect(syncArea.get).toHaveBeenCalled();
  });

  it('items should use chrome.storage.local', async () => {
    await getItems();
    expect(localArea.get).toHaveBeenCalled();
  });
});

// ─── DEFAULT_SETTINGS ───────────────────────────────────────────

describe('DEFAULT_SETTINGS', () => {
  it('should have sensible defaults', () => {
    expect(DEFAULT_SETTINGS.nudgeEnabled).toBe(true);
    expect(DEFAULT_SETTINGS.nudgeFrequencyHours).toBe(6);
    expect(DEFAULT_SETTINGS.tabThreshold).toBe(15);
    expect(DEFAULT_SETTINGS.decayDays).toBe(30);
    expect(DEFAULT_SETTINGS.autoArchiveDays).toBe(60);
    expect(DEFAULT_SETTINGS.focusModeEnabled).toBe(true);
    expect(DEFAULT_SETTINGS.sessionDurationMinutes).toBe(25);
  });

  it('should include common distraction sites in block list', () => {
    expect(DEFAULT_SETTINGS.focusModeBlockList).toContain('twitter.com');
    expect(DEFAULT_SETTINGS.focusModeBlockList).toContain('x.com');
    expect(DEFAULT_SETTINGS.focusModeBlockList).toContain('reddit.com');
    expect(DEFAULT_SETTINGS.focusModeBlockList).toContain('youtube.com');
  });
});

// ─── DEFAULT_STATS ──────────────────────────────────────────────

describe('DEFAULT_STATS', () => {
  it('should start at zero', () => {
    expect(DEFAULT_STATS.currentStreak).toBe(0);
    expect(DEFAULT_STATS.longestStreak).toBe(0);
    expect(DEFAULT_STATS.totalRead).toBe(0);
    expect(DEFAULT_STATS.totalSaved).toBe(0);
    expect(DEFAULT_STATS.lastReadDate).toBe('');
    expect(DEFAULT_STATS.weeklyHistory).toEqual([]);
  });
});
