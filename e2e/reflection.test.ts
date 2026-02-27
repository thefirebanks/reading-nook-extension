import { test, expect } from './fixtures';

test.describe('Reflection', () => {
  test('should load reflection page with form elements', async ({
    context,
    extensionId,
  }) => {
    const reflectionPage = await context.newPage();
    await reflectionPage.goto(
      `chrome-extension://${extensionId}/reflection.html?id=test-123&time=300`,
    );

    // Should show reflection heading or prompt
    await expect(
      reflectionPage
        .locator('text=/reflect|takeaway|thought/i')
        .first(),
    ).toBeVisible({ timeout: 5000 });
  });

  test('should show rating buttons', async ({ context, extensionId }) => {
    const reflectionPage = await context.newPage();
    await reflectionPage.goto(
      `chrome-extension://${extensionId}/reflection.html?id=test-123&time=300`,
    );

    // Should show rating options (worth-it, meh, not-worth-it or similar)
    await expect(
      reflectionPage
        .locator('button, [role="radio"], [class*="rating"]')
        .first(),
    ).toBeVisible({ timeout: 5000 });
  });

  test('should show takeaway input field', async ({
    context,
    extensionId,
  }) => {
    const reflectionPage = await context.newPage();
    await reflectionPage.goto(
      `chrome-extension://${extensionId}/reflection.html?id=test-123&time=300`,
    );

    // Should have a text input or textarea for takeaway
    const takeawayInput = reflectionPage.locator(
      'input[type="text"], textarea',
    );
    await expect(takeawayInput.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display reading time from URL params', async ({
    context,
    extensionId,
  }) => {
    const reflectionPage = await context.newPage();
    // 300 seconds = 5 minutes
    await reflectionPage.goto(
      `chrome-extension://${extensionId}/reflection.html?id=test-123&time=300`,
    );

    // Should show reading time somewhere on the page (5 min or 5:00)
    await expect(
      reflectionPage
        .locator('text=/5.*min|5:00/i')
        .first(),
    ).toBeVisible({ timeout: 5000 });
  });
});
