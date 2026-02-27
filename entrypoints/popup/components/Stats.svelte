<script lang="ts">
  import type { ReadingItem, UserStats } from '../../../lib/types';
  import { getStreakMessage } from '../../../lib/utils';
  import { groupByCategory } from '../../../lib/categories';

  let {
    stats,
    items,
  }: {
    stats: UserStats | null;
    items: ReadingItem[];
  } = $props();

  let streakMessage = $derived(
    stats ? getStreakMessage(stats.currentStreak) : '',
  );

  let categories = $derived(groupByCategory(items.filter((i) => i.status === 'unread')));

  let latestWeek = $derived(
    stats?.weeklyHistory?.length
      ? stats.weeklyHistory[stats.weeklyHistory.length - 1]
      : null,
  );
</script>

<div class="stats-page">
  {#if !stats}
    <div class="empty-state">
      <p class="empty-text">No stats yet. Start saving and reading!</p>
    </div>
  {:else}
    <!-- Streak Section -->
    <section class="stats-section">
      <div class="streak-card">
        <div class="streak-number">
          <span class="streak-fire">🔥</span>
          <span class="streak-value">{stats.currentStreak}</span>
          <span class="streak-label">day streak</span>
        </div>
        <p class="streak-message">{streakMessage}</p>
        <div class="streak-best">
          Best streak: {stats.longestStreak} day{stats.longestStreak !== 1 ? 's' : ''}
        </div>
      </div>
    </section>

    <!-- Overview Numbers -->
    <section class="stats-section">
      <h2 class="section-title">Overview</h2>
      <div class="stats-grid">
        <div class="stat-box">
          <span class="stat-value">{stats.totalSaved}</span>
          <span class="stat-label">Saved</span>
        </div>
        <div class="stat-box">
          <span class="stat-value">{stats.totalRead}</span>
          <span class="stat-label">Read</span>
        </div>
        <div class="stat-box">
          <span class="stat-value">
            {stats.totalSaved > 0
              ? Math.round((stats.totalRead / stats.totalSaved) * 100)
              : 0}%
          </span>
          <span class="stat-label">Completion</span>
        </div>
      </div>
    </section>

    <!-- Weekly Digest -->
    {#if latestWeek}
      <section class="stats-section">
        <h2 class="section-title">This Week</h2>
        <div class="digest-card">
          <div class="digest-row">
            <span>Saved</span>
            <strong>{latestWeek.saved}</strong>
          </div>
          <div class="digest-row">
            <span>Read</span>
            <strong>{latestWeek.read}</strong>
          </div>
          {#if latestWeek.reflections.length > 0}
            <div class="digest-reflections">
              <span class="digest-label">Takeaways:</span>
              {#each latestWeek.reflections as reflection}
                <p class="digest-quote">"{reflection}"</p>
              {/each}
            </div>
          {/if}
        </div>
      </section>
    {/if}

    <!-- Categories Breakdown -->
    {#if categories.size > 0}
      <section class="stats-section">
        <h2 class="section-title">Your Interests</h2>
        <div class="categories-list">
          {#each [...categories.entries()] as [category, catItems]}
            <div class="category-row">
              <span class="category-name">{category}</span>
              <span class="category-count">{catItems.length}</span>
            </div>
          {/each}
        </div>
      </section>
    {/if}
  {/if}
</div>

<style>
  .stats-page {
    padding: 8px 0;
  }

  .stats-section {
    padding: 8px 16px 16px;
  }

  .section-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--rn-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 10px;
  }

  /* ─── Streak ───────────────────────────────────────────────── */

  .streak-card {
    text-align: center;
    padding: 20px 16px;
    background: linear-gradient(135deg, var(--rn-warning-light), var(--rn-accent-light));
    border-radius: var(--rn-radius);
  }

  .streak-number {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 6px;
    margin-bottom: 6px;
  }

  .streak-fire {
    font-size: 24px;
  }

  .streak-value {
    font-size: 36px;
    font-weight: 700;
    color: var(--rn-text);
  }

  .streak-label {
    font-size: 14px;
    color: var(--rn-text-secondary);
  }

  .streak-message {
    font-size: 13px;
    color: var(--rn-text);
    font-style: italic;
    margin-bottom: 8px;
  }

  .streak-best {
    font-size: 11px;
    color: var(--rn-text-muted);
  }

  /* ─── Stats Grid ───────────────────────────────────────────── */

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .stat-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 8px;
    background: var(--rn-bg-card);
    border-radius: var(--rn-radius-sm);
    border: 1px solid var(--rn-border);
  }

  .stat-value {
    font-size: 20px;
    font-weight: 700;
    color: var(--rn-accent);
  }

  .stat-label {
    font-size: 11px;
    color: var(--rn-text-muted);
    margin-top: 2px;
  }

  /* ─── Digest ───────────────────────────────────────────────── */

  .digest-card {
    padding: 12px;
    background: var(--rn-bg-card);
    border-radius: var(--rn-radius-sm);
    border: 1px solid var(--rn-border);
  }

  .digest-row {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    font-size: 13px;
    border-bottom: 1px solid var(--rn-border);
  }

  .digest-row:last-child {
    border-bottom: none;
  }

  .digest-reflections {
    padding-top: 8px;
  }

  .digest-label {
    font-size: 11px;
    color: var(--rn-text-secondary);
    font-weight: 500;
  }

  .digest-quote {
    font-size: 12px;
    font-style: italic;
    color: var(--rn-text);
    padding: 4px 0;
  }

  /* ─── Categories ───────────────────────────────────────────── */

  .categories-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .category-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: var(--rn-bg-card);
    border-radius: var(--rn-radius-xs);
    border: 1px solid var(--rn-border);
  }

  .category-name {
    font-size: 12px;
    font-weight: 500;
    color: var(--rn-text);
  }

  .category-count {
    padding: 1px 8px;
    background: var(--rn-accent-light);
    color: var(--rn-accent);
    border-radius: 10px;
    font-size: 11px;
    font-weight: 600;
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 32px;
  }

  .empty-text {
    font-size: 13px;
    color: var(--rn-text-muted);
  }
</style>
