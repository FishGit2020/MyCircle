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

- **i18n**: Every visible string uses `t('key')`. Add keys to all 3 locales (`en`, `es`, `zh`). Rebuild shared after: `pnpm build:shared`
- **Dark mode**: Every color class needs a `dark:` variant. Check existing patterns in codebase.
- **a11y**: Semantic HTML, `aria-label` where needed, `type="button"` on non-submit buttons, touch targets ≥ 44px
- **Responsive**: Mobile-first (`md:` = main breakpoint). Content needs `pb-20 md:pb-8` for BottomNav.
- **Spanish i18n**: File uses Unicode escapes (`\u00f3`). Always read the exact line before editing.
- **PR merge**: Always run `gh pr checks <PR#> --watch` and confirm **all** checks (ci, e2e, e2e-emulator) pass before merging. Never merge with failing or pending checks.

## Test Gotchas

- `vi.fn(() => obj)` is NOT a constructor — use real `class` mocks for SpeechRecognition, AudioContext, etc.
- External callbacks triggering React state need `act()` wrapping
- Labels with ` *` suffix: use `getByRole('textbox', { name: /key/i })` not `getByLabelText`
- Missing `type="button"` creates extra submit buttons that break `getByRole('button')` queries
- Rebuild shared before MFE tests: `pnpm --filter @mycircle/shared build`
- e2e tests live in top-level `e2e/` — search entire repo when removing features

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
- [MFE Guide](./docs/mfe-guide.md) — adding new MFEs (20+ integration points), pitfalls
- [MCP Server](./docs/mcp.md) — MCP validators, AI tool registry, adding tools
- [PR Lifecycle](./docs/pr-lifecycle.md) — branch protection, merge workflow
- [CI/CD Pipeline](./docs/cicd.md) — pipeline details, troubleshooting
