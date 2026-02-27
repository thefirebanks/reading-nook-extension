<script lang="ts">
  import Queue from './components/Queue.svelte';
  import ReadList from './components/ReadList.svelte';
  import Stats from './components/Stats.svelte';
  import Search from './components/Search.svelte';
  import type { ReadingItem, UserStats } from '../../lib/types';

  type Tab = 'queue' | 'read' | 'stats';
  const TABS: Tab[] = ['queue', 'read', 'stats'];

  let activeTab = $state<Tab>('queue');
  let prevTab = $state<Tab>('queue');
  let items = $state<ReadingItem[]>([]);
  let stats = $state<UserStats | null>(null);
  let searchQuery = $state('');
  let loading = $state(true);
  let contentVisible = $state(true);

  let tabIndex = $derived(TABS.indexOf(activeTab));

  function switchTab(tab: Tab) {
    if (tab === activeTab) return;
    prevTab = activeTab;
    contentVisible = false;
    setTimeout(() => {
      activeTab = tab;
      contentVisible = true;
    }, 150);
  }

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
        <span class="logo-icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8 7h8M8 11h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </span>
        <span class="logo-text">Reading Nook</span>
      </h1>
      {#if stats && stats.currentStreak > 0}
        <div class="streak-badge" title="{stats.currentStreak}-day reading streak!">
          <span class="streak-flame" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 23c-4.97 0-9-3.58-9-8 0-3.07 2.31-6.64 4.5-9 .37-.4 1.03-.08.96.45-.27 2.07.67 4.05 1.54 5.05.13.15.37.07.4-.12.5-3.08 3.07-5.89 4.6-7.13.31-.25.75.02.7.41-.3 2.5.6 5.2 2.3 7.34 1.2 1.5 2 3.37 2 5C20 19.42 16.97 23 12 23z"/>
            </svg>
          </span>
          {stats.currentStreak}
        </div>
      {/if}
    </div>

    <!-- Search -->
    <Search bind:query={searchQuery} />
  </header>

  <!-- Tabs -->
  <div class="tabs" role="tablist">
    <div class="tab-track">
      <div class="tab-indicator" style="transform: translateX({tabIndex * 100}%)"></div>
    </div>
    <button
      class="tab"
      class:active={activeTab === 'queue'}
      onclick={() => switchTab('queue')}
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
      onclick={() => switchTab('read')}
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
      onclick={() => switchTab('stats')}
      role="tab"
      aria-selected={activeTab === 'stats'}
    >
      Stats
    </button>
  </div>

  <!-- Content -->
  <main class="content" class:content-enter={contentVisible} class:content-exit={!contentVisible}>
    {#if loading}
      <div class="loading">
        <div class="loading-skeleton">
          <div class="skeleton-card">
            <div class="skeleton-line skeleton-short"></div>
            <div class="skeleton-line skeleton-long"></div>
            <div class="skeleton-line skeleton-medium"></div>
          </div>
          <div class="skeleton-card" style="animation-delay: 0.1s">
            <div class="skeleton-line skeleton-short"></div>
            <div class="skeleton-line skeleton-long"></div>
            <div class="skeleton-line skeleton-medium"></div>
          </div>
          <div class="skeleton-card" style="animation-delay: 0.2s">
            <div class="skeleton-line skeleton-short"></div>
            <div class="skeleton-line skeleton-long"></div>
            <div class="skeleton-line skeleton-medium"></div>
          </div>
        </div>
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
    animation: fadeInPage 0.3s ease;
  }

  @keyframes fadeInPage {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* ─── Header ─────────────────────────────────────────────────── */

  .header {
    padding: 16px 16px 10px;
    background: var(--rn-bg);
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
    gap: 9px;
    font-family: var(--rn-font-display);
    font-size: 17px;
    font-weight: 400;
    color: var(--rn-text);
    letter-spacing: -0.01em;
  }

  .logo-icon {
    display: flex;
    align-items: center;
    color: var(--rn-accent);
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
    letter-spacing: -0.01em;
  }

  .streak-flame {
    display: flex;
    align-items: center;
    color: var(--rn-warning);
  }

  /* ─── Tabs ───────────────────────────────────────────────────── */

  .tabs {
    position: relative;
    display: flex;
    gap: 0;
    padding: 4px 16px;
    background: var(--rn-bg);
  }

  .tab-track {
    position: absolute;
    bottom: 4px;
    left: 16px;
    right: 16px;
    height: 100%;
    pointer-events: none;
  }

  .tab-indicator {
    position: absolute;
    bottom: 0;
    left: 0;
    width: calc(100% / 3);
    height: 100%;
    background: var(--rn-accent-light);
    border-radius: 10px;
    transition: transform var(--rn-transition-spring);
    opacity: 0.6;
  }

  .tab {
    flex: 1;
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 9px 8px;
    font-size: 13px;
    font-weight: 500;
    color: var(--rn-text-muted);
    border-radius: 10px;
    transition: color var(--rn-transition);
  }

  .tab:hover {
    color: var(--rn-text-secondary);
  }

  .tab.active {
    color: var(--rn-accent);
    font-weight: 600;
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
    padding: 4px 0;
    border-top: 1px solid var(--rn-border);
  }

  .content-enter {
    animation: contentFadeIn 0.2s ease forwards;
  }

  .content-exit {
    animation: contentFadeOut 0.12s ease forwards;
  }

  @keyframes contentFadeIn {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes contentFadeOut {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(-4px);
    }
  }

  /* ─── Loading Skeleton ──────────────────────────────────────── */

  .loading {
    padding: 8px 0;
  }

  .loading-skeleton {
    display: flex;
    flex-direction: column;
  }

  .skeleton-card {
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-bottom: 1px solid var(--rn-border);
    animation: shimmer 1.5s ease-in-out infinite;
  }

  .skeleton-line {
    height: 10px;
    background: linear-gradient(
      90deg,
      var(--rn-bg-secondary) 25%,
      rgba(255, 241, 227, 0.4) 50%,
      var(--rn-bg-secondary) 75%
    );
    background-size: 200% 100%;
    border-radius: 5px;
    animation: shimmerSlide 1.8s ease-in-out infinite;
  }

  .skeleton-short { width: 35%; height: 8px; }
  .skeleton-long { width: 90%; height: 11px; }
  .skeleton-medium { width: 60%; height: 8px; }

  @keyframes shimmerSlide {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  @keyframes shimmer {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
</style>
