<script lang="ts">
  import type { ReadingItem } from '../../../lib/types';
  import { formatRelativeTime, formatReadTime, truncate } from '../../../lib/utils';
  import { contentTypeEmoji } from '../../../lib/categories';

  let {
    item,
    onOpenFocus,
    onArchive,
    onDelete,
  }: {
    item: ReadingItem;
    onOpenFocus: (item: ReadingItem) => void;
    onArchive: (item: ReadingItem) => void;
    onDelete: (item: ReadingItem) => void;
  } = $props();

  let showActions = $state(false);
</script>

<div
  class="item-card"
  class:reading={item.status === 'reading'}
  role="article"
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
      <span class="item-type" title={item.contentType}>
        {contentTypeEmoji(item.contentType)}
      </span>
      <span class="item-site">{item.siteName}</span>
      {#if item.estimatedReadTime}
        <span class="item-dot">·</span>
        <span class="item-time">{formatReadTime(item.estimatedReadTime)}</span>
      {/if}
      {#if item.category}
        <span class="item-dot">·</span>
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

      {#if showActions}
        <div class="item-actions">
          <button
            class="action-btn action-read"
            onclick={() => onOpenFocus(item)}
            title="Read now"
          >
            📖 Read
          </button>
          <button
            class="action-btn action-archive"
            onclick={() => onArchive(item)}
            title="Archive"
          >
            📦
          </button>
          <button
            class="action-btn action-delete"
            onclick={() => onDelete(item)}
            title="Remove"
          >
            ✕
          </button>
        </div>
      {/if}
    </div>
  </div>

  {#if item.status === 'reading'}
    <div class="reading-indicator">Reading...</div>
  {/if}
</div>

<style>
  .item-card {
    display: flex;
    gap: 12px;
    padding: 12px 16px;
    background: var(--rn-bg-card);
    border-bottom: 1px solid var(--rn-border);
    transition: all var(--rn-transition);
    position: relative;
  }

  .item-card:hover {
    background: var(--rn-bg-secondary);
  }

  .item-card.reading {
    border-left: 3px solid var(--rn-accent);
  }

  .item-thumb {
    flex-shrink: 0;
    width: 56px;
    height: 56px;
    border-radius: var(--rn-radius-sm);
    overflow: hidden;
    background: var(--rn-bg-secondary);
  }

  .item-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
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
    margin-bottom: 4px;
  }

  .item-type {
    font-size: 12px;
  }

  .item-site {
    font-weight: 500;
  }

  .item-dot {
    opacity: 0.4;
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
    line-height: 1.3;
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
  }

  .action-btn {
    padding: 3px 8px;
    border-radius: var(--rn-radius-xs);
    font-size: 11px;
    transition: all var(--rn-transition);
  }

  .action-read {
    background: var(--rn-accent-light);
    color: var(--rn-accent);
    font-weight: 500;
  }

  .action-read:hover {
    background: var(--rn-accent);
    color: white;
  }

  .action-archive {
    font-size: 13px;
    opacity: 0.6;
  }

  .action-archive:hover {
    opacity: 1;
  }

  .action-delete {
    font-size: 13px;
    opacity: 0.4;
    color: var(--rn-danger);
  }

  .action-delete:hover {
    opacity: 1;
  }

  .reading-indicator {
    position: absolute;
    top: 8px;
    right: 8px;
    padding: 2px 8px;
    background: var(--rn-accent-light);
    color: var(--rn-accent);
    border-radius: 10px;
    font-size: 10px;
    font-weight: 600;
  }
</style>
