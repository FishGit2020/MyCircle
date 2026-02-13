# CI/CD Pipeline

MyCircle uses **GitHub Actions** for continuous integration, end-to-end testing, and deployment. All workflows live in `.github/workflows/`.

---

## Pipeline Overview

```
  PR opened to main
       │
       ├──► CI  (ci.yml)
       │     ├─ pnpm install --frozen-lockfile
       │     ├─ Check shared dependency versions
       │     ├─ Typecheck all packages
       │     └─ Unit tests (root + all MFEs)
       │
       └──► E2E  (e2e.yml)
             ├─ pnpm install --frozen-lockfile
             ├─ Install Playwright browsers
             ├─ Build full app
             └─ Run Playwright E2E tests

  PR merged → push to main
       │
       └──► Deploy  (deploy.yml)
             ├─ pnpm install --frozen-lockfile
             ├─ Build (shared → MFEs → shell → functions → assemble)
             └─ Deploy to Firebase Hosting (live channel)
```

---

## Workflows

### CI — `.github/workflows/ci.yml`

**Trigger:** Pull request to `main`

| Step | Command | Purpose |
|------|---------|---------|
| Checkout | `actions/checkout@v4` | Clone the repo |
| Setup pnpm | `pnpm/action-setup@v4` (v9) | Install pnpm |
| Setup Node | `actions/setup-node@v4` (Node 22, pnpm cache) | Install Node.js with dependency caching |
| Install | `pnpm install --frozen-lockfile` | Reproducible installs |
| **Shared dep check** | `node scripts/check-shared-versions.mjs` | Fail if any MFE has a mismatched version of react, react-dom, react-router, @apollo/client, or graphql |
| Typecheck | `pnpm typecheck:all` | TypeScript type checking across all packages |
| Unit tests | `pnpm test:all` | Vitest — root + all MFE packages |

Concurrency: only one CI run per PR branch (previous runs cancelled).

### E2E Tests — `.github/workflows/e2e.yml`

**Trigger:** Pull request to `main`

| Step | Command | Purpose |
|------|---------|---------|
| Checkout + Setup | Same as CI | — |
| Playwright browsers | `npx playwright install --with-deps` | Install Chromium/Firefox/WebKit |
| Build | `pnpm build` | Full production build of all MFEs |
| E2E tests | `pnpm test:e2e` | Playwright tests against the built app |

Concurrency: only one E2E run per PR branch.

### Deploy — `.github/workflows/deploy.yml`

**Trigger:** Push to `main` (i.e., merged PR)

| Step | Command | Purpose |
|------|---------|---------|
| Checkout + Setup | Same as CI | — |
| Build | `pnpm firebase:build` | Build shared → MFEs → Cloud Functions → assemble |
| Deploy | `FirebaseExtended/action-hosting-deploy@v0` | Deploy to Firebase Hosting live channel |

Uses the `FIREBASE_SERVICE_ACCOUNT` repository secret for authentication.

---

## Shared Dependency Version Safety

The CI pipeline includes a dedicated check to prevent Module Federation version drift:

1. **pnpm catalogs** — All packages reference shared dependencies via `catalog:` in their `package.json`. The actual versions are defined once in `pnpm-workspace.yaml`.
2. **CI check script** — `scripts/check-shared-versions.mjs` scans every `packages/*/package.json` and exits with code 1 if any shared dependency has a different version specifier.
3. **Singleton enforcement** — Every `vite.config.ts` declares `singleton: true` and `requiredVersion` for shared dependencies. The federation runtime will error at build/load time instead of silently loading duplicate copies.

---

## Setting Up CI/CD

### Prerequisites

- A GitHub repository with the MyCircle codebase
- A Firebase project on the Blaze plan
- A Firebase service account key (JSON)

### Step 1 — Repository Secrets

Go to **Settings → Secrets and variables → Actions** in your GitHub repo and add:

| Secret | Value | Docs |
|--------|-------|------|
| `FIREBASE_SERVICE_ACCOUNT` | Firebase service account JSON key | [Firebase CI setup](https://github.com/FirebaseExtended/action-hosting-deploy#setup) |

The `GITHUB_TOKEN` is provided automatically by GitHub Actions.

### Step 2 — Firebase Hosting Setup

If you haven't already:

```bash
firebase login
firebase init hosting     # Select your project, set public dir to "dist"
firebase init functions   # Select TypeScript
```

Or use the existing `firebase.json` in the repo.

- [Firebase Hosting docs](https://firebase.google.com/docs/hosting)
- [Firebase CLI reference](https://firebase.google.com/docs/cli)

### Step 3 — Cloud Function Secrets

Set API keys used by Cloud Functions:

```bash
firebase functions:secrets:set OPENWEATHER_API_KEY
firebase functions:secrets:set FINNHUB_API_KEY
firebase functions:secrets:set PODCASTINDEX_API_KEY
firebase functions:secrets:set PODCASTINDEX_API_SECRET
firebase functions:secrets:set GEMINI_API_KEY
```

- [Firebase Functions secrets](https://firebase.google.com/docs/functions/config-env#secret-manager)

### Step 4 — Enable Workflows

The workflows activate automatically when `.github/workflows/*.yml` files are pushed. No additional configuration is needed — GitHub Actions is enabled by default on public repos.

For private repos, ensure **Actions** is enabled under **Settings → Actions → General**.

---

## Useful Links

| Resource | URL |
|----------|-----|
| GitHub Actions docs | https://docs.github.com/en/actions |
| pnpm/action-setup | https://github.com/pnpm/action-setup |
| actions/setup-node | https://github.com/actions/setup-node |
| FirebaseExtended/action-hosting-deploy | https://github.com/FirebaseExtended/action-hosting-deploy |
| Firebase Hosting docs | https://firebase.google.com/docs/hosting |
| Firebase Functions secrets | https://firebase.google.com/docs/functions/config-env |
| Playwright CI docs | https://playwright.dev/docs/ci-intro |
| Vite Module Federation | https://github.com/nicedoc/vite-plugin-federation |
| pnpm catalogs | https://pnpm.io/catalogs |
