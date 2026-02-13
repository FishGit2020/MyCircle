# MyCircle — Personal Dashboard

A modern personal dashboard built with **micro frontend architecture**, React, GraphQL, and deployed on Firebase. MyCircle brings together weather, stocks, podcasts, AI chat, and multi-city comparison into a single unified experience.

**Live Demo:** https://mycircle-dash.web.app

![Built with React](https://img.shields.io/badge/React-18.2-blue)
![Micro Frontends](https://img.shields.io/badge/Micro%20Frontends-Vite%20Federation-green)
![Firebase](https://img.shields.io/badge/Firebase-Hosting%20%2B%20Functions-orange)
![Node.js](https://img.shields.io/badge/Node.js-22-brightgreen)

## Features

### Dashboard
- Dashboard homepage with quick-access cards for all features
- **Customizable widget dashboard** — drag-and-drop reordering, visibility toggles, layout persistence
- Weather favorites, stock watchlist, and podcast subscription previews
- Recent city searches for quick navigation
- **PWA Install Prompt** — Add to Home Screen banner with 7-day dismissal memory

### Weather
- **Enhanced city autocomplete** — inline recent city matching during search, localStorage fallback for non-auth users, "Clear all" recents
- Search for cities worldwide with autocomplete
- Current weather conditions with real-time live polling
- 7-day forecast and 48-hour hourly forecast
- Sun & visibility details (sunrise, sunset, daylight, visibility)
- "What to Wear" clothing suggestions
- Geolocation ("Use My Location")
- Favorite & recent cities (synced via Firestore)
- Share weather (link or screenshot image)
- Inline weather comparison (compare two cities side-by-side)
- **Historical weather** — "This day last year" comparison using Open-Meteo archive API
- **Air Quality Index** — real-time AQI with color-coded levels, expandable pollutant breakdown (PM2.5, PM10, O₃, NO₂, SO₂, CO)
- Visible live/paused toggle with clear state indication
- **Weather alerts** — subscribe to severe weather push notifications for your favorite cities; Cloud Function checks conditions every 30 minutes and sends FCM alerts for thunderstorms, heavy rain/snow, tornadoes, and other severe events

### Stocks & Crypto
- Real-time stock quotes via Finnhub API
- Symbol search and watchlist
- Live polling with visible toggle control
- **Crypto tracker** — live BTC, ETH, SOL, ADA, DOGE prices via CoinGecko API with 7-day sparkline, market cap, 24h volume, and expandable detail cards
- **Earnings calendar** — weekly earnings report schedule via Finnhub API with EPS estimates/actuals, revenue, beat/miss highlighting, and week navigation

### Podcasts
- Podcast discovery and search via PodcastIndex API
- Episode playback with built-in audio player and adjustable playback speed
- **Persistent audio player** — continues playing across all routes (navigate to Stocks, Weather, etc. without interrupting playback)
- **Category/genre filtering** — browse trending podcasts by genre with filter chips, category badges on cards
- **Share episode clip** — share currently playing episode with timestamp via Web Share API or clipboard fallback
- Podcast subscriptions with "My Subscriptions" tab
- Subscribe/unsubscribe from any podcast feed

### Bible Reader
- Browse all 66 canonical books (Old & New Testament)
- Chapter selection grid and passage reading
- **Bible version selector** — switch between WEB, KJV, BBE, OEB, Clementine (Latin), and Almeida (Portuguese) translations with localStorage persistence
- Verse of the Day (bible-api.com)
- Font size adjustment (14-22px) with persistence
- Bookmarks with localStorage persistence
- Copy passage text to clipboard
- **Community notes** — personal notes per passage (book + chapter), auto-saved with debounce to localStorage, collapsible notes panel with saved indicator
- **Daily devotional** — curated 30-entry reading plan cycled by day-of-year, with themed passage and "Read Passage" button, completion tracking (green checkmark persisted in localStorage, 90-day rolling window)

### Worship Songs
- Add, edit, and browse worship songs with ChordPro or plain text format
- Real-time transposition with direct key picker and semitone controls
- Auto-scroll with adjustable speed for live performance
- Copy lyrics to clipboard, **print support** — `@media print` CSS hides UI chrome and forces light theme for clean song output on paper
- **YouTube link integration** — optional YouTube URL per song; renders a styled "Watch on YouTube" button in the song viewer that opens in a new tab
- **Built-in metronome** — Web Audio API-powered metronome with BPM from song metadata (30-240 range), +/- controls, tap tempo (4-tap average), beat indicator flash, always visible in song viewer
- Favorites, search, tag filtering
- Firestore persistence with offline localStorage cache

### Notebook
- Personal note-taking with Firestore persistence (user-scoped subcollection)
- Create, edit, and delete notes with search/filter
- Privacy: each user can only see their own notes
- Note count cached for dashboard tile

### AI Assistant
- Conversational AI chat powered by Google Gemini
- **Context-aware responses** — automatically gathers user data (stock watchlist, favorite cities, podcast subscriptions, preferences) and injects into Gemini system instruction for personalized answers
- Tool calling: weather lookup, city search, stock quotes, crypto prices (CoinGecko), page navigation
- **Voice input** — microphone button using Web Speech API (`SpeechRecognition`) with pulsing visual feedback, graceful fallback (hidden when unsupported)
- Suggested prompt chips with crypto, weather, stock, and navigation prompts

### General
- Dark / light theme with system preference detection
- Multi-language support (i18n: English, Spanish)
- Temperature (°C / °F) and wind speed (m/s, mph, km/h) unit toggles
- **Push notifications** — multi-category preferences (weather alerts, stock price alerts, podcast episodes) via Firebase Cloud Messaging
- **"What's New" announcements** — Firestore-backed changelog with sparkle icon, unread badge, accessible modal; per-user read tracking (Firestore for signed-in, localStorage for anonymous)
- Offline indicator & PWA support
- Firebase Auth (Google OAuth) with cross-device profile sync
- Firebase App Check for API protection
- Firebase Remote Config for feature flags
- GraphQL API with Apollo Client caching and Automatic Persisted Queries (APQ)
- **MFE CSS isolation** — Tailwind preflight disabled in 8 MFE builds to prevent layout shifts from duplicate global resets

## Architecture

MyCircle uses a **micro frontend architecture** with Vite Module Federation. Each area of the app is an independently built and deployed module composed at runtime by the Shell host.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          Firebase Hosting                                │
├──────────────────────────────────────────────────────────────────────────┤
│  ┌───────────┐ ┌─────────────┐ ┌─────────────────┐ ┌───────────────┐   │
│  │   Shell   │ │ City Search │ │ Weather Display │ │ Stock Tracker │   │
│  │  (Host)   │ │    (MFE)    │ │      (MFE)      │ │     (MFE)     │   │
│  │ Port 3000 │ │  Port 3001  │ │   Port 3002     │ │  Port 3005    │   │
│  └───────────┘ └─────────────┘ └─────────────────┘ └───────────────┘   │
│  ┌─────────────────┐ ┌──────────────┐ ┌───────────────┐ ┌────────────┐  │
│  │ Podcast Player  │ │ AI Assistant │ │ Bible Reader  │ │  Worship   │  │
│  │     (MFE)       │ │    (MFE)     │ │    (MFE)      │ │   Songs    │  │
│  │   Port 3006     │ │  Port 3007   │ │  Port 3008    │ │ Port 3009  │  │
│  └─────────────────┘ └──────────────┘ └───────────────┘ └────────────┘  │
│  ┌────────────┐                                                          │
│  │  Notebook  │                                                          │
│  │   (MFE)    │                                                          │
│  │ Port 3010  │                                                          │
│  └────────────┘                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     Firebase Cloud Functions                             │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  GraphQL API (Apollo Server) · Stock Proxy · Podcast Proxy · AI  │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  OpenWeather API · Finnhub API · CoinGecko API · PodcastIndex API · Gemini │
└──────────────────────────────────────────────────────────────────────────┘
```

### Micro Frontends

| Module | Description | Exposes |
|--------|-------------|---------|
| **Shell** | Host app — routing, layout, auth, theme, notifications | — |
| **City Search** | City search with autocomplete & recent cities | `CitySearch` |
| **Weather Display** | Current weather, hourly & 7-day forecast, sun/visibility, clothing tips | `WeatherDisplay` |
| **Stock Tracker** | Real-time stock quotes and watchlist | `StockTracker` |
| **Podcast Player** | Podcast search, discovery, and episode playback | `PodcastPlayer` |
| **AI Assistant** | Conversational AI chat (Gemini) | `AiAssistant` |
| **Bible Reader** | Bible reading with daily devotionals and community notes | `BibleReader` |
| **Worship Songs** | Song library with lyrics, chord editor, YouTube links, metronome | `WorshipSongs` |
| **Notebook** | Personal note-taking with search and Firestore sync | `Notebook` |
| **Shared** | Apollo client, GraphQL queries, event bus, i18n, types, hooks, utilities | Library (not standalone) |

### Dashboard Widgets

The homepage features a customizable widget dashboard with drag-and-drop reordering and visibility toggles (layout persisted in localStorage):

| Widget | Icon | Data Source |
|--------|------|-------------|
| **Weather** | Cloud/sun | Current conditions + 7-day forecast for your city |
| **Stocks** | Chart | Watchlist prices from Finnhub API |
| **Podcasts** | Headphones | Latest episodes from subscribed feeds |
| **Bible** | Book | Verse of the Day from curated collection |
| **Notebook** | Pencil | Recent notes count from Firestore |

### Routes

| Path | Page |
|------|------|
| `/` | Dashboard — quick access cards, city search, favorites, recents |
| `/weather/:lat,:lon` | Weather detail (with inline comparison) |
| `/stocks` | Stock tracker |
| `/podcasts` | Podcast player (discover + subscriptions tabs) |
| `/ai` | AI assistant |
| `/bible` | Bible reader with daily devotionals |
| `/worship` | Worship song library with metronome |
| `/notebook` | Notebook — personal notes with create/edit/delete |
| `/compare` | Legacy multi-city comparison (still accessible) |

### Technology Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Build:** Vite 5, Module Federation
- **API:** Apollo Server 5, GraphQL
- **Data Sources:** OpenWeather API, Finnhub API, CoinGecko API, PodcastIndex API, Google Gemini
- **Auth:** Firebase Auth (Google OAuth)
- **Database:** Cloud Firestore (user profiles, favorites, preferences)
- **Hosting:** Firebase Hosting + Cloud Functions
- **Push Notifications:** Firebase Cloud Messaging
- **Bot Protection:** Firebase App Check (reCAPTCHA Enterprise)
- **Feature Flags:** Firebase Remote Config
- **Monitoring:** Sentry (error tracking + session replay), Web Vitals (LCP, CLS, INP)
- **CI/CD:** GitHub Actions (CI, deploy, E2E)
- **Runtime:** Node.js 22
- **Package Manager:** pnpm (workspaces + catalogs)

## Project Structure

```
mycircle/
├── packages/
│   ├── shared/                  # Shared library (not a standalone app)
│   │   └── src/
│   │       ├── apollo/          # Apollo Client factory, queries, fragments
│   │       ├── hooks/           # useWeatherData and other shared hooks
│   │       ├── i18n/            # Internationalization (translations)
│   │       ├── types/           # TypeScript interfaces
│   │       ├── utils/           # Event bus, weather helpers
│   │       └── data/            # Static data files
│   ├── shell/                   # Host micro frontend
│   │   └── src/
│   │       ├── components/      # Layout, CitySearchWrapper, UserMenu, toggles, etc.
│   │       ├── context/         # AuthContext, ThemeContext, RemoteConfigContext
│   │       ├── lib/             # Firebase SDK integration (auth, Firestore, FCM)
│   │       └── App.tsx          # Routes & provider hierarchy
│   ├── city-search/             # City search MFE
│   │   └── src/
│   │       ├── components/      # CitySearch component
│   │       └── test/
│   ├── weather-display/         # Weather display MFE
│   │   └── src/
│   │       ├── components/      # WeatherDisplay, CurrentWeather, Forecast, Hourly, etc.
│   │       ├── hooks/
│   │       └── test/
│   ├── stock-tracker/           # Stock tracker MFE
│   │   └── src/
│   │       ├── components/      # StockTracker, quote display, watchlist
│   │       ├── hooks/
│   │       └── test/
│   ├── podcast-player/          # Podcast player MFE
│   │   └── src/
│   │       ├── components/      # PodcastPlayer, episode list, audio player
│   │       ├── hooks/
│   │       └── test/
│   ├── ai-assistant/            # AI assistant MFE
│   │   └── src/
│   │       ├── components/      # AiAssistant, chat UI
│   │       ├── hooks/
│   │       └── test/
│   ├── bible-reader/            # Bible reader MFE
│   │   └── src/
│   │       ├── components/      # BibleReader, DailyDevotional, CommunityNotes
│   │       ├── hooks/
│   │       └── test/
│   ├── worship-songs/           # Worship songs MFE
│   │   └── src/
│   │       ├── components/      # WorshipSongs, SongViewer, SongEditor, Metronome
│   │       ├── hooks/
│   │       └── test/
│   └── notebook/                # Notebook MFE
│       └── src/
│           ├── components/      # Notebook, NoteList, NoteEditor, NoteCard
│           ├── hooks/
│           └── test/
├── server/                      # Local development Express server
│   ├── index.ts                 # Entry point — Apollo, REST proxies, AI endpoint
│   ├── api/                     # OpenWeather & geocoding API clients
│   ├── graphql/                 # Schema & resolvers (dev)
│   ├── middleware/              # Server-side caching
│   └── types/
├── functions/                   # Firebase Cloud Functions (production)
│   └── src/
│       ├── index.ts             # GraphQL, stock proxy, podcast proxy, AI chat
│       ├── schema.ts            # GraphQL schema (production)
│       ├── resolvers.ts         # Self-contained resolvers
│       └── recaptcha.ts         # reCAPTCHA verification
├── e2e/                         # Playwright end-to-end tests
│   └── integration/             # Integration tests against deployed app
├── scripts/
│   ├── assemble-firebase.mjs    # Firebase build assembly
│   └── generate-icons.mjs       # PWA icon generation
├── docs/
│   └── architecture.md          # Detailed architecture analysis
├── firebase.json                # Firebase hosting + functions config
├── firestore.rules              # Firestore security rules
├── pnpm-workspace.yaml          # Workspace package declarations
└── package.json                 # Root workspace config
```

## Local Development

### Prerequisites

- Node.js 22+
- pnpm 9+
- API keys (see [Environment Variables](#environment-variables) and the [API Key Guide](docs/api-keys.md) for step-by-step setup instructions)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd weather-app
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment**
   ```bash
   # Copy example env files and fill in your keys
   cp .env.example .env
   cp packages/shell/.env.example packages/shell/.env
   ```

   **Root `.env`** — server-side keys:
   | Variable | Source |
   |----------|--------|
   | `OPENWEATHER_API_KEY` | [openweathermap.org](https://home.openweathermap.org/api_keys) |
   | `FINNHUB_API_KEY` | [finnhub.io](https://finnhub.io/dashboard) |
   | `PODCASTINDEX_API_KEY` / `SECRET` | [podcastindex.org](https://api.podcastindex.org/) |
   | `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com/apikey) |
   | `RECAPTCHA_SECRET_KEY` | [Google reCAPTCHA admin](https://www.google.com/recaptcha/admin) |

   **`packages/shell/.env`** — client-side Firebase config:
   | Variable | Source |
   |----------|--------|
   | `VITE_FIREBASE_API_KEY` | Firebase Console → Project Settings → Web app |
   | `VITE_FIREBASE_AUTH_DOMAIN` | Same |
   | `VITE_FIREBASE_PROJECT_ID` | Same |
   | `VITE_FIREBASE_STORAGE_BUCKET` | Same |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | Same |
   | `VITE_FIREBASE_APP_ID` | Same |
   | `VITE_FIREBASE_MEASUREMENT_ID` | Same |
   | `VITE_FIREBASE_VAPID_KEY` | Firebase Console → Cloud Messaging → Web Push certificates |

4. **Build shared package**
   ```bash
   pnpm run build:shared
   ```

5. **Start development servers**
   ```bash
   pnpm run dev
   ```

   This starts all services concurrently:
   - Express server (GraphQL + proxies): http://localhost:3000
   - Shell (host): http://localhost:3000
   - City Search MFE preview
   - Weather Display MFE preview
   - Stock Tracker MFE preview
   - Podcast Player MFE preview
   - AI Assistant MFE preview
   - Bible Reader MFE preview
   - Worship Songs MFE preview
   - Notebook MFE preview

### Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start all services for development |
| `pnpm build` | Build shared + all micro frontends (remotes in parallel) |
| `pnpm test` | Run unit tests (Vitest, watch mode) |
| `pnpm test:run` | Run unit tests once |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm test:mf` | Run tests across all MFE packages (parallel) |
| `pnpm test:e2e` | Run Playwright end-to-end tests |
| `pnpm test:e2e:emulator` | Run Playwright E2E tests against Firebase emulators |
| `pnpm emulator:test` | Full emulator test run (mock API + emulators + seed + tests) |
| `pnpm mock-api` | Start mock API server on port 4000 |
| `pnpm seed:firestore` | Seed Firestore emulator with test data |
| `pnpm start:static` | Serve production build (`dist/firebase/`) on port 3000 |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm check:shared-versions` | Verify shared deps are consistent across MFEs |

## CI/CD

MyCircle uses **GitHub Actions** for continuous integration and deployment:

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| **CI** (`ci.yml`) | PR to `main` | Installs deps, checks shared dep versions, runs `typecheck:all`, runs `test:all` |
| **Deploy** (`deploy.yml`) | Push to `main` | Builds the full app, deploys to Firebase Hosting (live channel) |
| **E2E** (`e2e.yml`) | PR to `main` | Builds the app, installs Playwright browsers, runs `test:e2e` (mocked) and `emulator:test` (full-stack) |

All workflows use `pnpm/action-setup@v4` with Node 22 and pnpm caching for fast installs.

See [docs/cicd.md](docs/cicd.md) for a detailed CI/CD flow guide with setup instructions.
See [docs/workload-identity-federation-setup.md](docs/workload-identity-federation-setup.md) for keyless Firebase deployment using Workload Identity Federation.

## Security

| Layer | Implementation |
|-------|---------------|
| **CORS** | Whitelisted origins only (`mycircle-app.web.app`, `mycircle-app.firebaseapp.com`, `localhost:3000`) |
| **Rate Limiting** | Per-IP in-memory rate limiter: AI chat (10 req/min), Stock/Podcast proxies (60 req/min) |
| **Input Validation** | Zod schema validation on AI chat request body (`message`, `history`, `context`) |
| **reCAPTCHA** | v3 token verification on AI chat (graceful — skipped if token missing for backward compat) |
| **Auth** | Firebase ID token required for stock, podcast, and AI chat endpoints |
| **App Check** | Firebase App Check (reCAPTCHA Enterprise) on GraphQL endpoint |

## Deployment to Firebase

### Prerequisites

- Firebase account with Blaze plan (pay-as-you-go)
- Firebase CLI installed (`pnpm add -g firebase-tools`)

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a project and enable Blaze plan
3. Enable **Authentication** (Google provider)
4. Enable **Firestore**
5. Enable **App Check** with reCAPTCHA Enterprise
6. Enable **Cloud Messaging** for push notifications

### Step 2: Configure Firebase CLI

```bash
firebase login
# Update .firebaserc with your project ID
```

### Step 3: Set Cloud Function Secrets

```bash
firebase functions:secrets:set OPENWEATHER_API_KEY
firebase functions:secrets:set FINNHUB_API_KEY
firebase functions:secrets:set PODCASTINDEX_API_KEY
firebase functions:secrets:set PODCASTINDEX_API_SECRET
firebase functions:secrets:set GEMINI_API_KEY
```

### Step 4: Deploy

```bash
# Full deployment (builds everything and deploys)
pnpm run firebase:deploy

# Or deploy individually
pnpm run firebase:deploy:hosting    # Hosting only
pnpm run firebase:deploy:functions  # Functions only
```

### Firebase Architecture

After deployment, the app is available at:

- **Hosting:** `https://mycircle-dash.web.app`
- **GraphQL:** `https://us-central1-mycircle-dash.cloudfunctions.net/graphql`

#### Cloud Functions

| Function | Route / Trigger | Purpose | Rate Limit |
|----------|----------------|---------|------------|
| `graphql` | `/graphql` | GraphQL API — weather, city search, stocks, podcasts, bible, crypto | — |
| `stockProxy` | `/stock/**` | Finnhub API proxy (search, quote, profile, candles) | 60 req/min/IP |
| `podcastProxy` | `/podcast/**` | PodcastIndex API proxy (search, trending, episodes) | 60 req/min/IP |
| `aiChat` | `/ai/chat` | Gemini AI chat with function calling (weather, stocks, crypto, navigation) | 10 req/min/IP |
| `subscribeToAlerts` | Callable | Subscribe/unsubscribe FCM tokens to weather alerts for cities | — |
| `checkWeatherAlerts` | Scheduled (every 30 min) | Check weather for subscribed cities, send FCM for severe conditions | — |

All proxy functions require Firebase Auth. `stockProxy`, `podcastProxy`, and `aiChat` use IP-based rate limiting via `node-cache`.

## GraphQL API

### Endpoints

- **Production:** `https://us-central1-mycircle-dash.cloudfunctions.net/graphql`
- **Development:** `http://localhost:3000/graphql`

### Example Queries

```graphql
# Get comprehensive weather data
query Weather($lat: Float!, $lon: Float!) {
  weather(lat: $lat, lon: $lon) {
    current {
      temp
      feels_like
      humidity
      weather { main description icon }
    }
    forecast {
      dt
      temp { min max }
      weather { main icon }
    }
    hourly {
      dt
      temp
      weather { icon }
    }
  }
}

# Search for cities
query SearchCities($query: String!) {
  searchCities(query: $query, limit: 5) {
    id
    name
    country
    state
    lat
    lon
  }
}
```

## Module Federation

### How It Works

1. **Shell (Host)** loads 8 remote modules at runtime via `remoteEntry.js`
2. Each **remote MFE** exposes its root component
3. **Shared dependencies** (React, React DOM, Apollo Client) are deduplicated at runtime via `singleton: true` and `requiredVersion` constraints
4. **pnpm catalogs** centralise version specifiers so all packages resolve the same version from a single source of truth in `pnpm-workspace.yaml`
5. A **CI version-drift check** (`scripts/check-shared-versions.mjs`) fails the build if any package declares a mismatched version

### Configuration

**Shell (consumer):**
```typescript
// packages/shell/vite.config.ts
federation({
  name: 'shell',
  remotes: {
    citySearch:     '/city-search/assets/remoteEntry.js',
    weatherDisplay: '/weather-display/assets/remoteEntry.js',
    stockTracker:   '/stock-tracker/assets/remoteEntry.js',
    podcastPlayer:  '/podcast-player/assets/remoteEntry.js',
    aiAssistant:    '/ai-assistant/assets/remoteEntry.js',
    bibleReader:    '/bible-reader/assets/remoteEntry.js',
    worshipSongs:   '/worship-songs/assets/remoteEntry.js',
  },
  shared: {
    react:              { singleton: true, requiredVersion: '^18.2.0' },
    'react-dom':        { singleton: true, requiredVersion: '^18.2.0' },
    'react-router':     { singleton: true, requiredVersion: '^7' },
    '@apollo/client':   { singleton: true, requiredVersion: '^4.1.1' },
    graphql:            { singleton: true, requiredVersion: '^16.12.0' },
    '@mycircle/shared': { singleton: true },
  }
})
```

**Remote MFE (example — City Search):**
```typescript
// packages/city-search/vite.config.ts
federation({
  name: 'citySearch',
  filename: 'remoteEntry.js',
  exposes: {
    './CitySearch': './src/components/CitySearch.tsx'
  },
  shared: {
    react:              { singleton: true, requiredVersion: '^18.2.0' },
    'react-dom':        { singleton: true, requiredVersion: '^18.2.0' },
    'react-router':     { singleton: true, requiredVersion: '^7' },
    '@apollo/client':   { singleton: true, requiredVersion: '^4.1.1' },
    graphql:            { singleton: true, requiredVersion: '^16.12.0' },
    '@mycircle/shared': { singleton: true },
  }
})
```

### Shared Dependency Safety

Three layers prevent version drift across micro frontends:

| Layer | What it does | When it catches issues |
|-------|-------------|------------------------|
| **pnpm catalogs** | All packages use `catalog:` references pointing to `pnpm-workspace.yaml` | `pnpm install` |
| **CI check** | `scripts/check-shared-versions.mjs` compares version specifiers across all `packages/*/package.json` | PR pipeline |
| **`singleton: true`** | Federation runtime errors if incompatible versions are loaded instead of silently duplicating | Build / runtime |

## Environment Variables

### Server-side (root `.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENWEATHER_API_KEY` | OpenWeather API key (weather + air pollution) | Yes |
| `FINNHUB_API_KEY` | Finnhub stock API key | For stocks |
| `PODCASTINDEX_API_KEY` | PodcastIndex API key | For podcasts |
| `PODCASTINDEX_API_SECRET` | PodcastIndex API secret | For podcasts |
| `GEMINI_API_KEY` | Google Gemini API key | For AI chat |
| `RECAPTCHA_SECRET_KEY` | reCAPTCHA v3 secret | For bot protection |
| `PORT` | Server port (default: 3000) | No |
| `NODE_ENV` | `development` or `production` | No |

### Client-side (`packages/shell/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_FIREBASE_API_KEY` | Firebase API key | For auth/analytics |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | For auth |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | For Firestore |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | For storage |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID | For push notifications |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | For analytics |
| `VITE_FIREBASE_MEASUREMENT_ID` | Google Analytics ID | For analytics |
| `VITE_FIREBASE_VAPID_KEY` | FCM VAPID key | For push notifications |
| `VITE_RECAPTCHA_SITE_KEY` | reCAPTCHA v3 site key | For bot protection |
| `VITE_SENTRY_DSN` | Sentry DSN for error tracking | For monitoring |

### Emulator overrides (`.env.emulator`)

These are only used when running Firebase emulators with the mock API server (see `pnpm emulator:test`):

| Variable | Default | Purpose |
|----------|---------|---------|
| `OPENWEATHER_BASE_URL` | `https://api.openweathermap.org` | Redirect to mock server |
| `FINNHUB_BASE_URL` | `https://finnhub.io` | Redirect to mock server |
| `COINGECKO_BASE_URL` | `https://api.coingecko.com` | Redirect to mock server |
| `PODCASTINDEX_BASE_URL` | `https://api.podcastindex.org` | Redirect to mock server |
| `BIBLE_API_BASE_URL` | `https://bible-api.com` | Redirect to mock server |
| `OPEN_METEO_BASE_URL` | `https://archive-api.open-meteo.com` | Redirect to mock server |
| `FIRESTORE_EMULATOR_HOST` | — | `localhost:8080` |
| `FIREBASE_AUTH_EMULATOR_HOST` | — | `localhost:9099` |

> **Note:** Firebase is optional — the app works without it (auth, push notifications, and profile sync are disabled).

## Monitoring

- **Sentry** (`@sentry/react`): Client-side error tracking with session replay. Initialized in `main.tsx` (production only). Errors from React `ErrorBoundary` components are automatically captured with component stack traces.
- **Structured Logging**: Firebase Cloud Functions use `firebase-functions/logger` for structured, queryable logs in Google Cloud Logging.
- **Web Vitals**: Core Web Vitals (LCP, CLS, INP, FCP, TTFB) measured via `web-vitals` library. Reported per route for MFE-level performance analysis.

## Testing

```bash
# Unit tests (Vitest)
pnpm test              # Watch mode
pnpm test:run          # Single run
pnpm test:coverage     # With coverage
pnpm test:mf           # All MFE packages
pnpm test:all          # Root + all MFEs

# End-to-end tests (Playwright)
pnpm test:e2e          # Headless (browser-level mocks, no API server needed)
pnpm test:e2e:headed   # With browser UI
pnpm test:e2e:ui       # Playwright UI mode

# Emulator E2E tests (full-stack: Firebase emulators + mock API server)
pnpm emulator:test     # Orchestrated: starts mock API, emulators, seeds, runs tests
# Or manually:
pnpm mock-api &        # Start mock API server (port 4000)
firebase emulators:start  # Start Firebase emulators (hosting:5000, functions:5001, etc.)
pnpm seed:firestore    # Seed Firestore emulator
pnpm test:e2e:emulator # Run emulator tests
```

## Troubleshooting

### Module Federation Issues

**"... module is loading..." stuck**
- Ensure remote MFEs are built: `pnpm run build:remotes`
- In development, remotes are served via `preview` mode (pre-built)

### Firebase Deployment Issues

**Cloud Functions timeout during deployment**
- Ensure lazy initialization pattern in `functions/src/index.ts`
- Avoid importing heavy modules at top level

**API key not working in production**
- Verify secrets are set: `firebase functions:secrets:access OPENWEATHER_API_KEY`
- Check function config includes the secret in its `secrets` array

**Firebase features not working locally**
- Ensure `packages/shell/.env` has valid `VITE_FIREBASE_*` values
- Firebase is optional — the app runs without it (auth disabled)

## License

MIT
