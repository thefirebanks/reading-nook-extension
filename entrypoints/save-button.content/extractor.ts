import type { PageMetadata } from '../../lib/types';
import {
  detectContentType,
  extractSiteName,
  estimateReadTime,
} from '../../lib/utils';

/**
 * Extract metadata from the current page using Open Graph tags,
 * meta tags, and DOM analysis as fallbacks.
 */
export function extractPageMetadata(): PageMetadata {
  const url = window.location.href;

  // Title: OG > Twitter > document.title
  const title =
    getMeta('og:title') ||
    getMeta('twitter:title') ||
    document.title ||
    url;

  // Description: OG > Twitter > meta description
  const description =
    getMeta('og:description') ||
    getMeta('twitter:description') ||
    getMeta('description') ||
    '';

  // Thumbnail: OG > Twitter
  const thumbnail =
    getMeta('og:image') ||
    getMeta('twitter:image') ||
    undefined;

  // Site name: OG > extracted from URL
  const siteName =
    getMeta('og:site_name') || extractSiteName(url);

  // Content type
  const contentType = detectContentType(url);

  // Estimated read time from word count
  const wordCount = countWords();
  let estimatedReadTime: number | undefined;

  if (contentType === 'video') {
    // Videos don't have a word-based read time
    estimatedReadTime = undefined;
  } else if (contentType === 'paper') {
    // Papers (arxiv, etc.) — the abstract page has very few visible words,
    // but the actual paper is much longer. Use a sensible default range
    // based on academic paper norms (15-30 min) unless we extracted a
    // substantial word count (> 2000 words means we likely got the full text).
    if (wordCount > 2000) {
      estimatedReadTime = estimateReadTime(wordCount);
    } else {
      estimatedReadTime = 20; // ~20 min is a reasonable default for papers
    }
  } else {
    estimatedReadTime = wordCount > 0 ? estimateReadTime(wordCount) : undefined;
  }

  return {
    url,
    title,
    description,
    thumbnail,
    siteName,
    contentType,
    estimatedReadTime,
  };
}

/**
 * Get content of a meta tag by property or name
 */
function getMeta(nameOrProperty: string): string | null {
  const el =
    document.querySelector(`meta[property="${nameOrProperty}"]`) ||
    document.querySelector(`meta[name="${nameOrProperty}"]`);
  return el?.getAttribute('content') || null;
}

/**
 * Count approximate words in the main content of the page
 */
function countWords(): number {
  // Try to find the main content area
  const contentEl =
    document.querySelector('article') ||
    document.querySelector('[role="main"]') ||
    document.querySelector('main') ||
    document.querySelector('.post-content') ||
    document.querySelector('.article-content') ||
    document.querySelector('.entry-content') ||
    document.body;

  if (!contentEl) return 0;

  const text = contentEl.textContent || '';
  // Split by whitespace and filter empty strings
  return text
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}
