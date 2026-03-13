# Reading Nook

A cozy Chrome extension for saving articles and pages to read later — with gentle nudge reminders, focus mode, reading streaks, and reflection prompts.

## Install (no coding required)

1. Go to the [Releases](../../releases) page and download the latest `.zip` file
2. Unzip it into a folder (for example, `reading-nook-extension-0.1.0-chrome/`)
3. Open Chrome and go to `chrome://extensions`
4. Turn on **Developer mode** (toggle in the top-right corner)
5. Click **Load unpacked** and select the extracted folder that contains `manifest.json` at the top level
6. Done — you'll see the Reading Nook icon in your toolbar

## How it works

- **Save** — Click the floating button on any page (or right-click > "Save to Reading Nook")
- **Read** — Open the popup, browse your queue, and click an item to enter Focus Mode
- **Reflect** — After reading, rate the article and jot down a one-line takeaway
- **Track** — Check your reading streak, stats, and weekly digest in the Stats tab

## Features

- **Save Button** — Floating pill button on every page to save with one click
- **Reading Queue** — Search and browse saved items, auto-categorized by topic
- **Focus Mode** — Distraction-free reader with timer and optional site blocking (Twitter, Reddit, YouTube, etc.)
- **Reflections** — Rate articles and capture takeaways after reading
- **Reading Streaks** — Daily streak counter with stats tracking
- **Smart Decay** — Stale items fade and auto-archive after 60 days
- **Nudge Reminders** — Gentle Chrome notifications when items pile up
- **Session Mode** — Start a curated reading session from your queue

## Build from source

### Prerequisites

- [Bun](https://bun.sh/) v1.2+
- Chrome or Chromium-based browser

### Steps

```bash
# 1. Clone and install
git clone https://github.com/YOUR_USERNAME/reading-nook-extension.git
cd reading-nook-extension
bun install

# 2. Build
bun run build

# 3. Load in Chrome
#    Open chrome://extensions, enable Developer mode,
#    click "Load unpacked", select .output/chrome-mv3/
```

### Package as zip

```bash
bun run zip
```

This creates a distributable `.zip` in `.output/`.

### Development

```bash
bun run dev
```

Starts WXT dev server with hot reload. Load from `.output/chrome-mv3-dev/` in Chrome.

If you see `WebSocket connection to 'ws://localhost:3000/' failed`, the dev build is loaded but the dev server is not running. Either:
- run `bun run dev`, or
- load the production build from `.output/chrome-mv3/` instead.

### Tests

```bash
bun run test          # Unit tests (117 tests)
bun run test:e2e      # E2E tests (18 tests, builds first)
bun run test:all      # Both
```

## Project structure

```
entrypoints/
  background/          # Service worker — alarms, messages, blocking
  save-button.content/ # Content script — floating save button
  popup/               # Main popup — Queue, Read, Stats tabs
  reader/              # Focus mode — iframe + timer toolbar
  reflection/          # Post-reading reflection form
lib/
  types.ts             # TypeScript interfaces
  storage.ts           # chrome.storage CRUD
  utils.ts             # Utilities + microcopy
  categories.ts        # Auto-categorization + session logic
  blocking.ts          # Distraction blocking (declarativeNetRequest)
tests/                 # Vitest unit tests
e2e/                   # Playwright E2E tests
```

## Tech stack

[WXT](https://wxt.dev/) + [Svelte 5](https://svelte.dev/) + TypeScript + Vite + [Bun](https://bun.sh/)

## License

MIT
