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

## Must-Follow Rules

- **Apollo imports in MFEs**: Never import `useQuery`/`useMutation`/etc. directly from `@apollo/client` in MFE packages. Always import from `@mycircle/shared` which re-exports them. Direct `@apollo/client` imports break Module Federation at runtime (`R is not a function`).
- **i18n**: Every visible string uses `t('key')`. Add keys to all 3 locales (`en`, `es`, `zh`). Rebuild shared after: `pnpm build:shared`
- **Dark mode**: Every color class needs a `dark:` variant. Check existing patterns in codebase.
- **a11y**: Semantic HTML, `aria-label` where needed, `type="button"` on non-submit buttons, touch targets ≥ 44px
- **Responsive**: Mobile-first (`md:` = main breakpoint). Content needs `pb-20 md:pb-8` for BottomNav.
- **Spanish i18n**: File uses Unicode escapes (`\u00f3`). Always read the exact line before editing.
- **PR merge**: Always run `gh pr checks <PR#> --watch` and confirm **all** checks (ci, e2e, e2e-emulator) pass before merging. Never merge with failing or pending checks.
- **Firebase secrets**: Use `printf` not `echo` when piping values — `echo` appends a trailing newline (`\n`) that corrupts URLs and tokens. Always: `printf "value" | npx firebase functions:secrets:set SECRET_NAME`. PodcastIndex uses a combined JSON secret (`PODCASTINDEX_CREDS`). There are 6 secrets total — Ollama/CF secrets were removed (endpoints are per-user in Firestore).

## Test Gotchas

- `vi.fn(() => obj)` is NOT a constructor — use real `class` mocks for SpeechRecognition, AudioContext, etc.
- External callbacks triggering React state need `act()` wrapping
- Labels with ` *` suffix: use `getByRole('textbox', { name: /key/i })` not `getByLabelText`
- Missing `type="button"` creates extra submit buttons that break `getByRole('button')` queries
- Rebuild shared before MFE tests: `pnpm --filter @mycircle/shared build`
- e2e tests live in top-level `e2e/` — search entire repo when removing features

## Adding New MFE Packages

When adding a new micro frontend, update ALL of these integration points:

1. **Shell**: `App.tsx` (lazy import + route), `vite.config.ts` (federation remote URL), `remotes.d.ts` (type declaration), `tailwind.config.js` (content path), `WidgetDashboard.tsx` (WidgetType + DEFAULT_LAYOUT + WIDGET_COMPONENTS + WIDGET_ROUTES), `BottomNav.tsx` (nav item + icon)
2. **Testing**: Mock file in `packages/shell/src/test/mocks/`, alias in **both** root `vitest.config.ts` AND `packages/shell/vitest.config.ts`, update hardcoded widget/nav counts in existing tests
3. **Deployment**: `deploy/docker/Dockerfile` (COPY in build + runtime stages), `scripts/assemble-firebase.mjs` (copy block + mfeDirs array), `server/production.ts` (`MFE_PREFIXES` array)
4. **Other**: `firestore.rules` (if new subcollections), root `package.json` (`dev:*` and `preview:*` scripts **AND** the `"dev"` + `"dev:mf"` concurrently commands — missing this means the MFE won't start in local dev and the route silently fails), i18n keys in all 3 locales, `docs/architecture.md`, `README.md`
5. **functions/ has separate strict tsconfig**: `noUnusedLocals: true` — root `pnpm typecheck` doesn't catch it. Always verify with `cd functions && npx tsc --noEmit` before pushing backend changes.

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
