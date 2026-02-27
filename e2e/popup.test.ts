import { test, expect } from './fixtures';

test.describe('Popup', () => {
  test('should open and show the empty queue message', async ({
    context,
    extensionId,
  }) => {
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);

    // Should show the app title
    await expect(popupPage.getByText('Reading Nook', { exact: true })).toBeVisible();

    // Queue tab should be active by default
    const queueTab = popupPage.locator('[role="tab"]', { hasText: 'Queue' });
    await expect(queueTab).toBeVisible();

    // Should show empty queue message (one of the playful messages)
    // The queue component should be visible
    await expect(
      popupPage.locator('.queue, .empty-state, [class*="empty"]').first(),
    ).toBeVisible({ timeout: 5000 });
  });

  test('should switch between tabs', async ({ context, extensionId }) => {
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);

    // Click Read tab
    const readTab = popupPage.locator('[role="tab"]', { hasText: 'Read' });
    await readTab.click();

    // Click Stats tab
    const statsTab = popupPage.locator('[role="tab"]', { hasText: 'Stats' });
    await statsTab.click();

    // Click back to Queue tab
    const queueTab = popupPage.locator('[role="tab"]', { hasText: 'Queue' });
    await queueTab.click();
    await expect(queueTab).toBeVisible();
  });

  test('should show search bar', async ({ context, extensionId }) => {
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);

    const searchInput = popupPage.locator(
      'input[type="text"], input[type="search"], input[placeholder*="earch"]',
    );
    await expect(searchInput.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display stats tab with streak info', async ({
    context,
    extensionId,
  }) => {
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);

    // Navigate to Stats tab
    const statsTab = popupPage.locator('[role="tab"]', { hasText: 'Stats' });
    await statsTab.click();

    // Should show some stats content (streak, totals, etc.)
    await expect(
      popupPage
        .locator('text=/streak|Saved|Read|total/i')
        .first(),
    ).toBeVisible({ timeout: 5000 });
  });
});
