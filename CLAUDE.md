# Agent Guide — MyCircle

Compact reference for AI coding agents. Rules over explanations.

---

## 1. Workflow

1. `git checkout -b feat/my-feature` (see naming below)
2. Implement — honor **i18n · a11y · theme · responsive** rules
3. `pnpm build:shared` (required before per-package tests)
4. `pnpm test:run` then `pnpm typecheck:all`
5. Commit (conventional), push, `gh pr create`
6. CI must pass: `ci` + `e2e` (both required) — poll with `gh pr checks <PR#>` or `gh run watch`
7. `gh pr merge <PR#> --squash --admin` (only after `ci` and `e2e` both pass)
8. `git checkout main && git pull origin main`
9. Update `README.md` and `docs/architecture.md` if adding user-facing features

---

## 2. Branch & Commit

| Prefix | Use for | Example |
|-----------|-----------------|---------------------------|
| `feat/` | New features | `feat/public-notes` |
| `fix/` | Bug fixes | `fix/ui-bugs` |
| `docs/` | Documentation | `docs/agent-guide` |
| `refactor/`| Restructuring | `refactor/shared-exports` |
| `test/` | Test changes | `test/stock-coverage` |

**Commits**: [Conventional Commits](https://www.conventionalcommits.org/) — imperative mood, under 72 chars.
Examples: `feat: add baby size comparisons`, `fix: bible dropdown overflow on mobile`

---

## 3. i18n Rules

- **Config**: `packages/shared/src/i18n/translations.ts` — hook: `useTranslation()` from `@mycircle/shared`
- Every user-visible string **must** use `t('key')` — never hardcode English in JSX
- Add keys to **all 3 languages** (`en`, `es`, `zh`) in `translations.ts`
- Key format: `namespace.descriptiveName` (e.g., `bible.verseOfDay`, `stock.watchlist`)
- **Spanish gotcha**: file uses Unicode escapes (`\u00f3` for ó) — read the exact line before editing to match format
- After adding keys: `pnpm --filter @mycircle/shared build`

---

## 4. a11y Rules

- Use **semantic HTML** (`<nav>`, `<main>`, `<button>`, `<a>`) — avoid `<div>` with roles
- Add **ARIA attributes** when semantic HTML isn't enough (`aria-label`, `aria-expanded`, `aria-current="page"`)
- New pages must use `<main id="main-content">` (skip-to-content link exists in Layout)
- **Form inputs**: always associate `<label>` — for labels with ` *`, use `getByRole('textbox', { name: /key/i })` in tests
- **Focus indicators**: `focus:ring-2 focus:ring-blue-500 focus:outline-none` on interactive elements
- **Screen reader text**: use Tailwind `sr-only` class
- **Touch targets**: interactive elements ≥ 44×44px on mobile (`p-3` or `min-h-[44px]`)
- **`type="button"`**: non-submit `<button>` elements **must** have `type="button"` — default is `type="submit"`

---

## 5. Theme Rules

Tailwind class-based dark mode (`darkMode: 'class'`). Context in `packages/shell/src/context/ThemeContext.tsx`.

**Every color class must have a `dark:` variant.** Including hover/focus states.

| Light | Dark | Use for |
|-----------------|--------------------------|---------------------|
| `bg-white` | `dark:bg-gray-800` | Card backgrounds |
| `bg-gray-50` | `dark:bg-gray-900` | Page backgrounds |
| `text-gray-900` | `dark:text-white` | Primary text |
| `text-gray-600` | `dark:text-gray-300` | Secondary text |
| `text-gray-500` | `dark:text-gray-400` | Muted text |
| `border-gray-200`| `dark:border-gray-700` | Borders |
| `bg-blue-50` | `dark:bg-blue-900/20` | Info backgrounds |
| `text-blue-600` | `dark:text-blue-400` | Links/accents |
| `hover:bg-gray-100`| `dark:hover:bg-gray-700`| Hover states |

Use opacity modifiers (`/20`, `/40`) for translucent dark backgrounds: `dark:bg-amber-900/10`

---

## 6. Responsive Rules

Mobile-first using Tailwind breakpoints. Base styles = mobile, then override upward.

| Prefix | Min Width | Use |
|--------|-----------|----------------------------------|
| *(none)* | 0 | Mobile (default) |
| `sm:` | 640px | Large phones / small tablets |
| `md:` | 768px | **Main mobile↔desktop cutoff** |
| `lg:` | 1024px | Desktops |
| `xl:` | 1280px | Wide desktops |

- Write base styles for mobile, add `md:` / `lg:` for larger screens — never desktop-first
- **BottomNav**: fixed `h-14` (56px) on mobile — content needs `pb-20 md:pb-8` (Layout handles this)
- Show/hide pattern: `hidden md:flex` (desktop only) / `md:hidden` (mobile only)
- Grids: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` — follow existing patterns in codebase

---

## 7. Testing

### Commands

```bash
pnpm build:shared                              # Always run first
pnpm test:run                                   # All unit tests
pnpm typecheck:all                              # All typechecks
pnpm --filter @mycircle/<package> test:run      # Single package
pnpm test:e2e                                   # E2E (optional locally)
```

### CI Pipeline

| Check | What | Required |
|-------|------|----------|
| `ci` | build shared → typecheck → unit tests | Yes |
| `e2e` | production build → Playwright tests | Yes |
| `e2e-emulator` | Firebase emulator tests | No |

### Gotchas

- **`vi.fn()` is not a constructor** — `vi.fn(() => obj)` creates arrow fn, fails with `new`. Mock browser APIs (SpeechRecognition, AudioContext) with real `class` definitions
- **`act()` for external callbacks** — SpeechRecognition/AudioContext callbacks that trigger React state need `act()` wrapping
- **Label ` *` mismatch** — labels like `{t('key')} *` don't match `getByLabelText('key')`. Use `getByRole('textbox', { name: /key/i })`
- **Rebuild shared after i18n changes** — `pnpm --filter @mycircle/shared build` before running MFE tests
- **Delete e2e tests when removing features** — e2e tests in top-level `e2e/` dir are separate from component code. Search entire repo for references
- **`type="button"` in tests** — missing `type="button"` causes extra submit buttons that break `getByRole('button')` queries

### If CI Fails

```bash
gh run list && gh run view <run-id> --log-failed
```

Common fixes: TypeScript → `pnpm typecheck:all` | Tests → `pnpm test:run` | E2E → `pnpm test:e2e:headed` | Shared mismatch → use `catalog:` in package.json

---

## 8. Quick Reference

```bash
pnpm build:shared && pnpm typecheck:all && pnpm test:all && pnpm test:e2e   # Full local validation
gh pr create --title "feat: description" --body "summary"                     # Create PR
gh pr checks                                                                  # Check status
gh pr merge --squash                                                          # Merge
git checkout main && git pull origin main                                     # Sync
```

---

## 9. Adding a New Micro Frontend

When adding a new MFE, there are **20+ integration points** across the codebase. See the [Full Checklist for Adding a New MFE](./docs/mfe-guide.md#full-checklist-for-adding-a-new-mfe) in the MFE Guide.

Key areas to update (commonly missed items marked with `*`):
- Package setup, test mocks, and vitest aliases
- Shell: route, lazy import, **Layout prefetch** `*`, **Tailwind content** `*`, desktop nav link
- Navigation: BottomNav, **Breadcrumbs** `*`, CommandPalette, **keyboard shortcut** `*`, **shortcuts help** `*`
- Dashboard: **onboarding card** `*`, widget (optional)
- Shared: i18n keys (all 3 locales), StorageKeys, WindowEvents
- Docs: `architecture.md`, `README.md`, firebase config

---

## 11. Removing Features Safely

When removing a widget, route, or feature:

1. **Filter stale localStorage entries** — if the feature stored data in a registry (e.g., `WIDGET_COMPONENTS`, `DEFAULT_LAYOUT`), the user's localStorage may still contain references to the removed ID. Always filter out unknown IDs in the loader function:
   ```ts
   const VALID_IDS = new Set(DEFAULT_LAYOUT.map(w => w.id));
   const filtered = parsed.filter(w => VALID_IDS.has(w.id));
   ```
2. **Delete e2e tests** — search `e2e/` for references to the removed feature
3. **Update unit test counts** — tests that assert array lengths (e.g., `expect(buttons.length).toBe(9)`) must be updated
4. **Remove i18n keys** — keys from all 3 locales (`en.ts`, `es.ts`, `zh.ts`)
5. **PWA manifest shortcuts** — max 10 allowed; remove the feature's shortcut if over limit
6. **Update docs** — `README.md` widget table, `architecture.md`, Quick Access tiles array

**Why this matters:** Users' browsers cache layout/config in localStorage. If code references a removed ID without guarding, the app crashes with `undefined is not a function` — which in production (minified) shows as an opaque error like `W3[D.id] is not a function`.

---

## See Also

- [PR Lifecycle](./docs/pr-lifecycle.md) — branch protection, merge workflow
- [CI/CD Pipeline](./docs/cicd.md) — pipeline details, troubleshooting
- [Architecture](./docs/architecture.md) — MFE structure, data flow
- [MFE Guide](./docs/mfe-guide.md) — pitfalls and lessons learned (includes new MFE checklist)
- [API Keys](./docs/api-keys.md) — external service configuration
