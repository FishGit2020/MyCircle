# API Key Setup Guide

Step-by-step instructions for obtaining every API key used by MyCircle. All keys are free-tier compatible.

---

## Table of Contents

- [Firebase (Auth, Firestore, Hosting, App Check)](#firebase)
- [OpenWeatherMap](#openweathermap)
- [Finnhub (Stocks)](#finnhub)
- [PodcastIndex](#podcastindex)
- [Google Gemini (AI Assistant)](#google-gemini)
- [reCAPTCHA Enterprise](#recaptcha-enterprise)
- [Sentry (Error Tracking)](#sentry)
- [Summary of Variables](#summary)

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
| `GEMINI_API_KEY` | Google Gemini | For AI chat |
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
```
