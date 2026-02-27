import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  use: {
    // Chrome extensions only work in Chromium
    browserName: 'chromium',
    // Headful mode required for extensions
    headless: false,
  },
  // No webServer needed — we load the built extension directly
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
      },
    },
  ],
});
