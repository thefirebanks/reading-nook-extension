<script lang="ts">
  import type { Rating, Reflection } from '../../lib/types';

  const params = new URLSearchParams(window.location.search);
  const itemId = params.get('id') || '';
  const readingTime = parseInt(params.get('time') || '0', 10);

  let takeaway = $state('');
  let rating = $state<Rating | ''>('');
  let wantMore = $state(false);
  let notes = $state('');
  let submitted = $state(false);
  let submitting = $state(false);

  let formattedReadingTime = $derived(() => {
    const mins = Math.floor(readingTime / 60);
    if (mins < 1) return 'Less than a minute';
    if (mins === 1) return '1 minute';
    return `${mins} minutes`;
  });

  let canSubmit = $derived(takeaway.trim().length > 0 && rating !== '');

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    submitting = true;

    try {
      const reflection: Reflection = {
        takeaway: takeaway.trim(),
        rating: rating as Rating,
        notes: notes.trim() || undefined,
        wantMoreLikeThis: wantMore,
        completedAt: Date.now(),
      };

      await chrome.runtime.sendMessage({
        type: 'UPDATE_ITEM',
        payload: {
          id: itemId,
          status: 'read',
          readAt: Date.now(),
          reflection,
        },
      });

      submitted = true;
    } catch (err) {
      console.error('Failed to save reflection:', err);
    } finally {
      submitting = false;
    }
  }

  async function handleSkip() {
    await chrome.runtime.sendMessage({
      type: 'UPDATE_ITEM',
      payload: {
        id: itemId,
        status: 'read',
        readAt: Date.now(),
      },
    });
    window.close();
  }

  function handleDone() {
    window.close();
  }
</script>

<div class="reflection-page">
  {#if submitted}
    <!-- Success State -->
    <div class="success-container">
      <div class="success-icon" aria-hidden="true">
        <svg width="56" height="56" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="24" stroke="#7B9E6B" stroke-width="2" opacity="0.3"/>
          <circle cx="32" cy="32" r="16" stroke="#7B9E6B" stroke-width="2" opacity="0.5"/>
          <polyline points="24,32 30,38 40,26" stroke="#7B9E6B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h1 class="success-title">Nicely done!</h1>
      <p class="success-text">
        Your reflection has been saved. Your future self will thank you.
      </p>
      <button class="btn btn-primary" onclick={handleDone}>
        Close this window
      </button>
    </div>
  {:else}
    <!-- Reflection Form -->
    <div class="form-container">
      <div class="form-header">
        <div class="form-icon" aria-hidden="true">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#C4704B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
        </div>
        <h1 class="form-title">How was that read?</h1>
        <p class="form-subtitle">
          You spent {formattedReadingTime()} reading. Let's capture what you got from it.
        </p>
      </div>

      <!-- Rating -->
      <div class="field">
        <span class="field-label">Was it worth the read?</span>
        <div class="rating-options">
          <button
            class="rating-btn"
            class:active={rating === 'worth-it'}
            onclick={() => (rating = 'worth-it')}
          >
            <span class="rating-icon rating-icon-good" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
              </svg>
            </span>
            <span class="rating-text">Worth it</span>
          </button>
          <button
            class="rating-btn"
            class:active={rating === 'meh'}
            onclick={() => (rating = 'meh')}
          >
            <span class="rating-icon rating-icon-meh" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="8" y1="15" x2="16" y2="15"/>
                <line x1="9" y1="9" x2="9.01" y2="9"/>
                <line x1="15" y1="9" x2="15.01" y2="9"/>
              </svg>
            </span>
            <span class="rating-text">Meh</span>
          </button>
          <button
            class="rating-btn"
            class:active={rating === 'not-worth-it'}
            onclick={() => (rating = 'not-worth-it')}
          >
            <span class="rating-icon rating-icon-bad" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 15V19a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
                <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
              </svg>
            </span>
            <span class="rating-text">Not worth it</span>
          </button>
        </div>
      </div>

      <!-- Takeaway -->
      <div class="field">
        <label class="field-label" for="takeaway">
          One-line takeaway
          <span class="field-hint">(keep it short!)</span>
        </label>
        <input
          id="takeaway"
          type="text"
          bind:value={takeaway}
          placeholder="The most interesting thing I learned was..."
          class="input"
          maxlength="200"
        />
        <span class="char-count">{takeaway.length}/200</span>
      </div>

      <!-- Want More -->
      <div class="field">
        <label class="checkbox-label">
          <input type="checkbox" bind:checked={wantMore} class="checkbox" />
          <span class="checkbox-mark"></span>
          <span class="checkbox-text">I want to read more things like this</span>
        </label>
      </div>

      <!-- Notes (optional) -->
      <div class="field">
        <label class="field-label" for="notes">
          Additional notes
          <span class="field-hint">(optional)</span>
        </label>
        <textarea
          id="notes"
          bind:value={notes}
          placeholder="Any other thoughts, quotes, or connections..."
          class="textarea"
          rows="4"
        ></textarea>
      </div>

      <!-- Actions -->
      <div class="form-actions">
        <button class="btn btn-secondary" onclick={handleSkip}>
          Skip reflection
        </button>
        <button
          class="btn btn-primary"
          onclick={handleSubmit}
          disabled={!canSubmit || submitting}
        >
          {submitting ? 'Saving...' : 'Save reflection'}
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    background: #FFF8F0;
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
    color: #3D2C1E;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .reflection-page {
    width: 100%;
    max-width: 520px;
    margin: 0 auto;
    padding: 40px 24px;
    animation: pageEnter 0.4s ease;
  }

  @keyframes pageEnter {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* ─── Success ──────────────────────────────────────────────── */

  .success-container {
    text-align: center;
    padding: 48px 24px;
  }

  .success-icon {
    margin-bottom: 20px;
    animation: successPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes successPop {
    0% { transform: scale(0); opacity: 0; }
    60% { transform: scale(1.15); }
    100% { transform: scale(1); opacity: 1; }
  }

  .success-title {
    font-family: 'DM Serif Display', Georgia, serif;
    font-size: 28px;
    font-weight: 400;
    margin-bottom: 8px;
    color: #3D2C1E;
    animation: textFadeUp 0.4s ease 0.15s both;
  }

  .success-text {
    font-size: 15px;
    color: #8B7355;
    margin-bottom: 32px;
    line-height: 1.6;
    animation: textFadeUp 0.4s ease 0.25s both;
  }

  .success-container .btn {
    animation: textFadeUp 0.4s ease 0.35s both;
  }

  @keyframes textFadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* ─── Form ─────────────────────────────────────────────────── */

  .form-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .form-header {
    text-align: center;
    margin-bottom: 8px;
  }

  .form-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 14px;
  }

  .form-title {
    font-family: 'DM Serif Display', Georgia, serif;
    font-size: 24px;
    font-weight: 400;
    margin-bottom: 6px;
    letter-spacing: -0.01em;
  }

  .form-subtitle {
    font-size: 14px;
    color: #8B7355;
    line-height: 1.5;
  }

  /* ─── Fields ───────────────────────────────────────────────── */

  .field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .field-label {
    font-size: 14px;
    font-weight: 600;
    color: #3D2C1E;
  }

  .field-hint {
    font-weight: 400;
    color: #B8A48E;
  }

  .input,
  .textarea {
    padding: 10px 14px;
    background: white;
    border: 1.5px solid rgba(61, 44, 30, 0.1);
    border-radius: 10px;
    font-family: inherit;
    font-size: 14px;
    color: #3D2C1E;
    transition: all 0.25s ease;
    outline: none;
  }

  .input:focus,
  .textarea:focus {
    border-color: #C4704B;
    box-shadow: 0 0 0 3px rgba(196, 112, 75, 0.1);
  }

  .input::placeholder,
  .textarea::placeholder {
    color: #B8A48E;
  }

  .textarea {
    resize: vertical;
    min-height: 100px;
    line-height: 1.5;
  }

  .char-count {
    align-self: flex-end;
    font-size: 11px;
    color: #B8A48E;
  }

  /* ─── Rating Buttons ───────────────────────────────────────── */

  .rating-options {
    display: flex;
    gap: 10px;
  }

  .rating-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px 12px;
    background: white;
    border: 2px solid rgba(61, 44, 30, 0.06);
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: inherit;
  }

  .rating-btn:hover {
    border-color: rgba(61, 44, 30, 0.14);
    background: #FFF1E3;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(61, 44, 30, 0.08);
  }

  .rating-btn.active {
    border-color: #C4704B;
    background: rgba(196, 112, 75, 0.06);
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 4px 16px rgba(196, 112, 75, 0.15);
  }

  .rating-icon {
    display: flex;
    align-items: center;
    color: #B8A48E;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .rating-btn:hover .rating-icon {
    transform: scale(1.1);
  }

  .rating-btn.active .rating-icon {
    transform: scale(1.15);
  }

  .rating-btn.active .rating-icon-good {
    color: #7B9E6B;
  }

  .rating-btn.active .rating-icon-meh {
    color: #D4A843;
  }

  .rating-btn.active .rating-icon-bad {
    color: #C9544D;
  }

  .rating-text {
    font-size: 12px;
    font-weight: 500;
    color: #8B7355;
    transition: all 0.2s ease;
  }

  .rating-btn.active .rating-text {
    color: #C4704B;
    font-weight: 600;
  }

  /* ─── Checkbox ─────────────────────────────────────────────── */

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    padding: 12px 14px;
    background: white;
    border: 1.5px solid rgba(61, 44, 30, 0.06);
    border-radius: 10px;
    transition: all 0.2s ease;
  }

  .checkbox-label:hover {
    background: #FFF1E3;
    border-color: rgba(61, 44, 30, 0.12);
  }

  .checkbox {
    width: 18px;
    height: 18px;
    accent-color: #C4704B;
    cursor: pointer;
    border-radius: 4px;
  }

  .checkbox-text {
    font-size: 14px;
    color: #3D2C1E;
  }

  /* ─── Actions ──────────────────────────────────────────────── */

  .form-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding-top: 8px;
  }

  .btn {
    padding: 10px 20px;
    border: none;
    border-radius: 10px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background: #C4704B;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #B5613D;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(196, 112, 75, 0.25);
  }

  .btn-primary:active:not(:disabled) {
    transform: translateY(0);
  }

  .btn-secondary {
    background: rgba(61, 44, 30, 0.05);
    color: #8B7355;
  }

  .btn-secondary:hover {
    background: rgba(61, 44, 30, 0.1);
  }
</style>
