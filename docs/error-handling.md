# Error Handling & Monitoring

MyCircle uses a layered error handling strategy across client-side (browser), server-side (Cloud Functions), and CI/CD (GitHub Actions).

---

## Error Monitoring Stack

| Layer | Tool | What it catches | Where to look |
|-------|------|----------------|---------------|
| **Client-side JS errors** | [Sentry](https://sentry.io) (`@sentry/react`) | React crashes, unhandled exceptions, promise rejections | Sentry dashboard → Issues |
| **Client-side performance** | Google Analytics (Web Vitals) | LCP, CLS, INP, FCP, TTFB regressions | GA4 → Web Vitals dashboard |
| **Server-side errors** | Google Cloud Logging | Cloud Function errors, Firestore rule denials, deploy failures | Cloud Console → Logging → `severity="ERROR"` |
| **MFE load performance** | Firebase Performance (custom traces) | Slow micro-frontend chunk loads | Firebase Console → Performance → Custom traces |
| **CI/CD failures** | GitHub Actions | Build, test, deploy failures | GitHub → Actions tab |

### Key Insight: Client errors do NOT appear in Cloud Logging

Google Cloud Logging only captures **server-side** logs (Cloud Functions, Firestore rules). JavaScript errors that happen in the user's browser (React crashes, `SyntaxError`, hooks violations) are **invisible** to Cloud Logging because Firebase Hosting is a static CDN — there's no server processing user requests.

**Sentry** is the only tool that captures client-side errors. It works by injecting an SDK into the app bundle that hooks into `window.onerror`, `componentDidCatch`, and `unhandledrejection`.

---

## Client-Side Error Handling

### ErrorBoundary (React)

Every MFE route is wrapped in an `ErrorBoundary` + `Suspense`:

```tsx
// App.tsx
<ErrorBoundary fallback={<NotebookFallback />}>
  <Suspense fallback={<Loading />}>
    <NotebookMF />
  </Suspense>
</ErrorBoundary>
```

**Behavior:**
- `Suspense` shows `<Loading />` while the lazy MFE chunk downloads
- If the MFE throws during render, `ErrorBoundary` catches it and shows the fallback
- `ErrorBoundary.tsx` calls `Sentry.captureException()` with the React component stack
- The error is reported to Sentry with `handled: true`
- The error does **NOT** appear in the browser console (React swallows it)

### Self-Healing Stale Chunks

When a deploy changes chunk filenames, users with stale SW caches may try to load old chunks that no longer exist. The self-healing script in `index.html` catches these:

```js
// index.html
var STALE_RE = /Loading chunk|Failed to fetch dynamically imported module|Unexpected token '<'/i;
window.addEventListener('error', function(e) {
  if (e.message && STALE_RE.test(e.message)) selfHeal();
});
```

`selfHeal()` clears all caches, unregisters the SW, and reloads. A `sessionStorage` guard prevents infinite loops.

### Sentry Configuration

Initialized in `main.tsx` before `createRoot()`:

```typescript
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,  // 10% of sessions
  replaysOnErrorSampleRate: 1.0,  // 100% on error
});
```

### Unified Logger

All client-side logging uses `createLogger('namespace')` from `@mycircle/shared` (not raw `console.*`). In production, `console.*` is stripped by esbuild. The logger is a no-op in production builds but logs to console in development.

---

## Server-Side Error Handling

### Cloud Functions

All Firebase Cloud Functions use `firebase-functions/logger`:

```typescript
import { logger } from 'firebase-functions';
logger.error('Stock proxy error', { path, error: err.message });
```

These appear in **Google Cloud Logging** → filter by `severity="ERROR"`.

### Rate Limiting

Per-IP rate limiters prevent abuse:
- AI chat: 10 req/min
- Stock/Podcast proxies: 60 req/min

Rate-limited requests return HTTP 429.

---

## Common Error Patterns & Lessons Learned

### 1. MFE index.html Conflicts with SPA Routing

**Symptom:** Hard refresh on `/notebook/` shows blank page with `SyntaxError: Unexpected token '<'`.

**Cause:** MFE Vite builds produce `index.html` files. When copied to `dist/firebase/{mfe}/index.html`, Firebase Hosting serves them as directory index matches — overriding the SPA rewrite rule.

**Fix:** The assemble script (`scripts/assemble-firebase.mjs`) deletes all MFE `index.html` files after copying. Only the shell's root `index.html` should exist.

**Prevention:** The assemble script handles this automatically. If adding a new MFE, add it to the `mfeDirs` array in the cleanup section.

### 2. React Hooks Order Violations in Federated MFEs

**Symptom:** Sentry reports "Rendered more hooks than during the previous render" with `handled: true`. ErrorBoundary shows fallback UI. No console error visible.

**Cause:** Hooks (`useCallback`, `useEffect`, etc.) placed after conditional early returns. When the condition changes, React sees different hook counts.

**Fix:** Always place ALL hooks above ALL early returns in React components.

**Why no console error:** ErrorBoundary catches the error and renders fallback UI. Sentry's React integration reports it via `componentDidCatch`, but React prevents it from reaching `window.onerror`.

### 3. useTransition in Federated MFEs

**Symptom:** MFE module crashes on load — ErrorBoundary shows fallback.

**Cause:** `useTransition` hook imported via `const { useTransition } = await importShared("react")` can be `undefined` if the shared React singleton doesn't export it reliably in the federation context.

**Safe alternative:** Use `startTransition` (module-level function, not a hook):

```typescript
// SAFE in federated MFEs
import { startTransition } from 'react';
startTransition(() => { setState(newData); });

// UNSAFE in federated MFEs — may crash
const [isPending, startTransition] = useTransition();
```

### 4. modulePreload and Module Federation

**Symptom:** ALL MFE routes show "module is loading" — federation imports silently fail.

**Cause:** `modulePreload: { polyfill: false }` in the shell's Vite config injects `<link rel="modulepreload">` tags that can interfere with Module Federation's dynamic `import()` resolution.

**Current config:** Shell uses `modulePreload: { polyfill: false }` (safe after removing MFE `index.html` files). MFE packages use `modulePreload: false`.

**Note:** If MFE loading breaks again, check if modulePreload was changed.

### 5. Firebase Auth Check in MFEs

**Symptom:** Notebook/CloudFiles show infinite loading spinner for unauthenticated users.

**Cause:** `typeof window.__getFirebaseIdToken === 'function'` returns `true` even when no user is logged in (the function exists but returns `null`). The Firestore `subscribe()` callback never fires for unauthenticated users, so `setLoading(false)` is never called.

**Fix:** Check actual auth token, not just function existence:

```typescript
const [isAuthenticated, setIsAuthenticated] = useState(false);
useEffect(() => {
  const checkAuth = async () => {
    const token = await window.__getFirebaseIdToken?.();
    setIsAuthenticated(!!token);
  };
  checkAuth();
  window.addEventListener(WindowEvents.AUTH_STATE_CHANGED, checkAuth);
  return () => window.removeEventListener(WindowEvents.AUTH_STATE_CHANGED, checkAuth);
}, []);
```

Plus a safety timeout on Firestore subscriptions:

```typescript
const timeout = setTimeout(() => {
  if (!received) setLoading(false);
}, 3000);
```

### 6. Deploy Failures — esbuild Binary Mismatch

**Symptom:** `npm ci` in Cloud Functions predeploy fails with `Expected "0.27.3" but got "0.27.2"`.

**Cause:** `esbuild` (transitive dep via `vitest` → `vite`) has a post-install script that downloads a platform-specific binary. CI runners can have a cached stale binary.

**Fix:** Use `--ignore-scripts` in the predeploy command. `tsc` doesn't need esbuild.

```json
"predeploy": [
  "cd \"$RESOURCE_DIR\" && rm -rf node_modules && npm ci --ignore-scripts && npx tsc"
]
```

### 7. Cloud Build Package Manager Confusion

**Symptom:** `ERR_PNPM_OUTDATED_LOCKFILE` during Cloud Functions deploy.

**Cause:** Cloud Build detects the root `pnpm-lock.yaml` and tries to use pnpm for `functions/`, which uses npm.

**Fix:** Set `"packageManager": "npm"` in `firebase.json` functions config.

---

## Monitoring Checklist

After deploying, check:

1. **Sentry** — any new issues in the last hour? Filter by latest release.
2. **Deploy workflow** — did it succeed? Check `gh run list --workflow=deploy.yml`.
3. **Smoke test** — the deploy workflow includes a `curl` check for HTTP 200.
4. **Cloud Logging** — any new `severity="ERROR"` entries from Cloud Functions?

For production incidents:
1. Check **Sentry** first — client-side errors with session replay
2. Check **Cloud Logging** — server-side errors with structured metadata
3. Check **GitHub Actions** — recent deploy failures
4. Check **Firebase Console** — Firestore rules audit log, Performance traces
