<script lang="ts">
  // Extract params from URL
  const params = new URLSearchParams(window.location.search);
  const itemId = params.get('id') || '';
  const targetUrl = params.get('url') || '';

  let elapsed = $state(0);
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let showToolbar = $state(true);

  // Start reading timer
  function startTimer() {
    timerInterval = setInterval(() => {
      elapsed += 1;
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  startTimer();

  let formattedTime = $derived(() => {
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  });

  async function handleDone() {
    stopTimer();
    // Navigate to reflection page
    const reflectionUrl = chrome.runtime.getURL(
      `/reflection.html?id=${encodeURIComponent(itemId)}&time=${elapsed}`,
    );
    window.location.href = reflectionUrl;
  }

  async function handleClose() {
    stopTimer();
    // Mark as unread again (didn't finish)
    await chrome.runtime.sendMessage({
      type: 'UPDATE_ITEM',
      payload: { id: itemId, status: 'unread' },
    });
    window.close();
  }

  function toggleToolbar() {
    showToolbar = !showToolbar;
  }
</script>

<div class="reader">
  <!-- Floating Toolbar -->
  {#if showToolbar}
    <div class="toolbar">
      <div class="toolbar-left">
        <span class="toolbar-logo" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </span>
        <span class="toolbar-title">Focus Mode</span>
        <span class="toolbar-timer">{formattedTime()}</span>
      </div>
      <div class="toolbar-right">
        <button class="toolbar-btn btn-done" onclick={handleDone}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          I'm done reading
        </button>
        <button class="toolbar-btn btn-close" onclick={handleClose}>
          Close
        </button>
        <button class="toolbar-btn btn-hide" onclick={toggleToolbar} title="Hide toolbar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>
    </div>
  {:else}
    <button class="toolbar-show" onclick={toggleToolbar}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
      <span>{formattedTime()}</span>
    </button>
  {/if}

  <!-- Content iframe -->
  <iframe
    src={targetUrl}
    class="reader-frame"
    title="Reading content"
    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
  ></iframe>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  }

  .reader {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* ─── Toolbar ──────────────────────────────────────────────── */

  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    background: #FFF8F0;
    border-bottom: 1px solid rgba(61, 44, 30, 0.06);
    box-shadow: 0 2px 8px rgba(61, 44, 30, 0.04);
    z-index: 10;
    flex-shrink: 0;
    animation: toolbarSlideDown 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes toolbarSlideDown {
    from {
      opacity: 0;
      transform: translateY(-100%);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .toolbar-logo {
    display: flex;
    align-items: center;
    color: #C4704B;
  }

  .toolbar-title {
    font-size: 13px;
    font-weight: 600;
    color: #3D2C1E;
    letter-spacing: -0.01em;
  }

  .toolbar-timer {
    font-size: 13px;
    font-weight: 500;
    color: #8B7355;
    font-variant-numeric: tabular-nums;
    padding: 3px 10px;
    background: rgba(61, 44, 30, 0.04);
    border-radius: 20px;
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .toolbar-btn {
    padding: 6px 12px;
    border: none;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: inherit;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .btn-done {
    background: #7B9E6B;
    color: white;
  }

  .btn-done:hover {
    background: #6B8E5B;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(123, 158, 107, 0.3);
  }

  .btn-close {
    background: rgba(61, 44, 30, 0.05);
    color: #8B7355;
  }

  .btn-close:hover {
    background: rgba(61, 44, 30, 0.1);
  }

  .btn-hide {
    background: transparent;
    color: #B8A48E;
    padding: 6px;
    border-radius: 6px;
  }

  .btn-hide:hover {
    color: #8B7355;
    background: rgba(61, 44, 30, 0.04);
  }

  /* ─── Show button (when toolbar hidden) ────────────────────── */

  .toolbar-show {
    position: fixed;
    top: 10px;
    right: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    background: #FFF8F0;
    border: none;
    border-radius: 50px;
    box-shadow: 0 2px 12px rgba(61, 44, 30, 0.1);
    font-size: 12px;
    font-weight: 500;
    color: #3D2C1E;
    cursor: pointer;
    z-index: 10;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    opacity: 0.7;
    font-family: inherit;
    font-variant-numeric: tabular-nums;
    animation: toolbarPillFadeIn 0.3s ease;
  }

  @keyframes toolbarPillFadeIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 0.7;
      transform: scale(1);
    }
  }

  .toolbar-show:hover {
    opacity: 1;
    transform: scale(1.04);
    box-shadow: 0 4px 16px rgba(61, 44, 30, 0.14);
  }

  /* ─── Content Frame ────────────────────────────────────────── */

  .reader-frame {
    flex: 1;
    width: 100%;
    border: none;
    background: white;
  }
</style>
