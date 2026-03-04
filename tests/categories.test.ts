import { describe, it, expect } from 'vitest';
import {
  categorize,
  groupByCategory,
  suggestSessionItems,
  pickNudgeItems,
} from '../lib/categories';
import { makeItem } from './helpers';

// ─── categorize ─────────────────────────────────────────────────

describe('categorize', () => {
  it('should categorize video content type as Videos', () => {
    const item = makeItem({ contentType: 'video' });
    expect(categorize(item)).toBe('Videos');
  });

  it('should categorize tweet content type as Tweets & Threads', () => {
    const item = makeItem({ contentType: 'tweet' });
    expect(categorize(item)).toBe('Tweets & Threads');
  });

  it('should categorize paper content type as Papers & Research', () => {
    const item = makeItem({ contentType: 'paper' });
    expect(categorize(item)).toBe('Papers & Research');
  });

  it('should categorize by tech keywords in title', () => {
    const item = makeItem({ title: 'Introduction to React Hooks' });
    expect(categorize(item)).toBe('Tech & Programming');
  });

  it('should categorize by tech domain in URL', () => {
    const item = makeItem({ url: 'https://github.com/user/repo' });
    expect(categorize(item)).toBe('Tech & Programming');
  });

  it('should categorize AI keywords in title', () => {
    const item = makeItem({ title: 'How GPT-4 works: a deep dive into LLM architecture' });
    expect(categorize(item)).toBe('AI & Machine Learning');
  });

  it('should categorize AI domains', () => {
    const item = makeItem({ url: 'https://openai.com/research/new-model' });
    expect(categorize(item)).toBe('AI & Machine Learning');
  });

  it('should categorize science keywords', () => {
    const item = makeItem({ title: 'New neuroscience research on memory' });
    expect(categorize(item)).toBe('Science');
  });

  it('should categorize science domains', () => {
    const item = makeItem({ url: 'https://nature.com/articles/new-discovery' });
    expect(categorize(item)).toBe('Science');
  });

  it('should categorize design keywords', () => {
    const item = makeItem({ title: 'Modern typography trends in UI design' });
    expect(categorize(item)).toBe('Design');
  });

  it('should categorize design domains', () => {
    const item = makeItem({ url: 'https://dribbble.com/shots/12345' });
    expect(categorize(item)).toBe('Design');
  });

  it('should categorize business keywords', () => {
    const item = makeItem({ title: 'How to raise your Series A fundraising round' });
    expect(categorize(item)).toBe('Business & Startups');
  });

  it('should categorize philosophy keywords', () => {
    const item = makeItem({ title: 'Stoic philosophy for modern life' });
    expect(categorize(item)).toBe('Ideas & Philosophy');
  });

  it('should categorize culture keywords', () => {
    const item = makeItem({ title: 'The history of economics in society' });
    expect(categorize(item)).toBe('Culture & Society');
  });

  it('should categorize personal growth keywords', () => {
    const item = makeItem({ title: 'Building better productivity habits' });
    expect(categorize(item)).toBe('Personal Growth');
  });

  it('should categorize news domains', () => {
    const item = makeItem({ url: 'https://bbc.com/news/world-12345' });
    expect(categorize(item)).toBe('News');
  });

  it('should fall back to General Reading for unknown content', () => {
    const item = makeItem({
      url: 'https://random-site.com/page',
      title: 'Some random page about cats',
    });
    expect(categorize(item)).toBe('General Reading');
  });

  it('should prioritize content type over URL patterns', () => {
    // A video on github.com should be categorized as Videos, not Tech
    const item = makeItem({
      contentType: 'video',
      url: 'https://github.com/video',
    });
    expect(categorize(item)).toBe('Videos');
  });
});

// ─── groupByCategory ───────────────────────────────────────────

describe('groupByCategory', () => {
  it('should return empty map for empty array', () => {
    const groups = groupByCategory([]);
    expect(groups.size).toBe(0);
  });

  it('should group items by their category', () => {
    const items = [
      makeItem({ contentType: 'video', category: 'Videos' }),
      makeItem({ contentType: 'tweet', category: 'Tweets & Threads' }),
      makeItem({ contentType: 'video', category: 'Videos' }),
    ];
    const groups = groupByCategory(items);
    expect(groups.get('Videos')?.length).toBe(2);
    expect(groups.get('Tweets & Threads')?.length).toBe(1);
  });

  it('should use existing category field if present', () => {
    const item = makeItem({ category: 'Custom Category' });
    const groups = groupByCategory([item]);
    expect(groups.has('Custom Category')).toBe(true);
  });

  it('should auto-categorize when category field is missing', () => {
    const item = makeItem({ contentType: 'paper', category: undefined });
    const groups = groupByCategory([item]);
    expect(groups.has('Papers & Research')).toBe(true);
  });
});

// ─── suggestSessionItems ────────────────────────────────────────

describe('suggestSessionItems', () => {
  it('should return empty array when no unread items', () => {
    const items = [makeItem({ status: 'read' })];
    expect(suggestSessionItems(items, 25)).toEqual([]);
  });

  it('should return empty array for empty items list', () => {
    expect(suggestSessionItems([], 25)).toEqual([]);
  });

  it('should always return at least one item if unread items exist', () => {
    const items = [makeItem({ estimatedReadTime: 100 })];
    const result = suggestSessionItems(items, 5);
    expect(result.length).toBe(1);
  });

  it('should fill up to target minutes', () => {
    const items = [
      makeItem({ estimatedReadTime: 5, savedAt: 1000 }),
      makeItem({ estimatedReadTime: 5, savedAt: 2000 }),
      makeItem({ estimatedReadTime: 5, savedAt: 3000 }),
    ];
    const result = suggestSessionItems(items, 15);
    expect(result.length).toBe(3);
  });

  it('should not exceed target minutes (except for first item)', () => {
    const items = [
      makeItem({ estimatedReadTime: 5, savedAt: 1000 }),
      makeItem({ estimatedReadTime: 10, savedAt: 2000 }),
      makeItem({ estimatedReadTime: 20, savedAt: 3000 }),
    ];
    const result = suggestSessionItems(items, 12);
    // First item (5min) + second (10min) = 15min > 12min, so only first
    // Actually: 5 + 10 = 15 > 12, but first is always included, second: 5+10=15 > 12 so skip
    expect(result.length).toBe(1);
  });

  it('should cap at 3 items max', () => {
    const items = Array.from({ length: 10 }, (_, i) =>
      makeItem({ estimatedReadTime: 1, savedAt: i * 1000 }),
    );
    const result = suggestSessionItems(items, 100);
    expect(result.length).toBe(3);
  });

  it('should prioritize items with fewer nudges', () => {
    const leastNudged = makeItem({ nudgeCount: 0, savedAt: 3000 });
    const mostNudged = makeItem({ nudgeCount: 5, savedAt: 1000 });
    const items = [mostNudged, leastNudged];
    const result = suggestSessionItems(items, 25);
    expect(result[0]).toBe(leastNudged);
  });

  it('should use oldest first when nudge counts are equal', () => {
    const oldest = makeItem({ nudgeCount: 0, savedAt: 1000 });
    const newest = makeItem({ nudgeCount: 0, savedAt: 5000 });
    const items = [newest, oldest];
    const result = suggestSessionItems(items, 25);
    expect(result[0]).toBe(oldest);
  });

  it('should default to 5 min read time when estimatedReadTime is undefined', () => {
    const items = [
      makeItem({ estimatedReadTime: undefined, savedAt: 1000 }),
      makeItem({ estimatedReadTime: undefined, savedAt: 2000 }),
      makeItem({ estimatedReadTime: undefined, savedAt: 3000 }),
    ];
    // 3 items * 5 min default = 15 min. With target 10, should get 2 items.
    const result = suggestSessionItems(items, 10);
    expect(result.length).toBe(2);
  });

  it('should only select unread items', () => {
    const items = [
      makeItem({ status: 'read', savedAt: 1000 }),
      makeItem({ status: 'archived', savedAt: 2000 }),
      makeItem({ status: 'unread', savedAt: 3000 }),
    ];
    const result = suggestSessionItems(items, 25);
    expect(result.length).toBe(1);
    expect(result[0]!.status).toBe('unread');
  });
});

// ─── pickNudgeItems ─────────────────────────────────────────────

describe('pickNudgeItems', () => {
  it('should return empty array when no unread items', () => {
    const items = [makeItem({ status: 'read' })];
    expect(pickNudgeItems(items)).toEqual([]);
  });

  it('should return empty array for empty list', () => {
    expect(pickNudgeItems([])).toEqual([]);
  });

  it('should return at most 3 items', () => {
    const items = Array.from({ length: 10 }, () => makeItem());
    const result = pickNudgeItems(items);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it('should return all items if fewer than 3 unread', () => {
    const items = [makeItem(), makeItem()];
    const result = pickNudgeItems(items);
    expect(result.length).toBe(2);
  });

  it('should only pick unread items', () => {
    const items = [
      makeItem({ status: 'read' }),
      makeItem({ status: 'unread' }),
      makeItem({ status: 'archived' }),
    ];
    const result = pickNudgeItems(items);
    expect(result.length).toBe(1);
    expect(result[0]!.status).toBe('unread');
  });

  it('should prefer items with fewer nudges', () => {
    const lessNudged = makeItem({ nudgeCount: 0, savedAt: Date.now() });
    const moreNudged = makeItem({ nudgeCount: 10, savedAt: Date.now() - 86400000 * 30 });
    const items = [moreNudged, lessNudged];
    const result = pickNudgeItems(items);
    // lessNudged should come first due to lower nudge count (weighted x2)
    expect(result[0]).toBe(lessNudged);
  });
});
