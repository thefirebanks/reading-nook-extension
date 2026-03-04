/**
 * Distraction blocking during focus mode using chrome.declarativeNetRequest.
 *
 * When focus mode is active, adds dynamic rules that redirect blocked domains
 * to a gentle "stay focused" page (about:blank with a message, or the reader page).
 */

const RULE_ID_START = 100_000; // high range to avoid conflicts

/**
 * Build declarativeNetRequest rules that block a list of domains.
 * Each domain gets its own rule so they can be managed individually.
 */
function buildBlockRules(
  domains: string[],
): chrome.declarativeNetRequest.Rule[] {
  return domains.map((domain, index) => ({
    id: RULE_ID_START + index,
    priority: 1,
    action: {
      type: 'redirect' as chrome.declarativeNetRequest.RuleActionType,
      redirect: {
        // Redirect to a data URI with a gentle "stay focused" message
        url: `data:text/html,${encodeURIComponent(buildBlockPageHtml(domain))}`,
      },
    },
    condition: {
      urlFilter: `||${domain}`,
      resourceTypes: [
        'main_frame' as chrome.declarativeNetRequest.ResourceType,
      ],
    },
  }));
}

/**
 * Generate a minimal HTML page shown when a blocked site is accessed.
 */
function buildBlockPageHtml(domain: string): string {
  return `<!DOCTYPE html>
<html>
<head><title>Reading Nook - Stay Focused</title></head>
<body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#FFF8F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;color:#3D2C1E;">
<div style="text-align:center;max-width:400px;padding:40px;">
<div style="font-size:48px;margin-bottom:16px;">
<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C4704B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
</div>
<h1 style="font-size:20px;font-weight:600;margin:0 0 12px 0;color:#C4704B;">Stay in your reading nook</h1>
<p style="font-size:14px;color:#8B7355;line-height:1.6;margin:0 0 8px 0;">You're in focus mode right now. <strong>${domain}</strong> is paused until you're done reading.</p>
<p style="font-size:13px;color:#B8A48E;">Finish your reading session to unblock this site.</p>
</div>
</body>
</html>`;
}

/**
 * Enable distraction blocking for the given list of domains.
 */
export async function enableBlocking(domains: string[]): Promise<void> {
  if (domains.length === 0) return;

  const rules = buildBlockRules(domains);
  const ruleIds = rules.map((r) => r.id);

  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ruleIds,
      addRules: rules,
    });
    console.log(
      `Reading Nook: distraction blocking enabled for ${domains.length} domains`,
    );
  } catch (err) {
    console.error('Reading Nook: failed to enable distraction blocking', err);
  }
}

/**
 * Disable distraction blocking (remove all dynamic rules we added).
 * Uses clearAllBlockingRules internally to avoid rule leaks from stale domain counts.
 */
export async function disableBlocking(): Promise<void> {
  await clearAllBlockingRules();
  console.log('Reading Nook: distraction blocking disabled');
}

/**
 * Remove ALL dynamic rules added by the extension (cleanup).
 */
export async function clearAllBlockingRules(): Promise<void> {
  try {
    const existingRules =
      await chrome.declarativeNetRequest.getDynamicRules();
    const ourRuleIds = existingRules
      .filter((r) => r.id >= RULE_ID_START)
      .map((r) => r.id);

    if (ourRuleIds.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: ourRuleIds,
        addRules: [],
      });
    }
  } catch (err) {
    console.error('Reading Nook: failed to clear blocking rules', err);
  }
}
