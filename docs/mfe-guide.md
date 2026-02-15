# Micro Frontend Guide

Lessons learned from building MyCircle's Vite Module Federation architecture with 9 independently-built micro frontends. This guide captures pitfalls, limitations, and architectural knowledge accumulated during development.

---

## Table of Contents

### Pitfalls & Solutions
- [1. CSS Cascade Order Conflict](#1-css-cascade-order-conflict)
- [2. Duplicate Tailwind Preflight Resets](#2-duplicate-tailwind-preflight-resets)
- [3. Prefetch Side Effects](#3-prefetch-side-effects)
- [4. Scrollbar Layout Shift](#4-scrollbar-layout-shift)
- [5. Global State Pollution](#5-global-state-pollution)
- [6. Event Bus Memory Leaks](#6-event-bus-memory-leaks)
- [7. localStorage Key Collisions](#7-localstorage-key-collisions)
- [8. Body Scroll Lock Conflicts](#8-body-scroll-lock-conflicts)
- [9. Missing Test Aliases for New Remotes](#9-missing-test-aliases-for-new-remotes)

### Limitations & Architecture
- [10. No Hot Reload for Remote MFEs in Dev Mode](#10-no-hot-reload-for-remote-mfes-in-dev-mode)
- [11. PWA Service Worker Interference in Dev Mode](#11-pwa-service-worker-interference-in-dev-mode)
- [Quick Reference](#quick-reference)

---

## 1. CSS Cascade Order Conflict

**Severity: High** | **File: `packages/shell/tailwind.config.js`**

### The Problem

When Module Federation dynamically loads an MFE, its CSS bundle is injected as a `<style>` tag **appended to `<head>`** — after the shell's CSS. If the MFE's CSS contains duplicate Tailwind utility classes, those duplicates appear later in the document cascade and can override the shell's styles.

### How It Manifests

The shell's `DashboardPage` uses:

```
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6
```

On a desktop screen (>= 1024px), **both** `sm:` and `lg:` media queries are active. Since `sm:grid-cols-2` and `lg:grid-cols-6` have identical specificity (one class selector = `0-1-0`), the **last rule in document order wins**.

Before MFE load (correct):
```css
/* Shell CSS */
@media (min-width: 640px)  { .sm\:grid-cols-2 { grid-template-columns: repeat(2,...) } }
@media (min-width: 1024px) { .lg\:grid-cols-6 { grid-template-columns: repeat(6,...) } }
/* lg wins — correct! */
```

After MFE CSS is injected (broken):
```css
/* Shell CSS */
@media (min-width: 640px)  { .sm\:grid-cols-2 { ... } }   /* position A */
@media (min-width: 1024px) { .lg\:grid-cols-6 { ... } }   /* position B */

/* MFE CSS (appended AFTER shell) */
@media (min-width: 640px)  { .sm\:grid-cols-2 { ... } }   /* position C — NOW WINS */
```

Position C's `sm:grid-cols-2` overrides position B's `lg:grid-cols-6`. The 6-column grid collapses to 2 columns.

### Which MFEs Trigger It

Any MFE whose Tailwind bundle contains the same responsive utility class used in the shell:

| MFE | Conflicting class | Source file |
|-----|-------------------|-------------|
| weather-display | `sm:grid-cols-2` | `HistoricalWeather.tsx` |
| stock-tracker | `sm:grid-cols-2` | `Watchlist.tsx` |
| worship-songs | `sm:grid-cols-2` | `SongList.tsx` |
| notebook | `sm:grid-cols-2` | `NoteList.tsx` |

### The Fix

Add `important: '#root'` to the shell's Tailwind config:

```js
// packages/shell/tailwind.config.js
export default {
  important: '#root',   // <-- boosts specificity
  // ...
}
```

This wraps every shell utility in `#root`:

```css
/* Shell — specificity 1-1-0 (ID + class) */
#root .lg\:grid-cols-6 { grid-template-columns: repeat(6,...) }

/* MFE — specificity 0-1-0 (class only) */
.sm\:grid-cols-2 { grid-template-columns: repeat(2,...) }
```

The shell's `1-1-0` always beats the MFE's `0-1-0`, regardless of document order.

### Why Not `important: true`?

Using `important: true` adds `!important` to every utility, which makes it very difficult to override styles intentionally (e.g., inline styles, conditional overrides). The selector approach is surgical — it boosts specificity without preventing overrides when needed.

---

## 2. Duplicate Tailwind Preflight Resets

**Severity: Medium** | **File: all MFE `tailwind.config.js`**

### The Problem

Tailwind's `preflight` layer injects a CSS reset (based on modern-normalize). If every MFE includes its own preflight, you get 8+ copies of base CSS resets injected at different times, potentially causing:
- Flash of unstyled content (FOUC) as resets cascade
- Inconsistent base styles depending on MFE load order
- Unnecessary CSS weight

### The Fix

Only the **shell** (host app) includes preflight. All MFEs disable it:

```js
// packages/<any-mfe>/tailwind.config.js
export default {
  // ...
  corePlugins: {
    preflight: false,   // Shell provides the single source of base styles
  },
}
```

### Rule of Thumb

> The host app owns base styles. Remotes only generate utility classes.

---

## 3. Prefetch Side Effects

**Severity: Medium** | **File: `packages/shell/src/components/Layout.tsx`**

### The Problem

The shell prefetches MFE modules on nav link hover/focus for faster perceived navigation:

```ts
const ROUTE_MODULE_MAP: Record<string, () => Promise<unknown>> = {
  '/weather': () => import('weatherDisplay/WeatherDisplay'),
  '/stocks':  () => import('stockTracker/StockTracker'),
  // ...
};

function prefetchRoute(path: string) {
  if (prefetched.has(path)) return;
  prefetched.add(path);
  ROUTE_MODULE_MAP[path]?.().catch(() => {});
}
```

The `import()` call loads the MFE's `remoteEntry.js`, which pulls in **both JS and CSS bundles**. This means:
- CSS cascade conflicts (Pitfall #1) trigger on hover, not just on navigation
- The user never visits the page but the layout already breaks
- Network requests fire for modules the user may never use

### Mitigations

1. **Fix Pitfall #1 first** — with `important: '#root'`, prefetch CSS injection is harmless
2. Consider `requestIdleCallback` or `IntersectionObserver` instead of hover-based prefetch to reduce unnecessary loads
3. The `prefetched` Set prevents duplicate loads, but the first load is enough to corrupt the cascade

---

## 4. Scrollbar Layout Shift

**Severity: Low** | **File: `packages/shell/src/index.css`**

### The Problem

When navigating between pages, some pages have enough content to show a scrollbar and others don't. The scrollbar appearing/disappearing changes the viewport width, causing visible layout shifts (content jumps left/right).

In an MFE architecture this is amplified because different remotes produce different content heights, making scrollbar toggling frequent.

### The Fix

```css
/* packages/shell/src/index.css */
html {
  scrollbar-gutter: stable;
}
```

This reserves space for the scrollbar even when it's not visible, eliminating the width shift.

---

## 5. Global State Pollution

**Severity: High** | **Files: `packages/shared/src/utils/eventBus.ts`, MFE bridge APIs**

### The Problem

MFEs run in the same `window` context (not iframes). Any MFE can accidentally:
- Overwrite global variables set by another MFE
- Pollute `window` with side effects
- Conflict on `document.body` style mutations

### Patterns Used

**Namespaced window bridges** — MFEs that need host-provided APIs use explicitly namespaced globals:

```ts
// Shell exposes:
(window as any).__notebook = { getAll, get, add, update, delete };
(window as any).__getFirebaseIdToken = () => user.getIdToken();

// MFE consumes:
const api = (window as any).__notebook as NotebookAPI | undefined;
```

**Centralized constants** — All event names and storage keys are defined once in the shared package:

```ts
export const MFEvents = {
  CITY_SELECTED: 'mf:city-selected',
  PODCAST_PLAY_EPISODE: 'mf:podcast-play-episode',
  // ...
} as const;

export const StorageKeys = {
  STOCK_WATCHLIST: 'stock-tracker-watchlist',
  NOTEBOOK_CACHE: 'notebook-cache',
  // ...
} as const;
```

### Rule of Thumb

> Never use bare global names. Always namespace with a prefix (`mf:`, `__`, package name) and define constants in the shared package.

---

## 6. Event Bus Memory Leaks

**Severity: Medium** | **File: `packages/shared/src/utils/eventBus.ts`**

### The Problem

Cross-MFE communication uses DOM `CustomEvent` and a local listener map. If an MFE subscribes to events but doesn't unsubscribe when it unmounts, listeners accumulate — especially when navigating back and forth between pages.

### The Fix

The `subscribeToMFEvent` helper returns an unsubscribe function designed for React's `useEffect` cleanup:

```ts
useEffect(() => {
  const unsub = subscribeToMFEvent(MFEvents.PODCAST_PLAY_EPISODE, (data) => {
    setCurrentEpisode(data);
  });
  return unsub;  // cleanup on unmount
}, []);
```

Similarly, `WindowEvents` listeners must be cleaned up:

```ts
useEffect(() => {
  const handler = () => loadNotes();
  window.addEventListener(WindowEvents.NOTEBOOK_CHANGED, handler);
  return () => window.removeEventListener(WindowEvents.NOTEBOOK_CHANGED, handler);
}, [loadNotes]);
```

### Rule of Thumb

> Every `subscribe` / `addEventListener` in a `useEffect` must have a corresponding cleanup return. No exceptions.

---

## 7. localStorage Key Collisions

**Severity: Medium** | **File: `packages/shared/src/utils/eventBus.ts` (StorageKeys)**

### The Problem

Multiple MFEs share `localStorage`. Without coordination, two MFEs could use the same key (e.g., `"cache"`) and silently overwrite each other's data.

### The Fix

All storage keys are defined in a single `StorageKeys` enum in the shared package:

```ts
export const StorageKeys = {
  STOCK_WATCHLIST: 'stock-tracker-watchlist',
  PODCAST_SUBSCRIPTIONS: 'podcast-subscriptions',
  WIDGET_LAYOUT: 'widget-dashboard-layout',
  NOTEBOOK_CACHE: 'notebook-cache',
  // ... 20+ keys, all in one place
} as const;
```

Benefits:
- TypeScript catches typos at compile time
- Easy to audit all storage usage in one file
- Key names are prefixed with their domain (`stock-`, `podcast-`, `bible-`, etc.)

---

## 8. Body Scroll Lock Conflicts

**Severity: Low** | **File: `packages/shell/src/components/FeedbackButton.tsx`**

### The Problem

Modals often set `document.body.style.overflow = 'hidden'` to prevent background scrolling. In an MFE architecture, multiple components from different MFEs might try to lock/unlock body scroll simultaneously, leading to:
- Scroll remaining locked after a modal closes (if another modal opened during)
- Scroll unlocking prematurely (if two modals manage the same style)

### Current Approach

```ts
useEffect(() => {
  if (open) {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }
}, [open]);
```

This works when only one modal can be open at a time. For multiple concurrent modals, consider a **reference-counting** approach or a shared `useBodyScrollLock` hook in the shared package.

---

## 9. Missing Test Aliases for New Remotes

**Severity: High** | **Files: `vitest.config.ts` (root), `packages/shell/vitest.config.ts`**

### The Problem

Module Federation remote imports (e.g., `import('babyTracker/BabyTracker')`) don't exist on disk — they're resolved at runtime by the federation plugin. During testing, Vitest uses `resolve.alias` entries to redirect these imports to local mock components.

This project has **two** vitest configs that need these aliases:

| Config | Used by | Command |
|--------|---------|---------|
| `vitest.config.ts` (root) | `pnpm test:run` | Runs all tests across the monorepo |
| `packages/shell/vitest.config.ts` | `pnpm --filter @mycircle/shell test:run` | Runs only shell tests |

The CI script `pnpm test:all` runs **both** (`pnpm test:run && pnpm test:mf`). If you add the alias to the shell config but forget the root config, shell tests pass locally via `pnpm test:mf` but fail in CI when the root config picks up `Layout.tsx`.

### How It Manifests

```
Error: Failed to resolve import "babyTracker/BabyTracker" from
  "packages/shell/src/components/Layout.tsx". Does the file exist?
  Plugin: vite:import-analysis
```

Tests pass locally with `pnpm --filter @mycircle/shell test:run` but fail in CI with `pnpm test:run`.

### The Fix

When adding a new MFE remote, update **both** configs and create a mock:

1. **Create the mock** in `packages/shell/src/test/mocks/<Name>Mock.tsx`:

```tsx
export default function BabyTrackerMock() {
  return <div data-testid="baby-tracker-mock">Baby Tracker</div>;
}
```

2. **Add alias to shell config** (`packages/shell/vitest.config.ts`):

```ts
'babyTracker/BabyTracker': resolve(__dirname, './src/test/mocks/BabyTrackerMock.tsx'),
```

3. **Add alias to root config** (`vitest.config.ts`):

```ts
'babyTracker/BabyTracker': resolve(__dirname, './packages/shell/src/test/mocks/BabyTrackerMock.tsx'),
```

Note the path difference: the root config uses `./packages/shell/src/test/mocks/...` while the shell config uses `./src/test/mocks/...` (relative to each config's location).

### Checklist for Adding a New MFE

- [ ] Create `packages/<name>/` with its own `vitest.config.ts`
- [ ] Create mock at `packages/shell/src/test/mocks/<Name>Mock.tsx`
- [ ] Add alias to `packages/shell/vitest.config.ts`
- [ ] Add alias to root `vitest.config.ts`
- [ ] Add route entry to `Layout.tsx` `ROUTE_MODULE_MAP`
- [ ] Verify with `pnpm test:run` (root) — not just `pnpm --filter @mycircle/shell test:run`

---

## 10. No Hot Reload for Remote MFEs in Dev Mode

**Severity: N/A (architectural limitation)** | **Plugin: `@originjs/vite-plugin-federation` v1.3.5**

### The Problem

Vite's Hot Module Replacement (HMR) only works within a single dev server's WebSocket connection. In a Module Federation setup, the shell (host) and each remote MFE run on separate Vite servers (ports 3000–3011). When you edit a remote's source code, the host has no way to know that the remote changed — HMR events don't propagate across servers.

### How `pnpm dev` Works

The root `dev` script runs the **shell in `vite dev` mode** (with HMR) but all **remotes in `vite preview` mode** (serving pre-built static bundles):

```
pnpm build:remotes && concurrently \
  "pnpm dev:shell"       \  # vite --port 3000        (dev mode, HMR works)
  "pnpm preview:city"    \  # vite preview --port 3001 (static, no HMR)
  "pnpm preview:weather" \  # vite preview --port 3002 (static, no HMR)
  ...
```

This means:
- **Shell code changes** → instant HMR in the browser
- **Remote MFE changes** → no effect until you rebuild the remote and refresh

### Why It's Designed This Way

Running all 9 remotes in `vite dev` mode simultaneously would consume significant system resources. More importantly, `@originjs/vite-plugin-federation` requires remotes to generate a `remoteEntry.js` via `vite build` — the dev server's bundleless mode doesn't produce this manifest file.

### Plugin Landscape (as of Feb 2026)

| Plugin | Remote Dev HMR | Notes |
|--------|---------------|-------|
| `@originjs/vite-plugin-federation` (current) | No | Remotes must be built; host-side HMR only |
| `@module-federation/vite` (official) | Roadmap | Docs list remote HMR as a future feature, not yet shipped |
| `@antdevx/vite-plugin-hmr-sync` | Auto-refresh | Watches for rebuilds and triggers browser reload (not true HMR) |
| Rsbuild + Module Federation | Yes | Full HMR, but requires migrating from Vite to Rsbuild |

### Workaround: `pnpm dev:remote`

The `dev:remote` script (`scripts/dev-remote.mjs`) automates the rebuild-and-reload cycle. It runs `vite build --watch` for a single remote and automatically triggers a browser reload when the build finishes.

**Setup — two terminals required:**

```bash
# Terminal 1: start the full dev environment (shell + all preview servers)
pnpm dev

# Terminal 2: watch the remote you're actively editing
pnpm dev:remote -- worship-songs
```

Replace `worship-songs` with any package folder name: `city-search`, `weather-display`, `stock-tracker`, `podcast-player`, `ai-assistant`, `bible-reader`, `notebook`, `baby-tracker`.

**How it works:**

```
Save file → Vite rebuild (--watch) → dist/assets/remoteEntry.js changes
  → fs.watch detects it → fetches localhost:3000/__mfe-rebuilt → browser reloads
```

1. Runs `pnpm --filter @mycircle/<name> build --watch` to rebuild on every file save
2. Watches the `dist/assets/` directory for `remoteEntry.js` changes (with 500ms debounce)
3. Sends an HTTP request to the shell's `/__mfe-rebuilt` endpoint, which triggers a browser reload

**Important notes:**

- This is **not true HMR** — the browser does a full page reload, so in-memory state (form inputs, scroll position) is lost
- The shell must be running on port 3000 (`pnpm dev` in Terminal 1). If the shell isn't running, you'll see `Could not reach shell` warnings — the rebuild still works, you just need to manually refresh
- Only use `dev:remote` for the **one package you're actively editing**. All other remotes stay on their preview servers serving their last build

### Rule of Thumb

> HMR works within a single Vite dev server. Across federated boundaries, use `pnpm dev:remote` for automatic rebuild + reload. Focus on the package you're actively editing.

---

## 11. PWA Service Worker Interference in Dev Mode

**Severity: Medium** | **File: shell PWA config (`vite-plugin-pwa`)**

### The Problem

The shell uses `vite-plugin-pwa` with Workbox to cache assets for offline support. The service worker **persists in the browser** across sessions. If a previous production build (or a stale dev session) registered a service worker, it will intercept all requests to `localhost:3000` and serve cached HTML — even after you restart the dev server.

### How It Manifests

After running `pnpm dev`, the page at `localhost:3000` is **blank**. The console shows:

```
workbox Precaching did not find a match for /@vite-plugin-pwa/pwa-entry-point-loaded
GET http://localhost:3000/@vite/client net::ERR_CONNECTION_REFUSED
GET http://localhost:3000/src/main.tsx net::ERR_CONNECTION_REFUSED
```

The service worker is serving a cached `index.html` from a previous build that references dev-mode scripts (`/@vite/client`, `/src/main.tsx`), but those paths only exist when a Vite dev server is actively running.

### The Fix

Unregister the stale service worker using any of these methods:

**Option A — DevTools (quickest):**

1. Open DevTools → **Application** tab → **Service Workers** (left sidebar)
2. Check **"Bypass for network"** to skip the SW during dev, or click **"Unregister"** to remove it entirely

**Option B — Console one-liner:**

```js
navigator.serviceWorker.getRegistrations().then(r => r.forEach(sw => sw.unregister()))
```

Then hard-refresh with `Ctrl+Shift+R`.

**Option C — Clear all site data:**

1. DevTools → **Application** → **Storage** (left sidebar)
2. Click **"Clear site data"** (clears SW + cache + localStorage)
3. Refresh the page

### Rule of Thumb

> If `localhost:3000` shows a blank page after starting `pnpm dev`, the first thing to check is a stale PWA service worker. Unregister it and hard-refresh.

---

## Quick Reference

| Pitfall | Root Cause | Fix | Severity |
|---------|-----------|-----|----------|
| CSS cascade conflict | MFE CSS injected after shell, same utility classes | `important: '#root'` in shell Tailwind config | High |
| Duplicate preflight | Multiple Tailwind base resets | `corePlugins: { preflight: false }` in MFEs | Medium |
| Prefetch side effects | `import()` loads CSS as side effect | Fix cascade first; consider idle-time prefetch | Medium |
| Scrollbar layout shift | Viewport width changes with scrollbar | `scrollbar-gutter: stable` on `html` | Low |
| Global state pollution | Shared `window` context | Namespaced bridges + centralized constants | High |
| Event bus memory leaks | Missing `useEffect` cleanup | Always return unsubscribe in cleanup | Medium |
| Storage key collisions | Shared `localStorage` | Single `StorageKeys` enum in shared package | Medium |
| Body scroll lock conflicts | Multiple modals managing `overflow` | Ref-counting or shared hook | Low |
| Missing test aliases | New remote added to shell but not root vitest config | Update both `vitest.config.ts` files + create mock | High |
| No remote HMR in dev | Federation remotes run on separate servers; HMR doesn't cross boundaries | `pnpm dev:remote -- <name>` for auto rebuild + reload | Limitation |
| PWA service worker stale cache | Service worker serves cached HTML from previous build | Unregister SW in DevTools → Application → Service Workers | Medium |
