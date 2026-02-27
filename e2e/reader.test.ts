import { test, expect } from './fixtures';

test.describe('Reader (Focus Mode)', () => {
  test('should load reader page with toolbar', async ({
    context,
    extensionId,
  }) => {
    const readerPage = await context.newPage();
    const testUrl = 'https://example.com';
    await readerPage.goto(
      `chrome-extension://${extensionId}/reader.html?id=test-123&url=${encodeURIComponent(testUrl)}`,
    );

    // Should show the toolbar with Focus Mode title
    await expect(readerPage.locator('text=Focus Mode')).toBeVisible();

    // Should show the timer (starts at 0:00)
    await expect(readerPage.locator('text=0:00')).toBeVisible();

    // Should show "I'm done reading" button
    await expect(
      readerPage.locator('button', { hasText: "I'm done reading" }),
    ).toBeVisible();

    // Should show Close button
    await expect(
      readerPage.locator('button', { hasText: 'Close' }),
    ).toBeVisible();
  });

  test('should show the content iframe', async ({
    context,
    extensionId,
  }) => {
    const readerPage = await context.newPage();
    const testUrl = 'https://example.com';
    await readerPage.goto(
      `chrome-extension://${extensionId}/reader.html?id=test-123&url=${encodeURIComponent(testUrl)}`,
    );

    // Should have an iframe pointing to the target URL
    const iframe = readerPage.locator('iframe.reader-frame');
    await expect(iframe).toBeVisible();
    await expect(iframe).toHaveAttribute('src', testUrl);
  });

  test('should toggle toolbar visibility', async ({
    context,
    extensionId,
  }) => {
    const readerPage = await context.newPage();
    await readerPage.goto(
      `chrome-extension://${extensionId}/reader.html?id=test-123&url=${encodeURIComponent('https://example.com')}`,
    );

    // Toolbar should be visible initially
    const toolbar = readerPage.locator('.toolbar');
    await expect(toolbar).toBeVisible();

    // Click Hide button
    const hideBtn = readerPage.locator('button', { hasText: 'Hide' });
    await hideBtn.click();

    // Toolbar should be hidden, show button should appear
    await expect(toolbar).not.toBeVisible();
    const showBtn = readerPage.locator('.toolbar-show');
    await expect(showBtn).toBeVisible();

    // Click show button to bring toolbar back
    await showBtn.click();
    await expect(toolbar).toBeVisible();
  });

  test('should increment timer after a few seconds', async ({
    context,
    extensionId,
  }) => {
    const readerPage = await context.newPage();
    await readerPage.goto(
      `chrome-extension://${extensionId}/reader.html?id=test-123&url=${encodeURIComponent('https://example.com')}`,
    );

    // Wait 3 seconds for timer to increment
    await readerPage.waitForTimeout(3000);

    // Timer should show at least 0:02 (accounting for page load time)
    const timerText = await readerPage
      .locator('.toolbar-timer')
      .textContent();
    // Timer format is M:SS, so after 3 seconds it should be "0:02" or "0:03"
    expect(timerText).toMatch(/0:0[2-5]/);
  });
});
