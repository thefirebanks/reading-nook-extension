<script lang="ts">
  // Extract params from URL
  const params = new URLSearchParams(window.location.search);
  const itemId = params.get('id') || '';
  const targetUrl = params.get('url') || '';

  let elapsed = $state(0);
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let showToolbar = $state(true);
  let iframeLoading = $state(true);
  let iframeError = $state(false);

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

  import { onDestroy } from 'svelte';
  import { sendMessage } from '../../lib/messaging';

  startTimer();

  onDestroy(() => {
    stopTimer();
  });

  let formattedTime = $derived(
    `${Math.floor(elapsed / 60)}:${(elapsed % 60).toString().padStart(2, '0')}`,
  );

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
    await sendMessage('UPDATE_ITEM', { id: itemId, status: 'unread' });
    window.close();
  }

  function toggleToolbar() {
    showToolbar = !showToolbar;
  }

  function handleIframeLoad() {
    iframeLoading = false;
  }

  function handleIframeError() {
    iframeLoading = false;
    iframeError = true;
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
        <span class="toolbar-timer">{formattedTime}</span>
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
      <span>{formattedTime}</span>
    </button>
  {/if}

  <!-- Content iframe -->
  {#if iframeLoading}
    <div class="reader-loading">
      <div class="reader-spinner"></div>
      <p class="reader-loading-text">Loading your read...</p>
    </div>
  {/if}

  {#if iframeError}
    <div class="reader-error">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C4704B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
      <p class="reader-error-title">This page can't be loaded in focus mode</p>
      <p class="reader-error-hint">Some sites block embedding. You can still read it directly.</p>
      <a class="reader-error-link" href={targetUrl} target="_blank" rel="noopener">
        Open in a new tab
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      </a>
    </div>
  {/if}

  <iframe
    src={targetUrl}
    class="reader-frame"
    class:reader-frame-hidden={iframeError}
    title="Reading content"
    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
    onload={handleIframeLoad}
    onerror={handleIframeError}
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
    background: var(--rn-bg);
    border-bottom: 1px solid var(--rn-border);
    box-shadow: 0 2px 8px var(--rn-shadow);
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
    color: var(--rn-accent);
  }

  .toolbar-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--rn-text);
    letter-spacing: -0.01em;
  }

  .toolbar-timer {
    font-size: 13px;
    font-weight: 500;
    color: var(--rn-text-secondary);
    font-variant-numeric: tabular-nums;
    padding: 3px 10px;
    background: var(--rn-bg-secondary);
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
    background: var(--rn-success);
    color: white;
  }

  .btn-done:hover {
    background: #6B8E5B;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(123, 158, 107, 0.3);
  }

  .btn-close {
    background: var(--rn-bg-secondary);
    color: var(--rn-text-secondary);
  }

  .btn-close:hover {
    background: rgba(61, 44, 30, 0.1);
  }

  .btn-hide {
    background: transparent;
    color: var(--rn-text-muted);
    padding: 6px;
    border-radius: 6px;
  }

  .btn-hide:hover {
    color: var(--rn-text-secondary);
    background: var(--rn-bg-secondary);
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
    background: var(--rn-bg);
    border: none;
    border-radius: 50px;
    box-shadow: 0 2px 12px var(--rn-shadow-hover);
    font-size: 12px;
    font-weight: 500;
    color: var(--rn-text);
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

  .reader-frame-hidden {
    display: none;
  }

  /* ─── Loading State ───────────────────────────────────────── */

  .reader-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    gap: 14px;
    background: var(--rn-bg);
  }

  .reader-spinner {
    width: 28px;
    height: 28px;
    border: 3px solid var(--rn-border);
    border-top-color: var(--rn-accent);
    border-radius: 50%;
    animation: readerSpin 0.7s linear infinite;
  }

  @keyframes readerSpin {
    to { transform: rotate(360deg); }
  }

  .reader-loading-text {
    font-size: 13px;
    color: var(--rn-text-secondary);
    font-weight: 500;
  }

  /* ─── Error State ─────────────────────────────────────────── */

  .reader-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    gap: 10px;
    background: var(--rn-bg);
    padding: 32px;
    text-align: center;
  }

  .reader-error-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--rn-text);
    margin-top: 6px;
  }

  .reader-error-hint {
    font-size: 13px;
    color: var(--rn-text-secondary);
    max-width: 320px;
    line-height: 1.5;
  }

  .reader-error-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    padding: 8px 18px;
    background: var(--rn-accent);
    color: white;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .reader-error-link:hover {
    background: var(--rn-accent-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(196, 112, 75, 0.3);
  }
</style>
