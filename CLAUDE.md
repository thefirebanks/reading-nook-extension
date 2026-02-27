---
description: Reading Nook Chrome extension — WXT + Svelte 5 + TypeScript project conventions
globs: "**/*.{ts,svelte,html,css,js}"
alwaysApply: true
---

# Reading Nook Extension

## Project Overview

Chrome extension ("Reading Nook") for saving pages to read later, with focus mode, reflections, streaks, and gentle nudge reminders. Built with WXT framework + Svelte 5 + TypeScript (Manifest V3).

## Commands

- `bun install` — install dependencies
- `bun run dev` — start WXT dev server with hot reload
- `bun run build` — production build to `.output/chrome-mv3/`
- `bun run test` — run Vitest unit tests (117 tests)
- `bun run build && bunx playwright test` — run E2E tests (18 tests, must build first)
- `bun run zip` — package extension for distribution

## Package Manager

Always use `bun`, never npm/pnpm/yarn.

## Framework: WXT

- WXT uses file-based entrypoint discovery in `entrypoints/` directory
- Each entrypoint folder must have an `index.ts` (or `index.html` for pages)
- Content scripts use `defineContentScript()` with `createShadowRootUi` for style isolation
- Background uses `defineBackground()` 
- Build output: `.output/chrome-mv3/` (production) or `.output/chrome-mv3-dev/` (dev)
- Run `bunx wxt prepare` to generate types if `chrome` global shows LSP errors

## UI Framework: Svelte 5

- Uses runes syntax: `$state()`, `$derived()`, `$props()`, `$bindable()`
- Mount/unmount via `mount`/`unmount` from `'svelte'`
- `{@const}` declarations must be immediate children of control flow blocks (`{#if}`, `{#each}`, etc.)
- Content script UIs use shadow root — Google Fonts can't load there, use system font fallbacks

## Design System

- Background: `#FFF8F0` (cream), Accent: `#C4704B` (terracotta), Success: `#7B9E6B` (sage green)
- Fonts: DM Sans (body) + DM Serif Display (headings) — loaded via Google Fonts `<link>` in HTML files
- Border radius: 12px, soft warm shadows
- All icons are inline SVGs — no emoji in UI components
- CSS variables: `--rn-bg`, `--rn-accent`, `--rn-success`, `--rn-font-display`, `--rn-transition-spring`, `--rn-transition-smooth`
- Tone: warm, playful microcopy ("Your nook is empty — go find something fascinating!")

## Architecture

| Entrypoint | Purpose |
|---|---|
| `entrypoints/background/` | Service worker: messages, alarms, tab monitoring, focus mode, distraction blocking |
| `entrypoints/save-button.content/` | Content script: floating save button + metadata extraction |
| `entrypoints/popup/` | Main popup UI with 3 tabs: Queue, Read, Stats |
| `entrypoints/reader/` | Focus mode page: iframe + timer toolbar |
| `entrypoints/reflection/` | Post-reading reflection form |

## Data Model

- Types in `lib/types.ts`: `ReadingItem`, `Reflection`, `UserStats`, `WeekSummary`, `UserSettings`
- Storage: `chrome.storage.local` for items/stats (5MB), `chrome.storage.sync` for settings (100KB)
- CRUD operations in `lib/storage.ts`

## Testing

- Unit tests in `tests/` use Vitest with chrome.storage mocking
- E2E tests in `e2e/` use Playwright with headful Chrome (`headless: false`) and `launchPersistentContext` with `--load-extension`
- E2E fixture in `e2e/fixtures.ts` handles extension loading
- Use `import.meta.url` with `fileURLToPath` (not `__dirname` — ESM project)

## Key Gotchas

- Content script CSS injection mode must be `'ui'` for shadow root
- `chrome` type errors in editor are normal until `wxt prepare` runs
- Distraction blocking uses `chrome.declarativeNetRequest` with `declarative_net_request` permission in manifest
- Build is ~155KB total, builds in ~1 second
