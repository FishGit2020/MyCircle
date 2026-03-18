<!--
  Sync Impact Report
  Version change: 0.0.0 (template) → 1.0.0 (initial ratification)
  Added principles:
    - I. Federated Isolation
    - II. Complete Integration
    - III. GraphQL-First Data Layer
    - IV. Inclusive by Default
    - V. Fast Tests, Safe Code
    - VI. Simplicity
  Added sections:
    - Technology Stack
    - Development Workflow
  Removed sections: none (template placeholders replaced)
  Templates requiring updates:
    - plan-template.md: ✅ no changes needed (Constitution Check section is generic)
    - spec-template.md: ✅ no changes needed (mandatory sections align)
    - tasks-template.md: ✅ no changes needed (phase structure compatible)
  Follow-up TODOs: none
-->

# MyCircle Constitution

## Core Principles

### I. Federated Isolation

Every micro-frontend (MFE) MUST be independently buildable, testable, and deployable.
MFEs MUST NOT import directly from `@apollo/client` or other shared singletons;
all shared hooks, types, and utilities MUST be consumed through `@mycircle/shared`.
Direct singleton imports break Module Federation at runtime and are treated as
blocking defects.

### II. Complete Integration

Adding or removing an MFE MUST update ALL integration points defined in the
project checklist (20+ touchpoints: shell routes, nav, widgets, command palette,
breadcrumbs, i18n keys in all 3 locales, Dockerfile, dev scripts, Tailwind
content paths, vitest aliases, e2e tests, AI tool registry, docs, and spec file).
Partial integration is treated as an incomplete deliverable. The `validate_all`
MCP tool MUST pass before a feature is considered ready for review.

### III. GraphQL-First Data Layer

All MFE data operations (queries, mutations) MUST go through the existing Apollo
GraphQL service (`useQuery`/`useMutation` from `@mycircle/shared`). Never add a
new REST endpoint for MFE feature data — extend the GraphQL schema instead.
Schema changes in `functions/src/schema.ts` MUST be followed by `pnpm codegen`
to regenerate types. New resolvers MUST follow the existing factory pattern
(`createXxxQueryResolvers()` / `createXxxMutationResolvers()`).

**REST is only acceptable for**:
- Third-party APIs that do not offer a GraphQL interface
- Firebase admin/infrastructure operations (e.g. `firebase.json` rewrites, secret management)
- One-off scripts and tooling that run outside the MFE runtime (e.g. seed scripts, CI tools)

Any REST usage inside an MFE or Cloud Function that serves MFE data is a
blocking violation and MUST be justified in the plan's Complexity Tracking table.

### IV. Inclusive by Default

Every visible string MUST use `t('key')` with keys present in all 3 locale files
(en, es, zh). Every Tailwind color class MUST have a `dark:` variant. UI MUST use
semantic HTML, `aria-label` where needed, `type="button"` on non-submit buttons,
and touch targets of at least 44px. Layout MUST be mobile-first (`md:` as the main
breakpoint) using `<PageContent>` from shared.

### V. Fast Tests, Safe Code

Unit tests MUST complete in milliseconds — mock all network calls, timers, and
async side effects. Per-test assertion timeouts MUST NOT exceed 5000ms. `userEvent`
MUST use `{ delay: null }`. Server-side URL fetchers MUST block private/internal
network addresses (SSRF protection). User-supplied content MUST be sanitized before
display. Firebase secrets MUST use `printf`, never `echo`.

### VI. Simplicity

Start with the minimum viable solution. Do not add features, abstractions, or
configurability beyond what is explicitly requested. Three similar lines of code
are preferable to a premature abstraction. Error handling and validation are
required only at system boundaries (user input, external APIs). Complexity MUST be
justified in the plan's Complexity Tracking table if it exceeds a straightforward
implementation.

## Technology Stack

- **Monorepo**: pnpm workspaces, Vite Module Federation
- **Frontend**: React 18, TypeScript, Tailwind CSS, Apollo Client
- **Backend**: Firebase Cloud Functions, Apollo Server (GraphQL), Firestore
- **Testing**: Vitest, React Testing Library
- **CI/CD**: GitHub Actions, Docker, Firebase Hosting
- **Mobile**: MyCircleNative (Expo SDK 54, React Native, NativeWind)
- **i18n**: Code-split locales (en sync, es/zh lazy-loaded)

Stack changes (adding/removing a major dependency) require a constitution
amendment with MINOR version bump.

## Development Workflow

- **Branching**: Feature branches with prefixes (`feat/`, `fix/`, `docs/`,
  `refactor/`, `test/`). Never commit directly to main.
- **Commits**: Conventional Commits, imperative mood, under 72 characters.
- **PR lifecycle**: Branch, implement, `pnpm build:shared && pnpm lint &&
  pnpm test:run && pnpm typecheck`, push, create PR, wait for ALL checks
  (`ci`, `e2e-gate`, `spec-check`) to pass, squash-merge. All four commands
  MUST pass locally before pushing — lint failures in CI are avoidable.
  After merge, delete the local branch: `git checkout main && git pull origin main && git branch -d <branch>`.
  The remote branch is deleted automatically by GitHub (`delete_branch_on_merge: true`).
- **New MFE gate**: `spec-check` CI job blocks merge if
  `docs/specs/NNN-<mfe-name>/spec.md` is missing.
- **functions/ backend**: Separate strict tsconfig (`noUnusedLocals: true`).
  Always verify with `cd functions && npx tsc --noEmit` before pushing.

## Governance

This constitution is the authoritative source for project-level non-negotiable
rules. All PRs and code reviews MUST verify compliance with the principles above.
Violations MUST be justified in the plan's Complexity Tracking table and approved
by the project owner before merge.

Amendments follow semantic versioning:
- **MAJOR**: Removing or redefining a principle.
- **MINOR**: Adding a principle or materially expanding guidance.
- **PATCH**: Clarifications, wording fixes, non-semantic refinements.

Amendments require updating this file, incrementing the version, and verifying
that dependent templates (plan, spec, tasks) remain aligned.

**Version**: 1.0.2 | **Ratified**: 2026-03-17 | **Last Amended**: 2026-03-18
