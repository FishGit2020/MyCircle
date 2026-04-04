# Screenshot Evidence Utility

Local-only Playwright script that captures full-page screenshots of every route in MyCircle.

## What It Does

`e2e/screenshots.spec.ts` navigates to all 33 routes and takes full-page PNG screenshots in two passes:

| Pass | Output Directory | Description |
|------|-----------------|-------------|
| Unauthenticated | `screenshots/unauthenticated/` | Auth-gated pages show "Sign in required" |
| Authenticated | `screenshots/authenticated/` | Logged in via real Firebase email/password |
| Login modal | `screenshots/login.png` | Auth modal overlay on dashboard |

**Total: 67 screenshots** (33 + 33 + 1)

## How to Run

```bash
# 1. Rebuild shared (if changed since last build)
pnpm build:shared

# 2. Start the dev server (or let Playwright auto-start it)
pnpm dev

# 3. Run the screenshot tests (single worker for reliability)
npx playwright test e2e/screenshots.spec.ts --workers=1
```

Screenshots appear in `MyCircle/screenshots/` (gitignored).

### Options

```bash
# Headed mode (watch the browser)
npx playwright test e2e/screenshots.spec.ts --workers=1 --headed

# Only unauthenticated
npx playwright test e2e/screenshots.spec.ts -g "unauthenticated" --workers=1

# Only authenticated (also matches "unauthenticated" — runs both)
npx playwright test e2e/screenshots.spec.ts --workers=1
```

## Pages Captured (33 routes)

| Group | Pages |
|-------|-------|
| Dashboard | `/` |
| Daily | `/weather`, `/stocks`, `/podcasts`, `/radio`, `/transit`, `/deals` |
| Faith | `/bible`, `/worship` |
| Family | `/baby`, `/child-dev`, `/immigration`, `/family-games`, `/polls` |
| Learning | `/flashcards`, `/ai`, `/interview`, `/benchmark` |
| Workspace | `/notebook`, `/files`, `/library`, `/daily-log`, `/doc-scanner`, `/trips`, `/web-crawler`, `/resume` |
| Outdoor | `/hiking`, `/travel-map` |
| Other | `/whats-new`, `/privacy`, `/terms`, `/quota`, `/trash` |

## CI Exclusion

The test is excluded from CI via `testIgnore` in `playwright.config.ts`:

```ts
testIgnore: ['**/integration/**', '**/emulator/**', '**/smoke/**', '**/screenshots*'],
```

This is intentionally local-only — it requires a running dev server with all MFEs built and real Firebase credentials for the authenticated pass.

## Authentication

- **Unauthenticated pass**: Uses `__e2eAuthCallback` to quickly resolve Firebase auth with null user. Public pages render normally; auth-gated pages show the sign-in prompt.
- **Authenticated pass**: Lets real Firebase auth initialize, clicks the "Sign In" button in the desktop header, fills email/password via the AuthModal (`#auth-email`, `#auth-password`), and submits. After login, navigates all routes.
- **Credentials**: Stored in the test file — uses a test account. Update `test@123.com` / `test123` if the test account changes.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Blank white screenshots | Run `pnpm build:shared` — stale shared dist causes `COLLECT_QUOTA_SNAPSHOT` export error |
| `networkidle` timeout | The script uses `waitUntil: 'load'` + 3s settle instead of `networkidle` (Vite HMR keeps connections open) |
| "Sign In" button not found | The script uses `.last()` to target the desktop header button (mobile header button has `md:hidden`) |
| Auth test hangs | Firebase auth needs network access to resolve. Ensure you're not behind a restrictive firewall |

## Use Cases

- **Design review**: Send screenshots to designers for redesign (e.g., Google Stitch)
- **Regression evidence**: Before/after visual comparison when making UI changes
- **Documentation**: Feature inventory for stakeholders
- **Accessibility audit**: Visual review of all pages for a11y issues
