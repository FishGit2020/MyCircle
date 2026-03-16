# MyCircle Platform Constitution

## Core Principles

### I. Code Quality

All code must adhere to established standards and best practices:

- Follow React/TypeScript conventions (PascalCase components, camelCase hooks, UPPER_SNAKE constants)
- Use TypeScript strict mode — zero type errors, no `any` without justification
- Prefer functional components with hooks over class components
- Apply SOLID principles — each component/hook has a single responsibility
- Every color class needs a `dark:` variant (dark mode is non-negotiable)
- Semantic HTML with proper `aria-label`, `type="button"` on non-submit buttons, touch targets >= 44px
- Mobile-first responsive design (`md:` = main breakpoint)
- Every visible string uses `t('key')` with keys in all 3 locales (en, es, zh)

Module Federation rules (violations cause silent runtime failures):

- **Apollo imports**: Always from `@mycircle/shared`, never directly from `@apollo/client`
- **modulePreload**: Must be `false` (not `{ polyfill: false }`) in all MFE vite configs
- **No `useTransition`** or newer React 18 concurrent APIs in MFEs
- **No `100vh` calculations** in MFE pages — use `<PageContent fill>` instead
- **Window globals**: Read at call-time, never cache at import-time

### II. Testing Standards (NON-NEGOTIABLE)

Testing is mandatory for all new features and bug fixes:

- **Write tests alongside code**: Every component and hook must have corresponding test files
- **Unit tests complete in milliseconds** — mock all network calls, timers, and async side effects
- **Test naming**: Describe behavior, not implementation
- **Deterministic and isolated**: No shared mutable state between tests

Testing practices:

- Test timeout <= 5000ms per assertion (never pass `{ timeout: X }` > 5000)
- Global testTimeout up to 15000ms for packages with heavy jsdom rendering
- `userEvent.setup({ delay: null })` always — default typing delay breaks CI
- `vi.fn(() => obj)` is NOT a constructor — use real `class` mocks for SpeechRecognition, AudioContext
- External callbacks triggering React state need `act()` wrapping
- Labels with ` *` suffix: use `getByRole('textbox', { name: /key/i })` not `getByLabelText`
- Rebuild shared before MFE tests: `pnpm build:shared`

### III. Micro Frontend Consistency

Every MFE must provide a consistent, complete integration:

- **Shell integration**: App.tsx route, vite.config.ts remote, remotes.d.ts, tailwind.config.js
- **Navigation**: navConfig.ts (NAV_GROUPS + ALL_NAV_ITEMS + ROUTE_MODULE_MAP), routeConfig.ts, CommandPalette.tsx, iconRegistry.tsx
- **Widget**: widgetConfig.ts (WidgetType + ALL_WIDGET_IDS + WIDGET_COMPONENTS + WIDGET_ROUTES), widget component
- **i18n**: Keys in all 3 locales — nav, bottomNav, commandPalette, widgets, feature-specific
- **Tests**: Unit tests (component + hooks), shell mock, vitest aliases (root + shell), e2e spec
- **Deployment**: Dockerfile (both stages), assemble-firebase.mjs, root package.json (dev + preview + concurrently)
- **Documentation**: docs/architecture.md entry, feature spec in docs/specs/, MCP tools navigateTo list
- **Validation**: Run `validate_all` after integration — all validators must pass

### IV. Performance Requirements

Performance must be measured and maintained within defined bounds:

- Shell bundle: <= 5 MB (CI fails if exceeded)
- Individual MFE bundle: <= 2 MB (CI warns if exceeded)
- Total bundle size regression: <= 10% increase per PR
- Lighthouse Performance score: >= 70
- No blocking operations in render paths
- Cache expensive computations (NodeCache for Cloud Functions, localStorage for frontend)
- Benchmark Cloud Function endpoints — P99 latency tracked in monitoring

### V. Security

Security is non-negotiable:

- No secrets in committed code (.env, credentials, API keys)
- Firebase secrets: use `printf` not `echo` (echo appends `\n` that corrupts URLs/tokens)
- New secrets need IAM grant: `gcloud secrets add-iam-policy-binding` for compute SA
- CORS whitelist in `ALLOWED_ORIGINS` — production domains + localhost only
- Cloud Functions validate auth tokens via `verifyAuthToken()` and rate-limit via `checkRateLimit()`
- Input validation at system boundaries (Zod schemas for Cloud Function bodies)
- `functions/` has separate strict tsconfig (`noUnusedLocals: true`) — always verify with `cd functions && npx tsc --noEmit`

## Quality Gates

All code changes must pass the following gates before merge:

1. **CI check** (`ci`): typecheck, test-root, test-mfe all pass
2. **E2E check** (`e2e`): Playwright tests pass across 3 shards
3. **E2E emulator check** (`e2e-emulator`): Tests pass against Firebase emulators
4. **Type safety**: `pnpm typecheck` produces zero errors
5. **Bundle size**: Shell <= 5MB, individual MFEs <= 2MB
6. **Lint cap**: Warnings do not exceed current threshold (610)
7. **Validators**: `validate_all` returns no failures (warnings acceptable)

## Development Workflow

1. **Spec** (required for new MFEs): Run `pnpm new-spec <name>`, fill out spec.md, plan.md, tasks.md. CI blocks PRs for new MFEs without specs.
2. **Branch**: Create feature branch (`feat/`, `fix/`, `docs/`, `refactor/`, `test/`)
3. **Implement**: Write code following constitution principles
4. **Test**: Ensure all test categories pass locally
5. **Validate**: Run `validate_all` for integration health
6. **PR**: Create pull request with conventional commit title
7. **CI**: Wait for all required checks to pass (ci, e2e, e2e-emulator)
8. **Merge**: Squash merge to main — never force-push or commit directly to main

## Removing Features

When removing an MFE or feature, the inverse of the MFE checklist applies:

- Remove from all shell integration points (App.tsx, vite.config.ts, navConfig, widgetConfig, etc.)
- Delete e2e tests (in `e2e/`, easy to miss)
- Remove i18n keys from all 3 locales
- Filter stale localStorage IDs: `parsed.filter(w => VALID_IDS.has(w.id))`
- Update Dockerfile, assemble-firebase.mjs, root package.json scripts
- Update docs, PWA shortcuts (max 10), MCP tool lists

## Governance

This constitution supersedes all other development practices for the MyCircle platform. It complements `CLAUDE.md` (which provides agent-specific instructions) with team-level governance.

Amendments require:
- Documented rationale for the change
- Update to both CONSTITUTION.md and CLAUDE.md if rules overlap
- Migration plan for existing code if standards change

**Version**: 1.0.0 | **Ratified**: 2026-03-16 | **Last Amended**: 2026-03-16
