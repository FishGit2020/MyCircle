# API Key Setup Guide

Step-by-step instructions for obtaining every API key used by MyCircle. All keys are free-tier compatible.

---

## Table of Contents

- [Firebase (Auth, Firestore, Hosting, App Check)](#firebase)
- [OpenWeatherMap](#openweathermap)
- [Finnhub (Stocks)](#finnhub)
- [PodcastIndex](#podcastindex)
- [Google Gemini (AI Assistant)](#google-gemini)
- [Ollama (Self-Hosted AI)](#ollama)
- [reCAPTCHA Enterprise](#recaptcha-enterprise)
- [YouVersion (Bible)](#youversion)
- [Sentry (Error Tracking)](#sentry)
- [Summary of Variables](#summary)
- [Emulator Testing](#emulator-testing-envemulator)

---

## Firebase

Firebase provides authentication, Firestore database, hosting, cloud functions, push notifications, and App Check.

### Steps

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project** and follow the wizard
3. Once created, go to **Project Settings** (gear icon) > **General**
4. Scroll down to **Your apps** and click the **Web** (`</>`) icon
5. Register your app and copy the config object values:
   - `apiKey` → `VITE_FIREBASE_API_KEY`
   - `authDomain` → `VITE_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `VITE_FIREBASE_PROJECT_ID`
   - `storageBucket` → `VITE_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `VITE_FIREBASE_APP_ID`
   - `measurementId` → `VITE_FIREBASE_MEASUREMENT_ID`

### Cloud Messaging (Push Notifications)

1. In Firebase Console, go to **Project Settings** > **Cloud Messaging**
2. Under **Web Push certificates**, click **Generate key pair**
3. Copy the key → `VITE_FIREBASE_VAPID_KEY`

### Enable Services

- **Authentication:** Go to **Authentication** > **Sign-in method** > Enable **Google**
- **Firestore:** Go to **Firestore Database** > **Create database** > Start in **production mode**
- **Hosting:** Run `firebase init hosting` locally
- **App Check:** Go to **App Check** > Register your app with reCAPTCHA Enterprise

### Env file

All Firebase keys go in `packages/shell/.env`:
```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXX
VITE_FIREBASE_VAPID_KEY=BL...
```

---

## OpenWeatherMap

Provides current weather, forecasts, air quality, and geocoding.

### Steps

1. Sign up at [openweathermap.org](https://openweathermap.org/)
2. Go to [API Keys](https://home.openweathermap.org/api_keys)
3. Copy your default key or generate a new one
4. The free tier includes: Current Weather, 5-day Forecast, Geocoding, Air Pollution

### Env file

Root `.env`:
```
OPENWEATHER_API_KEY=your_key_here
```

> **Note:** New API keys can take up to 2 hours to activate.

---

## Finnhub

Provides real-time stock quotes, symbol search, and earnings calendar.

### Steps

1. Sign up at [finnhub.io](https://finnhub.io/)
2. Go to [Dashboard](https://finnhub.io/dashboard)
3. Copy your **API Key** from the dashboard
4. Free tier: 60 API calls/minute

### Env file

Root `.env`:
```
FINNHUB_API_KEY=your_key_here
```

---

## PodcastIndex

Provides podcast search, trending feeds, and episode data.

### Steps

1. Go to [podcastindex.org/join](https://api.podcastindex.org/)
2. Click **Register** and create an account
3. You will receive both an **API Key** and **API Secret** via email
4. Free tier: 300 requests/day

### Env file

Root `.env`:
```
PODCASTINDEX_API_KEY=your_key_here
PODCASTINDEX_API_SECRET=your_secret_here
```

---

## Google Gemini

Powers the AI Assistant chat feature.

### Steps

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click **Get API key** > **Create API key in new project** (or select existing)
4. Copy the generated key
5. Free tier: 15 RPM (requests per minute) for Gemini 1.5 Flash

### Env file

Root `.env`:
```
GEMINI_API_KEY=your_key_here
```

---

## Ollama

Optional self-hosted AI backend. When `OLLAMA_BASE_URL` is set, AI chat uses Ollama instead of Google Gemini. This is useful for running a local/private model on your own hardware (e.g., a NAS via Docker).

### Tool Calling

MyCircle supports two modes of tool calling with Ollama:

- **Native tool calling** — Models like `qwen2.5`, `llama3.1+`, and `mistral` support the OpenAI-compatible `tools` parameter. This is tried first automatically.
- **Prompt-based fallback** — For models without native tool support (e.g., `gemma2:2b`), the system injects tool descriptions into the prompt and parses `<tool_call>` tags from the response. This works with any instruction-following model.

The fallback is automatic — no configuration needed.

### Requirements

- [Ollama](https://ollama.ai/) running on a reachable host
- A pulled model (default: `gemma2:2b` ~1.6GB, or `qwen2.5:7b` for native tool calling)
- Network access from the server to Ollama (direct LAN, VPN, tunnel, or custom domain)

### Setup with Custom Domain (recommended)

If you have a permanent domain pointing to your Ollama instance:

1. Install Ollama in Docker on your NAS/server
2. Pull a model: `docker exec ollama ollama pull gemma2:2b`
3. Set up a reverse proxy (Nginx, Caddy, Cloudflare Tunnel) pointing `ollama.yourdomain.com` → `localhost:11434`

### Setup with Cloudflare Quick Tunnel (temporary)

If Ollama runs on a NAS or remote machine without a public IP:

1. Install Ollama in Docker on your NAS
2. Pull a model: `docker exec ollama ollama pull gemma2:2b`
3. Start a [Cloudflare Quick Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/): `cloudflared tunnel --url http://localhost:11434`
4. Copy the generated `*.trycloudflare.com` URL

> **Note:** Quick Tunnel URLs change on container restart. Use a permanent domain/tunnel for production.

### Env file

Root `.env`:
```
OLLAMA_BASE_URL=https://ollama.yourdomain.com
OLLAMA_MODEL=gemma2:2b
```

### Firebase Secrets (production)

```bash
firebase functions:secrets:set OLLAMA_BASE_URL
# Enter: https://ollama.yourdomain.com

firebase functions:secrets:set OLLAMA_MODEL
# Enter: gemma2:2b

firebase deploy --only functions
```

When the URL changes:
```bash
firebase functions:secrets:set OLLAMA_BASE_URL
# Enter: new URL
firebase deploy --only functions
```

### Cloudflare Access (tunnel authentication)

If your Ollama instance is behind a Cloudflare Tunnel with Access protection, Cloud Functions needs a **Service Token** to authenticate.

#### Setup steps

1. Go to [Cloudflare Zero Trust](https://one.dash.cloudflare.com/) → **Access controls** → **Service credentials**
2. Click **Create Service Token** → name: `cloud-functions` → **Non-expiring**
3. Copy the **Client ID** and **Client Secret** (secret only shown once!)
4. Go to **Access controls** → **Applications** → **Add application** → **Self-hosted**
   - Application name: `Ollama API`
   - Public hostname: `ollama.mycircledash.com`
5. Add a policy:
   - Action: **Service Auth**
   - Include: **Service Token** → select `cloud-functions`
6. Save the application
7. Set Firebase secrets:

```bash
firebase functions:secrets:set CF_ACCESS_CLIENT_ID
# Enter: your-client-id.access

firebase functions:secrets:set CF_ACCESS_CLIENT_SECRET
# Enter: your-client-secret

firebase deploy --only functions
```

The code automatically passes `CF-Access-Client-Id` and `CF-Access-Client-Secret` headers when calling Ollama. If these secrets are not set, the headers are omitted (for setups without Cloudflare Access).

### Provider Priority

- If `OLLAMA_BASE_URL` is set → Ollama is used (Gemini is ignored)
- If only `GEMINI_API_KEY` is set → Gemini is used
- If neither is set → AI chat returns a 500 error

---

## reCAPTCHA Enterprise

Protects the GraphQL API via Firebase App Check.

### Steps

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Navigate to **Security** > **reCAPTCHA Enterprise**
4. Click **Create Key** > choose **Website** type
5. Add your domains (e.g., `localhost`, `your-project.web.app`)
6. Copy the **Site Key** → `VITE_RECAPTCHA_SITE_KEY`
7. The **Secret Key** is auto-managed when using Firebase App Check

### Env file

`packages/shell/.env`:
```
VITE_RECAPTCHA_SITE_KEY=6Le...
```

Root `.env` (for server-side validation):
```
RECAPTCHA_SECRET_KEY=6Le...
```

---

## YouVersion

Provides Bible versions and passage text for the Bible Reader feature.

### Steps

1. Go to the [YouVersion Developer Portal](https://developers.youversion.com/)
2. Register as a developer and create a new application
3. Once approved, copy your **App Key** from the dashboard
4. The API provides 19+ English Bible translations including KJV, NIV, AMP, NASB

### Env file

Root `.env`:
```
YOUVERSION_APP_KEY=your_key_here
```

### API Reference

- [YouVersion Bible API docs](https://developers.youversion.com/api/bibles)
- List versions: `GET /v1/bibles?language_ranges[]=en&all_available=true`
- Get passage: `GET /v1/bibles/{id}/passages/{passageId}?format=text`
- Passage ID format: USFM — `JHN.3.16`, `GEN.1`, `PSA.23`

---

## Sentry

Optional error tracking and session replay for production monitoring.

### Steps

1. Sign up at [sentry.io](https://sentry.io/)
2. Create a new project (select **React** as the platform)
3. Copy the **DSN** from **Settings** > **Projects** > your project > **Client Keys (DSN)**
4. Free tier: 5K errors/month, 50 replays/month

### Env file

`packages/shell/.env`:
```
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

---

## Summary

### Root `.env` (Server-side — Cloud Functions)

| Variable | Service | Required |
|----------|---------|----------|
| `OPENWEATHER_API_KEY` | OpenWeatherMap | Yes |
| `FINNHUB_API_KEY` | Finnhub | For stocks |
| `PODCASTINDEX_API_KEY` | PodcastIndex | For podcasts |
| `PODCASTINDEX_API_SECRET` | PodcastIndex | For podcasts |
| `GEMINI_API_KEY` | Google Gemini | For AI chat (unless Ollama set) |
| `OLLAMA_BASE_URL` | Ollama | For self-hosted AI (optional) |
| `OLLAMA_MODEL` | Ollama | Model name (default: gemma2:2b) |
| `CF_ACCESS_CLIENT_ID` | Cloudflare Access | For Ollama tunnel auth |
| `CF_ACCESS_CLIENT_SECRET` | Cloudflare Access | For Ollama tunnel auth |
| `YOUVERSION_APP_KEY` | YouVersion | For Bible reader |
| `RECAPTCHA_SECRET_KEY` | reCAPTCHA Enterprise | For App Check |

### `packages/shell/.env` (Client-side — Browser)

| Variable | Service | Required |
|----------|---------|----------|
| `VITE_FIREBASE_API_KEY` | Firebase | For auth/analytics |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase | For auth |
| `VITE_FIREBASE_PROJECT_ID` | Firebase | For Firestore |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase | For storage |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase | For push |
| `VITE_FIREBASE_APP_ID` | Firebase | For analytics |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase | For analytics |
| `VITE_FIREBASE_VAPID_KEY` | Firebase | For push |
| `VITE_RECAPTCHA_SITE_KEY` | reCAPTCHA Enterprise | For App Check |
| `VITE_SENTRY_DSN` | Sentry | Optional |

### Deploying secrets to Firebase

For production, store server-side keys as Firebase secrets:

```bash
firebase functions:secrets:set OPENWEATHER_API_KEY
firebase functions:secrets:set FINNHUB_API_KEY
firebase functions:secrets:set PODCASTINDEX_API_KEY
firebase functions:secrets:set PODCASTINDEX_API_SECRET
firebase functions:secrets:set GEMINI_API_KEY
firebase functions:secrets:set YOUVERSION_APP_KEY
firebase functions:secrets:set OLLAMA_BASE_URL
firebase functions:secrets:set OLLAMA_MODEL
firebase functions:secrets:set CF_ACCESS_CLIENT_ID
firebase functions:secrets:set CF_ACCESS_CLIENT_SECRET
```

### Emulator Testing (`.env.emulator`)

When running Firebase emulators, API keys are replaced with dummy values and all external API base URLs are redirected to a local mock server (`scripts/mock-api-server.mjs` on port 4000). This file is auto-loaded by the functions emulator via `firebase.json` → `emulators.functions.env`.

| Variable | Value | Purpose |
|----------|-------|---------|
| `OPENWEATHER_BASE_URL` | `http://localhost:4000` | Redirect OpenWeather calls to mock |
| `FINNHUB_BASE_URL` | `http://localhost:4000` | Redirect Finnhub calls to mock |
| `COINGECKO_BASE_URL` | `http://localhost:4000` | Redirect CoinGecko calls to mock |
| `PODCASTINDEX_BASE_URL` | `http://localhost:4000` | Redirect PodcastIndex calls to mock |
| `YOUVERSION_API_BASE_URL` | `http://localhost:4000` | Redirect YouVersion API calls to mock |
| `OPEN_METEO_BASE_URL` | `http://localhost:4000` | Redirect Open-Meteo calls to mock |
| `*_API_KEY` / `*_API_SECRET` | `test-*-key` | Dummy keys (mock server ignores auth) |

Run the full emulator test suite: `pnpm emulator:test`
