import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { chromium, type BrowserContext, type Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const extensionPath = path.resolve(rootDir, '.output/chrome-mv3');
const outputDir = path.resolve(rootDir, 'docs/screenshots');

type ReadingItem = {
  id: string;
  url: string;
  title: string;
  description: string;
  siteName: string;
  contentType: 'article' | 'video' | 'tweet' | 'paper' | 'other';
  estimatedReadTime?: number;
  savedAt: number;
  readAt?: number;
  status: 'unread' | 'reading' | 'read' | 'archived';
  category?: string;
  tags: string[];
  nudgeCount: number;
};

type UserStats = {
  currentStreak: number;
  longestStreak: number;
  totalRead: number;
  totalSaved: number;
  lastReadDate: string;
  weeklyHistory: Array<{
    weekStart: string;
    saved: number;
    read: number;
    topTags: string[];
    reflections: string[];
  }>;
};

type UserSettings = {
  nudgeEnabled: boolean;
  nudgeFrequencyHours: number;
  tabThreshold: number;
  decayDays: number;
  autoArchiveDays: number;
  focusModeBlockList: string[];
  focusModeEnabled: boolean;
  sessionDurationMinutes: number;
};

function isoDate(daysAgo: number): string {
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

function buildSampleData() {
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;

  const items: ReadingItem[] = [
    {
      id: 'item-1',
      url: 'https://example.com/deep-work',
      title: 'Deep Work for Focused Builders',
      description: 'How to structure sessions for high quality thinking and less context switching.',
      siteName: 'Example Journal',
      contentType: 'article',
      estimatedReadTime: 8,
      savedAt: now - 4 * hour,
      status: 'unread',
      category: 'Personal Growth',
      tags: ['focus', 'productivity'],
      nudgeCount: 0,
    },
    {
      id: 'item-2',
      url: 'https://example.com/svelte-patterns',
      title: 'Svelte UI Patterns That Scale',
      description: 'Practical state patterns and architecture decisions for growing front-end codebases.',
      siteName: 'Frontend Weekly',
      contentType: 'article',
      estimatedReadTime: 12,
      savedAt: now - 30 * hour,
      status: 'unread',
      category: 'Tech & Programming',
      tags: ['svelte', 'architecture'],
      nudgeCount: 1,
    },
    {
      id: 'item-3',
      url: 'https://example.com/ai-notes',
      title: 'Notes on Building Reliable AI Features',
      description: 'A checklist for evaluating prompts, models, and UX quality before launch.',
      siteName: 'Builders Digest',
      contentType: 'article',
      estimatedReadTime: 10,
      savedAt: now - 3 * day,
      status: 'reading',
      category: 'AI & Machine Learning',
      tags: ['ai', 'ux'],
      nudgeCount: 2,
    },
    {
      id: 'item-4',
      url: 'https://example.com/design-system',
      title: 'Design Tokens for Product Teams',
      description: 'How to ship a coherent visual language without slowing down product velocity.',
      siteName: 'Design Notes',
      contentType: 'article',
      estimatedReadTime: 7,
      savedAt: now - 7 * day,
      readAt: now - 2 * day,
      status: 'read',
      category: 'Design',
      tags: ['design-system'],
      nudgeCount: 0,
    },
  ];

  const stats: UserStats = {
    currentStreak: 6,
    longestStreak: 11,
    totalRead: 18,
    totalSaved: 34,
    lastReadDate: isoDate(0),
    weeklyHistory: [
      {
        weekStart: isoDate(4),
        saved: 5,
        read: 3,
        topTags: ['focus', 'ai'],
        reflections: [
          'Short focused sessions beat long distracted ones.',
          'Design constraints help writing quality.',
        ],
      },
    ],
  };

  const settings: UserSettings = {
    nudgeEnabled: true,
    nudgeFrequencyHours: 6,
    tabThreshold: 15,
    decayDays: 30,
    autoArchiveDays: 60,
    focusModeBlockList: [
      'twitter.com',
      'x.com',
      'reddit.com',
      'youtube.com',
    ],
    focusModeEnabled: true,
    sessionDurationMinutes: 25,
  };

  return { items, stats, settings };
}

async function ensureBuildExists() {
  try {
    await fs.access(path.join(extensionPath, 'manifest.json'));
  } catch {
    throw new Error(
      `Missing build output at ${extensionPath}. Run "bun run build" first.`,
    );
  }
}

async function getExtensionId(context: BrowserContext): Promise<string> {
  let [background] = context.serviceWorkers();
  if (!background) {
    background = await context.waitForEvent('serviceworker');
  }
  return background.url().split('/')[2]!;
}

async function seedStorage(
  page: Page,
  items: ReadingItem[],
  stats: UserStats,
  settings: UserSettings,
) {
  await page.evaluate(
    async (payload) => {
      await chrome.storage.local.set({
        reading_items: payload.items,
        reading_stats: payload.stats,
      });
      await chrome.storage.sync.set({
        reading_settings: payload.settings,
      });
    },
    { items, stats, settings },
  );
}

async function captureScreenshots() {
  await ensureBuildExists();
  await fs.mkdir(outputDir, { recursive: true });

  const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'reading-nook-shots-'));
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-first-run',
      '--no-default-browser-check',
    ],
  });

  try {
    const extensionId = await getExtensionId(context);
    const { items, stats, settings } = buildSampleData();

    const popupPage = await context.newPage();
    await popupPage.setViewportSize({ width: 430, height: 980 });
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
    await seedStorage(popupPage, items, stats, settings);
    await popupPage.reload();
    await popupPage.waitForTimeout(500);
    await popupPage.locator('body').screenshot({
      path: path.join(outputDir, 'popup-queue.png'),
    });

    await popupPage.locator('[role="tab"]', { hasText: 'Stats' }).click();
    await popupPage.waitForTimeout(350);
    await popupPage.locator('body').screenshot({
      path: path.join(outputDir, 'popup-stats.png'),
    });
    await popupPage.close();

    const readerPage = await context.newPage();
    await readerPage.setViewportSize({ width: 1400, height: 860 });
    await readerPage.goto(
      `chrome-extension://${extensionId}/reader.html?id=item-1&url=${encodeURIComponent('https://example.com')}`,
    );
    await readerPage.waitForTimeout(1200);
    await readerPage.screenshot({
      path: path.join(outputDir, 'focus-mode.png'),
      fullPage: false,
    });
    await readerPage.close();

    const reflectionPage = await context.newPage();
    await reflectionPage.setViewportSize({ width: 1180, height: 930 });
    await reflectionPage.goto(
      `chrome-extension://${extensionId}/reflection.html?id=item-1&time=780`,
    );
    await reflectionPage.getByRole('button', { name: 'Worth it', exact: true }).click();
    await reflectionPage.locator('#takeaway').fill(
      'Clear interfaces and small habits make deep reading easier.',
    );
    await reflectionPage.waitForTimeout(200);
    await reflectionPage.screenshot({
      path: path.join(outputDir, 'reflection.png'),
      fullPage: false,
    });
    await reflectionPage.close();

    const saveButtonPage = await context.newPage();
    await saveButtonPage.setViewportSize({ width: 1100, height: 760 });
    await saveButtonPage.goto('https://example.com');
    const saveButton = saveButtonPage.locator(
      'button[aria-label="Save to Reading Nook"], button[aria-label="Already saved to Reading Nook"]',
    );
    await saveButton.first().waitFor({ state: 'visible', timeout: 10000 });
    await saveButton.first().click();
    await saveButtonPage.waitForTimeout(350);
    await saveButtonPage.screenshot({
      path: path.join(outputDir, 'save-button.png'),
      fullPage: false,
    });
    await saveButtonPage.close();
  } finally {
    await context.close();
    await fs.rm(userDataDir, { recursive: true, force: true });
  }
}

captureScreenshots()
  .then(() => {
    console.log(`Saved screenshots to ${outputDir}`);
  })
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
