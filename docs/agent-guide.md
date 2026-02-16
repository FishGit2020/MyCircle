# Agent Development Guide

How to use an AI coding agent (Claude Code, Copilot, Cursor, etc.) to implement features and fixes in MyCircle — while honoring the project's i18n, accessibility, theme, responsive, and CI/CD standards.

---

## Table of Contents

- [Workflow Overview](#workflow-overview)
- [Branch & PR Lifecycle](#branch--pr-lifecycle)
- [Internationalization (i18n)](#internationalization-i18n)
- [Accessibility (a11y)](#accessibility-a11y)
- [Theme & Dark Mode](#theme--dark-mode)
- [Responsive Design](#responsive-design)
- [Testing & Verification](#testing--verification)
- [Checklist Template](#checklist-template)
- [Example Agent Prompt](#example-agent-prompt)

---

## Workflow Overview

```
1. Create branch          git checkout -b feat/my-feature
2. Implement changes      Honor i18n · a11y · theme · responsive
3. Run unit tests         pnpm test:run
4. Commit & push          git commit → git push -u origin feat/my-feature
5. Open PR                gh pr create --title "feat: ..." --body "..."
6. Wait for CI            ci (typecheck + unit) + e2e + e2e-emulator
7. Fix failures           Push fix commits → CI re-runs
8. Merge                  gh pr merge --squash
9. Sync                   git checkout main && git pull origin main
```

> See [docs/pr-lifecycle.md](./pr-lifecycle.md) for full branch protection rules and [docs/cicd.md](./cicd.md) for pipeline details.

---

## Branch & PR Lifecycle

### Branch Naming

| Prefix | Use for | Example |
|--------|---------|---------|
| `feat/` | New features | `feat/public-notes` |
| `fix/` | Bug fixes | `fix/ui-bugs` |
| `docs/` | Documentation only | `docs/agent-guide` |
| `refactor/` | Code restructuring | `refactor/shared-exports` |
| `test/` | Test additions/fixes | `test/stock-coverage` |

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/) — imperative mood, under 72 characters:

```
feat: add animal/vegetable baby size comparisons
fix: bible dropdown overflow on mobile
docs: add agent development guide
```

### PR Structure

```bash
gh pr create --title "feat: short description" --body "$(cat <<'EOF'
## Summary
- What changed and why

## Test plan
- [ ] Unit tests pass (`pnpm test:run`)
- [ ] CI checks pass (typecheck + unit + E2E)
- [ ] Manual verification steps
EOF
)"
```

After CI passes: `gh pr merge --squash`

---

## Internationalization (i18n)

MyCircle supports **3 languages**: English (`en`), Spanish (`es`), Chinese (`zh`).

### Setup

- **Config**: `packages/shared/src/i18n/`
- **Translations**: `packages/shared/src/i18n/translations.ts`
- **Hook**: `useTranslation()` from `@mycircle/shared`
- **Persistence**: `localStorage` via `StorageKeys.LOCALE`

### Rules for Agents

1. **Every user-visible string MUST use `t('key')`** — never hardcode English text in JSX.

   ```tsx
   // ✅ Correct
   const { t } = useTranslation();
   <h2>{t('weather.forecast')}</h2>

   // ❌ Wrong
   <h2>Weather Forecast</h2>
   ```

2. **Add keys to ALL 3 languages** in `translations.ts`. The file uses nested dot-notation keys:

   ```ts
   // translations.ts structure
   export const translations = {
     en: {
       'weather.forecast': '7-Day Forecast',
       'weather.humidity': 'Humidity',
       // ...
     },
     es: {
       'weather.forecast': 'Pronóstico de 7 días',
       'weather.humidity': 'Humedad',
     },
     zh: {
       'weather.forecast': '7天预报',
       'weather.humidity': '湿度',
     },
   };
   ```

3. **Key naming**: Use `namespace.descriptiveName` format (e.g., `bible.verseOfDay`, `stock.watchlist`).

4. **Spanish file gotcha**: The translations file uses Unicode escapes (e.g., `\u00f3` for ó). Always read the exact line before editing to match the escape format already in use.

5. **After adding keys**, rebuild shared so other packages pick up changes:
   ```bash
   pnpm --filter @mycircle/shared build
   ```

---

## Accessibility (a11y)

### Required Patterns

1. **Semantic HTML** — prefer `<nav>`, `<main>`, `<footer>`, `<button>`, `<a>` over generic `<div>` with roles.

2. **ARIA attributes** — add when semantic HTML alone isn't sufficient:

   ```tsx
   // Navigation
   <nav aria-label="Main navigation">

   // Toggle buttons
   <button aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>

   // Active page indicator
   <Link to={path} aria-current={isActive ? 'page' : undefined}>

   // Expandable sections
   <button aria-expanded={isOpen} aria-haspopup="true">
   ```

3. **Skip-to-content link** — already implemented in `Layout.tsx`. New pages use `<main id="main-content">`.

4. **Form inputs** — always associate labels. For inputs with required indicator (` *`), use regex matchers in tests:

   ```tsx
   // Component
   <label htmlFor="city">{t('search.city')} *</label>
   <input id="city" ... />

   // Test — use regex because label includes " *"
   screen.getByRole('textbox', { name: /search\.city|city/i })
   ```

5. **Focus management** — interactive elements must be keyboard-navigable. Use `focus:ring-2 focus:ring-blue-500 focus:outline-none` for visible focus indicators.

6. **Screen reader text** — use Tailwind's `sr-only` class for text only screen readers should see:

   ```tsx
   <span className="sr-only">{t('nav.skipToContent')}</span>
   ```

---

## Theme & Dark Mode

### How It Works

- **Strategy**: Tailwind CSS class-based dark mode (`darkMode: 'class'`)
- **Context**: `packages/shell/src/context/ThemeContext.tsx`
- **Toggle**: `packages/shell/src/components/ThemeToggle.tsx`
- **Persistence**: `localStorage` via `StorageKeys.THEME`, synced to Firestore for authenticated users
- **Auto-detect**: Falls back to OS preference via `prefers-color-scheme: dark`

### Rules for Agents

1. **Every color class MUST have a `dark:` variant**:

   ```tsx
   // ✅ Correct — both light and dark
   <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">

   // ❌ Wrong — no dark mode support
   <div className="bg-white text-gray-900">
   ```

2. **Common color pairings** (follow existing patterns):

   | Light | Dark | Use for |
   |-------|------|---------|
   | `bg-white` | `dark:bg-gray-800` | Card backgrounds |
   | `bg-gray-50` | `dark:bg-gray-900` | Page backgrounds |
   | `text-gray-900` | `dark:text-white` | Primary text |
   | `text-gray-600` | `dark:text-gray-300` | Secondary text |
   | `text-gray-500` | `dark:text-gray-400` | Muted text |
   | `border-gray-200` | `dark:border-gray-700` | Borders |
   | `bg-blue-50` | `dark:bg-blue-900/20` | Info/highlight backgrounds |
   | `text-blue-600` | `dark:text-blue-400` | Links/accents |

3. **Opacity modifiers** — use `/20`, `/40`, etc. for translucent dark backgrounds:

   ```tsx
   <div className="bg-amber-50 dark:bg-amber-900/10">
   ```

4. **Hover states** need dark variants too:

   ```tsx
   <button className="hover:bg-gray-100 dark:hover:bg-gray-700">
   ```

---

## Responsive Design

### Approach

Mobile-first using Tailwind breakpoints. Start with mobile styles, add larger-screen overrides.

### Breakpoints

| Prefix | Min Width | Typical Use |
|--------|-----------|-------------|
| *(none)* | 0px | Mobile (default) |
| `sm:` | 640px | Large phones / small tablets |
| `md:` | 768px | Tablets / **main mobile↔desktop cutoff** |
| `lg:` | 1024px | Desktops |
| `xl:` | 1280px | Wide desktops |

### Rules for Agents

1. **Mobile-first** — write base styles for mobile, add `md:` / `lg:` for larger screens:

   ```tsx
   // ✅ Mobile-first
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

   // ❌ Desktop-first (wrong approach)
   <div className="grid grid-cols-3 sm:grid-cols-1">
   ```

2. **BottomNav awareness** — on mobile, a fixed bottom nav (`h-14`, 56px) sits at the bottom. Content containers need bottom padding to avoid overlap:

   ```tsx
   // Layout.tsx already handles this:
   <main className={`pb-20 md:pb-8`}>   // Extra padding on mobile
   <footer className="pb-20 md:pb-6">   // Footer clears BottomNav
   ```

3. **Show/hide by breakpoint** — use `hidden md:flex` pattern:

   ```tsx
   // Desktop nav (hidden on mobile)
   <nav className="hidden md:flex items-center space-x-4">

   // Mobile nav (hidden on desktop)
   <nav className="md:hidden fixed bottom-0">
   ```

4. **Responsive grids** — common patterns in the codebase:

   ```tsx
   // Weather forecast: 2 → 3 → 4 → 7 columns
   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">

   // Metrics: 2 → 4 columns
   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

   // Dashboard cards: 1 → 2 → 3 columns
   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
   ```

5. **Touch targets** — interactive elements should be at least 44×44px on mobile (use `p-3` or `min-h-[44px]`).

---

## Testing & Verification

### Local Verification (Run Before Pushing)

```bash
# 1. Build shared (required for per-package tests)
pnpm build:shared

# 2. Unit tests — all packages
pnpm test:run

# 3. Typecheck — all packages
pnpm typecheck:all

# 4. E2E tests (optional locally, but good practice)
pnpm test:e2e
```

### CI Pipeline (Runs Automatically on PR)

| Check | What It Does | Required? |
|-------|-------------|-----------|
| `ci` | Shared dep check → build shared → typecheck → unit tests | Yes |
| `e2e` | Full production build → Playwright browser tests | Yes |
| `e2e-emulator` | Full-stack Firebase emulator tests | No (extra confidence) |

Both `ci` and `e2e` must pass before merge is allowed. See [docs/cicd.md](./cicd.md) for details.

### Per-Package Testing

```bash
# Test a specific package
pnpm --filter @mycircle/bible-reader test:run
pnpm --filter @mycircle/weather-display test:run
pnpm --filter @mycircle/shell test:run
```

### Testing Gotchas for Agents

1. **`vi.fn()` is not a constructor** — `vi.fn(() => obj)` creates an arrow function that fails with `new`. Mock browser APIs (SpeechRecognition, AudioContext) with real classes:

   ```ts
   // ✅ Correct
   class MockSpeechRecognition {
     start = vi.fn();
     stop = vi.fn();
     onresult: ((e: any) => void) | null = null;
   }
   global.SpeechRecognition = MockSpeechRecognition;

   // ❌ Wrong — arrow functions can't be called with `new`
   global.SpeechRecognition = vi.fn(() => ({ start: vi.fn() }));
   ```

2. **`act()` for external callbacks** — callbacks from SpeechRecognition, AudioContext, etc. that trigger React state updates need `act()` wrapping:

   ```ts
   await act(async () => {
     mockRecognition.onresult?.({ results: [[{ transcript: 'hello' }]] });
   });
   ```

3. **Label matching with ` *`** — labels like `{t('key')} *` won't match `getByLabelText('key')`. Use role queries or `{ exact: false }`:

   ```ts
   screen.getByRole('textbox', { name: /city/i });
   ```

4. **Rebuild shared after i18n changes** — if you add translation keys, rebuild before running MFE tests:

   ```bash
   pnpm --filter @mycircle/shared build
   ```

5. **Delete e2e tests when removing features** — e2e tests live in the top-level `e2e/` directory, separate from component code. When deleting a feature, always search the whole repo (including `e2e/`) for references to the removed feature. Orphaned e2e tests cause persistent CI failures that are easy to miss.

6. **Always set `type="button"` on non-submit buttons** — HTML `<button>` elements without an explicit `type` attribute default to `type="submit"`, which can accidentally trigger form submissions. This is especially common inside or near `<form>` elements and causes subtle bugs in tests that look for submit buttons:

   ```tsx
   // ✅ Correct — explicit type prevents accidental form submission
   <button type="button" onClick={handleClose}>Close</button>
   <button type="button" onClick={() => setTab('signUp')}>Sign Up</button>
   <button type="submit">Submit Form</button>

   // ❌ Wrong — defaults to type="submit", may trigger form unexpectedly
   <button onClick={handleClose}>Close</button>
   ```

### If CI Fails

```bash
# View failed CI logs
gh run list
gh run view <run-id> --log-failed

# Common fixes
# TypeScript errors → pnpm typecheck:all
# Test failures    → pnpm test:run
# E2E failures     → pnpm test:e2e:headed  (debug visually)
# Shared mismatch  → use catalog: in package.json
```

---

## Checklist Template

Copy this checklist into your PR description when using an agent to implement features:

```markdown
## Agent Implementation Checklist

### i18n
- [ ] All user-visible strings use `t('key')` — no hardcoded English
- [ ] Translation keys added to `en`, `es`, and `zh` in `translations.ts`
- [ ] Key names follow `namespace.descriptiveName` convention
- [ ] Shared package rebuilt after adding keys (`pnpm build:shared`)

### Accessibility
- [ ] Semantic HTML used (nav, main, button, etc.)
- [ ] ARIA attributes added where semantic HTML isn't sufficient
- [ ] Form inputs have associated labels
- [ ] Interactive elements are keyboard-navigable
- [ ] Focus indicators visible (focus:ring-2 focus:ring-blue-500)

### Theme / Dark Mode
- [ ] Every color class has a `dark:` counterpart
- [ ] Hover/focus states have dark variants
- [ ] Tested visually in both light and dark mode

### Responsive
- [ ] Mobile-first approach (base → sm → md → lg)
- [ ] Content doesn't overlap with BottomNav on mobile
- [ ] Grid layouts adapt to screen size
- [ ] Touch targets ≥ 44px on mobile

### Testing
- [ ] Unit tests pass: `pnpm test:run`
- [ ] TypeScript compiles: `pnpm typecheck:all`
- [ ] CI passes: `ci` + `e2e` checks green
- [ ] New features have test coverage
```

---

## Example Agent Prompt

Use this as a starting template when asking an AI agent to implement a feature:

```
Implement [feature description] in the MyCircle project.

Requirements:
- Branch: feat/[feature-name]
- Follow existing code patterns in [relevant package]
- i18n: Add translation keys for en, es, zh in packages/shared/src/i18n/translations.ts
- a11y: Use semantic HTML, add aria attributes where needed
- Theme: All colors must have dark: variants (follow existing pairings)
- Responsive: Mobile-first, account for BottomNav (pb-20 on mobile)

Files to modify:
- [list specific files]

Verification:
1. pnpm --filter @mycircle/shared build
2. pnpm test:run
3. Commit with conventional commit message
4. Push and create PR: gh pr create
5. Wait for CI (ci + e2e) to pass
6. Merge: gh pr merge --squash
7. Sync: git checkout main && git pull origin main

Update README.md and docs/architecture.md if the feature adds new user-facing functionality.
```

---

## Quick Reference

```bash
# Full local validation (mirrors CI)
pnpm build:shared && pnpm typecheck:all && pnpm test:all && pnpm test:e2e

# Create PR
gh pr create --title "feat: description" --body "summary"

# Check PR status
gh pr checks

# Merge (after checks pass)
gh pr merge --squash

# Sync after merge
git checkout main && git pull origin main
```

---

## See Also

- [PR Lifecycle](./pr-lifecycle.md) — branch protection rules, merge workflow
- [CI/CD Pipeline](./cicd.md) — pipeline details, deploy workflow, troubleshooting
- [Architecture](./architecture.md) — MFE structure, data flow, persistence
- [MFE Guide](./mfe-guide.md) — pitfalls and lessons learned
- [API Keys](./api-keys.md) — external service configuration
