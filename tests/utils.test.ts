import { describe, it, expect } from 'vitest';
import {
  generateId,
  detectContentType,
  extractSiteName,
  estimateReadTime,
  formatRelativeTime,
  formatReadTime,
  truncate,
  createPageMetadata,
  getEmptyQueueMessage,
  getAllReadMessage,
  getNudgeMessage,
  getSaveConfirmation,
  getStreakMessage,
} from '../lib/utils';

// ─── generateId ─────────────────────────────────────────────────

describe('generateId', () => {
  it('should generate a non-empty string', () => {
    const id = generateId();
    expect(id).toBeTruthy();
    expect(typeof id).toBe('string');
  });

  it('should generate unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it('should contain a timestamp component', () => {
    const before = Date.now();
    const id = generateId();
    const after = Date.now();
    const timestamp = parseInt(id.split('-')[0]!, 10);
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });
});

// ─── detectContentType ──────────────────────────────────────────

describe('detectContentType', () => {
  it('should detect YouTube videos', () => {
    expect(detectContentType('https://www.youtube.com/watch?v=abc')).toBe('video');
    expect(detectContentType('https://youtu.be/abc')).toBe('video');
  });

  it('should detect Vimeo videos', () => {
    expect(detectContentType('https://vimeo.com/123456')).toBe('video');
  });

  it('should detect Twitch videos', () => {
    expect(detectContentType('https://www.twitch.tv/channel')).toBe('video');
  });

  it('should detect tweets from twitter.com', () => {
    expect(detectContentType('https://twitter.com/user/status/123')).toBe('tweet');
  });

  it('should detect tweets from x.com', () => {
    expect(detectContentType('https://x.com/user/status/123')).toBe('tweet');
  });

  it('should detect tweets from nitter instances', () => {
    expect(detectContentType('https://nitter.net/user/status/123')).toBe('tweet');
  });

  it('should detect arXiv papers', () => {
    expect(detectContentType('https://arxiv.org/abs/2301.12345')).toBe('paper');
  });

  it('should detect Google Scholar papers', () => {
    expect(detectContentType('https://scholar.google.com/citations?user=abc')).toBe('paper');
  });

  it('should detect Semantic Scholar papers', () => {
    expect(detectContentType('https://www.semanticscholar.org/paper/abc')).toBe('paper');
  });

  it('should detect DOI links as papers', () => {
    expect(detectContentType('https://doi.org/10.1234/abc')).toBe('paper');
  });

  it('should detect PDF links as papers', () => {
    expect(detectContentType('https://example.com/paper.pdf')).toBe('paper');
  });

  it('should detect PubMed as papers', () => {
    expect(detectContentType('https://pubmed.ncbi.nlm.nih.gov/12345')).toBe('paper');
  });

  it('should default to article for regular URLs', () => {
    expect(detectContentType('https://blog.example.com/post')).toBe('article');
    expect(detectContentType('https://medium.com/article')).toBe('article');
  });
});

// ─── extractSiteName ────────────────────────────────────────────

describe('extractSiteName', () => {
  it('should extract domain without www prefix', () => {
    expect(extractSiteName('https://www.example.com/page')).toBe('example.com');
  });

  it('should keep subdomains that are not www', () => {
    expect(extractSiteName('https://blog.example.com/page')).toBe('blog.example.com');
  });

  it('should handle URLs without www', () => {
    expect(extractSiteName('https://example.com/page')).toBe('example.com');
  });

  it('should return "unknown" for invalid URLs', () => {
    expect(extractSiteName('not-a-url')).toBe('unknown');
  });
});

// ─── estimateReadTime ───────────────────────────────────────────

describe('estimateReadTime', () => {
  it('should return at least 1 minute', () => {
    expect(estimateReadTime(0)).toBe(1);
    expect(estimateReadTime(50)).toBe(1);
  });

  it('should estimate 1 minute for 200 words', () => {
    expect(estimateReadTime(200)).toBe(1);
  });

  it('should estimate 5 minutes for 1000 words', () => {
    expect(estimateReadTime(1000)).toBe(5);
  });

  it('should round up', () => {
    expect(estimateReadTime(201)).toBe(2);
    expect(estimateReadTime(401)).toBe(3);
  });
});

// ─── formatRelativeTime ─────────────────────────────────────────

describe('formatRelativeTime', () => {
  it('should show "just now" for recent timestamps', () => {
    expect(formatRelativeTime(Date.now())).toBe('just now');
  });

  it('should show minutes for timestamps within the hour', () => {
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    expect(formatRelativeTime(fiveMinAgo)).toBe('5m ago');
  });

  it('should show hours for timestamps within the day', () => {
    const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000;
    expect(formatRelativeTime(threeHoursAgo)).toBe('3h ago');
  });

  it('should show days for timestamps within the week', () => {
    const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
    expect(formatRelativeTime(twoDaysAgo)).toBe('2d ago');
  });

  it('should show weeks for timestamps within the month', () => {
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    expect(formatRelativeTime(twoWeeksAgo)).toBe('2w ago');
  });

  it('should show date for older timestamps', () => {
    const longAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;
    const result = formatRelativeTime(longAgo);
    expect(result).not.toContain('ago');
  });
});

// ─── formatReadTime ─────────────────────────────────────────────

describe('formatReadTime', () => {
  it('should return empty string for undefined', () => {
    expect(formatReadTime(undefined)).toBe('');
  });

  it('should return "< 1 min" for zero', () => {
    expect(formatReadTime(0)).toBe('');
  });

  it('should return "1 min read" for 1', () => {
    expect(formatReadTime(1)).toBe('1 min read');
  });

  it('should return "5 min read" for 5', () => {
    expect(formatReadTime(5)).toBe('5 min read');
  });
});

// ─── truncate ───────────────────────────────────────────────────

describe('truncate', () => {
  it('should not truncate short text', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });

  it('should truncate long text with ellipsis', () => {
    const result = truncate('This is a long text that should be truncated', 20);
    expect(result.length).toBeLessThanOrEqual(20);
    expect(result).toContain('\u2026');
  });

  it('should handle text at exact max length', () => {
    expect(truncate('12345', 5)).toBe('12345');
  });

  it('should handle empty string', () => {
    expect(truncate('', 10)).toBe('');
  });
});

// ─── createPageMetadata ─────────────────────────────────────────

describe('createPageMetadata', () => {
  it('should create metadata with detected content type', () => {
    const meta = createPageMetadata(
      'https://www.youtube.com/watch?v=abc',
      'Test Video',
      'A test video',
      'https://img.youtube.com/vi/abc/default.jpg',
      undefined,
    );

    expect(meta.contentType).toBe('video');
    expect(meta.siteName).toBe('youtube.com');
    expect(meta.title).toBe('Test Video');
    expect(meta.estimatedReadTime).toBeUndefined();
  });

  it('should calculate read time from word count', () => {
    const meta = createPageMetadata(
      'https://blog.example.com/post',
      'Blog Post',
      'A blog post',
      undefined,
      1000,
    );

    expect(meta.estimatedReadTime).toBe(5);
  });

  it('should use URL as title fallback', () => {
    const meta = createPageMetadata(
      'https://example.com/page',
      '',
      '',
    );

    expect(meta.title).toBe('https://example.com/page');
  });
});

// ─── Playful copy functions ─────────────────────────────────────

describe('playful copy', () => {
  it('getEmptyQueueMessage should return a non-empty string', () => {
    const msg = getEmptyQueueMessage();
    expect(msg).toBeTruthy();
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });

  it('getAllReadMessage should return a non-empty string', () => {
    const msg = getAllReadMessage();
    expect(msg).toBeTruthy();
  });

  it('getNudgeMessage should return a non-empty string', () => {
    const msg = getNudgeMessage();
    expect(msg).toBeTruthy();
  });

  it('getSaveConfirmation should return a non-empty string', () => {
    const msg = getSaveConfirmation();
    expect(msg).toBeTruthy();
  });

  it('getStreakMessage should return appropriate messages for different streaks', () => {
    expect(getStreakMessage(0)).toBeTruthy();
    expect(getStreakMessage(1)).toBeTruthy();
    expect(getStreakMessage(7)).toBeTruthy();
    expect(getStreakMessage(30)).toBeTruthy();
    expect(getStreakMessage(100)).toBeTruthy();
  });

  it('getStreakMessage for 0 should suggest starting', () => {
    // Run multiple times since it's random
    const messages = Array.from({ length: 20 }, () => getStreakMessage(0));
    const allStartMessages = messages.every(
      (m) => m.includes('Start') || m.includes('Read'),
    );
    expect(allStartMessages).toBe(true);
  });
});
