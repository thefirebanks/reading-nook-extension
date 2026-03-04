<script lang="ts">
  import { sendMessage } from '../../../lib/messaging';
  import type { UserSettings } from '../../../lib/types';
  import { DEFAULT_SETTINGS } from '../../../lib/storage';

  let {
    onClose,
  }: {
    onClose: () => void;
  } = $props();

  let settings = $state<UserSettings | null>(null);
  let saving = $state(false);
  let saved = $state(false);

  async function loadSettings() {
    try {
      const res = await sendMessage<{ settings: UserSettings }>('GET_SETTINGS');
      settings = res?.settings ?? { ...DEFAULT_SETTINGS };
    } catch (err) {
      console.error('Failed to load settings:', err);
      settings = { ...DEFAULT_SETTINGS };
    }
  }

  loadSettings();

  async function save() {
    if (!settings || saving) return;
    saving = true;
    saved = false;
    try {
      await sendMessage('UPDATE_SETTINGS', settings);
      saved = true;
      setTimeout(() => (saved = false), 2000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      saving = false;
    }
  }

  function handleBlockListInput(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    if (settings) {
      settings.focusModeBlockList = target.value
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
</script>

<div class="settings-overlay" role="dialog" aria-label="Settings">
  <div class="settings-panel">
    <div class="settings-header">
      <h2 class="settings-title">Settings</h2>
      <button class="settings-close" onclick={onClose} title="Close settings">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    {#if !settings}
      <div class="settings-loading">Loading...</div>
    {:else}
      <div class="settings-body">
        <!-- Nudge Settings -->
        <section class="settings-section">
          <h3 class="section-title">Nudge Reminders</h3>

          <label class="setting-row">
            <span class="setting-label">Enable nudge reminders</span>
            <input type="checkbox" class="setting-toggle" bind:checked={settings.nudgeEnabled} />
          </label>

          <label class="setting-row">
            <span class="setting-label">
              Nudge frequency
              <span class="setting-hint">{settings.nudgeFrequencyHours}h</span>
            </span>
            <input
              type="range"
              class="setting-range"
              min="1"
              max="24"
              step="1"
              bind:value={settings.nudgeFrequencyHours}
            />
          </label>

          <label class="setting-row">
            <span class="setting-label">
              Tab threshold
              <span class="setting-hint">{settings.tabThreshold} tabs</span>
            </span>
            <input
              type="range"
              class="setting-range"
              min="5"
              max="50"
              step="5"
              bind:value={settings.tabThreshold}
            />
          </label>
        </section>

        <!-- Reading Queue -->
        <section class="settings-section">
          <h3 class="section-title">Reading Queue</h3>

          <label class="setting-row">
            <span class="setting-label">
              Stale after
              <span class="setting-hint">{settings.decayDays} days</span>
            </span>
            <input
              type="range"
              class="setting-range"
              min="7"
              max="90"
              step="1"
              bind:value={settings.decayDays}
            />
          </label>

          <label class="setting-row">
            <span class="setting-label">
              Auto-archive after
              <span class="setting-hint">{settings.autoArchiveDays} days</span>
            </span>
            <input
              type="range"
              class="setting-range"
              min="14"
              max="180"
              step="1"
              bind:value={settings.autoArchiveDays}
            />
          </label>
        </section>

        <!-- Focus Mode -->
        <section class="settings-section">
          <h3 class="section-title">Focus Mode</h3>

          <label class="setting-row">
            <span class="setting-label">Enable distraction blocking</span>
            <input type="checkbox" class="setting-toggle" bind:checked={settings.focusModeEnabled} />
          </label>

          <label class="setting-row">
            <span class="setting-label">
              Session duration
              <span class="setting-hint">{settings.sessionDurationMinutes} min</span>
            </span>
            <input
              type="range"
              class="setting-range"
              min="5"
              max="60"
              step="5"
              bind:value={settings.sessionDurationMinutes}
            />
          </label>

          <div class="setting-row setting-row-block">
            <span class="setting-label">Blocked sites (one per line)</span>
            <textarea
              class="setting-textarea"
              rows="4"
              value={settings.focusModeBlockList.join('\n')}
              oninput={handleBlockListInput}
            ></textarea>
          </div>
        </section>
      </div>

      <div class="settings-footer">
        {#if saved}
          <span class="settings-saved">Saved!</span>
        {/if}
        <button class="settings-save-btn" onclick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save settings'}
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .settings-overlay {
    position: absolute;
    inset: 0;
    z-index: 100;
    background: var(--rn-bg);
    display: flex;
    flex-direction: column;
    animation: settingsSlideIn 0.25s ease;
  }

  @keyframes settingsSlideIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .settings-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .settings-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid var(--rn-border);
  }

  .settings-title {
    font-family: var(--rn-font-display);
    font-size: 17px;
    font-weight: 400;
    color: var(--rn-text);
  }

  .settings-close {
    display: flex;
    align-items: center;
    padding: 4px;
    border-radius: var(--rn-radius-xs);
    color: var(--rn-text-muted);
    transition: all var(--rn-transition);
  }

  .settings-close:hover {
    color: var(--rn-text);
    background: var(--rn-bg-secondary);
  }

  .settings-loading {
    padding: 40px 16px;
    text-align: center;
    color: var(--rn-text-muted);
    font-size: 13px;
  }

  .settings-body {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
  }

  /* ─── Sections ────────────────────────────────────────────── */

  .settings-section {
    padding: 12px 16px;
    border-bottom: 1px solid var(--rn-border);
  }

  .section-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--rn-text-muted);
    margin-bottom: 10px;
  }

  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;
    gap: 12px;
    cursor: pointer;
  }

  .setting-row-block {
    flex-direction: column;
    align-items: stretch;
    cursor: default;
  }

  .setting-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--rn-text);
    flex: 1;
  }

  .setting-hint {
    font-weight: 400;
    color: var(--rn-text-muted);
    font-size: 12px;
    margin-left: 4px;
  }

  .setting-toggle {
    width: 18px;
    height: 18px;
    accent-color: var(--rn-accent);
    cursor: pointer;
    flex-shrink: 0;
  }

  .setting-range {
    width: 100px;
    accent-color: var(--rn-accent);
    cursor: pointer;
    flex-shrink: 0;
  }

  .setting-textarea {
    width: 100%;
    margin-top: 6px;
    padding: 8px 10px;
    background: var(--rn-bg-card);
    border: 1px solid var(--rn-border);
    border-radius: var(--rn-radius-sm);
    font-family: var(--rn-font);
    font-size: 12px;
    color: var(--rn-text);
    resize: vertical;
    outline: none;
    transition: border-color var(--rn-transition);
    line-height: 1.5;
  }

  .setting-textarea:focus {
    border-color: var(--rn-accent);
  }

  /* ─── Footer ──────────────────────────────────────────────── */

  .settings-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    padding: 12px 16px;
    border-top: 1px solid var(--rn-border);
  }

  .settings-saved {
    font-size: 12px;
    font-weight: 500;
    color: var(--rn-success);
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .settings-save-btn {
    padding: 7px 16px;
    background: var(--rn-accent);
    color: white;
    border-radius: var(--rn-radius-sm);
    font-size: 12px;
    font-weight: 600;
    transition: all var(--rn-transition);
  }

  .settings-save-btn:hover:not(:disabled) {
    background: var(--rn-accent-hover);
    transform: translateY(-1px);
  }

  .settings-save-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
