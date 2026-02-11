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
- Weather favorites, stock watchlist, and podcast subscription previews
- Recent city searches for quick navigation

### Weather
- Search for cities worldwide with autocomplete
- Current weather conditions with real-time live polling
- 7-day forecast and 48-hour hourly forecast
- Sun & visibility details (sunrise, sunset, daylight, visibility)
- "What to Wear" clothing suggestions
- Geolocation ("Use My Location")
- Favorite & recent cities (synced via Firestore)
- Share weather (link or screenshot image)
- Inline weather comparison (compare two cities side-by-side)
- Visible live/paused toggle with clear state indication

### Stocks
- Real-time stock quotes via Finnhub API
- Symbol search and watchlist
- Live polling with visible toggle control

### Podcasts
- Podcast discovery and search via PodcastIndex API
- Episode playback with built-in audio player
- Podcast subscriptions with "My Subscriptions" tab
- Subscribe/unsubscribe from any podcast feed

### AI Assistant
- Conversational AI chat powered by Google Gemini
- Context-aware responses (weather, stocks, navigation)

### General
- Dark / light theme with system preference detection
- Multi-language support (i18n: English, Spanish)
- Temperature (°C / °F) and wind speed (m/s, mph, km/h) unit toggles
- Push notifications (Firebase Cloud Messaging)
- Offline indicator & PWA support
- Firebase Auth (Google OAuth) with cross-device profile sync
- Firebase App Check for API protection
- Firebase Remote Config for feature flags
- GraphQL API with Apollo Client caching

## Architecture

MyCircle uses a **micro frontend architecture** with Vite Module Federation. Each area of the app is an independently built and deployed module composed at runtime by the Shell host.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          Firebase Hosting                                │
├──────────────────────────────────────────────────────────────────────────┤
│  ┌───────────┐ ┌─────────────┐ ┌─────────────────┐ ┌───────────────┐   │
│  │   Shell   │ │ City Search │ │ Weather Display │ │ Stock Tracker │   │
│  │  (Host)   │ │    (MFE)    │ │      (MFE)      │ │     (MFE)     │   │
│  │ Port 3000 │ │  Port 3001  │ │   Port 3002     │ │  Port 3004    │   │
│  └───────────┘ └─────────────┘ └─────────────────┘ └───────────────┘   │
│  ┌─────────────────┐ ┌──────────────┐                                   │
│  │ Podcast Player  │ │ AI Assistant │                                   │
│  │     (MFE)       │ │    (MFE)     │                                   │
│  │   Port 3005     │ │  Port 3006   │                                   │
│  └─────────────────┘ └──────────────┘                                   │
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
│  OpenWeather API  ·  Finnhub API  ·  PodcastIndex API  ·  Google Gemini │
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
| **Shared** | Apollo client, GraphQL queries, event bus, i18n, types, hooks, utilities | Library (not standalone) |

### Routes

| Path | Page |
|------|------|
| `/` | Dashboard — quick access cards, city search, favorites, recents |
| `/weather/:lat,:lon` | Weather detail (with inline comparison) |
| `/stocks` | Stock tracker |
| `/podcasts` | Podcast player (discover + subscriptions tabs) |
| `/ai` | AI assistant |
| `/compare` | Legacy multi-city comparison (still accessible) |

### Technology Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Build:** Vite 5, Module Federation
- **API:** Apollo Server 5, GraphQL
- **Data Sources:** OpenWeather API, Finnhub API, PodcastIndex API, Google Gemini
- **Auth:** Firebase Auth (Google OAuth)
- **Database:** Cloud Firestore (user profiles, favorites, preferences)
- **Hosting:** Firebase Hosting + Cloud Functions
- **Push Notifications:** Firebase Cloud Messaging
- **Bot Protection:** Firebase App Check (reCAPTCHA Enterprise)
- **Feature Flags:** Firebase Remote Config
- **Runtime:** Node.js 22
- **Package Manager:** pnpm (workspaces)

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
│   └── ai-assistant/            # AI assistant MFE
│       └── src/
│           ├── components/      # AiAssistant, chat UI
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
- API keys (see [Environment Variables](#environment-variables))

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

### Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start all services for development |
| `pnpm build` | Build shared + all micro frontends |
| `pnpm test` | Run unit tests (Vitest, watch mode) |
| `pnpm test:run` | Run unit tests once |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm test:mf` | Run tests across all MFE packages |
| `pnpm test:e2e` | Run Playwright end-to-end tests |
| `pnpm typecheck` | TypeScript type checking |

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

Cloud Functions handle:
- `/graphql` — GraphQL API (weather queries, city search, reverse geocode)
- `/stock/**` — Finnhub stock API proxy
- `/podcast/**` — PodcastIndex API proxy
- `/ai/**` — Gemini AI chat endpoint

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

1. **Shell (Host)** loads 5 remote modules at runtime via `remoteEntry.js`
2. Each **remote MFE** exposes its root component
3. **Shared dependencies** (React, React DOM, Apollo Client) are deduplicated at runtime

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
  },
  shared: ['react', 'react-dom', 'react-router', '@apollo/client']
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
  shared: ['react', 'react-dom', 'react-router', '@apollo/client']
})
```

## Environment Variables

### Server-side (root `.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENWEATHER_API_KEY` | OpenWeather API key | Yes |
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

> **Note:** Firebase is optional — the app works without it (auth, push notifications, and profile sync are disabled).

## Testing

```bash
# Unit tests (Vitest)
pnpm test              # Watch mode
pnpm test:run          # Single run
pnpm test:coverage     # With coverage
pnpm test:mf           # All MFE packages
pnpm test:all          # Root + all MFEs

# End-to-end tests (Playwright)
pnpm test:e2e          # Headless
pnpm test:e2e:headed   # With browser UI
pnpm test:e2e:ui       # Playwright UI mode
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
