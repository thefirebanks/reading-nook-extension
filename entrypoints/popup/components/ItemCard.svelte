<script lang="ts">
  import type { ReadingItem } from '../../../lib/types';
  import { formatRelativeTime, formatReadTime, truncate } from '../../../lib/utils';

  let {
    item,
    index = 0,
    onOpenFocus,
    onArchive,
    onDelete,
  }: {
    item: ReadingItem;
    index?: number;
    onOpenFocus: (item: ReadingItem) => void;
    onArchive: (item: ReadingItem) => void;
    onDelete: (item: ReadingItem) => void;
  } = $props();

  let showActions = $state(false);

  function contentTypeLabel(type: string): string {
    switch (type) {
      case 'article': return 'Article';
      case 'video': return 'Video';
      case 'tweet': return 'Thread';
      case 'paper': return 'Paper';
      default: return 'Link';
    }
  }
</script>

<div
  class="item-card"
  class:reading={item.status === 'reading'}
  role="article"
  style="animation-delay: {index * 50}ms"
  onmouseenter={() => (showActions = true)}
  onmouseleave={() => (showActions = false)}
>
  <!-- Thumbnail -->
  {#if item.thumbnail}
    <div class="item-thumb">
      <img src={item.thumbnail} alt="" loading="lazy" />
    </div>
  {/if}

  <!-- Content -->
  <div class="item-body">
    <div class="item-meta">
      <span class="item-type">{contentTypeLabel(item.contentType)}</span>
      <span class="item-dot">&middot;</span>
      <span class="item-site">{item.siteName}</span>
      {#if item.estimatedReadTime}
        <span class="item-dot">&middot;</span>
        <span class="item-time">{formatReadTime(item.estimatedReadTime)}</span>
      {/if}
      {#if item.category}
        <span class="item-dot">&middot;</span>
        <span class="item-category">{item.category}</span>
      {/if}
    </div>

    <h3 class="item-title">
      <button class="item-title-btn" onclick={() => onOpenFocus(item)}>
        {truncate(item.title, 80)}
      </button>
    </h3>

    {#if item.description}
      <p class="item-desc">{truncate(item.description, 120)}</p>
    {/if}

    <div class="item-footer">
      <span class="item-saved">{formatRelativeTime(item.savedAt)}</span>

      <div class="item-actions" class:item-actions-visible={showActions}>
        <button
          class="action-btn action-read"
          onclick={() => onOpenFocus(item)}
          title="Read now"
        >
          Read
        </button>
        <button
          class="action-btn action-archive"
          onclick={() => onArchive(item)}
          title="Archive"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="21 8 21 21 3 21 3 8"></polyline>
            <rect x="1" y="3" width="22" height="5"></rect>
            <line x1="10" y1="12" x2="14" y2="12"></line>
          </svg>
        </button>
        <button
          class="action-btn action-delete"
          onclick={() => onDelete(item)}
          title="Remove"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  </div>

  {#if item.status === 'reading'}
    <div class="reading-indicator">
      <span class="reading-dot"></span>
      Reading
    </div>
  {/if}
</div>

<style>
  .item-card {
    display: flex;
    gap: 12px;
    padding: 12px 16px;
    background: var(--rn-bg-card);
    border-bottom: 1px solid var(--rn-border);
    transition: all var(--rn-transition-smooth);
    position: relative;
    animation: cardSlideIn 0.3s ease both;
  }

  @keyframes cardSlideIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .item-card:hover {
    background: var(--rn-bg-secondary);
    box-shadow: 0 1px 4px var(--rn-shadow);
  }

  .item-card.reading {
    border-left: 3px solid var(--rn-accent);
  }

  .item-thumb {
    flex-shrink: 0;
    width: 52px;
    height: 52px;
    border-radius: 10px;
    overflow: hidden;
    background: var(--rn-bg-secondary);
  }

  .item-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }

  .item-card:hover .item-thumb img {
    transform: scale(1.06);
  }

  .item-body {
    flex: 1;
    min-width: 0;
  }

  .item-meta {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--rn-text-secondary);
    margin-bottom: 3px;
  }

  .item-type {
    font-weight: 600;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: var(--rn-text-muted);
    padding: 1px 5px;
    background: var(--rn-bg-secondary);
    border-radius: 4px;
  }

  .item-site {
    font-weight: 500;
  }

  .item-dot {
    opacity: 0.3;
  }

  .item-time {
    color: var(--rn-text-muted);
  }

  .item-category {
    color: var(--rn-accent);
    font-weight: 500;
  }

  .item-title {
    font-size: 13px;
    font-weight: 600;
    line-height: 1.35;
    margin-bottom: 2px;
  }

  .item-title-btn {
    text-align: left;
    font-weight: inherit;
    font-size: inherit;
    line-height: inherit;
    color: var(--rn-text);
    padding: 0;
    transition: color var(--rn-transition);
  }

  .item-title-btn:hover {
    color: var(--rn-accent);
  }

  .item-desc {
    font-size: 12px;
    color: var(--rn-text-secondary);
    line-height: 1.4;
    margin-bottom: 4px;
    opacity: 0.85;
  }

  .item-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 24px;
  }

  .item-saved {
    font-size: 11px;
    color: var(--rn-text-muted);
  }

  .item-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    opacity: 0;
    transform: translateY(2px);
    transition: all 0.2s ease;
    pointer-events: none;
  }

  .item-actions-visible {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }

  .action-btn {
    padding: 3px 8px;
    border-radius: var(--rn-radius-xs);
    font-size: 11px;
    transition: all var(--rn-transition);
    display: flex;
    align-items: center;
    gap: 3px;
  }

  .action-read {
    background: var(--rn-accent-light);
    color: var(--rn-accent);
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 8px;
  }

  .action-read:hover {
    background: var(--rn-accent);
    color: white;
    transform: translateY(-1px);
  }

  .action-archive {
    color: var(--rn-text-muted);
    padding: 4px;
    border-radius: 6px;
  }

  .action-archive:hover {
    color: var(--rn-text-secondary);
    background: var(--rn-bg-secondary);
  }

  .action-delete {
    color: var(--rn-text-muted);
    padding: 4px;
    border-radius: 6px;
    opacity: 0.6;
  }

  .action-delete:hover {
    opacity: 1;
    color: var(--rn-danger);
    background: rgba(201, 84, 77, 0.06);
  }

  .reading-indicator {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 2px 8px;
    background: var(--rn-accent-light);
    color: var(--rn-accent);
    border-radius: 10px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  .reading-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--rn-accent);
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
</style>
