# Removing mycircledash.com Domain Dependency

This document covers every place the `mycircledash.com` custom domain is referenced and what needs to change if you stop using it. The Firebase project `mycircle-dash` and its default domains (`mycircle-dash.web.app`, `mycircle-dash.firebaseapp.com`) are separate from the custom domain and can remain as-is.

---

## What is the current setup?

```
User browser
  |
  ├── mycircledash.com ──► Cloudflare DNS ──► Firebase Hosting (mycircle-dash.web.app)
  |
  └── ollama.mycircledash.com ──► Cloudflare Tunnel + Access ──► Self-hosted Ollama server
```

- **Cloudflare** manages DNS for `mycircledash.com`, proxies traffic to Firebase Hosting, and runs a Cloudflare Tunnel for the `ollama` subdomain
- **Firebase Hosting** has `mycircledash.com` configured as a custom domain
- **reCAPTCHA Enterprise** has `mycircledash.com` registered as an allowed domain
- **Cloudflare Access** protects `ollama.mycircledash.com` with a service token

---

## Step 1: Cloudflare — Remove DNS & Tunnel

### 1a. Remove Cloudflare Tunnel for Ollama subdomain

1. Go to **Cloudflare Dashboard > Zero Trust > Networks > Tunnels**
2. Find the tunnel routing `ollama.mycircledash.com` → `http://ollama:11434`
3. Delete the public hostname entry for `ollama.mycircledash.com`
4. If no other hostnames use this tunnel, delete the entire tunnel

### 1b. Remove Cloudflare Access application

1. Go to **Cloudflare Dashboard > Zero Trust > Access > Applications**
2. Find the application for `ollama.mycircledash.com`
3. Delete it — this invalidates the service token (CF_ACCESS_CLIENT_ID / CF_ACCESS_CLIENT_SECRET)

### 1c. Remove Cloudflare WAF rule

1. Go to **Cloudflare Dashboard > mycircledash.com > Security > WAF**
2. Find the rule that skips bot challenge for `ollama.mycircledash.com`
3. Delete it

### 1d. Remove DNS records

1. Go to **Cloudflare Dashboard > mycircledash.com > DNS > Records**
2. Delete all DNS records (A, AAAA, CNAME, TXT) — these typically include:
   - Root (`@`) records pointing to Firebase Hosting IPs
   - `ollama` CNAME pointing to the Cloudflare Tunnel
   - Any TXT records for domain verification
3. Optionally: remove the domain from Cloudflare entirely (**Websites > mycircledash.com > Remove Site**)

### 1e. Cancel domain renewal (if applicable)

If you registered `mycircledash.com` through Cloudflare Registrar:
1. Go to **Cloudflare Dashboard > Domain Registration > mycircledash.com**
2. Disable auto-renew to let the domain expire
3. Or transfer to another registrar if keeping it for other purposes

---

## Step 2: Firebase Hosting — Remove Custom Domain

1. Go to **https://console.firebase.google.com/project/mycircle-dash/hosting/sites**
2. Under your site `mycircle-dash`, find the **Custom domains** section
3. Find `mycircledash.com` in the list
4. Click the **three-dot menu** (⋮) next to it
5. Click **Remove** (or **Disconnect**)
6. Confirm the removal
7. Firebase will stop serving content on that domain
8. Your app remains accessible at `https://mycircle-dash.web.app`

> **Note:** There is no Firebase CLI command for this — it must be done in the web console.

### Quick option: Just stop the website, keep the Ollama API

If you only want to **stop `mycircledash.com` from serving the website** but keep `ollama.mycircledash.com` working for the AI chat API, this step alone is all you need. The Ollama subdomain routes through a completely separate Cloudflare Tunnel and is unaffected by Firebase Hosting changes. Optionally clean up the CORS allowlist (Step 5a) afterward.

---

## Step 3: Google reCAPTCHA — Remove Domain from Allowed List

1. Go to **Google Cloud Console > Security > reCAPTCHA Enterprise** (or [reCAPTCHA admin](https://www.google.com/recaptcha/admin))
2. Find the key: `6Lcvm2ksAAAAAPQ63bPl94XAfS2gTn2Fu4zMmT4f`
3. Under **Domains**, remove `mycircledash.com` from the allowed domains list
4. Keep `mycircle-dash.web.app` and `localhost` in the list
5. The reCAPTCHA key itself does NOT need to change — it is tied to the Firebase project, not the domain

---

## Step 4: Firebase Secrets — Update or Remove Ollama Secrets

If you are **keeping Ollama** but changing the domain:
```bash
printf "https://ollama.yournewdomain.com" | npx firebase functions:secrets:set OLLAMA_BASE_URL
```

If you are **removing Ollama entirely**:
```bash
npx firebase functions:secrets:delete OLLAMA_BASE_URL
npx firebase functions:secrets:delete OLLAMA_MODEL
npx firebase functions:secrets:delete CF_ACCESS_CLIENT_ID
npx firebase functions:secrets:delete CF_ACCESS_CLIENT_SECRET
```

---

## Step 5: Codebase Changes

### 5a. CORS allowlist — `functions/src/index.ts` (~line 38)

Remove `mycircledash.com` from ALLOWED_ORIGINS:

```ts
// BEFORE
const ALLOWED_ORIGINS = [
  'https://mycircle-dash.web.app',
  'https://mycircle-dash.firebaseapp.com',
  'https://mycircledash.com',       // ← REMOVE THIS
  'http://localhost:3000',
];

// AFTER
const ALLOWED_ORIGINS = [
  'https://mycircle-dash.web.app',
  'https://mycircle-dash.firebaseapp.com',
  'http://localhost:3000',
];
```

### 5b. Sentry trace targets — `packages/shell/src/main.tsx` (~line 27)

No change needed — Sentry is already configured for `mycircle-dash.web.app` only:
```ts
tracePropagationTargets: ['localhost', /^https:\/\/mycircle-dash\.web\.app/]
```

### 5c. Documentation updates

| File | What to change |
|------|----------------|
| `README.md` (line 5) | Live demo URL is already `mycircle-dash.web.app` — no change |
| `docs/architecture.md` (~line 1203) | Remove `mycircledash.com` from CORS allowlist docs |
| `docs/ollama-setup.md` (many lines) | Update all `ollama.mycircledash.com` references if moving Ollama, or add a note that the custom domain was decommissioned |
| `docs/announcements.md` (~line 77) | Uses `mycircle-dash` project ID (not the custom domain) — no change |
| `docs/api-keys.md` (~line 227) | Remove/update Cloudflare Access setup references |
| `docs/workload-identity-federation-setup.md` | Uses `mycircle-dash` project ID — no change |

### 5d. Environment files

No changes needed — `.env` files reference `mycircle-dash` (Firebase project ID), not the custom domain.

### 5e. GitHub Workflows

No changes needed — workflows use `mycircle-dash.web.app` (Firebase default domain), not the custom domain:
- `.github/workflows/deploy.yml` — deploys to Firebase project `mycircle-dash`
- `.github/workflows/smoke.yml` — smoke tests against `mycircle-dash.web.app`

---

## Step 6: Verify

After making all changes:

1. **Test the app** at `https://mycircle-dash.web.app` — should work as before
2. **Test AI chat** — if Ollama was removed, it should gracefully fall back to Gemini
3. **Test reCAPTCHA** — App Check should still work on the Firebase domain
4. **Run `pnpm test:run`** — ensure no tests reference the removed domain
5. **Run `pnpm typecheck`** — ensure no type errors
6. **Deploy** — `npx firebase-tools deploy --only hosting,functions --project mycircle-dash`

---

## Summary Checklist

| # | Where | Action | Status |
|---|-------|--------|--------|
| 1 | Cloudflare Tunnel | Delete `ollama.mycircledash.com` public hostname | ☐ |
| 2 | Cloudflare Access | Delete `ollama.mycircledash.com` application | ☐ |
| 3 | Cloudflare WAF | Delete bot-skip rule for `ollama.mycircledash.com` | ☐ |
| 4 | Cloudflare DNS | Delete all records for `mycircledash.com` | ☐ |
| 5 | Cloudflare Registrar | Disable auto-renew (optional) | ☐ |
| 6 | Firebase Hosting | Remove `mycircledash.com` custom domain | ☐ |
| 7 | reCAPTCHA Enterprise | Remove `mycircledash.com` from allowed domains | ☐ |
| 8 | Firebase Secrets | Delete/update OLLAMA_BASE_URL, CF_ACCESS_* secrets | ☐ |
| 9 | `functions/src/index.ts` | Remove `mycircledash.com` from CORS allowlist | ☐ |
| 10 | `docs/architecture.md` | Remove custom domain from CORS docs | ☐ |
| 11 | `docs/ollama-setup.md` | Update or archive Cloudflare setup docs | ☐ |
| 12 | `docs/api-keys.md` | Remove Cloudflare Access references | ☐ |
| 13 | Verify & deploy | Test app on `mycircle-dash.web.app`, deploy | ☐ |

---

## What does NOT need to change

These use the Firebase project ID `mycircle-dash`, not the custom domain — leave them alone:

- `.firebaserc` — project alias
- `.env` / `packages/shell/.env` — Firebase config (auth domain, storage bucket, etc.)
- `e2e/emulator/*.spec.ts` — Firestore project ID for emulator tests
- `scripts/seed-*.mjs` — Firestore seeding scripts
- `.github/workflows/deploy.yml` — deploys to Firebase project
- `playwright.smoke.config.ts` — tests against `mycircle-dash.web.app`
- `packages/shared/src/utils/recaptcha.ts` — reCAPTCHA site key (tied to project, not domain)
- `packages/shell/src/lib/firebase.ts` — App Check provider key (tied to project)
- Sentry DSN in `packages/shell/src/main.tsx` — tied to Sentry project, not domain
