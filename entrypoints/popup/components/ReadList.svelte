<script lang="ts">
  import type { ReadingItem } from '../../../lib/types';
  import { formatRelativeTime, truncate, getAllReadMessage } from '../../../lib/utils';

  let { items }: { items: ReadingItem[] } = $props();

  let emptyMessage = $state(getAllReadMessage());
</script>

<div class="read-list">
  {#if items.length === 0}
    <div class="empty-state">
      <div class="empty-illustration" aria-hidden="true">
        <svg width="56" height="56" viewBox="0 0 64 64" fill="none">
          <path d="M32 16c-8 0-16 8-16 20s8 16 16 16 16-4 16-16S40 16 32 16z" stroke="#7B9E6B" stroke-width="1.5" opacity="0.4"/>
          <path d="M28 28c0-4 2-8 4-8s4 4 4 8" stroke="#7B9E6B" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
          <line x1="32" y1="36" x2="32" y2="44" stroke="#7B9E6B" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
          <path d="M26 44c2 2 4 3 6 3s4-1 6-3" stroke="#7B9E6B" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
        </svg>
      </div>
      <p class="empty-text">{emptyMessage}</p>
      <p class="empty-hint">
        Finished reads and reflections will appear here.
      </p>
    </div>
  {:else}
    <div class="item-list">
      {#each items as item, i (item.id)}
        <div class="read-item" style="animation-delay: {i * 40}ms">
          <div class="read-item-header">
            <span class="read-item-site">{item.siteName}</span>
            <span class="read-item-dot">&middot;</span>
            <span class="read-item-date">
              Read {item.readAt ? formatRelativeTime(item.readAt) : ''}
            </span>
          </div>

          <h3 class="read-item-title">
            <a href={item.url} target="_blank" rel="noopener">
              {truncate(item.title, 80)}
            </a>
          </h3>

          {#if item.reflection}
            <div class="reflection-card">
              <div class="reflection-rating">
                {#if item.reflection.rating === 'worth-it'}
                  <span class="rating-badge rating-good">Worth it</span>
                {:else if item.reflection.rating === 'meh'}
                  <span class="rating-badge rating-meh">Meh</span>
                {:else}
                  <span class="rating-badge rating-bad">Not worth it</span>
                {/if}

                {#if item.reflection.wantMoreLikeThis}
                  <span class="more-badge">More like this</span>
                {/if}
              </div>

              {#if item.reflection.takeaway}
                <p class="reflection-takeaway">
                  &ldquo;{item.reflection.takeaway}&rdquo;
                </p>
              {/if}

              {#if item.reflection.notes}
                <p class="reflection-notes">{truncate(item.reflection.notes, 200)}</p>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .read-list {
    display: flex;
    flex-direction: column;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 32px;
    text-align: center;
    animation: fadeUp 0.4s ease;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .empty-illustration {
    margin-bottom: 14px;
    opacity: 0.7;
  }

  .empty-text {
    font-size: 14px;
    font-weight: 500;
    color: var(--rn-text);
    margin-bottom: 6px;
  }

  .empty-hint {
    font-size: 12px;
    color: var(--rn-text-muted);
  }

  .read-item {
    padding: 12px 16px;
    border-bottom: 1px solid var(--rn-border);
    animation: cardSlideIn 0.3s ease both;
    transition: background var(--rn-transition);
  }

  @keyframes cardSlideIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .read-item:hover {
    background: rgba(255, 248, 240, 0.5);
  }

  .read-item-header {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--rn-text-secondary);
    margin-bottom: 4px;
  }

  .read-item-site {
    font-weight: 500;
  }

  .read-item-dot {
    opacity: 0.3;
  }

  .read-item-date {
    color: var(--rn-text-muted);
  }

  .read-item-title {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 8px;
    line-height: 1.35;
  }

  .read-item-title a {
    color: var(--rn-text);
    text-decoration: none;
    transition: color var(--rn-transition);
  }

  .read-item-title a:hover {
    color: var(--rn-accent);
  }

  /* ─── Reflection Card ──────────────────────────────────────── */

  .reflection-card {
    padding: 10px 12px;
    background: var(--rn-bg-secondary);
    border-radius: var(--rn-radius-sm);
    border-left: 3px solid var(--rn-accent);
  }

  .reflection-rating {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
  }

  .rating-badge {
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  .rating-good {
    background: var(--rn-success-light);
    color: var(--rn-success);
  }

  .rating-meh {
    background: var(--rn-warning-light);
    color: var(--rn-warning);
  }

  .rating-bad {
    background: #fde8e8;
    color: var(--rn-danger);
  }

  .more-badge {
    padding: 2px 8px;
    background: var(--rn-accent-light);
    color: var(--rn-accent);
    border-radius: 10px;
    font-size: 10px;
    font-weight: 500;
  }

  .reflection-takeaway {
    font-size: 12px;
    font-style: italic;
    color: var(--rn-text);
    margin-bottom: 4px;
    line-height: 1.5;
  }

  .reflection-notes {
    font-size: 11px;
    color: var(--rn-text-secondary);
    line-height: 1.4;
  }
</style>
