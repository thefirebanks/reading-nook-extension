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

  let unreadItems = $derived(items.filter((i) => i.status === 'unread'));
  let categories = $derived(groupByCategory(unreadItems));

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
    <section class="stats-section" style="animation-delay: 0ms">
      <div class="streak-card">
        <div class="streak-number">
          <span class="streak-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 23c-4.97 0-9-3.58-9-8 0-3.07 2.31-6.64 4.5-9 .37-.4 1.03-.08.96.45-.27 2.07.67 4.05 1.54 5.05.13.15.37.07.4-.12.5-3.08 3.07-5.89 4.6-7.13.31-.25.75.02.7.41-.3 2.5.6 5.2 2.3 7.34 1.2 1.5 2 3.37 2 5C20 19.42 16.97 23 12 23z"/>
            </svg>
          </span>
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
    <section class="stats-section" style="animation-delay: 60ms">
      <h2 class="section-title">Overview</h2>
      <div class="stats-grid">
        <div class="stat-box">
          <span class="stat-value">{stats.totalSaved}</span>
          <span class="stat-label">Saved</span>
        </div>
        <div class="stat-box">
          <span class="stat-value stat-value-success">{stats.totalRead}</span>
          <span class="stat-label">Read</span>
        </div>
        <div class="stat-box">
          <span class="stat-value stat-value-warm">
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
      <section class="stats-section" style="animation-delay: 120ms">
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
              <span class="digest-label">Takeaways</span>
              {#each latestWeek.reflections as reflection}
                <p class="digest-quote">&ldquo;{reflection}&rdquo;</p>
              {/each}
            </div>
          {/if}
        </div>
      </section>
    {/if}

    <!-- Categories Breakdown -->
    {#if categories.size > 0}
      <section class="stats-section" style="animation-delay: 180ms">
        <h2 class="section-title">Your Interests</h2>
        <div class="categories-list">
          {#each [...categories.entries()] as [category, catItems]}
            <div class="category-row">
              <span class="category-name">{category}</span>
              <div class="category-bar-wrap">
                <div
                  class="category-bar"
                  style="width: {Math.min(100, (catItems.length / unreadItems.length) * 100)}%"
                ></div>
              </div>
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
    padding: 4px 0;
  }

  .stats-section {
    padding: 8px 16px 16px;
    animation: sectionFadeIn 0.35s ease both;
  }

  @keyframes sectionFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .section-title {
    font-size: 11px;
    font-weight: 600;
    color: var(--rn-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.6px;
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

  .streak-icon {
    color: var(--rn-warning);
    display: flex;
    align-items: center;
    align-self: center;
  }

  .streak-value {
    font-size: 36px;
    font-weight: 700;
    color: var(--rn-text);
    letter-spacing: -0.02em;
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
    padding: 14px 8px;
    background: var(--rn-bg-card);
    border-radius: var(--rn-radius);
    border: 1.5px solid var(--rn-border);
    transition: all var(--rn-transition);
  }

  .stat-box:hover {
    border-color: var(--rn-accent-light);
    transform: translateY(-1px);
  }

  .stat-value {
    font-size: 22px;
    font-weight: 700;
    color: var(--rn-accent);
    letter-spacing: -0.02em;
  }

  .stat-value-success {
    color: var(--rn-success);
  }

  .stat-value-warm {
    color: var(--rn-warning);
  }

  .stat-label {
    font-size: 11px;
    color: var(--rn-text-muted);
    margin-top: 2px;
    font-weight: 500;
  }

  /* ─── Digest ───────────────────────────────────────────────── */

  .digest-card {
    padding: 12px;
    background: var(--rn-bg-card);
    border-radius: var(--rn-radius);
    border: 1.5px solid var(--rn-border);
  }

  .digest-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    font-size: 13px;
    border-bottom: 1px solid var(--rn-border);
  }

  .digest-row:last-child {
    border-bottom: none;
  }

  .digest-row span {
    color: var(--rn-text-secondary);
  }

  .digest-row strong {
    color: var(--rn-text);
  }

  .digest-reflections {
    padding-top: 8px;
  }

  .digest-label {
    font-size: 11px;
    color: var(--rn-text-muted);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }

  .digest-quote {
    font-size: 12px;
    font-style: italic;
    color: var(--rn-text);
    padding: 4px 0;
    line-height: 1.5;
  }

  /* ─── Categories ───────────────────────────────────────────── */

  .categories-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .category-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--rn-bg-card);
    border-radius: var(--rn-radius-sm);
    border: 1px solid var(--rn-border);
    transition: all var(--rn-transition);
  }

  .category-row:hover {
    border-color: var(--rn-accent-light);
  }

  .category-name {
    font-size: 12px;
    font-weight: 500;
    color: var(--rn-text);
    white-space: nowrap;
    min-width: 100px;
  }

  .category-bar-wrap {
    flex: 1;
    height: 4px;
    background: var(--rn-bg-secondary);
    border-radius: 2px;
    overflow: hidden;
  }

  .category-bar {
    height: 100%;
    background: var(--rn-accent);
    border-radius: 2px;
    min-width: 4px;
    transition: width 0.5s ease;
    opacity: 0.6;
  }

  .category-count {
    padding: 1px 8px;
    background: var(--rn-accent-light);
    color: var(--rn-accent);
    border-radius: 10px;
    font-size: 11px;
    font-weight: 600;
    min-width: 20px;
    text-align: center;
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
