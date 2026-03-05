# MyCircle — Agent Rules

pnpm monorepo · Vite Module Federation · React 18 · Tailwind · TypeScript

## Workflow

```
git checkout -b feat/my-feature
# implement (honor rules below)
pnpm build:shared
pnpm test:run && pnpm typecheck
git add <files> && git commit --no-verify -m "feat: description"
git push -u origin HEAD
gh pr create --title "feat: description" --body "summary"
gh pr checks <PR#> --watch          # wait for ALL checks to pass
gh pr merge <PR#> --squash --admin  # ONLY after ci, e2e, and e2e-emulator all pass
git checkout main && git pull origin main
```

Branch prefixes: `feat/` `fix/` `docs/` `refactor/` `test/`
Commits: [Conventional Commits](https://www.conventionalcommits.org/), imperative, under 72 chars.

**Git Safety**: Always create a feature branch BEFORE implementing changes. Never commit directly to main. After implementation, create PR and merge via the standard git workflow (branch → commit → push → PR → merge).

## Testing

- After implementing changes, always run the full test suite (`pnpm test:run` / `pnpm typecheck`) and fix any failures before creating a PR. Do not assume tests pass without running them.

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

- **Apollo imports in MFEs**: Never import `useQuery`/`useMutation`/etc. directly from `@apollo/client` in MFE packages. Always import from `@mycircle/shared` which re-exports them. Direct `@apollo/client` imports break Module Federation at runtime (`R is not a function`).
- **i18n**: Every visible string uses `t('key')`. Add keys to all 3 locales (`en`, `es`, `zh`). Rebuild shared after: `pnpm build:shared`
- **Dark mode**: Every color class needs a `dark:` variant. Check existing patterns in codebase.
- **a11y**: Semantic HTML, `aria-label` where needed, `type="button"` on non-submit buttons, touch targets ≥ 44px
- **Responsive**: Mobile-first (`md:` = main breakpoint). Content needs `pb-20 md:pb-8` for BottomNav.
- **Spanish i18n**: File uses Unicode escapes (`\u00f3`). Always read the exact line before editing.
- **PR merge**: Always run `gh pr checks <PR#> --watch` and confirm **all** checks (ci, e2e, e2e-emulator) pass before merging. Never merge with failing or pending checks.
- **Firebase secrets**: Use `printf` not `echo` when piping values — `echo` appends a trailing newline (`\n`) that corrupts URLs and tokens. Always: `printf "value" | npx firebase functions:secrets:set SECRET_NAME`. PodcastIndex uses a combined JSON secret (`PODCASTINDEX_CREDS`). After creating a new secret, grant the compute SA access: `gcloud secrets add-iam-policy-binding SECRET_NAME --project=mycircle-dash --member="serviceAccount:441498720264-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"`. Without this, deploy fails with `secretmanager.secrets.setIamPolicy` denied.
- **GraphQL codegen**: When the schema changes (`functions/src/schema.ts`) or queries change (`packages/shared/src/apollo/queries.ts`), run `pnpm codegen` to regenerate `packages/shared/src/apollo/generated.ts`. Always commit the regenerated file. Auto-runs on `pnpm install` via `postinstall` hook.

## Test Gotchas

- `vi.fn(() => obj)` is NOT a constructor — use real `class` mocks for SpeechRecognition, AudioContext, etc.
- External callbacks triggering React state need `act()` wrapping
- Labels with ` *` suffix: use `getByRole('textbox', { name: /key/i })` not `getByLabelText`
- Missing `type="button"` creates extra submit buttons that break `getByRole('button')` queries
- Rebuild shared before MFE tests: `pnpm --filter @mycircle/shared build`
- e2e tests live in top-level `e2e/` — search entire repo when removing features
- **fireEvent vs userEvent**: `@testing-library/react` v16 does NOT wrap `fireEvent` in `act()` — it's a direct passthrough to `@testing-library/dom`. React 18 batched state updates from `fireEvent.change` may not flush before the next synchronous call. Use `fireEvent.change` for fast text input (avoids `user.type` per-keystroke overhead), but use `user.click` for submit/save buttons (userEvent properly flushes React state). Never do `fireEvent.change` → `fireEvent.submit` without an `await waitFor` gate in between — `handleSubmit` will read stale closure state.

## Adding New MFE Packages

When adding a new micro frontend, update ALL of these integration points:

1. **Shell**: `App.tsx` (lazy import + route), `vite.config.ts` (federation remote URL), `remotes.d.ts` (type declaration), `tailwind.config.js` (content path), `WidgetDashboard.tsx` (WidgetType + DEFAULT_LAYOUT + WIDGET_COMPONENTS + WIDGET_ROUTES), `BottomNav.tsx` (nav item + icon), `Layout.tsx` (NAV_GROUPS item + NavIcon case + ROUTE_MODULE_MAP prefetch), `CommandPalette.tsx` (nav item), `routeConfig.ts` (ROUTE_LABEL_KEYS for breadcrumbs)
2. **Testing**: Mock file in `packages/shell/test/mocks/`, alias in **both** root `vitest.config.ts` AND `packages/shell/vitest.config.ts`, update hardcoded widget/nav counts in existing tests, add e2e test in `e2e/`
3. **Deployment**: `deploy/docker/Dockerfile` (COPY in build + runtime stages), `scripts/assemble-firebase.mjs` (copy block + mfeDirs array), `server/production.ts` (`MFE_PREFIXES` array)
4. **Other**: `firestore.rules` (if new subcollections), root `package.json` (`dev:*` and `preview:*` scripts **AND** the `"dev"` + `"dev:mf"` concurrently commands — missing this means the MFE won't start in local dev and the route silently fails), i18n keys in all 3 locales (including `commandPalette.goTo*` and `nav.*` keys), `docs/architecture.md`, `README.md`
5. **AI Tools**: Update `navigateTo` page list in `scripts/mcp-tools/mfe-tools.ts` to include the new route. If the MFE has AI-callable actions, add new tool definitions to `ALL_TOOLS` array.
6. **Cloud Function endpoints**: If the MFE has its own Cloud Function (REST API), add a `firebase.json` hosting rewrite **before** the catch-all `** → /index.html` rule: `{ "source": "/your-api-path/**", "function": "yourFunction" }`. Missing this causes the API to return HTML (index.html) instead of JSON in production.
7. **functions/ has separate strict tsconfig**: `noUnusedLocals: true` — root `pnpm typecheck` doesn't catch it. Always verify with `cd functions && npx tsc --noEmit` before pushing backend changes.

## Removing Features

Filter stale localStorage IDs or the app crashes (`undefined is not a function`):
```ts
const VALID_IDS = new Set(DEFAULT_LAYOUT.map(w => w.id));
const filtered = parsed.filter(w => VALID_IDS.has(w.id));
```
Also: delete e2e tests, remove i18n keys from all 3 locales, update `deploy/docker/Dockerfile` (remove `COPY` lines for deleted packages in both build and runtime stages), update `packages/shell/tailwind.config.js` `content` array (add/remove MFE src paths — missing this silently breaks arbitrary-value Tailwind classes like `z-[55]`), update docs, respect PWA shortcuts max of 10.

## MCP Validators

MyCircle has a custom MCP server (`.mcp.json`) with project health validators. After restarting Claude Code, these tools are available:

- `validate_i18n` — Check all 3 locale files have the same keys
- `validate_dockerfile` — Check Dockerfile references all packages
- `validate_pwa_shortcuts` — Count PWA shortcuts (max 10)
- `validate_widget_registry` — Check WidgetType/DEFAULT_LAYOUT/WIDGET_COMPONENTS sync
- `validate_all` — Run all validators at once
- `list_ai_tools` — List all AI assistant tool definitions

Run `validate_all` after adding/removing features or packages.

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
