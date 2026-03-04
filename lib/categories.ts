import type { ReadingItem } from './types';

/**
 * Auto-categorize a reading item based on URL, content type, and title
 */
export function categorize(item: ReadingItem): string {
  const url = item.url.toLowerCase();
  const title = item.title.toLowerCase();

  // Check content type first
  if (item.contentType === 'video') return 'Videos';
  if (item.contentType === 'tweet') return 'Tweets & Threads';
  if (item.contentType === 'paper') return 'Papers & Research';

  // Check URL patterns for common categories
  const categoryPatterns: [RegExp, string][] = [
    // Tech
    [/\b(programming|coding|developer|software|engineering|api|framework|library|react|svelte|vue|angular|node|python|rust|go|typescript|javascript)\b/, 'Tech & Programming'],
    [/(github\.com|stackoverflow\.com|dev\.to|medium\.com\/.*\btech\b|hackernoon\.com)/, 'Tech & Programming'],

    // AI / ML
    [/\b(ai|artificial.intelligence|machine.learning|deep.learning|neural|gpt|llm|transformer|diffusion|generative)\b/, 'AI & Machine Learning'],
    [/(openai\.com|anthropic\.com|huggingface\.co)/, 'AI & Machine Learning'],

    // Science
    [/\b(science|physics|biology|chemistry|astronomy|neuroscience|research|study|experiment)\b/, 'Science'],
    [/(nature\.com|science\.org|scientificamerican\.com)/, 'Science'],

    // Design
    [/\b(design|ux|ui|typography|color|layout|figma|sketch)\b/, 'Design'],
    [/(dribbble\.com|behance\.net|figma\.com)/, 'Design'],

    // Business & Startups
    [/\b(startup|business|entrepreneurship|marketing|growth|revenue|fundraising|vc|venture)\b/, 'Business & Startups'],

    // Philosophy & Thinking
    [/\b(philosophy|thinking|consciousness|ethics|moral|stoic|meditation|mindfulness)\b/, 'Ideas & Philosophy'],

    // Culture & Society
    [/\b(culture|society|politics|history|economics|climate|social)\b/, 'Culture & Society'],

    // Personal Development
    [/\b(productivity|habits|self.improvement|career|learning|skills|growth.mindset)\b/, 'Personal Growth'],

    // News
    [/(cnn\.com|bbc\.com|reuters\.com|nytimes\.com|theguardian\.com|washingtonpost\.com)/, 'News'],
  ];

  // Check title and URL against patterns
  for (const [pattern, category] of categoryPatterns) {
    if (pattern.test(title) || pattern.test(url)) {
      return category;
    }
  }

  return 'General Reading';
}

/**
 * Group items by category
 */
export function groupByCategory(
  items: ReadingItem[],
): Map<string, ReadingItem[]> {
  const groups = new Map<string, ReadingItem[]>();

  for (const item of items) {
    const category = item.category || categorize(item);
    const group = groups.get(category) || [];
    group.push(item);
    groups.set(category, group);
  }

  return groups;
}

/**
 * Suggest items for a reading session based on estimated reading time
 */
export function suggestSessionItems(
  items: ReadingItem[],
  targetMinutes: number,
): ReadingItem[] {
  const unread = items
    .filter((i) => i.status === 'unread')
    .sort((a, b) => {
      // Prioritize: least nudged, then oldest
      if (a.nudgeCount !== b.nudgeCount) return a.nudgeCount - b.nudgeCount;
      return a.savedAt - b.savedAt;
    });

  if (unread.length === 0) return [];

  const selected: ReadingItem[] = [];
  let totalTime = 0;

  for (const item of unread) {
    const readTime = item.estimatedReadTime || 5; // default 5 min if unknown
    if (totalTime + readTime <= targetMinutes || selected.length === 0) {
      selected.push(item);
      totalTime += readTime;
    }
    if (selected.length >= 3) break; // max 3 items per session
  }

  return selected;
}

/**
 * Pick items to suggest in a nudge notification (1-3 items)
 */
export function pickNudgeItems(items: ReadingItem[]): ReadingItem[] {
  const unread = items
    .filter((i) => i.status === 'unread')
    .sort((a, b) => {
      // Mix of oldest and least-nudged
      const ageScore =
        (Date.now() - a.savedAt) / (1000 * 60 * 60 * 24) -
        (Date.now() - b.savedAt) / (1000 * 60 * 60 * 24);
      const nudgeScore = a.nudgeCount - b.nudgeCount;
      return nudgeScore * 2 + ageScore;
    });

  return unread.slice(0, Math.min(3, unread.length));
}
