<script lang="ts">
  import Queue from './components/Queue.svelte';
  import ReadList from './components/ReadList.svelte';
  import Stats from './components/Stats.svelte';
  import Search from './components/Search.svelte';
  import type { ReadingItem, UserStats } from '../../lib/types';

  type Tab = 'queue' | 'read' | 'stats';

  let activeTab = $state<Tab>('queue');
  let items = $state<ReadingItem[]>([]);
  let stats = $state<UserStats | null>(null);
  let searchQuery = $state('');
  let loading = $state(true);

  async function loadData() {
    try {
      const [itemsRes, statsRes] = await Promise.all([
        chrome.runtime.sendMessage({ type: 'GET_ITEMS' }),
        chrome.runtime.sendMessage({ type: 'GET_STATS' }),
      ]);
      items = itemsRes?.items ?? [];
      stats = statsRes?.stats ?? null;
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      loading = false;
    }
  }

  // Load data on mount
  loadData();

  // Listen for storage changes to keep UI in sync
  chrome.storage.onChanged.addListener(() => {
    loadData();
  });

  let filteredItems = $derived(
    searchQuery
      ? items.filter(
          (i) =>
            i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            i.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            i.siteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (i.category?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false),
        )
      : items,
  );

  let unreadCount = $derived(
    items.filter((i) => i.status === 'unread').length,
  );

  let readCount = $derived(items.filter((i) => i.status === 'read').length);

  async function handleStartSession() {
    const response = await chrome.runtime.sendMessage({
      type: 'START_SESSION',
    });
    if (response?.items?.length > 0) {
      // Open the first item in focus mode
      await chrome.runtime.sendMessage({
        type: 'OPEN_FOCUS_MODE',
        payload: { id: response.items[0].id },
      });
    }
  }
</script>

<div class="popup">
  <!-- Header -->
  <header class="header">
    <div class="header-top">
      <h1 class="logo">
        <span class="logo-icon">📚</span>
        <span class="logo-text">Reading Nook</span>
      </h1>
      {#if stats && stats.currentStreak > 0}
        <div class="streak-badge" title="{stats.currentStreak}-day reading streak!">
          🔥 {stats.currentStreak}
        </div>
      {/if}
    </div>

    <!-- Search -->
    <Search bind:query={searchQuery} />
  </header>

  <!-- Tabs -->
  <div class="tabs" role="tablist">
    <button
      class="tab"
      class:active={activeTab === 'queue'}
      onclick={() => (activeTab = 'queue')}
      role="tab"
      aria-selected={activeTab === 'queue'}
    >
      Queue
      {#if unreadCount > 0}
        <span class="tab-badge">{unreadCount}</span>
      {/if}
    </button>
    <button
      class="tab"
      class:active={activeTab === 'read'}
      onclick={() => (activeTab = 'read')}
      role="tab"
      aria-selected={activeTab === 'read'}
    >
      Read
      {#if readCount > 0}
        <span class="tab-badge tab-badge-success">{readCount}</span>
      {/if}
    </button>
    <button
      class="tab"
      class:active={activeTab === 'stats'}
      onclick={() => (activeTab = 'stats')}
      role="tab"
      aria-selected={activeTab === 'stats'}
    >
      Stats
    </button>
  </div>

  <!-- Content -->
  <main class="content">
    {#if loading}
      <div class="loading">
        <div class="loading-spinner"></div>
        <p>Loading your nook...</p>
      </div>
    {:else if activeTab === 'queue'}
      <Queue
        items={filteredItems.filter((i) => i.status === 'unread' || i.status === 'reading')}
        onStartSession={handleStartSession}
      />
    {:else if activeTab === 'read'}
      <ReadList items={filteredItems.filter((i) => i.status === 'read')} />
    {:else if activeTab === 'stats'}
      <Stats {stats} {items} />
    {/if}
  </main>
</div>

<style>
  .popup {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  /* ─── Header ─────────────────────────────────────────────────── */

  .header {
    padding: 16px 16px 8px;
    background: var(--rn-bg);
    border-bottom: 1px solid var(--rn-border);
  }

  .header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: var(--rn-text);
  }

  .logo-icon {
    font-size: 20px;
  }

  .streak-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    background: var(--rn-warning-light);
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    color: var(--rn-warning);
  }

  /* ─── Tabs ───────────────────────────────────────────────────── */

  .tabs {
    display: flex;
    gap: 0;
    padding: 0 16px;
    background: var(--rn-bg);
    border-bottom: 1px solid var(--rn-border);
  }

  .tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 8px;
    font-size: 13px;
    font-weight: 500;
    color: var(--rn-text-secondary);
    border-bottom: 2px solid transparent;
    transition: all var(--rn-transition);
  }

  .tab:hover {
    color: var(--rn-text);
    background: var(--rn-bg-secondary);
  }

  .tab.active {
    color: var(--rn-accent);
    border-bottom-color: var(--rn-accent);
  }

  .tab-badge {
    padding: 1px 7px;
    background: var(--rn-accent-light);
    color: var(--rn-accent);
    border-radius: 10px;
    font-size: 11px;
    font-weight: 600;
  }

  .tab-badge-success {
    background: var(--rn-success-light);
    color: var(--rn-success);
  }

  /* ─── Content ────────────────────────────────────────────────── */

  .content {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
  }

  /* ─── Loading ────────────────────────────────────────────────── */

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 48px 16px;
    color: var(--rn-text-secondary);
  }

  .loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--rn-border);
    border-top-color: var(--rn-accent);
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
