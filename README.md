# Reading Nook

A cozy, playful Chrome extension for saving articles and pages to read later — with gentle nudge reminders, focus mode reading sessions, reading streaks, and structured reflection prompts.

## Features

- **Save Button** — A floating pill button on every page to save it to your nook with one click
- **Reading Queue** — Browse and search your saved items, organized by category with auto-categorization
- **Focus Mode** — Open saved items in a distraction-free reader with a built-in timer and optional distraction blocking (blocks Twitter, Reddit, YouTube, etc.)
- **Reflections** — After reading, rate the article and capture your takeaways with structured prompts
- **Reading Streaks** — Track your daily reading habit with streak counters and stats
- **Smart Decay** — Unread items gradually fade and auto-archive after 30 days, keeping your queue fresh
- **Weekly Digest** — Get a summary of your reading activity via Chrome notifications
- **Session Queue** — Start a focused reading session with multiple queued items

## Tech Stack

- **Framework**: [WXT](https://wxt.dev/) (Web Extension Tools) — file-based entrypoint discovery, hot reload, Manifest V3
- **UI**: [Svelte 5](https://svelte.dev/) with runes syntax (`$state`, `$derived`, `$props`)
- **Language**: TypeScript
- **Build**: Vite (via WXT)
- **Package Manager**: [Bun](https://bun.sh/)
- **Testing**: Vitest (unit) + Playwright (E2E)

## Design

Warm, hand-crafted aesthetic — not "AI-generated." Key design tokens:

| Token | Value |
|-------|-------|
| Background | `#FFF8F0` (cream) |
| Accent | `#C4704B` (terracotta) |
| Success | `#7B9E6B` (sage green) |
| Body font | DM Sans |
| Display font | DM Serif Display |
| Border radius | 12px |
| Shadows | Soft, warm-toned |

All icons are hand-crafted inline SVGs — no emoji in the UI.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) v1.2+
- Chrome or Chromium-based browser

### Install

```bash
bun install
```

### Development

```bash
bun run dev
```

This starts WXT in dev mode with hot reload. Load the extension from `.output/chrome-mv3-dev/` in `chrome://extensions` (enable Developer Mode).

### Build

```bash
bun run build
```

Production output goes to `.output/chrome-mv3/`.

### Test

```bash
# Unit tests (117 tests)
bun run test

# E2E tests (18 tests, requires build first)
bun run build && bunx playwright test
```

## Project Structure

```
entrypoints/
  background/          # Service worker — alarms, messages, tab monitoring, blocking
  save-button.content/ # Content script — floating save button (shadow root)
  popup/               # Main UI — Queue, Read, Stats tabs
  reader/              # Focus mode — iframe + timer toolbar
  reflection/          # Post-reading reflection form
lib/
  types.ts             # TypeScript interfaces
  storage.ts           # chrome.storage CRUD
  utils.ts             # Utilities + playful microcopy
  categories.ts        # Auto-categorization + session logic
  blocking.ts          # Distraction blocking (declarativeNetRequest)
tests/                 # Vitest unit tests
e2e/                   # Playwright E2E tests
public/icons/          # Extension icons (16, 48, 128px)
```

## License

MIT
