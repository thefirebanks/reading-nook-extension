<script lang="ts">
  let { query = $bindable('') }: { query: string } = $props();
</script>

<div class="search-bar">
  <span class="search-icon">🔍</span>
  <input
    type="text"
    bind:value={query}
    placeholder="Search your nook..."
    class="search-input"
    aria-label="Search saved items"
  />
  {#if query}
    <button class="search-clear" onclick={() => (query = '')} aria-label="Clear search">
      ×
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
    border: 1px solid var(--rn-border);
    border-radius: var(--rn-radius-sm);
    transition: all var(--rn-transition);
  }

  .search-bar:focus-within {
    border-color: var(--rn-accent);
    box-shadow: 0 0 0 3px var(--rn-accent-light);
  }

  .search-icon {
    font-size: 14px;
    opacity: 0.5;
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
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--rn-bg-secondary);
    font-size: 14px;
    color: var(--rn-text-secondary);
    transition: all var(--rn-transition);
  }

  .search-clear:hover {
    background: var(--rn-accent-light);
    color: var(--rn-accent);
  }
</style>
