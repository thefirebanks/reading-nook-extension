<script lang="ts">
  let { query = $bindable('') }: { query: string } = $props();
</script>

<div class="search-bar">
  <span class="search-icon" aria-hidden="true">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  </span>
  <input
    type="text"
    bind:value={query}
    placeholder="Search your nook..."
    class="search-input"
    aria-label="Search saved items"
  />
  {#if query}
    <button class="search-clear" onclick={() => (query = '')} aria-label="Clear search">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  {/if}
</div>

<style>
  .search-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--rn-bg-card);
    border: 1.5px solid var(--rn-border);
    border-radius: 10px;
    transition: all var(--rn-transition-smooth);
  }

  .search-bar:focus-within {
    border-color: var(--rn-accent);
    box-shadow: 0 0 0 3px rgba(196, 112, 75, 0.08);
  }

  .search-icon {
    display: flex;
    align-items: center;
    color: var(--rn-text-muted);
    flex-shrink: 0;
    transition: color var(--rn-transition);
  }

  .search-bar:focus-within .search-icon {
    color: var(--rn-accent);
  }

  .search-input {
    flex: 1;
    border: none;
    background: none;
    font-family: var(--rn-font);
    font-size: 13px;
    color: var(--rn-text);
    outline: none;
  }

  .search-input::placeholder {
    color: var(--rn-text-muted);
  }

  .search-clear {
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--rn-bg-secondary);
    color: var(--rn-text-secondary);
    transition: all var(--rn-transition);
    flex-shrink: 0;
  }

  .search-clear:hover {
    background: var(--rn-accent-light);
    color: var(--rn-accent);
    transform: scale(1.1);
  }
</style>
