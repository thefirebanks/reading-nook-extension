import type { ReadingItem } from '../lib/types';

/**
 * Create a test ReadingItem with sensible defaults.
 * Pass overrides to customise specific fields.
 */
export function makeItem(overrides: Partial<ReadingItem> = {}): ReadingItem {
  return {
    id: `test-${Math.random().toString(36).slice(2, 9)}`,
    url: `https://example.com/${Math.random().toString(36).slice(2, 9)}`,
    title: 'Test Article',
    description: 'A test article',
    siteName: 'example.com',
    contentType: 'article',
    savedAt: Date.now(),
    status: 'unread',
    tags: [],
    nudgeCount: 0,
    ...overrides,
  };
}
