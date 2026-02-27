import { test, expect } from './fixtures';

test.describe('Background Service Worker', () => {
  test('should register and provide an extension ID', async ({
    extensionId,
  }) => {
    // If we get here, the service worker registered successfully
    expect(extensionId).toBeTruthy();
    expect(extensionId.length).toBeGreaterThan(0);
  });

  test('should respond to GET_ITEMS message with empty items', async ({
    context,
    extensionId,
  }) => {
    // Open a page within the extension to send runtime messages
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    const result = await page.evaluate(async () => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'GET_ITEMS' }, (response) => {
          resolve(response);
        });
      });
    });

    expect(result).toHaveProperty('items');
    expect((result as any).items).toEqual([]);
  });

  test('should respond to GET_STATS message with default stats', async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    const result = await page.evaluate(async () => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'GET_STATS' }, (response) => {
          resolve(response);
        });
      });
    });

    expect(result).toHaveProperty('stats');
    const stats = (result as any).stats;
    expect(stats.currentStreak).toBe(0);
    expect(stats.totalRead).toBe(0);
    expect(stats.totalSaved).toBe(0);
  });

  test('should respond to GET_SETTINGS message with defaults', async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    const result = await page.evaluate(async () => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
          resolve(response);
        });
      });
    });

    expect(result).toHaveProperty('settings');
    const settings = (result as any).settings;
    expect(settings.nudgeEnabled).toBe(true);
    expect(settings.focusModeBlockList).toContain('twitter.com');
  });

  test('should save and retrieve an item', async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    // Save an item
    const saveResult = await page.evaluate(async () => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          {
            type: 'SAVE_PAGE',
            payload: {
              id: 'e2e-test-item',
              url: 'https://example.com/e2e-test',
              title: 'E2E Test Article',
              description: 'An article saved during E2E testing',
              siteName: 'example.com',
              contentType: 'article',
              status: 'unread',
              tags: [],
              nudgeCount: 0,
              savedAt: Date.now(),
            },
          },
          (response) => {
            resolve(response);
          },
        );
      });
    });

    expect((saveResult as any).success).toBe(true);

    // Retrieve items
    const getResult = await page.evaluate(async () => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'GET_ITEMS' }, (response) => {
          resolve(response);
        });
      });
    });

    const items = (getResult as any).items;
    expect(items.length).toBe(1);
    expect(items[0].title).toBe('E2E Test Article');
    expect(items[0].url).toBe('https://example.com/e2e-test');
  });

  test('should delete an item', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    // Save then delete
    await page.evaluate(async () => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          {
            type: 'SAVE_PAGE',
            payload: {
              id: 'delete-me',
              url: 'https://example.com/delete-test',
              title: 'Delete Me',
              description: '',
              siteName: 'example.com',
              contentType: 'article',
              status: 'unread',
              tags: [],
              nudgeCount: 0,
              savedAt: Date.now(),
            },
          },
          (response) => resolve(response),
        );
      });
    });

    await page.evaluate(async () => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { type: 'DELETE_ITEM', payload: { id: 'delete-me' } },
          (response) => resolve(response),
        );
      });
    });

    const result = await page.evaluate(async () => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'GET_ITEMS' }, (response) => {
          resolve(response);
        });
      });
    });

    // Should have no items (or no item with id 'delete-me')
    const items = (result as any).items;
    const deletedItem = items.find((i: any) => i.id === 'delete-me');
    expect(deletedItem).toBeUndefined();
  });
});
