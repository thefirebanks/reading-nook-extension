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
      <div class="empty-icon">📖</div>
      <p class="empty-text">{emptyMessage}</p>
      <p class="empty-hint">
        Click the save button on any page to add it here.
      </p>
    </div>
  {:else}
    <!-- Session CTA -->
    {#if items.length >= 2}
      <button class="session-cta" onclick={onStartSession}>
        <span class="session-icon">☕</span>
        <span class="session-text">
          <strong>Start a reading session</strong>
          <small>We'll pick a few cozy reads for you</small>
        </span>
      </button>
    {/if}

    <!-- Item list -->
    <div class="item-list">
      {#each items as item (item.id)}
        <ItemCard
          {item}
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
    padding: 48px 32px;
    text-align: center;
  }

  .empty-icon {
    font-size: 40px;
    margin-bottom: 12px;
    animation: gentle-bounce 2s ease-in-out infinite;
  }

  .empty-text {
    font-size: 14px;
    font-weight: 500;
    color: var(--rn-text);
    margin-bottom: 8px;
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
    margin: 8px 16px;
    padding: 12px 16px;
    background: linear-gradient(135deg, var(--rn-accent-light), var(--rn-warning-light));
    border-radius: var(--rn-radius);
    transition: all var(--rn-transition);
  }

  .session-cta:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px var(--rn-shadow-hover);
  }

  .session-icon {
    font-size: 24px;
  }

  .session-text {
    display: flex;
    flex-direction: column;
    text-align: left;
    gap: 2px;
  }

  .session-text strong {
    font-size: 13px;
    color: var(--rn-text);
  }

  .session-text small {
    font-size: 11px;
    color: var(--rn-text-secondary);
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

  /* ─── Animations ───────────────────────────────────────────── */

  @keyframes gentle-bounce {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-6px);
    }
  }
</style>
