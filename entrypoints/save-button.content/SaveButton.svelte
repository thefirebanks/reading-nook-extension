<script lang="ts">
  import { generateId, getSaveConfirmation } from '../../lib/utils';
  import { extractPageMetadata } from './extractor';

  let saved = $state(false);
  let saving = $state(false);
  let confirmMessage = $state('');
  let showConfirm = $state(false);
  let toastExiting = $state(false);
  let hovered = $state(false);
  let errorMessage = $state('');
  let showError = $state(false);
  let errorExiting = $state(false);

  async function handleSave() {
    if (saved || saving) return;
    saving = true;

    try {
      const metadata = extractPageMetadata();

      await chrome.runtime.sendMessage({
        type: 'SAVE_PAGE',
        payload: {
          id: generateId(),
          ...metadata,
          status: 'unread',
          tags: [],
          nudgeCount: 0,
          savedAt: Date.now(),
        },
      });

      saved = true;
      confirmMessage = getSaveConfirmation();
      showConfirm = true;
      toastExiting = false;

      setTimeout(() => {
        toastExiting = true;
        setTimeout(() => {
          showConfirm = false;
          toastExiting = false;
        }, 300);
      }, 2200);
    } catch (err) {
      console.error('Reading Nook: Failed to save page', err);
      errorMessage = 'Couldn\u2019t save \u2014 try again?';
      showError = true;
      errorExiting = false;

      setTimeout(() => {
        errorExiting = true;
        setTimeout(() => {
          showError = false;
          errorExiting = false;
        }, 300);
      }, 3000);
    } finally {
      saving = false;
    }
  }

  // Check if this page is already saved
  async function checkIfSaved() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CHECK_SAVED',
        payload: { url: window.location.href },
      });
      if (response?.saved) {
        saved = true;
      }
    } catch {
      // Extension context may be invalid, ignore
    }
  }

  checkIfSaved();
</script>

<div class="reading-nook-container">
  <!-- Confirmation toast -->
  {#if showConfirm}
    <div class="rn-toast" class:rn-toast-visible={showConfirm && !toastExiting} class:rn-toast-exit={toastExiting}>
      <span class="rn-toast-check" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </span>
      <span class="rn-toast-text">{confirmMessage}</span>
    </div>
  {/if}

  <!-- Error toast -->
  {#if showError}
    <div class="rn-toast rn-toast-error" class:rn-toast-visible={showError && !errorExiting} class:rn-toast-exit={errorExiting}>
      <span class="rn-toast-icon-error" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      </span>
      <span class="rn-toast-text">{errorMessage}</span>
    </div>
  {/if}

  <!-- Save button -->
  <button
    class="rn-save-btn"
    class:rn-saved={saved}
    class:rn-saving={saving}
    class:rn-hovered={hovered}
    onclick={handleSave}
    onmouseenter={() => (hovered = true)}
    onmouseleave={() => (hovered = false)}
    title={saved ? 'Already in your nook' : 'Save to Reading Nook'}
    aria-label={saved ? 'Already saved to Reading Nook' : 'Save to Reading Nook'}
  >
    {#if saving}
      <span class="rn-spinner"></span>
    {:else if saved}
      <span class="rn-icon-check" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </span>
    {:else}
      <span class="rn-icon-book" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
      </span>
    {/if}

    {#if hovered && !saving}
      <span class="rn-label">
        {saved ? 'Saved!' : 'Save for later'}
      </span>
    {/if}
  </button>
</div>
