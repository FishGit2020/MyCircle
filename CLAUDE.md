# MyCircle — Agent Rules

pnpm monorepo · Vite Module Federation · React 18 · Tailwind · TypeScript

## Workflow

```
git checkout -b feat/my-feature
# implement (honor rules below)
pnpm build:shared
pnpm lint && pnpm test:run && pnpm typecheck
git add <files> && git commit --no-verify -m "feat: description"
git push -u origin HEAD
gh pr create --title "feat: description" --body "summary"
gh pr checks <PR#> --watch          # wait for ALL checks to pass
gh pr merge <PR#> --squash --admin  # ONLY after ci, e2e-gate, and spec-check all pass
git checkout main && git pull origin main && git branch -d feat/my-feature
```

Branch prefixes: `feat/` `fix/` `docs/` `refactor/` `test/`
Commits: [Conventional Commits](https://www.conventionalcommits.org/), imperative, under 72 chars.

**Git Safety**: Always create a feature branch BEFORE implementing changes. Never commit directly to main. After implementation, create PR and merge via the standard git workflow (branch → commit → push → PR → merge).

## Testing

- After implementing changes, always run the full local suite — `pnpm lint && pnpm test:run && pnpm typecheck` — and fix any failures before pushing. All three MUST pass. Do not assume they pass without running them.

## General Guidelines

- When user asks to remove a feature or dependency, remove it completely — do not keep it as a fallback unless explicitly asked.
- When user asks to implement something, proceed with implementation rather than extended planning unless told otherwise.

## Repository Context

- This is a TypeScript monorepo with multiple MFEs. Always verify import paths after moving files.
- When switching branches, stash or commit work first to avoid losing changes.
- After git operations (rebase, stash pop), verify key files weren't reverted.

## Debugging

- When fixing bugs, verify the fix in the correct location (correct React component, correct API path, correct environment URL).
- Double-check sandbox vs production URLs, Firestore rules paths, and which component actually renders the UI being fixed.

## Must-Follow Rules

- **GraphQL-first**: All data operations MUST use the existing Apollo GraphQL service (`useQuery`, `useMutation` from `@mycircle/shared`). Never add a new REST endpoint for MFE feature data — extend the GraphQL schema instead (`functions/src/schema.ts` → `pnpm codegen`). REST is only acceptable for: (a) third-party APIs that don't offer GraphQL, (b) Firebase admin operations (e.g. `firebase.json` rewrites for existing Cloud Functions), or (c) one-off scripts/tooling outside the MFE runtime. When in doubt, use GraphQL.
- **Apollo imports in MFEs**: Never import `useQuery`/`useMutation`/etc. directly from `@apollo/client` in MFE packages. Always import from `@mycircle/shared` which re-exports them. Direct `@apollo/client` imports break Module Federation at runtime (`R is not a function`).
- **i18n**: Every visible string uses `t('key')`. Add keys to all 3 locales (`en`, `es`, `zh`). Rebuild shared after: `pnpm build:shared`
- **Dark mode**: Every color class needs a `dark:` variant. Check existing patterns in codebase.
- **a11y**: Semantic HTML, `aria-label` where needed, `type="button"` on non-submit buttons, touch targets ≥ 44px
- **Responsive**: Mobile-first (`md:` = main breakpoint). Wrap MFE page content in `<PageContent>` from `@mycircle/shared` — Layout.tsx handles BottomNav padding.
- **No `100vh` calculations in MFEs**: Never use `h-[calc(100vh-...)]` or `min-h-[calc(100vh-...)]` inside MFE pages. The `<main>` element is a flex scroll container smaller than the viewport (header, breadcrumbs, padding consume space). To fill available space, use `<PageContent fill>` which provides `flex flex-col min-h-0`, then use `flex-1 min-h-0` on the child that should expand. See AI Assistant for the reference pattern.
- **Spanish i18n**: File uses Unicode escapes (`\u00f3`). Always read the exact line before editing.
- **PR merge**: Always run `gh pr checks <PR#> --watch` and confirm **all** required checks (`ci`, `e2e-gate`, `spec-check`) pass before merging. Never merge with failing or pending checks. `spec-check` enforces that new MFEs have a spec in `docs/specs/`.
- **Firebase secrets**: Use `printf` not `echo` when piping values — `echo` appends a trailing newline (`\n`) that corrupts URLs and tokens. Always: `printf "value" | npx firebase functions:secrets:set SECRET_NAME`. PodcastIndex uses a combined JSON secret (`PODCASTINDEX_CREDS`). After creating a new secret, grant the compute SA access: `gcloud secrets add-iam-policy-binding SECRET_NAME --project=mycircle-dash --member="serviceAccount:441498720264-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"`. Without this, deploy fails with `secretmanager.secrets.setIamPolicy` denied.
- **GraphQL codegen**: When the schema changes (`functions/src/schema.ts`) or queries change (`packages/shared/src/apollo/queries.ts`), run `pnpm codegen` to regenerate `packages/shared/src/apollo/generated.ts`. Always commit the regenerated file. Auto-runs on `pnpm install` via `postinstall` hook.
- **Unit system**: Distance/temperature/speed preferences live in `@mycircle/shared` (`useUnits()`, `formatDistance()`, `StorageKeys.DISTANCE_UNIT`). All MFEs must use these shared utilities — never define local `formatDistance` helpers. Preferences are persisted to Firestore `UserProfile` and restored via `restoreUserData` on sign-in. The central toggle is in `UserMenu` (profile avatar dropdown), not in individual MFE headers.
- **Cross-MFE window globals**: Shell exposes Firebase APIs to MFEs via `window.__hikingRoutes`, `window.__currentUid`, etc. MFEs must read these at call-time (not cache at import-time) since they're set asynchronously after Firebase initializes. Fire `WindowEvents.*_CHANGED` events from the wrapper callbacks (not inside raw Firestore listeners) so the shell widget can react.

## Test Performance

- **Explicit assertion timeouts ≤ 5000ms** — never pass `{ timeout: X }` > 5000 to `it()`/`test()` or to assertions like `.toBeVisible({ timeout: X })`. Tests that need more time indicate a design problem: mock the slow dependency or use `fireEvent` instead of `userEvent`.
- **Global testTimeout** — can be set higher in vitest config (e.g. 15000ms) for packages with heavy component rendering where the jsdom env startup itself takes time. This is different from per-test overrides.
- Unit tests must complete in milliseconds — mock all network calls, timers, and async side effects.
- **userEvent**: always use `userEvent.setup({ delay: null })` — the default typing delay makes tests slow in CI. For tests that only verify state (not interaction fidelity), prefer `fireEvent.change()` over `userEvent.type()`.

## Firestore Gotchas

- **Nested arrays are not supported**: GeoJSON `LineString.coordinates` is `[[lng,lat],...]` — a nested array. Firestore rejects it with `Function addDoc() called with invalid data. Nested arrays are not supported`. Always serialize GeoJSON geometry to a JSON string before writing: `geometry: JSON.stringify(route.geometry)`, and parse it back on read: `typeof raw.geometry === 'string' ? JSON.parse(raw.geometry) : raw.geometry`.
- **Timestamps from onSnapshot**: Firestore `Timestamp` objects come back from `onSnapshot` with a `.toMillis()` method. Convert them explicitly — they are NOT plain numbers.

## MapLibre GL Gotchas

- **`setStyle()` wipes all custom sources/layers**: Every `map.setStyle()` call fires `style.load` and destroys all custom GL sources/layers added after init. Re-draw them by listening to the `style.load` event (expose via an `onStyleLoad` prop from MapView) and re-running the relevant effects.
- **`map.getCanvas().toDataURL()` returns blank**: WebGL buffer isn't populated synchronously. Use `preserveDrawingBuffer: true` in the map constructor, then `map.once('idle', () => canvas.toDataURL()); map.triggerRepaint()`.
- **`map.getLayer()` crashes after navigation**: When the user navigates away, the map is destroyed (`map.remove()`) but React effects with the stale `map` reference may still fire. `map.getLayer()` internally accesses `this.style` which is null after removal → `TypeError: undefined is not an object`. Always wrap GL layer operations in try/catch.
- **Map canvas not filling container on mobile**: MapLibre doesn't auto-resize when the container dimensions change. Call `map.resize()` once after `load`, and attach a `ResizeObserver` to the container div that calls `map.resize()` on every size change.

## CI/CD Gotchas

- **`cancel-in-progress: true` at workflow level kills gate jobs**: If you set concurrency at the workflow level with `cancel-in-progress: true`, a new push cancels the entire in-progress workflow including the gate job — GitHub then shows "Waiting for status to be reported" indefinitely. Fix: set concurrency at the **job level** on expensive jobs only (setup, test, build), and give gate jobs **no concurrency group** so they always run and always post a status.
- **`functions/node_modules` must be in the e2e cache**: `functions/` is NOT a pnpm workspace package — `pnpm install` at the root does not install `functions/node_modules`. `firebase:build:functions` runs `npm install` inside `functions/` and produces `functions/lib` (compiled JS), but only `functions/lib` was cached. When the emulator restores the cache and runs Cloud Functions, runtime deps like `cheerio` are missing (`Cannot find module 'cheerio'`). Fix: include `functions/node_modules` in the `e2e-build` cache path alongside `functions/lib`. Any new runtime dep added to `functions/package.json` needs this cache path present — otherwise the emulator job silently breaks.
- **Rebase introduces duplicate i18n keys**: When rebasing a branch that adds i18n keys onto main (which also added i18n keys), the rebase can create duplicate `// Section` comment blocks with all their keys repeated. This causes `TS1117: An object literal cannot have multiple properties with the same name` and breaks the shared build. Always run `pnpm build:shared` locally after a rebase to catch this before pushing.

## Test Gotchas

- `vi.fn(() => obj)` is NOT a constructor — use real `class` mocks for SpeechRecognition, AudioContext, etc.
- External callbacks triggering React state need `act()` wrapping
- Labels with ` *` suffix: use `getByRole('textbox', { name: /key/i })` not `getByLabelText`
- Missing `type="button"` creates extra submit buttons that break `getByRole('button')` queries
- Rebuild shared before MFE tests: `pnpm --filter @mycircle/shared build`
- e2e tests live in top-level `e2e/` — search entire repo when removing features

## Adding New MFE Packages

When adding a new micro frontend, update ALL of these integration points:

1. **Shell**: `App.tsx` (lazy import + route), `vite.config.ts` (federation remote URL), `remotes.d.ts` (type declaration), `tailwind.config.js` (content path), `WidgetDashboard.tsx` (WidgetType + DEFAULT_LAYOUT + WIDGET_COMPONENTS + WIDGET_ROUTES), `BottomNav.tsx` (nav item + icon), `Layout.tsx` (NAV_GROUPS item + NavIcon case + ROUTE_MODULE_MAP prefetch), `CommandPalette.tsx` (nav item), `routeConfig.ts` (ROUTE_LABEL_KEYS for breadcrumbs)
2. **Testing**: Mock file in `packages/shell/test/mocks/`, alias in **both** root `vitest.config.ts` AND `packages/shell/vitest.config.ts`, update hardcoded widget/nav counts in existing tests, add e2e test in `e2e/`
3. **Deployment**: `deploy/docker/Dockerfile` (COPY in build + runtime stages), `scripts/assemble-firebase.mjs` (copy block + mfeDirs array), `server/production.ts` (`MFE_PREFIXES` array)
4. **Other**: `firestore.rules` (if new subcollections), root `package.json` (`dev:*` and `preview:*` scripts **AND** the `"dev"` + `"dev:mf"` concurrently commands — missing this means the MFE won't start in local dev and the route silently fails), i18n keys in all 3 locales (including `commandPalette.goTo*` and `nav.*` keys), `docs/architecture.md`, `README.md`
5. **AI Tools**: Update `navigateTo` page list in `scripts/mcp-tools/mfe-tools.ts` to include the new route. If the MFE has AI-callable actions, add new tool definitions to `ALL_TOOLS` array.
6. **Cloud Function endpoints**: If the MFE has its own Cloud Function (REST API), add a `firebase.json` hosting rewrite **before** the catch-all `** → /index.html` rule: `{ "source": "/your-api-path/**", "function": "yourFunction" }`. Missing this causes the API to return HTML (index.html) instead of JSON in production.
7. **functions/ has separate strict tsconfig**: `noUnusedLocals: true` — root `pnpm typecheck` doesn't catch it. Always verify with `cd functions && npx tsc --noEmit` before pushing backend changes.
8. **Spec required**: New MFEs must have a spec file at `docs/specs/NNN-<mfe-name>/spec.md`. The `spec-check` CI job (`.github/workflows/spec-guard.yml`) blocks merge if missing. Create one with `pnpm new-spec <name>` before opening the PR.

## Removing Features

Filter stale localStorage IDs or the app crashes (`undefined is not a function`):
```ts
const VALID_IDS = new Set(DEFAULT_LAYOUT.map(w => w.id));
const filtered = parsed.filter(w => VALID_IDS.has(w.id));
```
Also: delete e2e tests, remove i18n keys from all 3 locales, update `deploy/docker/Dockerfile` (remove `COPY` lines for deleted packages in both build and runtime stages), update `packages/shell/tailwind.config.js` `content` array (add/remove MFE src paths — missing this silently breaks arbitrary-value Tailwind classes like `z-[55]`), update docs, respect PWA shortcuts max of 10.
- **Deleting scripts**: When removing files from `scripts/`, also remove any `package.json` script entries that reference them. Missing this breaks CI silently (e.g. `seed-firestore.mjs` deletion broke `emulator:seed-and-test` → e2e-emulator failed on every PR until the dangling reference was found).

## MCP Validators

MyCircle has a custom MCP server (`.mcp.json`) with project health validators. After restarting Claude Code, these tools are available:

- `validate_i18n` — Check all 3 locale files have the same keys
- `validate_dockerfile` — Check Dockerfile references all packages
- `validate_pwa_shortcuts` — Count PWA shortcuts (max 10)
- `validate_widget_registry` — Check WidgetType/DEFAULT_LAYOUT/WIDGET_COMPONENTS sync
- `validate_all` — Run all validators at once
- `list_ai_tools` — List all AI assistant tool definitions

Run `validate_all` after adding/removing features or packages.

## Announcements (What's New)

Announcements are stored in the Firestore `announcements` collection and shown to users via the notification bell. To create a new announcement, use the Firestore REST API with `gcloud` credentials:

```bash
TOKEN=$(gcloud auth application-default print-access-token) && curl -s -X POST \
  "https://firestore.googleapis.com/v1/projects/mycircle-dash/databases/(default)/documents/announcements" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json; charset=utf-8" \
  --data-binary @- <<'ENDJSON'
{
  "fields": {
    "title": {"stringValue": "Your Title Here"},
    "description": {"stringValue": "Description with \\n\\n for paragraphs. Supports emoji."},
    "icon": {"stringValue": "announcement"},
    "createdAt": {"timestampValue": "YYYY-MM-DDTHH:MM:SSZ"}
  }
}
ENDJSON
```

For the `createdAt` timestamp, use `$(date -u +%Y-%m-%dT%H:%M:%SZ)` in the shell or set manually. Emojis must use JSON Unicode escapes (e.g. `\ud83d\uddfa\ufe0f` for 🗺️) to avoid shell encoding issues. See [Announcements doc](./docs/announcements.md) for full schema and examples.

## Docs

- [Architecture](./docs/architecture.md) — MFE structure, data flow
- [Data Patterns](./docs/data-patterns.md) — data refresh, notifications, real-time sync (onSnapshot, polling, FCM, eventBus)
- [Firestore Transport](./docs/firestore-transport.md) — gRPC, HTTP/2, WebSocket, target multiplexing, persistence
- [MFE Guide](./docs/mfe-guide.md) — adding new MFEs (20+ integration points), pitfalls
- [MCP Server](./docs/mcp.md) — MCP validators, AI tool registry, adding tools
- [PR Lifecycle](./docs/pr-lifecycle.md) — branch protection, merge workflow
- [CI/CD Pipeline](./docs/cicd.md) — pipeline details, troubleshooting
- [Ollama Setup](./docs/ollama-setup.md) — self-hosted AI, Cloudflare tunnel/access, Firebase secrets, troubleshooting
- [AI Monitoring](./docs/ai-monitoring.md) — chat logging, raw data access, benchmark correlation

## Active Technologies
- TypeScript 5.x, React 18 + React, Tailwind CSS, `@mycircle/shared` (eventBus, i18n, StorageKeys), Firebase Firestore SDK (shell-only) (001-favorite-cities)
- Firestore `users/{uid}.favoriteCities[]` (existing); localStorage for recents (unchanged) (001-favorite-cities)
- TypeScript 5.x, React 18 + `@mycircle/shared` (Apollo re-exports, i18n), SVG (no new charting library) (003-stock-data)
- `localStorage` (watchlist, unchanged); no new storage (003-stock-data)
- TypeScript 5.x, React 18 + `@mycircle/shared` (Apollo re-exports, eventBus, i18n, StorageKeys, PageContent), `react-router` (URL routing and deep-link autoplay) (004-podcast-player)
- `localStorage` — subscriptions, progress, played state, playback speed, now-playing; Firestore sync via shell on `SUBSCRIPTIONS_CHANGED` (004-podcast-player)
- TypeScript 5.x, React 18 (same as existing `ai-assistant` MFE) + `packages/ai-assistant` (existing MFE), `functions/src/handlers/aiChat.ts` (existing SSE stream handler), `@mycircle/shared` (Apollo re-exports, i18n, StorageKeys) — no new dependencies (005-ollama-chat)
- No new storage — all state managed by existing hooks (005-ollama-chat)
- TypeScript 5.x, React 18 (same as existing `ai-assistant`, `bible-reader` MFEs) + Existing — `packages/bible-reader`, `packages/shell`, `@mycircle/shared` (Apollo re-exports, i18n, StorageKeys, WindowEvents) (006-bible-enhancements)
- localStorage (`bible-bookmarks`) + Firestore `users/{uid}.bibleBookmarks` (already exists) + no new storage (006-bible-enhancements)
- TypeScript 5.x, React 18 + `@mycircle/shared` (Apollo re-exports, i18n, StorageKeys, PageContent) — no new packages (007-worship-songs)
- Firestore `worshipSetlists` collection (new, top-level, `createdBy`-scoped) via GraphQL (007-worship-songs)
- TypeScript 5.x + React 18, `@mycircle/shared` (Apollo re-exports, i18n, WindowEvents, PageContent), `react-router`, Tailwind CSS (008-personal-notes)
- Firestore `users/{uid}/notes/{noteId}` — existing collection, no schema migration needed (008-personal-notes)
- TypeScript 5.x (frontend + backend) + React 18, Apollo Client (via `@mycircle/shared`), Firebase Cloud Functions v2, Firestore, Cloud Storage, Tailwind CSS, Zod (input validation in Cloud Functions) (009-baby-photo-journal)
- TypeScript 5.x + React 18, Tailwind CSS, `@mycircle/shared` (i18n, StorageKeys, PageContent), Firebase Firestore SDK (shell-only, via `window.__flashcardDecks` bridge) (010-language-flashcards)
- Firestore `users/{uid}/flashcardDecks`, `users/{uid}/flashcardDecks/{id}/deckCards`, `users/{uid}/reviewSessions`, `users/{uid}/dailyStreak`; localStorage fallback for unauthenticated users (010-language-flashcards)
- TypeScript 5.x + React 18 + `@mycircle/shared` (useTranslation, StorageKeys, PageContent), Tailwind CSS — no new packages added (011-daily-log-enhancements)
- Firestore `users/{uid}/dailylog/{entryId}` — two optional fields added (`mood`, `tags`); existing documents untouched (011-daily-log-enhancements)

## Recent Changes
- 011-daily-log-enhancements: Enhanced daily-log MFE with mood tracking (5 moods), tag chips, full-text search with highlight, stats view (streak, 30-day chart, mood distribution, top tags)
- 001-favorite-cities: Added cross-MFE favorite cities — star/unstar from search, favorites dropdown, transit city chips, FavoritesManager panel
