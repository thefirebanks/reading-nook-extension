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
      <div class="success-icon">🌟</div>
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
        <span class="form-icon">📝</span>
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
            <span class="rating-emoji">👍</span>
            <span class="rating-text">Worth it</span>
          </button>
          <button
            class="rating-btn"
            class:active={rating === 'meh'}
            onclick={() => (rating = 'meh')}
          >
            <span class="rating-emoji">😐</span>
            <span class="rating-text">Meh</span>
          </button>
          <button
            class="rating-btn"
            class:active={rating === 'not-worth-it'}
            onclick={() => (rating = 'not-worth-it')}
          >
            <span class="rating-emoji">👎</span>
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
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
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
  }

  /* ─── Success ──────────────────────────────────────────────── */

  .success-container {
    text-align: center;
    padding: 48px 24px;
  }

  .success-icon {
    font-size: 56px;
    margin-bottom: 16px;
    animation: pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  .success-title {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 8px;
    color: #3D2C1E;
  }

  .success-text {
    font-size: 15px;
    color: #8B7355;
    margin-bottom: 32px;
    line-height: 1.5;
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
    font-size: 40px;
    display: block;
    margin-bottom: 12px;
  }

  .form-title {
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 6px;
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
    border: 1px solid rgba(61, 44, 30, 0.12);
    border-radius: 8px;
    font-family: inherit;
    font-size: 14px;
    color: #3D2C1E;
    transition: all 0.2s ease;
    outline: none;
  }

  .input:focus,
  .textarea:focus {
    border-color: #C4704B;
    box-shadow: 0 0 0 3px rgba(196, 112, 75, 0.15);
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
    gap: 8px;
  }

  .rating-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 14px 12px;
    background: white;
    border: 2px solid rgba(61, 44, 30, 0.08);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .rating-btn:hover {
    border-color: rgba(61, 44, 30, 0.16);
    background: #FFF1E3;
  }

  .rating-btn.active {
    border-color: #C4704B;
    background: rgba(196, 112, 75, 0.08);
  }

  .rating-emoji {
    font-size: 28px;
  }

  .rating-text {
    font-size: 12px;
    font-weight: 500;
    color: #8B7355;
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
    border: 1px solid rgba(61, 44, 30, 0.08);
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .checkbox-label:hover {
    background: #FFF1E3;
  }

  .checkbox {
    width: 18px;
    height: 18px;
    accent-color: #C4704B;
    cursor: pointer;
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
    border-radius: 8px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
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
  }

  .btn-secondary {
    background: rgba(61, 44, 30, 0.06);
    color: #8B7355;
  }

  .btn-secondary:hover {
    background: rgba(61, 44, 30, 0.12);
  }

  /* ─── Animations ───────────────────────────────────────────── */

  @keyframes pop {
    0% {
      transform: scale(0.3);
      opacity: 0;
    }
    60% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
</style>
