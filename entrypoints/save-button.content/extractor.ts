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
  const estimatedReadTime =
    contentType === 'video' ? undefined : estimateReadTime(wordCount);

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
