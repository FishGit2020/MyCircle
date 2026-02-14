# CI/CD Pipeline

MyCircle uses **GitHub Actions** for continuous integration, end-to-end testing, and deployment. All workflows live in `.github/workflows/`.

---

## Pipeline Overview

```
  PR opened to main
       │
       ├──► CI  (ci.yml)               ✅ Required   ⬚ Skipped if only docs changed
       │     ├─ pnpm install --frozen-lockfile
       │     ├─ Check shared dependency versions
       │     ├─ Build shared package (dist/)
       │     ├─ Typecheck all packages
       │     └─ Unit tests (root + all MFEs)
       │
       ├──► E2E  (e2e.yml → e2e job)   ✅ Required   ⬚ Skipped if only docs changed
       │     ├─ Build full app (firebase:build)
       │     ├─ Serve dist/firebase/ via express.static
       │     └─ Playwright E2E tests (browser-mocked)
       │
       └──► E2E Emulator (e2e.yml → e2e-emulator job)   ⚪ Optional
             ├─ Build full app + setup Java
             ├─ Start mock API server + Firebase emulators
             ├─ Seed Firestore emulator
             └─ Playwright E2E tests (full-stack, no browser mocks)

  Both CI + E2E pass → PR can be merged (squash)

  PR merged → push to main                       ⬚ Skipped if only docs/tests changed
       │
       └──► Deploy  (deploy.yml)
             ├─ pnpm install --frozen-lockfile
             ├─ Build (shared → MFEs → shell → functions → assemble)
             │    └─ VITE_FIREBASE_* secrets injected as env vars
             ├─ Authenticate via Workload Identity Federation
             ├─ Deploy Hosting (hosting-first for faster rollouts)
             ├─ Deploy Functions + Firestore rules
             └─ Smoke test (HTTP 200 check)
```

> **Branch protection:** `main` requires `ci` and `e2e` checks to pass before merge. Admin bypass is disabled. See [docs/pr-lifecycle.md](./pr-lifecycle.md) for full PR workflow details.

---

## Path Filters

All three workflow types (CI, E2E, Deploy) skip when a push only changes non-app files:

```yaml
# Common to CI, E2E, and Deploy
paths-ignore:
  - '**.md'
  - 'docs/**'
  - 'LICENSE'
  - '.gitignore'
  - '.vscode/**'

# Deploy also skips for test-only infrastructure
  - '.env.emulator'
  - 'e2e/**'
  - 'playwright*.config.ts'
  - 'scripts/mock-api-server.mjs'
  - 'scripts/seed-firestore.mjs'
```

If a push touches both docs and code, the workflows still run.

---

## Workflows

### CI — `.github/workflows/ci.yml`

**Trigger:** Pull request to `main` (code changes only)

| Step | Command | Purpose |
|------|---------|---------|
| Checkout | `actions/checkout@v4` | Clone the repo |
| Setup pnpm | `pnpm/action-setup@v4` | Install pnpm |
| Setup Node | `actions/setup-node@v4` (Node 22, pnpm cache) | Install Node.js with dependency caching |
| Install | `pnpm install --frozen-lockfile` | Reproducible installs |
| **Shared dep check** | `node scripts/check-shared-versions.mjs` | Fail if any MFE has a mismatched version of react, react-dom, react-router, @apollo/client, or graphql |
| **Build shared** | `pnpm build:shared` | Compile `@mycircle/shared` to `dist/` — required by per-package test runners |
| Typecheck | `pnpm typecheck:all` | TypeScript type checking across all packages |
| Unit tests | `pnpm test:all` | Vitest — root + all MFE packages |

> **Why build shared?** Per-package `test:run` scripts resolve `@mycircle/shared` via its `package.json` exports which point to `./dist/index.js`. Without this step, all tests that import from `@mycircle/shared` fail with "Failed to resolve entry for package".

Concurrency: only one CI run per PR branch (previous runs cancelled).

### E2E Tests — `.github/workflows/e2e.yml`

**Trigger:** Pull request to `main` (code changes only)

This workflow runs two parallel jobs:

#### Job: `e2e` (required check)

| Step | Command | Purpose |
|------|---------|---------|
| Checkout + Setup | Same as CI | — |
| Cache browsers | `actions/cache@v4` | Cache `~/.cache/ms-playwright` to avoid re-downloading ~400MB |
| Playwright browsers | `npx playwright install --with-deps` | Install browsers (skipped if cache hit) |
| Build | `pnpm firebase:build` | Full production build + assembly into `dist/firebase/` |
| E2E tests | `pnpm test:e2e` | Playwright tests against static production build |
| Upload report | `actions/upload-artifact@v4` | Upload Playwright HTML report + traces on failure (14-day retention) |

> **CI vs local:** In CI, Playwright starts `pnpm start:static` (serves `dist/firebase/` via Express on port 3000). Locally, it starts `pnpm dev` (all MFE dev servers). This is controlled by `process.env.CI` in `playwright.config.ts`. All API calls are mocked at the browser level via `page.route()`.

#### Job: `e2e-emulator` (optional check)

| Step | Command | Purpose |
|------|---------|---------|
| Checkout + Setup | Same as CI | — |
| Setup Java | `actions/setup-java@v4` (Temurin 21) | Required by Firebase emulators |
| Playwright browsers | `npx playwright install --with-deps chromium` | Install Chromium only |
| Build | `pnpm firebase:build` | Full production build |
| Emulator tests | `pnpm emulator:test` | Starts mock API server + Firebase emulators, seeds Firestore, runs Playwright |
| Upload report | `actions/upload-artifact@v4` | Upload Playwright HTML report (14-day retention) |

> **Full-stack testing:** Unlike the mocked `e2e` job, emulator tests make real requests through the full chain: Browser → Hosting Emulator → Functions Emulator → Mock API Server. No browser-level mocking.

Concurrency: only one E2E run per PR branch.

### Deploy — `.github/workflows/deploy.yml`

**Trigger:** Push to `main` (i.e., merged PR) — skipped if only docs/tests changed

| Step | Command | Purpose |
|------|---------|---------|
| Checkout + Setup | Same as CI | — |
| Build | `pnpm firebase:build` | Build shared → MFEs → Cloud Functions → assemble |
| | *(with `VITE_FIREBASE_*` env vars from GitHub secrets)* | Vite embeds these at build time for Firebase client config |
| Authenticate | `google-github-actions/auth@v2` | Keyless auth via Workload Identity Federation |
| Deploy Hosting | `npx firebase-tools deploy --only hosting` | Deploy static assets to Firebase Hosting (runs first) |
| Deploy Functions + Firestore | `npx firebase-tools deploy --only functions,firestore` | Deploy Cloud Functions + Firestore rules |
| Smoke test | `curl` health check | Verify deployed site returns HTTP 200 |

#### Authentication

The deploy workflow uses **Workload Identity Federation** (keyless) instead of a service account JSON key:

```yaml
- uses: google-github-actions/auth@v2
  with:
    workload_identity_provider: 'projects/<PROJECT_NUMBER>/locations/global/workloadIdentityPools/github-actions/providers/github'
    service_account: 'firebase-adminsdk-fbsvc@mycircle-dash.iam.gserviceaccount.com'
```

See [docs/workload-identity-federation-setup.md](./workload-identity-federation-setup.md) for the full setup guide.

#### Required GitHub Secrets

The build step needs `VITE_*` secrets so Vite can embed Firebase client config at build time:

| Secret | Example | Purpose |
|--------|---------|---------|
| `VITE_FIREBASE_API_KEY` | `AIzaSy...` | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `mycircle-dash.firebaseapp.com` | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | `mycircle-dash` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | `mycircle-dash.firebasestorage.app` | Cloud Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `441498720264` | FCM sender ID |
| `VITE_FIREBASE_APP_ID` | `1:441498...` | Firebase App ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-3TTECZHFDV` | Google Analytics ID |
| `VITE_FIREBASE_VAPID_KEY` | `BG0dnBc...` | FCM VAPID key for push notifications |

> **Why secrets?** These values are client-side (visible in the deployed JS bundle), but storing them as secrets keeps them out of the repo and makes rotation easy. Set them via `gh secret set <NAME> --body "<VALUE>"`.

---

## Shared Dependency Version Safety

The CI pipeline includes a dedicated check to prevent Module Federation version drift:

1. **pnpm catalogs** — All packages reference shared dependencies via `catalog:` in their `package.json`. The actual versions are defined once in `pnpm-workspace.yaml`.
2. **CI check script** — `scripts/check-shared-versions.mjs` scans every `packages/*/package.json` and exits with code 1 if any shared dependency has a different version specifier.
3. **Singleton enforcement** — Every `vite.config.ts` declares `singleton: true` and `requiredVersion` for shared dependencies. The federation runtime will error at build/load time instead of silently loading duplicate copies.

---

## Running CI Checks Locally

Before pushing a PR, you can run the same checks locally:

```bash
# Build shared (required before per-package tests)
pnpm build:shared

# Shared dependency version check
node scripts/check-shared-versions.mjs

# Typecheck all packages
pnpm typecheck:all

# Unit tests (root + all MFEs)
pnpm test:all

# E2E tests (starts dev server automatically)
pnpm test:e2e

# E2E with visible browser
pnpm test:e2e:headed

# Emulator E2E tests (full-stack, requires Java for Firebase emulators)
pnpm emulator:test
```

---

## Setting Up CI/CD

### Prerequisites

- A GitHub repository with the MyCircle codebase
- A Firebase project on the Blaze plan
- Workload Identity Federation configured (see [setup guide](./workload-identity-federation-setup.md))

### Step 1 — Workload Identity Federation

Follow the [Workload Identity Federation setup guide](./workload-identity-federation-setup.md) to enable keyless deployment from GitHub Actions. This replaces the need for a `FIREBASE_SERVICE_ACCOUNT` secret.

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
firebase functions:secrets:set YOUVERSION_APP_KEY
```

- [Firebase Functions secrets](https://firebase.google.com/docs/functions/config-env#secret-manager)

### Step 4 — Enable Workflows

The workflows activate automatically when `.github/workflows/*.yml` files are pushed. No additional configuration is needed — GitHub Actions is enabled by default on public repos.

For private repos, ensure **Actions** is enabled under **Settings → Actions → General**.

---

## Deploy Troubleshooting

### Common IAM Permission Errors

The deploy workflow authenticates via Workload Identity Federation as `firebase-adminsdk-fbsvc@mycircle-dash.iam.gserviceaccount.com`. This service account requires specific IAM roles to deploy all resources. Missing roles cause 403 errors during the deploy step.

| Error | Missing Role | Fix |
|-------|-------------|-----|
| `cloudscheduler.jobs.update` denied | **Cloud Scheduler Admin** (`roles/cloudscheduler.admin`) | Required for scheduled functions like `checkWeatherAlerts` |
| `secretmanager.versions.get` denied | **Secret Manager Viewer** (`roles/secretmanager.viewer`) | Required to validate function secrets during deploy |
| `iam.serviceAccounts.ActAs` denied | **Service Account User** (`roles/iam.serviceAccountUser`) | Required to deploy Cloud Functions (must be project-level) |
| `firebaserules.googleapis.com` 403 | **Firebase Admin** (`roles/firebase.admin`) | Required to compile and deploy Firestore rules |

To add a missing role:

```bash
SA="firebase-adminsdk-fbsvc@mycircle-dash.iam.gserviceaccount.com"
gcloud projects add-iam-policy-binding mycircle-dash \
  --member="serviceAccount:$SA" --role="roles/<missing-role>"
```

> **Note:** IAM changes can take up to 7 minutes to propagate. If a deploy fails after adding a role, wait and re-run the workflow.

For the full list of required IAM roles and detailed troubleshooting, see [docs/workload-identity-federation-setup.md](./workload-identity-federation-setup.md#required-iam-roles-for-the-service-account).

### Local Deploy Fallback

If the GitHub Actions deploy fails due to IAM issues, you can deploy locally using your personal Firebase credentials (which typically have Owner access):

```bash
# Full deploy (build + hosting + functions + firestore)
pnpm firebase:deploy

# Or deploy only functions
pnpm firebase:deploy:functions
```

---

## Useful Links

| Resource | URL |
|----------|-----|
| **PR Lifecycle & Branch Protection** | [docs/pr-lifecycle.md](./pr-lifecycle.md) |
| GitHub Actions docs | https://docs.github.com/en/actions |
| pnpm/action-setup | https://github.com/pnpm/action-setup |
| actions/setup-node | https://github.com/actions/setup-node |
| FirebaseExtended/action-hosting-deploy | https://github.com/FirebaseExtended/action-hosting-deploy |
| google-github-actions/auth | https://github.com/google-github-actions/auth |
| Firebase Hosting docs | https://firebase.google.com/docs/hosting |
| Firebase Functions secrets | https://firebase.google.com/docs/functions/config-env |
| Playwright CI docs | https://playwright.dev/docs/ci-intro |
| Vite Module Federation | https://github.com/nicedoc/vite-plugin-federation |
| pnpm catalogs | https://pnpm.io/catalogs |
