import type { ContentType, PageMetadata } from './types';

/**
 * Generate a unique ID for reading items
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Detect content type from URL and page metadata
 */
export function detectContentType(url: string): ContentType {
  const hostname = new URL(url).hostname.toLowerCase();
  const pathname = new URL(url).pathname.toLowerCase();

  // Video platforms
  if (
    hostname.includes('youtube.com') ||
    hostname.includes('youtu.be') ||
    hostname.includes('vimeo.com') ||
    hostname.includes('twitch.tv')
  ) {
    return 'video';
  }

  // Twitter/X
  if (
    hostname.includes('twitter.com') ||
    hostname.includes('x.com') ||
    hostname.includes('nitter.')
  ) {
    return 'tweet';
  }

  // Academic papers
  if (
    hostname.includes('arxiv.org') ||
    hostname.includes('scholar.google') ||
    hostname.includes('semanticscholar.org') ||
    hostname.includes('doi.org') ||
    hostname.includes('pubmed.ncbi') ||
    pathname.endsWith('.pdf')
  ) {
    return 'paper';
  }

  return 'article';
}

/**
 * Extract the site name from a URL
 */
export function extractSiteName(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    // Remove www. prefix and get the domain
    return hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

/**
 * Estimate reading time from word count (avg 200 wpm)
 */
export function estimateReadTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 200));
}

/**
 * Format a timestamp into a human-readable relative time
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(diff / 604800000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(timestamp).toLocaleDateString();
}

/**
 * Format reading time into a friendly string
 */
export function formatReadTime(minutes?: number): string {
  if (!minutes) return '';
  if (minutes < 1) return '< 1 min';
  if (minutes === 1) return '1 min read';
  return `${minutes} min read`;
}

/**
 * Truncate text to a max length with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 1).trimEnd() + '\u2026';
}

/**
 * Create page metadata from extracted DOM info
 */
export function createPageMetadata(
  url: string,
  title: string,
  description: string,
  thumbnail?: string,
  wordCount?: number,
): PageMetadata {
  return {
    url,
    title: title || url,
    description: description || '',
    thumbnail,
    siteName: extractSiteName(url),
    contentType: detectContentType(url),
    estimatedReadTime: wordCount ? estimateReadTime(wordCount) : undefined,
  };
}

// ─── Playful copy ───────────────────────────────────────────────

const EMPTY_QUEUE_MESSAGES = [
  'Your nook is empty \u2014 go find something fascinating!',
  'Nothing here yet. The internet awaits!',
  'All clear! Time to discover something new.',
  'A fresh start. What will you read next?',
  'Your reading nook is cozy and quiet\u2026 for now.',
];

const ALL_READ_MESSAGES = [
  'All caught up! Time for tea.',
  'Nothing left unread. You\u2019re a reading machine!',
  'Clean slate! Your future self thanks you.',
  'Wow, you read everything. That\u2019s impressive.',
  'All done! Go take a walk, you\u2019ve earned it.',
];

const NUDGE_MESSAGES = [
  'It\u2019s been a little while\u2026 want to revisit something you saved?',
  'Your nook has some reads waiting for a cozy moment.',
  'Hey there! A few saved reads could use some love.',
  'Remember that interesting thing you saved? It\u2019s still here!',
  'Time for a reading break? Your nook has suggestions.',
];

const SAVE_CONFIRMATIONS = [
  'Saved to your nook!',
  'Tucked away for later.',
  'Added! It\u2019ll be here when you\u2019re ready.',
  'Safe and sound in your reading nook.',
  'Got it! One more interesting read for later.',
];

const STREAK_MESSAGES: Record<string, string[]> = {
  '0': ['Start a reading streak today!', 'Read something to start your streak!'],
  '1': ['Day 1! A journey of a thousand reads begins with one.'],
  '3': ['3 days strong! You\u2019re building a habit.'],
  '7': ['A full week of reading! Your nook is well-loved.'],
  '14': ['Two weeks! You\u2019re a dedicated reader.'],
  '30': ['30 days! That\u2019s a real reading habit.'],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export function getEmptyQueueMessage(): string {
  return pickRandom(EMPTY_QUEUE_MESSAGES);
}

export function getAllReadMessage(): string {
  return pickRandom(ALL_READ_MESSAGES);
}

export function getNudgeMessage(): string {
  return pickRandom(NUDGE_MESSAGES);
}

export function getSaveConfirmation(): string {
  return pickRandom(SAVE_CONFIRMATIONS);
}

export function getStreakMessage(streak: number): string {
  // Find the closest matching streak message
  const keys = Object.keys(STREAK_MESSAGES)
    .map(Number)
    .sort((a, b) => b - a);
  for (const key of keys) {
    if (streak >= key) {
      return pickRandom(STREAK_MESSAGES[String(key)]!);
    }
  }
  return pickRandom(STREAK_MESSAGES['0']!);
}
