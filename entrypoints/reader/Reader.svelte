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
        <span class="toolbar-logo">📚</span>
        <span class="toolbar-title">Focus Mode</span>
        <span class="toolbar-timer">{formattedTime()}</span>
      </div>
      <div class="toolbar-right">
        <button class="toolbar-btn btn-done" onclick={handleDone}>
          ✅ I'm done reading
        </button>
        <button class="toolbar-btn btn-close" onclick={handleClose}>
          ✕ Close
        </button>
        <button class="toolbar-btn btn-hide" onclick={toggleToolbar}>
          ▼ Hide
        </button>
      </div>
    </div>
  {:else}
    <button class="toolbar-show" onclick={toggleToolbar}>
      <span>📚</span>
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
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
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
    border-bottom: 1px solid rgba(61, 44, 30, 0.08);
    box-shadow: 0 2px 8px rgba(61, 44, 30, 0.06);
    z-index: 10;
    flex-shrink: 0;
  }

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .toolbar-logo {
    font-size: 18px;
  }

  .toolbar-title {
    font-size: 13px;
    font-weight: 600;
    color: #3D2C1E;
  }

  .toolbar-timer {
    font-size: 13px;
    font-weight: 500;
    color: #8B7355;
    font-variant-numeric: tabular-nums;
    padding: 2px 10px;
    background: rgba(61, 44, 30, 0.05);
    border-radius: 12px;
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .toolbar-btn {
    padding: 6px 12px;
    border: none;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .btn-done {
    background: #7B9E6B;
    color: white;
  }

  .btn-done:hover {
    background: #6B8E5B;
    transform: scale(1.02);
  }

  .btn-close {
    background: rgba(61, 44, 30, 0.06);
    color: #8B7355;
  }

  .btn-close:hover {
    background: rgba(61, 44, 30, 0.12);
  }

  .btn-hide {
    background: transparent;
    color: #B8A48E;
    font-size: 11px;
  }

  .btn-hide:hover {
    color: #8B7355;
  }

  /* ─── Show button (when toolbar hidden) ────────────────────── */

  .toolbar-show {
    position: fixed;
    top: 8px;
    right: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: #FFF8F0;
    border: none;
    border-radius: 20px;
    box-shadow: 0 2px 12px rgba(61, 44, 30, 0.12);
    font-size: 12px;
    font-weight: 500;
    color: #3D2C1E;
    cursor: pointer;
    z-index: 10;
    transition: all 0.2s ease;
    opacity: 0.7;
    font-family: inherit;
  }

  .toolbar-show:hover {
    opacity: 1;
    transform: scale(1.05);
  }

  /* ─── Content Frame ────────────────────────────────────────── */

  .reader-frame {
    flex: 1;
    width: 100%;
    border: none;
    background: white;
  }
</style>
