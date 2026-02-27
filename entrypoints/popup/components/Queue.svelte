<script lang="ts">
  import type { ReadingItem } from '../../../lib/types';
  import { getEmptyQueueMessage } from '../../../lib/utils';
  import ItemCard from './ItemCard.svelte';

  let {
    items,
    onStartSession,
  }: {
    items: ReadingItem[];
    onStartSession: () => void;
  } = $props();

  let emptyMessage = $state(getEmptyQueueMessage());

  async function handleOpenFocus(item: ReadingItem) {
    await chrome.runtime.sendMessage({
      type: 'OPEN_FOCUS_MODE',
      payload: { id: item.id },
    });
  }

  async function handleArchive(item: ReadingItem) {
    await chrome.runtime.sendMessage({
      type: 'UPDATE_ITEM',
      payload: { id: item.id, status: 'archived' },
    });
  }

  async function handleDelete(item: ReadingItem) {
    await chrome.runtime.sendMessage({
      type: 'DELETE_ITEM',
      payload: { id: item.id },
    });
  }
</script>

<div class="queue">
  {#if items.length === 0}
    <div class="empty-state">
      <div class="empty-illustration" aria-hidden="true">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <rect x="12" y="8" width="40" height="48" rx="4" stroke="#C4704B" stroke-width="1.5" opacity="0.3"/>
          <rect x="16" y="14" width="32" height="38" rx="3" stroke="#C4704B" stroke-width="1.5" opacity="0.5"/>
          <path d="M24 24h16M24 30h12M24 36h8" stroke="#C4704B" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
          <circle cx="48" cy="48" r="8" fill="#FFF8F0" stroke="#7B9E6B" stroke-width="1.5"/>
          <path d="M45 48h6M48 45v6" stroke="#7B9E6B" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
      <p class="empty-text">{emptyMessage}</p>
      <p class="empty-hint">
        Click the save button on any page to add it here.
      </p>
    </div>
  {:else}
    <!-- Session CTA -->
    {#if items.length >= 2}
      <button class="session-cta" onclick={onStartSession}>
        <div class="session-icon-wrap" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
            <line x1="6" y1="1" x2="6" y2="4"/>
            <line x1="10" y1="1" x2="10" y2="4"/>
            <line x1="14" y1="1" x2="14" y2="4"/>
          </svg>
        </div>
        <span class="session-text">
          <strong>Start a reading session</strong>
          <small>We'll pick a few cozy reads for you</small>
        </span>
        <span class="session-arrow" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </span>
      </button>
    {/if}

    <!-- Item list -->
    <div class="item-list">
      {#each items as item, i (item.id)}
        <ItemCard
          {item}
          index={i}
          onOpenFocus={handleOpenFocus}
          onArchive={handleArchive}
          onDelete={handleDelete}
        />
      {/each}
    </div>

    <div class="queue-footer">
      <span class="queue-count">
        {items.length} read{items.length !== 1 ? 's' : ''} waiting for a cozy moment
      </span>
    </div>
  {/if}
</div>

<style>
  .queue {
    display: flex;
    flex-direction: column;
  }

  /* ─── Empty State ──────────────────────────────────────────── */

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 32px;
    text-align: center;
    animation: fadeUp 0.4s ease;
  }

  @keyframes fadeUp {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .empty-illustration {
    margin-bottom: 16px;
    opacity: 0.8;
    animation: gentleFloat 3s ease-in-out infinite;
  }

  @keyframes gentleFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }

  .empty-text {
    font-size: 14px;
    font-weight: 500;
    color: var(--rn-text);
    margin-bottom: 6px;
    line-height: 1.4;
  }

  .empty-hint {
    font-size: 12px;
    color: var(--rn-text-muted);
  }

  /* ─── Session CTA ──────────────────────────────────────────── */

  .session-cta {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 8px 12px;
    padding: 12px 14px;
    background: var(--rn-bg-card);
    border: 1.5px solid var(--rn-accent-light);
    border-radius: 14px;
    transition: all var(--rn-transition-smooth);
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

  .session-cta:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px var(--rn-shadow-hover);
    border-color: var(--rn-accent);
    background: linear-gradient(135deg, var(--rn-bg-card), var(--rn-accent-light));
  }

  .session-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: var(--rn-accent-light);
    color: var(--rn-accent);
    flex-shrink: 0;
    transition: all var(--rn-transition-smooth);
  }

  .session-cta:hover .session-icon-wrap {
    background: var(--rn-accent);
    color: white;
    transform: scale(1.05);
  }

  .session-text {
    display: flex;
    flex-direction: column;
    text-align: left;
    gap: 1px;
    flex: 1;
  }

  .session-text strong {
    font-size: 13px;
    font-weight: 600;
    color: var(--rn-text);
  }

  .session-text small {
    font-size: 11px;
    color: var(--rn-text-muted);
  }

  .session-arrow {
    color: var(--rn-text-muted);
    transition: all var(--rn-transition);
    flex-shrink: 0;
  }

  .session-cta:hover .session-arrow {
    color: var(--rn-accent);
    transform: translateX(2px);
  }

  /* ─── Footer ───────────────────────────────────────────────── */

  .queue-footer {
    padding: 12px 16px;
    text-align: center;
  }

  .queue-count {
    font-size: 11px;
    color: var(--rn-text-muted);
    font-style: italic;
  }
</style>
