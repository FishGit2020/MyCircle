# MyCircle — Micro Frontend Architecture Analysis

A comprehensive analysis of the MyCircle personal dashboard architecture, covering micro frontend communication, data flow, persistence, and key implementation patterns.

## Table of Contents

- [High-Level Architecture](#high-level-architecture)
- [Micro Frontends](#micro-frontends)
- [MFE Prefetch Strategy](#mfe-prefetch-strategy)
- [Inter-MFE Communication](#inter-mfe-communication)
- [Data Flow](#data-flow)
- [Persistence & Storage](#persistence--storage)
- [GraphQL & Apollo Client](#graphql--apollo-client)
- [Authentication & User Profile](#authentication--user-profile)
- [Theme System](#theme-system)
- [Key Files Reference](#key-files-reference)

---

## High-Level Architecture

```
+──────────────────────────────────────────────────────────────────────────+
|                          Firebase Hosting                                |
+──────────────────────────────────────────────────────────────────────────+
|  +-----------+ +-------------+ +-----------------+ +---------------+    |
|  |   Shell   | | City Search | | Weather Display | | Stock Tracker |    |
|  |  (Host)   | |    (MFE)    | |      (MFE)      | |     (MFE)     |    |
|  | Port 3000 | |  Port 3001  | |   Port 3002     | |  Port 3005    |    |
|  +-----------+ +-------------+ +-----------------+ +---------------+    |
|  +-----------------+ +--------------+ +---------------+ +--------------+  |
|  | Podcast Player  | | AI Assistant | | Bible Reader  | |   Worship    |  |
|  |     (MFE)       | |    (MFE)     | |    (MFE)      | |    Songs     |  |
|  |   Port 3006     | |  Port 3007   | |  Port 3008    | |  Port 3009   |  |
|  +-----------------+ +--------------+ +---------------+ +--------------+  |
|  +--------------+ +---------------+ +-------------------+                  |
|  |   Notebook   | | Baby Tracker  | | Child Development |                  |
|  |    (MFE)     | |    (MFE)      | |       (MFE)       |                  |
|  |  Port 3010   | |  Port 3011    | |    Port 3012      |                  |
|  +--------------+ +---------------+ +-------------------+                  |
|  +-------------------+ +-------------------+                               |
|  | Chinese Learning  | | English Learning  |                               |
|  |       (MFE)       | |       (MFE)       |                               |
|  |    Port 3013      | |    Port 3014      |                               |
|  +-------------------+ +-------------------+                               |
+──────────────────────────────────────────────────────────────────────────+
                                |
                                v
+──────────────────────────────────────────────────────────────────────────+
|                     Firebase Cloud Functions                             |
|  +────────────────────────────────────────────────────────────────────+  |
|  |  GraphQL API · Stock Proxy · Podcast Proxy · AI Chat (Gemini)    |  |
|  +────────────────────────────────────────────────────────────────────+  |
+──────────────────────────────────────────────────────────────────────────+
                                |
                                v
+──────────────────────────────────────────────────────────────────────────+
|  OpenWeather API · Open-Meteo · Finnhub API · CoinGecko API · PodcastIndex · Gemini |
+──────────────────────────────────────────────────────────────────────────+
```

### Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Tailwind CSS |
| **Build** | Vite 5, Module Federation |
| **API** | Apollo Server 5, GraphQL |
| **Data Sources** | OpenWeather API (weather + air pollution), Open-Meteo Archive API, Finnhub API, CoinGecko API (crypto), PodcastIndex API, Google Gemini, [YouVersion API](https://developers.youversion.com/api/bibles) (Bible) |
| **Hosting** | Firebase Hosting + Cloud Functions |
| **Auth** | Firebase Auth (Google OAuth + email/password) |
| **Database** | Cloud Firestore (user profiles, favorites, preferences) |
| **Push Notifications** | Firebase Cloud Messaging |
| **Bot Protection** | Firebase App Check (reCAPTCHA Enterprise) |
| **Feature Flags** | Firebase Remote Config |
| **Runtime** | Node.js 22 |
| **Package Manager** | pnpm (workspaces + catalogs) |

### Centralized Tailwind CSS

Tailwind CSS is built exclusively in the shell host. The shell's `tailwind.config.js` scans all 9 MFE `src/` directories in its `content` array, producing a single CSS bundle that covers every utility class used across the entire app. MFE packages do not have their own Tailwind configs, `@tailwind` directives, or `tailwindcss` devDependencies — they rely entirely on the shell's CSS output at runtime.

This eliminates duplicate utility class injection, prevents specificity conflicts between MFE CSS bundles, and reduces total CSS payload. The only MFE-level CSS that remains is `worship-songs/src/index.css`, which contains `@media print` rules for print-friendly song output (no Tailwind directives).

### Accessibility (a11y)

The shell and MFE components follow WCAG 2.1 patterns:

- **Loading states** — `role="status"` with `aria-live="polite"` and sr-only text so screen readers announce loading transitions
- **Offline indicator** — `role="alert"` for immediate AT announcement when connectivity changes
- **User menu** — `aria-label`, `aria-expanded`, `aria-haspopup` on the avatar button; `role="menu"` / `role="menuitem"` on the dropdown
- **Stock price changes** — sr-only directional text ("up" / "down") alongside color-coded badges, so the information isn't color-dependent
- **Audio progress bar** — `aria-valuetext` with human-readable time (`"2:30 / 45:00"`) instead of raw seconds
- **Horizontal scroll regions** — `role="region"` with `aria-label` and `tabIndex={0}` for keyboard-focusable scroll containers (e.g., hourly forecast)
- **Toast notifications** — `role="alert"` with `aria-live="assertive"` for foreground push notification toasts
- **Skip-to-content** link in Layout.tsx for keyboard users
- **Focus management** — `useFocusOnRouteChange` hook moves focus to `#main-content` on route change so screen readers announce the new page
- **Breadcrumbs** — `<nav aria-label="Breadcrumb">` with `aria-current="page"` on the current segment, rendered below the header on feature pages
- **Focus indicators** — `focus:ring-2 focus:ring-blue-500` on interactive elements
- **Color contrast** — text/background combinations meet WCAG AA 4.5:1 minimum (e.g., `text-gray-500` on white for widget placeholders ≥ 5.28:1, `text-blue-600` on `bg-gray-50` for buttons ≥ 5.41:1, `text-blue-300` on `bg-gray-700` for footer badges ≥ 6.86:1)
- **Touch targets** — interactive elements (e.g., onboarding step dots) use a minimum 24×24px tap area, with visual size kept small via inner spans
- **Geolocation** — auto-location only fires when the user has previously granted permission (via Permissions API); first-time users must click "Use My Location"

---

## Micro Frontends

### Shell (Host) - `packages/shell/`

The orchestrator that loads and composes all remote micro frontends.

**Responsibilities:**
- Application routing (React Router v7)
- Layout: sticky header with grouped nav dropdowns (Daily, Faith, Family, Learning, Tools), toggles, notifications, "What's New" button, user menu
- Authentication context (Firebase Auth)
- Theme context (dark/light mode with system preference detection)
- i18n / language selection (English, Spanish, Chinese)
- Unit toggles (temperature, wind speed)
- Push notification management (Firebase Cloud Messaging)
- Remote Config context (Firebase Remote Config)
- Loading remote MFEs via Module Federation

**Route Structure:**
```
/                       -> DashboardPage (hero section, widget dashboard)
/weather/:coords        -> WeatherDisplay MFE (lazy-loaded, includes inline comparison)
/stocks                 -> StockTracker MFE (lazy-loaded, watchlist + crypto)
/stocks/:symbol         -> StockTracker MFE (drill-down: quote, chart, news)
/podcasts               -> PodcastPlayer MFE (lazy-loaded, discover + subscribed tabs)
/podcasts/:podcastId    -> PodcastPlayer MFE (drill-down: episodes list)
/ai                     -> AiAssistant MFE (lazy-loaded)
/bible                  -> BibleReader MFE (lazy-loaded, daily devotionals)
/worship                -> WorshipSongs MFE (lazy-loaded, song list)
/worship/new            -> WorshipSongs MFE (new song editor)
/worship/:songId        -> WorshipSongs MFE (drill-down: song viewer)
/worship/:songId/edit   -> WorshipSongs MFE (song editor)
/notebook               -> Notebook MFE (lazy-loaded, personal notes)
/notebook/new           -> Notebook MFE (new note editor)
/notebook/:noteId       -> Notebook MFE (drill-down: note editor)
/baby                   -> BabyTracker MFE (lazy-loaded, baby growth tracker)
/child-dev              -> ChildDevelopment MFE (lazy-loaded, developmental guide)
/compare                -> WeatherCompare (legacy, still accessible)
/*                      -> 404 NotFound
```

**Provider Hierarchy:**
```
ApolloProvider
  -> AuthProvider
    -> RemoteConfigProvider
      -> ThemeProvider
        -> ThemeSync (side-effect component)
        -> BrowserRouter
          -> Layout (Outlet)
            -> Routes
            -> GlobalAudioPlayer (persistent across all routes)
            -> FeedbackButton
```

### City Search (Remote MFE) - `packages/city-search/`

Exposes `CitySearch` component via Module Federation.

**Key Behavior:**
- Input focus with empty query -> shows "Recent Searches" dropdown (up to 5 cities) with "Clear all" button
- Typing triggers a 300ms debounced GraphQL `searchCities` query
- **Inline recent matching** — matching recent cities appear above API results with a "Recent" badge and relative timestamp
- **localStorage fallback** — non-authenticated users get local recent city persistence (`recent-cities` key)
- City selection publishes `CITY_SELECTED` event via event bus and saves to local recents
- Click-outside detection closes all dropdowns
- Receives `recentCities`, `onRemoveCity`, and `onClearRecents` as props from the shell's `CitySearchWrapper`

**Module Federation Config:**
```typescript
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
    '@apollo/client':   { singleton: true, requiredVersion: '^4.1.1', eager: false },
    graphql:            { singleton: true, requiredVersion: '^16.12.0', eager: false },
    '@mycircle/shared': { singleton: true },
  }
})
```

### Weather Display (Remote MFE) - `packages/weather-display/`

Exposes `WeatherDisplay`, `CurrentWeather`, and `Forecast` components.

**Key Behavior:**
- Extracts `lat,lon` from URL params (`/weather/:coords`)
- Listens for `CITY_SELECTED` DOM events from other MFEs
- Uses `useWeatherData(lat, lon, true)` hook with real-time subscriptions
- Renders: `CurrentWeather`, `HourlyForecast`, `Forecast`, `HistoricalWeather`, `AirQuality`, `ActivitySuggestions`
- **Historical weather comparison** — "This day last year" using Open-Meteo archive API via `useHistoricalWeather` hook
- **Air Quality Index** — real-time AQI (1-5 European scale) with color-coded levels (Good/Fair/Moderate/Poor/Very Poor), expandable pollutant breakdown via `useAirQuality` hook
- Shows a "Live" badge when WebSocket subscription is active
- **DashboardSettings** widget visibility panel with Show All / Hide All / Reset to defaults quick actions

**Data Displayed:**
| Component | Data Points |
|-----------|------------|
| **CurrentWeather** | Temperature, feels-like, weather icon, description, humidity, wind speed + direction, pressure, cloudiness |
| **HourlyForecast** | 48-hour forecast with temp, icon, rain probability, wind speed |
| **Forecast** | 7-day grid with date, icon, max/min temps, description, rain probability; expandable details showing day/night temps, humidity, wind speed |
| **HistoricalWeather** | Side-by-side comparison of today vs same day last year (temp high/low, precipitation, wind, weather condition) |
| **AirQuality** | AQI level badge, color-coded scale bar, expandable pollutant grid (PM2.5, PM10, O₃, NO₂, SO₂, CO) |
| **ActivitySuggestions** | Weather-based outdoor/indoor activity recommendations with collapsible card UI |

### Shared Package - `packages/shared/`

Library consumed by all micro frontends. Not a standalone app.

**Exports (via barrel `src/index.ts`):**
- Apollo Client factory & singleton (`createApolloClient`, `getApolloClient`)
- GraphQL queries & fragments (`GET_WEATHER`, `SEARCH_CITIES`, etc.)
- Event bus (`eventBus`, `MFEvents`, `subscribeToMFEvent`)
- Types (`City`, `CurrentWeather`, `ForecastDay`, `HistoricalWeatherDay`, `AirQuality`, `CryptoPrice`, etc.)
- Hooks (`useWeatherData`, `useHistoricalWeather`, `useAirQuality`, `useCryptoPrices`)
- i18n (`useTranslation`)
- Utility functions (weather icons, formatting, `getErrorMessage`)

### Stock Tracker - `packages/stock-tracker/`

Exposes `StockTracker` component via Module Federation.

**Key Behavior:**
- Real-time stock quote lookup via Finnhub API (proxied through Cloud Functions)
- Symbol search and watchlist management
- **Crypto tracker** — live prices for BTC, ETH, SOL, ADA, DOGE via CoinGecko free API (`/coins/markets`), with 7-day sparkline, market cap, 24h volume, expandable detail cards, 60s polling
- **Company news** — recent news articles for selected stock via Finnhub `/company-news` (free tier), showing headline, source, relative timestamp, and thumbnail image with links to full articles (7-day window, 5-min server cache)
- Authenticated requests (Firebase ID token attached)

### Podcast Player - `packages/podcast-player/`

Exposes `PodcastPlayer` component via Module Federation.

**Key Behavior:**
- Tabbed interface: "Discover" (trending + search) and "My Subscriptions"
- Podcast discovery and search via PodcastIndex API (proxied through Cloud Functions)
- Episode listing and detail view
- Built-in audio player for episode playback
- **Category/genre filtering**: `TrendingPodcasts` extracts categories from podcast data (comma-separated strings), sorts by frequency (top 12), renders filter chips. `PodcastCard` displays up to 2 category badges as purple chips.
- **Share episode clip**: Both `AudioPlayer` and `GlobalAudioPlayer` include a share button that formats episode title, podcast name, and current timestamp. Uses `navigator.share()` (Web Share API) with `navigator.clipboard.writeText()` fallback. Visual feedback via green checkmark on clipboard copy.
- Podcast subscriptions stored in localStorage (`podcast-subscriptions`)
- Subscribed tab fetches feed details via `podcastFeed(feedId)` query
- All podcast/episode IDs use GraphQL `ID` type (string) to handle large PodcastIndex IDs
- Authenticated requests (Firebase ID token attached)

### AI Assistant - `packages/ai-assistant/`

Exposes `AiAssistant` component via Module Federation.

**Key Behavior:**
- Conversational AI chat powered by Google Gemini
- **Context-aware responses**: `useAiChat` hook calls `gatherUserContext()` on every message, collecting stock watchlist symbols, favorite/recent city names, podcast subscription count, locale, temperature unit, theme, and current page from localStorage. This context is sent in the request body and injected into Gemini's system instruction for personalized answers.
- **Tool calling**: Gemini can invoke `getWeather`, `searchCities`, `getStockQuote`, `getCryptoPrices` (CoinGecko API with 2-min cache), and `navigateTo` tools. Tool calls are displayed as labeled badges (e.g., "Weather lookup", "Crypto prices") via `ToolCallDisplay`.
- **Voice input**: `ChatInput` component includes a microphone button that uses the Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`). Lazy detection via `getSpeechRecognition()` ensures the button only renders when the browser supports it. Pulsing red animation indicates listening state. Transcribed speech is appended to the textarea.
- Suggested prompt chips: weather, stocks, crypto, navigation, comparison
- Authenticated requests (Firebase ID token attached)

### Bible Reader - `packages/bible-reader/`

Exposes `BibleReader` component via Module Federation.

**Key Behavior:**
- Browse all 66 canonical Bible books (Old & New Testament) with search/filter
- Chapter grid navigation with previous/next chapter controls
- **Dynamic Bible versions**: 19+ English translations (KJV, NIV, AMP, NASB, etc.) fetched from YouVersion API via `bibleVersions` GraphQL query (24hr server-side cache)
- Verse of the Day via GraphQL (`bibleVotdApi` query) cached by day-of-year with local verse fallback
- Passage reading via YouVersion API (`biblePassage` query with USFM reference conversion), with copyright display
- Font size adjustment (5 levels, persisted via `StorageKeys.BIBLE_FONT_SIZE`)
- Bookmark system (create/remove, stored in `StorageKeys.BIBLE_BOOKMARKS`, synced to Firestore per user via `BIBLE_BOOKMARKS_CHANGED` event)
- Copy passage text to clipboard
- **Community notes**: Collapsible notes panel per passage (`book:chapter` key). Auto-saved to `StorageKeys.BIBLE_NOTES` with 800ms debounce. Notes are loaded when navigating to a passage and cleared preview shown in collapsed state.
- **Daily devotional**: `DailyDevotional` component renders a curated reading plan (30 entries cycled by `dayOfYear % 30`). Each entry has a book, chapter, and theme. "Read Passage" button navigates to the passage and marks the day complete in `StorageKeys.BIBLE_DEVOTIONAL_LOG` (90-day rolling window to prevent unbounded growth).
- Last read position tracking (`StorageKeys.BIBLE_LAST_READ`)

### Worship Songs - `packages/worship-songs/`

Exposes `WorshipSongs` component via Module Federation.

**Key Behavior:**
- Song management (add, edit, delete) with CRUD via `window.__worshipSongs` Firestore bridge
- Two content formats: ChordPro (with bracket notation) and plain text
- Real-time transposition with semitone +/- controls and direct key picker
- Auto-scroll with adjustable speed (6 presets: 20-100ms/px), persisted via `StorageKeys.WORSHIP_SCROLL_SPEED`
- Copy lyrics to clipboard (strips ChordPro brackets for clean output)
- Print-friendly view via `window.print()`
- **YouTube link integration**: Optional `youtubeUrl` field on `WorshipSong` type. `SongEditor` renders a URL input; `SongViewer` renders a styled red "Watch on YouTube" `<a>` tag (opens `target="_blank"`, `rel="noopener noreferrer"`) when URL is present, hidden otherwise.
- **Built-in metronome**: `Metronome` component uses Web Audio API (`AudioContext` + `OscillatorNode`) for precise click timing. Optional `bpm` field on `WorshipSong` (30-240 range). Features: start/stop toggle, +/- BPM buttons, direct BPM number input, tap tempo (4-tap rolling average with 2s timeout), visual beat indicator (green flash). Always rendered in `SongViewer` below controls bar.
- **Capo calculator**: `CapoCalculator` component in `SongViewer` (ChordPro only). Collapsible panel showing fret positions 1-9 with resulting chord shape keys. Easy guitar keys (C, G, D, A, E) highlighted with green styling. Selecting a capo position adjusts displayed chords to the shape key (transposes content by `semitones - capoFret`). Formula: `shapeKey = transposeChord(soundingKey, -capoFret)`. Shows instruction panel when active and suggested easy-key positions when inactive.
- Favorites system with `StorageKeys.WORSHIP_FAVORITES`
- **Real-time sync** via Firestore `onSnapshot` — changes by any user push instantly to all connected clients; `useWorshipSongs` hook prefers `subscribe()` over one-shot `getAll()`, with localStorage cache as initial data
- Tag-based filtering and full-text search

### Notebook - `packages/notebook/`

Exposes `Notebook` component via Module Federation.

**Key Behavior:**
- Personal note-taking (create, edit, delete) with user-scoped Firestore subcollection (`users/{uid}/notes`)
- **Public Notes:** publish notes to shared `publicNotes` top-level collection, visible to all authenticated users
- "My Notes" / "Public Notes" tab navigation in the Notebook UI
- Publish button in NoteEditor creates a copy in `publicNotes` with `createdBy: { uid, displayName }`
- Public notes show green card styling with creator badge; publishing is irreversible
- **Real-time sync** for public notes via Firestore `onSnapshot` — `usePublicNotes` hook prefers `subscribePublic()` over one-shot `getAllPublic()`, falls back gracefully
- Search/filter notes by title or content
- Note count cached to `StorageKeys.NOTEBOOK_CACHE` for dashboard tile
- CRUD via `window.__notebook` Firestore bridge (same pattern as worship-songs)
- `WindowEvents.NOTEBOOK_CHANGED` for cross-tab cache invalidation
- Auth-gated: shows "Sign in" message when logged out

### Baby Tracker - `packages/baby-tracker/`

Exposes `BabyTracker` component via Module Federation. Port **3011**.

**Key Behavior:**
- Week-by-week baby growth tracking with fruit size comparisons (40-week hardcoded data)
- Encouraging pregnancy Bible verses (15 references) fetched from YouVersion API with shuffle button
- Estimated length/weight measurements with typical range (±15% length, ±20% weight)
- Due date input with dual persistence: `StorageKeys.BABY_DUE_DATE` (localStorage) + Firestore `babyDueDate` field
- `WindowEvents.BABY_DUE_DATE_CHANGED` bridges MFE ↔ shell AuthContext for Firestore sync
- Gestational week = `40 - ceil(weeksUntilDue)`, trimester display, ARIA progress bar
- Uses Apollo `GET_BIBLE_PASSAGE` query for accurate verse text from YouVersion API
- Route: `/baby`

### Child Development - `packages/child-development/`

Exposes `ChildDevelopment` component via Module Federation. Port **3012**.

**Key Behavior:**
- Informational developmental milestone reference from birth through age 5 (270 milestones, CDC guidelines)
- 6 developmental domains (Physical, Speech, Cognitive, Social, Health, Sensory) with color-coded domain icons
- 9 age ranges (0–3m, 3–6m, 6–9m, 9–12m, 12–18m, 18–24m, 2–3y, 3–4y, 4–5y)
- **Vertical timeline** — progressive disclosure with color-coded stage dots (green past, blue current, gray upcoming); past and current stages auto-expand, future stages collapse; domain filter chips to toggle visibility; milestones displayed as bullet points grouped by domain
- **CDC & AAP resource links** per age range stage linking to corresponding developmental guidelines
- Auto-calculated age from birth date with current age range highlighting
- Red flag indicators (~11% of milestones) for pediatrician consultation
- Encouraging Bible verses (15 references) for parents with shuffle
- Persistence: `StorageKeys.CHILD_NAME`, `CHILD_BIRTH_DATE` (localStorage)
- `WindowEvents.CHILD_DATA_CHANGED` bridges MFE ↔ shell for cross-tab sync
- Route: `/child-dev`

### Chinese Learning - `packages/chinese-learning/`

Exposes `ChineseLearning` component via Module Federation. Port **3013**.

**Key Behavior:**
- **Firestore-backed characters** — `chineseCharacters` collection (public read, authenticated write); CRUD via `window.__chineseCharacters` bridge; real-time `onSnapshot` subscription with `localStorage` cache (`StorageKeys.CHINESE_CHARACTERS_CACHE`)
- `useChineseCharacters` hook — mirrors `useWorshipSongs` pattern: real-time subscribe with one-shot fetch fallback, auth state detection, CRUD operations
- ~50 default characters seeded via `scripts/seed-chinese-characters.mjs` across 8 categories (Family, Feelings, Food, Body, House, Nature, Numbers, Phrases)
- **Character CRUD** — `CharacterEditor` modal with character, pinyin (with `PinyinKeyboard`), meaning, category; add/edit/delete with confirmation; creator/editor metadata
- **PinyinKeyboard** — compact toggle toolbar with tone-marked vowels grouped by base vowel (ā á ǎ à, ē é ě è, etc.); inserts at cursor position
- **Flashcard system** — front shows character, tap to flip for pinyin + meaning; navigation between characters; mark as mastered
- **Practice canvas** — Pointer Events API (`pointerdown/move/up`) drawing with reference character as `globalAlpha=0.15` watermark; undo (stroke history) and clear; `touch-action: none` prevents scroll interference
- **Character grid** — browse all characters grouped by category with green checkmark badges; edit button on hover (auth-gated); creator metadata tooltip
- Persistence: `StorageKeys.CHINESE_LEARNING_PROGRESS` (localStorage JSON: `{ masteredIds, lastDate }`)
- `WindowEvents.CHINESE_PROGRESS_CHANGED` bridges MFE ↔ shell AuthContext for Firestore sync
- `WindowEvents.CHINESE_CHARACTERS_CHANGED` invalidation signal for non-real-time consumers
- Route: `/chinese`

### English Learning - `packages/english-learning/`

Exposes `EnglishLearning` component via Module Federation. Port **3014**.

**Key Behavior:**
- ~80 daily English phrases across 8 categories (Greetings, Feelings, House, Food, Going Out, People, Time, Emergencies)
- **Lesson mode** — step-through phrases showing English, phonetic guide, and Chinese translation; mark as "Got It" to track completion
- **Quiz mode** — show Chinese phrase, pick correct English from 4 choices; auto-advance with correct/incorrect feedback; score tracking
- **Progress dashboard** — per-category progress bars, streak counter (consecutive days with quiz activity), quiz score history
- Persistence: `StorageKeys.ENGLISH_LEARNING_PROGRESS` (localStorage JSON: `{ completedIds, quizScores, lastDate }`)
- `WindowEvents.ENGLISH_PROGRESS_CHANGED` bridges MFE ↔ shell AuthContext for Firestore sync
- Route: `/english`

---

## Navigation & Discovery

### Breadcrumbs
**File:** `packages/shell/src/components/layout/Breadcrumbs.tsx`

A breadcrumb trail renders below the header on all feature pages (`/weather`, `/stocks`, etc.), showing "Home / Weather". Uses `useLocation()` to derive the current route segment and maps it to the i18n label key via `ROUTE_LABEL_KEYS`. Hidden on the home page.

### Recently Visited Pages
**File:** `packages/shell/src/hooks/useRecentlyVisited.ts`

Tracks the last 5 visited routes (excluding `/` and `/compare`) in `StorageKeys.RECENTLY_VISITED`. Surfaces recent pages in the command palette (Ctrl+K) as a "Recent Pages" section above the navigation items.

### Cross-Package Content Search
**File:** `packages/shell/src/hooks/useSearchableContent.ts`

Reads user-owned data from localStorage (stock watchlist, Bible bookmarks) and surfaces them as searchable items in the command palette (Ctrl+K). Content is read fresh each time the palette opens via a `useMemo` dependency on the `open` state, avoiding the need for cross-package event listeners. Results appear in a "Your Content" section between "Recent Pages" and "Quick Actions".

### Focus Management
**File:** `packages/shell/src/hooks/useFocusOnRouteChange.ts`

Moves focus to `#main-content` on route change (skipping initial render) so screen readers announce the new page content. Sets `tabindex="-1"` for programmatic focus.

---

## MFE Prefetch Strategy

The shell uses a three-layer loading strategy to balance initial page load speed with fast subsequent navigation between micro frontends.

### Layer 1 — Hover/Focus Prefetch

**File:** `packages/shell/src/components/layout/Layout.tsx`

When a user hovers or focuses a dropdown menu item (or the Home link), the shell fires a dynamic `import()` for that MFE's remote module. A `Set<string>` prevents duplicate loads.

```typescript
const prefetched = new Set<string>();
const ROUTE_MODULE_MAP: Record<string, () => Promise<unknown>> = {
  '/weather': () => import('weatherDisplay/WeatherDisplay'),
  '/stocks':  () => import('stockTracker/StockTracker'),
  '/podcasts': () => import('podcastPlayer/PodcastPlayer'),
  '/ai':      () => import('aiAssistant/AiAssistant'),
  '/bible':   () => import('bibleReader/BibleReader'),
  '/worship': () => import('worshipSongs/WorshipSongs'),
  '/notebook': () => import('notebook/Notebook'),
  '/baby':    () => import('babyTracker/BabyTracker'),
};

function prefetchRoute(path: string) {
  if (prefetched.has(path)) return;
  prefetched.add(path);
  ROUTE_MODULE_MAP[path]?.().catch(() => {});  // Fire and forget
}
```

Each nav link triggers prefetch on `onMouseEnter` and `onFocus`:

```tsx
<Link to="/weather" onMouseEnter={() => prefetchRoute('/weather')} onFocus={() => prefetchRoute('/weather')}>
```

**What happens on prefetch:**

```
1. prefetchRoute('/weather') called
2. import('weatherDisplay/WeatherDisplay') initiated
3. Module Federation downloads remoteEntry.js from the remote server
4. remoteEntry.js registers shared dependency versions & exports
5. Component JS bundle downloaded
6. CSS bundle downloaded and injected into <head>
7. Promise resolves; module cached in browser and prefetched Set
8. If user clicks the link → React Suspense resolves instantly (no spinner)
```

### Layer 2 — Lazy Loading with React.lazy + Suspense

**File:** `packages/shell/src/App.tsx`

All MFE routes use `React.lazy()` for code splitting. If the module was already prefetched (Layer 1), navigation is instant. Otherwise, `Suspense` shows a loading fallback while the module downloads.

```typescript
const WeatherDisplayMF = lazy(() => import('weatherDisplay/WeatherDisplay'));

<ErrorBoundary fallback={<WeatherDisplayFallback />}>
  <Suspense fallback={<Loading />}>
    <WeatherDisplayMF />
  </Suspense>
</ErrorBoundary>
```

### Layer 3 — PWA Service Worker Caching

**File:** `packages/shell/vite.config.ts` (Workbox runtime caching)

The PWA service worker caches `remoteEntry.js` files with a `NetworkFirst` strategy. On repeat visits, cached manifests are served instantly while a fresh copy is fetched in the background. External images (podcast artwork, weather icons) are cached with `CacheFirst` (30-day TTL, 200 max entries) so they remain visible offline.

```typescript
{
  urlPattern: /\/remoteEntry\.js$/,
  handler: 'NetworkFirst',
  options: {
    cacheName: 'mfe-remote-entries',
    expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 },
    cacheableResponse: { statuses: [0, 200] },
  },
}
```

### Build Configuration

All packages (shell + 9 MFEs) set `modulePreload: false` in their Vite build config. All packages also use `minify: 'esbuild'` for production JS minification. The shell additionally configures esbuild to strip `console.*` and `debugger` statements and remove legal comments, and uses cssnano in its PostCSS pipeline for aggressive CSS minification:

```typescript
// Shell esbuild options
esbuild: { drop: ['console', 'debugger'], legalComments: 'none' }
build: { modulePreload: false, minify: 'esbuild' }
```

`modulePreload: false` prevents Vite from injecting `<link rel="modulepreload">` tags in HTML, which would conflict with Module Federation's own module loading mechanism. Prefetch is instead controlled explicitly via the `import()` calls in Layer 1. `minify: 'esbuild'` ensures all federated remote chunks are minified, reducing bundle sizes without affecting module resolution (Module Federation uses explicit `exposes` config).

Heavy shared dependencies (`@apollo/client`, `graphql`) use `eager: false` in the federation config so they are not preloaded into the initial dependency graph — they are loaded on-demand when a remote MFE actually imports them.

### Trade-offs

| Benefit | Cost |
|---------|------|
| Near-instant navigation after hover | Network bandwidth for modules user may not visit |
| No loading spinner on click | CSS injected on hover can cause cascade conflicts (see [Pitfall #3](mfe-guide.md#3-prefetch-side-effects)) |
| SW cache speeds up repeat visits | Stale SW can serve outdated remoteEntry.js (see [Pitfall #11](mfe-guide.md#11-pwa-service-worker-interference-in-dev-mode)) |

### Reload Prompt Optimization

`ReloadPrompt.tsx` detects new service worker versions and prompts the user to reload:

| Mechanism | Value | Purpose |
|-----------|-------|---------|
| Polling interval | 30 s | Checks `registration.update()` periodically |
| `visibilitychange` listener | on tab focus | Triggers immediate check when user returns to tab |
| `registerType` | `'prompt'` | New SW waits; user clicks "Reload" to activate it |

**Important:** The Workbox config must **not** set `skipWaiting: true` or `clientsClaim: true` — those directives are injected into the SW file itself and would bypass the prompt, causing silent auto-refreshes (via stale-chunk recovery) instead of the intended banner.

**FCM service worker scope:** The Firebase Cloud Messaging service worker (`firebase-messaging-sw.js`) must be registered with an explicit scope (`/firebase-cloud-messaging-push-scope`) to avoid colliding with the PWA service worker at scope `/`. Without this, registering the FCM SW replaces the PWA registration, causing `useRegisterSW` to detect a false "update" and show the reload prompt in an infinite loop whenever push notifications are enabled.

The `visibilitychange` listener is the most impactful optimization — users returning to a tab after a deploy see the reload prompt almost instantly instead of waiting up to 30 seconds.

### Future Considerations

- `requestIdleCallback` — prefetch during browser idle time instead of on hover
- `IntersectionObserver` — prefetch when nav links scroll into the viewport

---

## Inter-MFE Communication

### Event Bus

A singleton event bus (`packages/shared/src/utils/eventBus.ts`) using two delivery mechanisms:

1. **In-process listeners** — for same-bundle communication (e.g., shell components)
2. **DOM CustomEvents** — for cross-MFE communication via `window.dispatchEvent`

```typescript
class EventBusImpl {
  private listeners: Map<string, Set<EventCallback>>;

  subscribe(event, callback)    // In-process listener, returns unsubscribe fn
  publish(event, data)          // Fires local listeners + dispatches DOM event
}

// For listening to events from OTHER micro frontends (DOM-level)
function subscribeToMFEvent(event, callback)  // window.addEventListener wrapper
```

### Event Types

```typescript
const MFEvents = {
  CITY_SELECTED:        'mf:city-selected',
  WEATHER_LOADED:       'mf:weather-loaded',
  NAVIGATION_REQUEST:   'mf:navigation-request',
  THEME_CHANGED:        'mf:theme-changed',
  USER_LOCATION_CHANGED: 'mf:user-location-changed',
  PODCAST_PLAY_EPISODE: 'mf:podcast-play-episode',
  PODCAST_CLOSE_PLAYER: 'mf:podcast-close-player',
}
```

### Communication Flows

**City Selection (primary flow):**
```
CitySearch.tsx                          CitySearchWrapper.tsx
(city-search MFE)                       (shell)
     |                                       |
     |-- eventBus.publish(CITY_SELECTED) --> eventBus.subscribe(CITY_SELECTED)
     |                                       |
     |                                       +--> addCity() -> Firestore
     |
     +-- navigate(/weather/:coords)
                                        WeatherDisplay.tsx
                                        (weather-display MFE)
                                             |
                                        subscribeToMFEvent(CITY_SELECTED)
                                             |
                                             +--> setLocation() -> fetch weather
```

**Geolocation Flow:**
```
UseMyLocation.tsx (shell)
     |
     +--> navigator.geolocation.getCurrentPosition()
     |
     +--> REVERSE_GEOCODE GraphQL query
     |
     +--> sessionStorage.setItem('selectedCity', ...)
     |
     +--> navigate(/weather/:lat,:lon)
```

**Persistent Podcast Player Flow:**
```
PodcastPlayer.tsx                           GlobalAudioPlayer.tsx
(podcast-player MFE)                        (shell)
     |                                           |
     |-- eventBus.publish(PODCAST_PLAY_EPISODE) --> subscribeToMFEvent(PODCAST_PLAY_EPISODE)
     |   { episode, podcast }                    |
     |                                           +--> setEpisode(episode)
     |                                           +--> setPodcast(podcast)
     |                                           +--> <audio> starts playback
     |                                           |
     |-- eventBus.publish(PODCAST_CLOSE_PLAYER) --> subscribeToMFEvent(PODCAST_CLOSE_PLAYER)
     |                                           |
     |                                           +--> audio.pause()
     |                                           +--> setEpisode(null)
     |
     +-- User navigates to /stocks, /weather, etc.
         GlobalAudioPlayer stays mounted in Layout (persists across routes)
```

---

## Data Flow

### Complete Data Flow Diagram

```
SHELL APP (Host)
|
+-- AuthProvider (Context)
|   +-- Firebase Auth subscription (onAuthStateChanged)
|   +-- User profile state (Firestore)
|   +-- Recent cities state
|
+-- ThemeProvider (Context)
|   +-- Theme state ('light' | 'dark')
|   +-- localStorage persistence
|   +-- System preference detection (prefers-color-scheme)
|
+-- ApolloProvider
|   +-- GraphQL client (HTTP + WS links)
|   +-- In-memory cache (normalized by lat/lon)
|
+-- Layout
    +-- ThemeToggle -> updateDarkMode() -> Firestore
    +-- UserMenu -> signIn/signOut -> Firebase Auth
    |
    +-- CitySearchWrapper (loads CitySearch MFE)
    |   +-- Listens to CITY_SELECTED event
    |   +-- Saves city to Firestore via addCity()
    |   +-- Passes recentCities as prop to CitySearch
    |
    +-- WeatherDisplay MFE
        +-- Listens to CITY_SELECTED event
        +-- useWeatherData hook
        +-- Queries GraphQL via Apollo
        +-- Renders current + forecast + hourly
```

---

## Persistence & Storage

### Firebase Firestore — User Profile

**Document path:** `users/{uid}`

```typescript
interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  darkMode: boolean;
  recentCities: RecentCity[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface RecentCity {
  id: string;           // "{lat},{lon}"
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
  searchedAt: Date;
}
```

**Recent Cities Rules:**
- Deduplicated by `id` on save (existing entry removed before prepend)
- Sorted by recency (newest first)
- Hard limit of 10 cities
- Only saved when user is authenticated

### Firebase Firestore — Announcements ("What's New")

**Collection path:** `announcements/{id}`

```typescript
interface Announcement {
  id: string;
  title: string;
  description: string;
  icon?: string;       // 'feature' | 'fix' | 'improvement' | 'announcement'
  createdAt: Timestamp;
}
```

- **Read:** Public (no auth required) — anonymous users can view announcements
- **Write:** Admin-only (Firebase console or backend) — no client writes
- **Read tracking:** Signed-in users store `lastSeenAnnouncementId` in their UserProfile; anonymous users use `localStorage('last-seen-announcement')`
- **Query:** `orderBy('createdAt', 'desc'), limit(20)` — newest first, bounded

### Firebase Firestore — Weather Alert Subscriptions

**Collection path:** `alertSubscriptions/{docId}`

```typescript
interface AlertSubscription {
  token: string;              // FCM device token
  cities: Array<{
    lat: number;
    lon: number;
    name: string;
  }>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

- **Subscribe:** `subscribeToAlerts` callable function — upserts by FCM token
- **Unsubscribe:** Call with empty `cities` array — deletes the document
- **Scheduled check:** `checkWeatherAlerts` runs every 30 minutes, fetches weather for all subscribed cities, sends FCM notifications for severe conditions (thunderstorm, heavy rain/snow, tornado, squall — 19 OpenWeather condition IDs)
- **Stale token cleanup:** Invalid/expired FCM tokens are batch-deleted after failed send attempts

### Firebase Firestore — Notebook Notes

**Collection path:** `users/{uid}/notes/{noteId}`

```typescript
interface Note {
  title: string;
  content: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

- **Privacy:** Firestore rules scope reads/writes to the owning user (`request.auth.uid == uid`)
- **Public Notes:** `publicNotes/{noteId}` top-level collection — any authenticated user can read/write. Each doc includes `isPublic: true`, `createdBy: { uid, displayName }`, `createdAt`, `updatedAt`. Publishing is one-way (cannot revert to private).
- **Dashboard:** Note count is cached to `StorageKeys.NOTEBOOK_CACHE` in localStorage for the dashboard widget
- **Window bridge:** `window.__notebook.getNoteCount()` provides note count to the Shell without direct MFE coupling

### Browser LocalStorage — Theme & Preferences

| Key | Value | Purpose |
|-----|-------|---------|
| `'theme'` | `'light'` or `'dark'` | Fast theme restore on page load (before Firestore loads) |
| `'weather-live-enabled'` | `'true'` or `'false'` | Weather live polling toggle state |
| `'stock-live-enabled'` | `'true'` or `'false'` | Stock live polling toggle state |
| `'stock-tracker-watchlist'` | JSON array | Stock watchlist items |
| `'podcast-subscriptions'` | JSON array of string IDs | Subscribed podcast feed IDs |
| `'podcast-speed'` | Number (e.g., `1.5`) | Podcast playback speed multiplier |
| `'podcast-progress'` | JSON object | Per-episode playback progress (resume position) |
| `'weather-dashboard-widgets'` | JSON object | Weather dashboard widget visibility toggles (incl. activitySuggestions) |
| `'widget-dashboard-layout'` | JSON array | Homepage widget order, visibility |
| `'recent-cities'` | JSON array | Recent city searches (localStorage fallback for non-auth users) |
| `'weather-alerts-enabled'` | `'true'` / `'false'` | Weather alert notifications toggle (Firestore sync when signed in) |
| `'podcast-alerts-enabled'` | `'true'` / `'false'` | Podcast alert notifications toggle (Firestore sync when signed in) |
| `'announcement-alerts-enabled'` | `'true'` / `'false'` | Announcement alert notifications toggle (Firestore sync when signed in) |
| `'last-seen-announcement'` | Announcement doc ID | Tracks last viewed announcement (anonymous users) |
| `'bible-translation'` | Bible version ID (e.g., `'1'` for KJV, `'111'` for NIV) | Selected YouVersion Bible version for passage reading |
| `'notebook-cache'` | JSON `{ count: number }` | Notebook note count for dashboard widget |
| `'baby-due-date'` | ISO date string (e.g., `'2026-08-15'`) | Baby due date for growth tracking |
| `'bottom-nav-order'` | JSON array of path strings | Mobile bottom nav item order (Firestore sync when signed in) |

### Browser SessionStorage — Geolocation

| Key | Value | Purpose |
|-----|-------|---------|
| `'selectedCity'` | City JSON | Temporary storage after reverse geocode lookup |

### Apollo In-Memory Cache

- Cache normalization by `lat` and `lon` coordinates
- Fetch policies: `cache-and-network` for watch queries, `network-only` for one-off queries
- Shared across all MFEs via the same Apollo Client instance

---

## GraphQL & Apollo Client

### Client Configuration

```typescript
// packages/shared/src/apollo/client.ts

// Environment-aware endpoint detection
const graphqlUrl = isProduction
  ? '/graphql'                          // Firebase Functions proxy
  : 'http://localhost:3003/graphql';    // Local dev server

// WebSocket subscriptions only in development
const wsUrl = isDev
  ? 'ws://localhost:3003/graphql'
  : null;                               // Disabled in production
```

**Cache Type Policies:**
```typescript
typePolicies: {
  Query: {
    fields: {
      weather:         { keyArgs: ['lat', 'lon'] },
      currentWeather:  { keyArgs: ['lat', 'lon'] },
      forecast:        { keyArgs: ['lat', 'lon'] },
      hourlyForecast:  { keyArgs: ['lat', 'lon'] },
    }
  }
}
```

### Queries & Subscription

| Query | Parameters | Returns |
|-------|-----------|---------|
| `GET_WEATHER` | `lat, lon` | `current` + `forecast[]` + `hourly[]` |
| `GET_CURRENT_WEATHER` | `lat, lon` | `CurrentWeather` |
| `GET_FORECAST` | `lat, lon` | `ForecastDay[]` |
| `GET_HOURLY_FORECAST` | `lat, lon` | `HourlyForecast[]` |
| `GET_HISTORICAL_WEATHER` | `lat, lon, date` | `HistoricalWeatherDay` (Open-Meteo archive) |
| `GET_AIR_QUALITY` | `lat, lon` | `AirQuality` (OpenWeather Air Pollution API) |
| `GET_CRYPTO_PRICES` | `ids[], vsCurrency` | `CryptoPrice[]` (CoinGecko) |
| `SEARCH_CITIES` | `query, limit` | `City[]` |
| `REVERSE_GEOCODE` | `lat, lon` | `City` |
| `WEATHER_UPDATES` (subscription) | `lat, lon` | `WeatherUpdate` (real-time) |

All weather queries share a `WeatherConditionFragment` for consistent field selection.

### Automatic Persisted Queries (APQ)

The Apollo Client link chain includes `createPersistedQueryLink` which sends a SHA-256 hash instead of the full query string on repeat requests. On the first request for a given query, the full query text is sent alongside the hash. On subsequent requests, only the hash is sent — the server recognizes the hash and executes the cached query. This reduces payload size for frequently-used queries. Hashing uses the browser-native `crypto.subtle.digest('SHA-256', ...)` (no extra dependencies).

The Cloud Functions GraphQL handler (`functions/src/index.ts`) passes `extensions` (containing the APQ hash) through to `server.executeOperation()`. Apollo Server 4's built-in APQ plugin handles the hash lookup with an in-memory cache. On cold starts, hash-only requests return `PersistedQueryNotFound`, the client retries with full query + hash, and subsequent hash-only requests succeed.

### useWeatherData Hook

```typescript
// packages/shared/src/hooks/useWeatherData.ts

function useWeatherData(lat, lon, enableRealtime) {
  // Always runs: HTTP query
  const { data, loading, error } = useQuery(GET_WEATHER, { variables: { lat, lon } });

  // Dev only: WebSocket subscription
  useSubscription(WEATHER_UPDATES, {
    skip: isProduction || !enableRealtime,
    variables: { lat, lon },
    onData: ({ data }) => { /* merge subscription data */ }
  });

  return {
    current,      // Subscription data takes priority over query data
    forecast,
    hourly,
    loading,
    error,
    isLive,       // True when subscription is active
    lastUpdate    // Timestamp of last subscription update
  };
}
```

---

## Authentication & User Profile

### Auth Flow

Users can sign in via **Google OAuth** or **email/password**. An `AuthModal` component provides both options in a tabbed dialog.

```
User clicks "Sign In" → AuthModal opens
     |
     ├── Google tab:    signInWithPopup(auth, GoogleAuthProvider)
     ├── Email sign-in: signInWithEmailAndPassword(auth, email, password)
     └── Email sign-up: createUserWithEmailAndPassword(auth, email, password)
                        + updateProfile(user, { displayName })
     |
     v
ensureUserProfile(user)          // Creates Firestore doc if first login
     |
     v
onAuthStateChanged fires
     |
     v
AuthProvider:
  +-- setUser(firebaseUser)
  +-- getUserProfile(uid)        // Fetch from Firestore
  +-- setProfile(profile)
  +-- setRecentCities(profile.recentCities)
```

Password reset is also available via `sendPasswordResetEmail(auth, email)`.

### Sign-Out & Cache Clearing

When a user signs out, `signOutUser()` performs three cleanup steps:

1. **Firebase sign-out** — `logOut()` clears the Firebase auth session.
2. **localStorage cleanup** — iterates `Object.values(StorageKeys)` and removes all user-specific keys. Device-level keys (`THEME`, `LOCALE`, `WEATHER_ALERTS`, `PODCAST_ALERTS`, `ANNOUNCEMENT_ALERTS`) are preserved so the next user inherits the device's display and notification preferences.
3. **Apollo cache reset** — `getApolloClient().clearStore()` wipes cached GraphQL responses (e.g., daily verse) so the next session starts fresh.

This prevents stale data (watchlists, bookmarks, baby tracker settings, widget layouts) from leaking between accounts on a shared device.

### Profile Operations

| Function | Description |
|----------|------------|
| `ensureUserProfile(user)` | Creates Firestore doc on first login |
| `getUserProfile(uid)` | Reads profile from Firestore |
| `addRecentCity(uid, city)` | Deduplicates, prepends, caps at 10, writes to Firestore |
| `getRecentCities(uid)` | Reads `recentCities` from profile |
| `updateUserDarkMode(uid, darkMode)` | Updates dark mode preference |

---

## Theme System

### Dual-Layer Persistence

The theme system uses two persistence layers for different purposes:

1. **LocalStorage** — fast restore on page load (avoids flash of wrong theme)
2. **Firestore** — cross-device sync for authenticated users

### Initialization Priority

```
1. Read localStorage('theme')
2. If not set, check system preference: matchMedia('prefers-color-scheme: dark')
3. Apply 'dark' class to <html> element
4. After auth loads: ThemeSync reads profile.darkMode from Firestore
5. If profile preference differs, override local theme
```

### ThemeSync Component

A side-effect-only component (`renders null`) that bridges auth and theme contexts:

```
Auth profile loads -> ThemeSync reads profile.darkMode -> setThemeFromProfile()
```

---

## Key Files Reference

| Component | File Path | Purpose |
|-----------|-----------|---------|
| **App (Shell)** | `packages/shell/src/App.tsx` | Routing, lazy MFE loading |
| **Layout** | `packages/shell/src/components/layout/Layout.tsx` | Header, grouped nav dropdowns, toggles, footer |
| **CitySearchWrapper** | `packages/shell/src/components/widgets/CitySearchWrapper.tsx` | MFE host, event listener, city persistence |
| **UseMyLocation** | `packages/shell/src/components/widgets/UseMyLocation.tsx` | Geolocation + reverse geocode |
| **FavoriteCities** | `packages/shell/src/components/widgets/FavoriteCities.tsx` | Favorited cities grid |
| **WeatherCompare** | `packages/shell/src/components/widgets/WeatherCompare.tsx` | Legacy multi-city comparison page |
| **WeatherComparison** | `packages/weather-display/src/components/WeatherComparison.tsx` | Inline weather comparison (within weather detail) |
| **HistoricalWeather** | `packages/weather-display/src/components/HistoricalWeather.tsx` | "This day last year" side-by-side comparison |
| **WidgetDashboard** | `packages/shell/src/components/widgets/WidgetDashboard.tsx` | Drag-and-drop customizable widget grid |
| **PwaInstallPrompt** | `packages/shell/src/components/layout/PwaInstallPrompt.tsx` | Add to Home Screen banner |
| **DashboardPage** | `packages/shell/src/pages/DashboardPage.tsx` | Dashboard homepage with quick access cards |
| **SubscribedPodcasts** | `packages/podcast-player/src/components/SubscribedPodcasts.tsx` | Subscribed podcasts tab view |
| **NotificationBell** | `packages/shell/src/components/notifications/NotificationBell.tsx` | Push notification UI |
| **LanguageSelector** | `packages/shell/src/components/layout/LanguageSelector.tsx` | i18n language picker |
| **UnitToggle / SpeedToggle** | `packages/shell/src/components/settings/UnitToggle.tsx` | °C/°F and wind speed toggles |
| **AuthModal** | `packages/shell/src/components/layout/AuthModal.tsx` | Sign in/up dialog (Google + email/password) |
| **AuthContext** | `packages/shell/src/context/AuthContext.tsx` | User state, recent/favorite cities, profile ops |
| **ThemeContext** | `packages/shell/src/context/ThemeContext.tsx` | Theme state, localStorage, system pref |
| **RemoteConfigContext** | `packages/shell/src/context/RemoteConfigContext.tsx` | Firebase Remote Config feature flags |
| **ThemeSync** | `packages/shell/src/components/sync/ThemeSync.tsx` | Auth -> theme sync |
| **Firebase Lib** | `packages/shell/src/lib/firebase.ts` | Firestore CRUD, auth, FCM, App Check |
| **CitySearch** | `packages/city-search/src/components/CitySearch.tsx` | Search UI, debounce, event publishing |
| **WeatherDisplay** | `packages/weather-display/src/components/WeatherDisplay.tsx` | Weather UI, event listener, subscriptions |
| **CurrentWeather** | `packages/weather-display/src/components/CurrentWeather.tsx` | Current conditions display |
| **Forecast** | `packages/weather-display/src/components/Forecast.tsx` | 7-day forecast grid |
| **StockTracker** | `packages/stock-tracker/src/components/StockTracker.tsx` | Stock quotes and watchlist |
| **CryptoTracker** | `packages/stock-tracker/src/components/CryptoTracker.tsx` | Live crypto prices (CoinGecko) |
| **useCryptoPrices** | `packages/shared/src/hooks/useCryptoPrices.ts` | Crypto price data fetching hook |
| **PullToRefresh** | `packages/shared/src/components/PullToRefresh.tsx` | Shared pull-to-refresh gesture wrapper for mobile PWA (Weather, Stocks, Crypto, Notebook, Worship) |
| **GlobalAudioPlayer** | `packages/shell/src/components/player/GlobalAudioPlayer.tsx` | Persistent audio player (shell-level, survives route changes) |
| **PodcastPlayer** | `packages/podcast-player/src/components/PodcastPlayer.tsx` | Podcast search, episodes, event publishing |
| **AiAssistant** | `packages/ai-assistant/src/components/AiAssistant.tsx` | AI chat UI (Gemini) |
| **Event Bus** | `packages/shared/src/utils/eventBus.ts` | Cross-MFE communication |
| **Apollo Client** | `packages/shared/src/apollo/client.ts` | GraphQL setup, caching |
| **Queries** | `packages/shared/src/apollo/queries.ts` | GraphQL queries & subscription |
| **useWeatherData** | `packages/shared/src/hooks/useWeatherData.ts` | Weather data fetching + real-time |
| **useHistoricalWeather** | `packages/shared/src/hooks/useHistoricalWeather.ts` | Historical weather (Open-Meteo) |
| **useAirQuality** | `packages/shared/src/hooks/useAirQuality.ts` | Air quality data (OpenWeather Air Pollution) |
| **AirQuality** | `packages/weather-display/src/components/AirQuality.tsx` | AQI display with pollutant breakdown |
| **ActivitySuggestions** | `packages/weather-display/src/components/ActivitySuggestions.tsx` | Weather-based activity recommendations |
| **i18n** | `packages/shared/src/i18n/` | Translation files and hook |
| **GraphQL Server** | `server/index.ts` | Local dev Express + Apollo + WebSocket |
| **GraphQL Schema** | `server/graphql/schema.ts` | Type definitions + subscription |
| **GraphQL Resolvers** | `server/graphql/resolvers.ts` | Query + subscription resolvers |
| **BibleReader** | `packages/bible-reader/src/components/BibleReader.tsx` | Bible reading UI with chapter navigation |
| **DailyDevotional** | `packages/bible-reader/src/components/DailyDevotional.tsx` | Daily reading plan with progress tracking |
| **WorshipSongs** | `packages/worship-songs/src/components/WorshipSongs.tsx` | Song library, search, and song viewer |
| **SongEditor** | `packages/worship-songs/src/components/SongEditor.tsx` | Chord and lyrics editor |
| **Metronome** | `packages/worship-songs/src/components/Metronome.tsx` | Built-in metronome with BPM control |
| **CapoCalculator** | `packages/worship-songs/src/components/CapoCalculator.tsx` | Capo position calculator with easy key suggestions |
| **Notebook** | `packages/notebook/src/components/Notebook.tsx` | Personal & public note-taking UI with tab navigation |
| **NoteEditor** | `packages/notebook/src/components/NoteEditor.tsx` | Note create/edit form with publish button |
| **useNotes** | `packages/notebook/src/hooks/useNotes.ts` | Private notebook CRUD hook via window bridge |
| **usePublicNotes** | `packages/notebook/src/hooks/usePublicNotes.ts` | Public notes CRUD hook via window bridge |
| **Web Vitals** | `packages/shared/src/utils/webVitals.ts` | Core Web Vitals reporting (LCP, CLS, INP) |
| **tracedLazy** | `packages/shell/src/lib/tracedLazy.ts` | React.lazy wrapper with Firebase Performance traces for MFE loads |
| **Firebase Functions** | `functions/src/index.ts` | Production Cloud Functions (GraphQL, proxies, AI) |
| **CI Workflow** | `.github/workflows/ci.yml` | PR checks: typecheck, lint, test |
| **Deploy Workflow** | `.github/workflows/deploy.yml` | Firebase Hosting deployment on push to main |
| **E2E Workflow** | `.github/workflows/e2e.yml` | Playwright E2E tests on PR (mocked + emulator) |
| **Mock API Server** | `scripts/mock-api-server.mjs` | Simulates all 6 external APIs for emulator tests |
| **Firestore Seed** | `scripts/seed-firestore.mjs` | Seeds Firestore emulator with test data |
| **Emulator Env** | `.env.emulator` | Points Cloud Functions to mock API server |

---

## Project Structure

```
mycircle/
+-- packages/
|   +-- shared/                  # Shared types, utilities, Apollo client, i18n
|   |   +-- src/
|   |       +-- apollo/          # Client factory, queries, fragments
|   |       +-- hooks/           # useWeatherData and other shared hooks
|   |       +-- i18n/            # Internationalization (translations)
|   |       +-- types/           # TypeScript interfaces
|   |       +-- utils/           # Event bus, weather helpers, daily verse/devotional
|   |       +-- data/            # Static data files
|   |       +-- index.ts         # Barrel exports
|   +-- shell/                   # Host micro frontend
|   |   +-- src/
|   |       +-- components/
|   |       |   +-- layout/      # Layout, BottomNav, ThemeToggle, UserMenu, etc.
|   |       |   +-- widgets/     # WidgetDashboard, CitySearchWrapper, FavoriteCities, etc.
|   |       |   +-- notifications/ # NotificationBell, WhatsNew, WhatsNewButton
|   |       |   +-- player/      # GlobalAudioPlayer
|   |       |   +-- common/      # Loading, ErrorBoundary
|   |       |   +-- settings/    # UnitToggle, SpeedToggle
|   |       |   +-- sync/        # ThemeSync, DataSync, ReloadPrompt, Onboarding
|   |       +-- context/         # AuthContext, ThemeContext, RemoteConfigContext
|   |       +-- hooks/           # useDailyVerse, useAnnouncements
|   |       +-- lib/             # Firebase integration (auth, Firestore, FCM, App Check)
|   |       +-- App.tsx          # Routes & providers
|   +-- city-search/             # City search micro frontend
|   |   +-- src/
|   |       +-- components/      # CitySearch
|   |       +-- test/
|   +-- weather-display/         # Weather display micro frontend
|   |   +-- src/
|   |       +-- components/      # WeatherDisplay, CurrentWeather, Forecast, HourlyForecast
|   |       +-- hooks/
|   |       +-- test/
|   +-- stock-tracker/           # Stock tracker micro frontend
|   |   +-- src/
|   |       +-- components/      # StockTracker, quote display, watchlist
|   |       +-- hooks/
|   |       +-- test/
|   +-- podcast-player/          # Podcast player micro frontend
|   |   +-- src/
|   |       +-- components/      # PodcastPlayer, episode list, audio player
|   |       +-- hooks/
|   |       +-- test/
|   +-- ai-assistant/            # AI assistant micro frontend
|   |   +-- src/
|   |       +-- components/      # AiAssistant, chat UI
|   |       +-- hooks/
|   |       +-- test/
|   +-- bible-reader/            # Bible reader micro frontend
|   |   +-- src/
|   |       +-- components/      # BibleReader, DailyDevotional, CommunityNotes
|   |       +-- hooks/
|   |       +-- test/
|   +-- worship-songs/           # Worship songs micro frontend
|   |   +-- src/
|   |       +-- components/      # WorshipSongs, SongViewer, SongEditor, Metronome
|   |       +-- hooks/
|   |       +-- test/
|   +-- notebook/                # Notebook micro frontend
|       +-- src/
|           +-- components/      # Notebook, NoteList, NoteEditor, NoteCard
|           +-- hooks/
|           +-- test/
+-- server/                      # Local development GraphQL server
|   +-- index.ts                 # Entry — Apollo + REST proxies + AI endpoint
|   +-- api/                     # OpenWeather & geocoding API clients
|   +-- graphql/                 # Schema, resolvers, pubsub
|   +-- middleware/              # Server-side caching
|   +-- types/                   # Server TypeScript types
+-- functions/                   # Firebase Cloud Functions (production)
|   +-- src/
|       +-- index.ts             # GraphQL, stock proxy, podcast proxy, AI chat
|       +-- schema.ts            # GraphQL schema (production)
|       +-- resolvers.ts         # Self-contained resolvers
|       +-- recaptcha.ts         # reCAPTCHA verification
+-- e2e/                         # Playwright end-to-end tests
|   +-- fixtures.ts              # Browser-level API mocks (page.route)
|   +-- emulator/                # Full-stack emulator tests (no browser mocks)
|   |   +-- fixtures.ts          # Emulator test setup (onboarding dismiss only)
|   |   +-- smoke.spec.ts        # Smoke tests through emulated stack
|   +-- integration/             # Integration tests against deployed app
+-- scripts/
|   +-- check-shared-versions.mjs # MFE shared dep version-drift check
|   +-- assemble-firebase.mjs   # Firebase build assembly
|   +-- generate-icons.mjs      # PWA icon generation
|   +-- serve-static.mjs        # Serve dist/firebase on port 3000 for CI
|   +-- mock-api-server.mjs     # Mock all external APIs on port 4000
|   +-- seed-firestore.mjs      # Seed Firestore emulator with test data
+-- .github/
|   +-- workflows/
|       +-- ci.yml              # PR checks (typecheck, test)
|       +-- deploy.yml          # Firebase deploy on push to main
|       +-- e2e.yml             # Playwright E2E tests on PR
+-- docs/
|   +-- architecture.md         # This file
|   +-- agent-guide.md          # AI agent development guide (i18n, a11y, theme, responsive, CI)
+-- firebase.json               # Firebase hosting + functions config
+-- firestore.rules             # Firestore security rules
+-- pnpm-workspace.yaml        # Workspace package declarations
+-- package.json                # Root workspace config
```

---

## CI/CD

GitHub Actions workflows automate testing and deployment:

| Workflow | File | Trigger | Steps |
|----------|------|---------|-------|
| **CI** | `.github/workflows/ci.yml` | PR to `main` | Install → Check shared dep versions → Typecheck → Unit tests |
| **Deploy** | `.github/workflows/deploy.yml` | Push to `main` | Install → Build (with VITE_* secrets) → Deploy Hosting → Deploy Functions+Firestore → Smoke test |
| **E2E (mocked)** | `.github/workflows/e2e.yml` (`e2e` job) | PR to `main` | Install → Playwright install → Build → E2E tests (browser-level mocks) |
| **E2E (emulator)** | `.github/workflows/e2e.yml` (`e2e-emulator` job) | PR to `main` | Install → Java setup → Build → Mock API + Firebase emulators → Seed Firestore → Full-stack E2E tests |

All workflows use `pnpm/action-setup@v4`, `actions/setup-node@v4` with Node 22 and pnpm dependency caching. The deploy workflow authenticates via **Workload Identity Federation** (`google-github-actions/auth@v2`) — no service account keys required. `VITE_FIREBASE_*` GitHub secrets are injected during the build step so Vite can embed Firebase client config.

### Shared Dependency Safety

Three layers prevent shared dependency version drift across micro frontends:

| Layer | Mechanism | Catches issues at |
|-------|-----------|-------------------|
| **pnpm catalogs** | All packages use `catalog:` references in `package.json`, resolved from `pnpm-workspace.yaml` | Install time |
| **CI check script** | `scripts/check-shared-versions.mjs` compares version specifiers across all `packages/*/package.json` | PR pipeline |
| **Singleton enforcement** | `singleton: true` + `requiredVersion` in every `vite.config.ts` shared config | Build / runtime |

The Deploy workflow authenticates via **Workload Identity Federation** (keyless) using a service account that requires specific IAM roles — notably **Cloud Scheduler Admin** for scheduled functions (`checkWeatherAlerts`) and **Secret Manager Viewer/Accessor** for function secrets. See [workload-identity-federation-setup.md](workload-identity-federation-setup.md) for the full role list and troubleshooting.

See [cicd.md](cicd.md) for a detailed CI/CD flow guide with setup instructions and deploy troubleshooting.

---

## Cloud Functions

All Cloud Functions are defined in `functions/src/index.ts` and deployed via `firebase deploy --only functions`.

| Function | Type | Route / Trigger | Memory | Timeout | Secrets |
|----------|------|----------------|--------|---------|---------|
| `graphql` | `onRequest` | `/graphql` | 512 MiB | 60s | OPENWEATHER, FINNHUB, PODCASTINDEX keys |
| `stockProxy` | `onRequest` | `/stock/**` | 256 MiB | 30s | FINNHUB_API_KEY |
| `podcastProxy` | `onRequest` | `/podcast/**` | 256 MiB | 30s | PODCASTINDEX keys |
| `aiChat` | `onRequest` | `/ai/chat` (POST) | 256 MiB | 60s | GEMINI, OPENWEATHER, FINNHUB, RECAPTCHA keys |
| `subscribeToAlerts` | `onCall` | Callable | Default | Default | — |
| `checkWeatherAlerts` | `onSchedule` | Every 30 minutes | 256 MiB | 120s | OPENWEATHER_API_KEY |

### Rate Limiting

IP-based rate limiting via `node-cache` (in-memory, per-instance):

| Function | Limit | Window |
|----------|-------|--------|
| `stockProxy` | 60 requests | 60 seconds |
| `podcastProxy` | 60 requests | 60 seconds |
| `aiChat` | 10 requests | 60 seconds |

### Authentication

- `stockProxy`, `aiChat`: Require Firebase Auth ID token (`Authorization: Bearer <token>`)
- `podcastProxy`: Public (no auth required) — allows unauthenticated podcast browsing with rate limiting
- `graphql`: Requires auth for stock/podcast operations (checked by operation name)
- `subscribeToAlerts`: Enforces App Check
- `graphql`: Optionally verifies App Check token if present

### AI Chat Function Calling

The `aiChat` function uses Gemini's function calling to execute tools:

| Tool | Description | External API |
|------|-------------|-------------|
| `getWeather` | Geocode city + fetch current weather | OpenWeather |
| `searchCities` | Search cities by name | OpenWeather Geo |
| `getStockQuote` | Fetch stock price by symbol | Finnhub |
| `getCryptoPrices` | Fetch top 5 crypto prices | CoinGecko |
| `navigateTo` | Navigate user to an app page | — (client-side) |

Context injection: The system instruction is enriched with user context (favorite cities, stock watchlist, podcast subscriptions, temperature unit, locale, current page) for personalized responses.

### Configurable Base URLs

All external API base URLs are configurable via environment variables (defaults to production):

```
OPENWEATHER_BASE_URL, FINNHUB_BASE_URL, COINGECKO_BASE_URL,
PODCASTINDEX_BASE_URL, YOUVERSION_API_BASE_URL, OPEN_METEO_BASE_URL
```

This is used by the emulator testing infrastructure (`.env.emulator`) to redirect API calls to a local mock server on port 4000.

---

## Security

### CORS
All Cloud Functions (`graphql`, `stockProxy`, `podcastProxy`, `aiChat`) restrict CORS to whitelisted origins:
- `https://mycircle-app.web.app`
- `https://mycircle-app.firebaseapp.com`
- `http://localhost:3000`

### Rate Limiting
Per-IP in-memory rate limiter using `NodeCache`:
- **AI Chat**: 10 requests/minute
- **Stock Proxy**: 60 requests/minute
- **Podcast Proxy**: 60 requests/minute

### Input Validation
Zod schema validation on AI chat request body:
- `message`: string, 1-5000 chars (required)
- `history`: array of `{ role, content }` objects (optional)
- `context`: arbitrary key-value object (optional)

### reCAPTCHA v3
The AI chat endpoint verifies `x-recaptcha-token` header via `verifyRecaptchaToken()`. Graceful: if token is missing, the request proceeds (backward compatibility during rollout). The client-side `useAiChat` hook obtains tokens via `getRecaptchaToken('ai_chat')` from `@mycircle/shared`.

## Observability

### Structured Logging
All Firebase Cloud Functions use `firebase-functions/logger` (`logger.info`, `logger.warn`, `logger.error`) instead of `console.log/warn/error`. Structured metadata objects are attached to log messages for easier filtering and search in Google Cloud Logging (e.g., `logger.error('Stock proxy error', { path, error: err.message })`).

### Sentry Error Tracking
The shell host initializes `@sentry/react` in `main.tsx` before `createRoot()` (only when `VITE_SENTRY_DSN` is set and in production mode). Features:
- **Browser Tracing**: Automatic performance monitoring for page loads and navigation
- **Session Replay**: 10% of sessions recorded normally, 100% on error for debugging
- **Error Boundary Capture**: `ErrorBoundary.tsx` calls `Sentry.captureException()` with React component stack context
- **Trace Propagation**: Traces propagate to `localhost` and `mycircle-app.web.app`

### Web Vitals
Core Web Vitals are measured using the `web-vitals` library via `reportWebVitals()` from `@mycircle/shared`. Metrics reported: LCP, CLS, INP, FCP, TTFB. Each metric includes the current route path for per-MFE analysis. In development, metrics are logged to the console. In production, metrics are sent via `navigator.sendBeacon('/api/vitals')`.

### Firebase Performance Custom Traces
Each micro-frontend's chunk load is wrapped with a Firebase Performance `trace()` via the `tracedLazy()` utility (`packages/shell/src/lib/tracedLazy.ts`). This replaces bare `React.lazy()` calls in `App.tsx` and measures wall-clock time from dynamic `import()` initiation to module evaluation. Traces are named `mfe_<name>_load` (e.g., `mfe_weather_load`, `mfe_stocks_load`) and appear in **Firebase Console > Performance > Custom traces**. The utility uses a getter function (`getPerf`) to avoid capturing a stale `null` before Firebase initializes. When `perf` is null (tests, Firebase disabled), tracing is skipped gracefully. See [`docs/analytics-and-tracking.md`](./analytics-and-tracking.md#custom-mfe-load-traces) for the full trace name table and console viewing instructions.

### Lighthouse CI
Every pull request triggers a Lighthouse CI run (`.github/workflows/lighthouse.yml`) that builds the shell and audits it against four categories. Accessibility is gated at ≥ 90 (`error` level), while performance, best practices, and SEO use `warn` at ≥ 80-90. Results are uploaded to Lighthouse's temporary public storage. Configuration lives in `.lighthouserc.json`.

---

## Docker Self-Hosting

As an alternative to Firebase Hosting, MyCircle can be self-hosted on a Synology DS1525+ NAS (or any Docker host).

### Architecture

```
Internet → [Router :443] → Caddy (auto-HTTPS) → mycircle-app (Node.js :3000)
                                                   ├─ /graphql      → Apollo Server (GraphQL + WS subscriptions)
                                                   ├─ /ai/chat      → Gemini AI proxy
                                                   ├─ /stock/**     → Finnhub proxy (cached, rate-limited)
                                                   ├─ /podcast/**   → PodcastIndex proxy (cached, rate-limited)
                                                   ├─ /health       → Health check
                                                   └─ /*            → Static files (SPA with MFE fallback)
```

A single Node.js container (`server/production.ts`) serves both the assembled static assets (`dist/firebase/`) and all API routes. Firebase client SDKs (Auth, Firestore, FCM) still talk directly to Google's cloud — only the hosting and API backend are self-hosted.

### Key Files

| File | Purpose |
|------|---------|
| `server/production.ts` | Production entry point — extends the dev server with proxies + static serving |
| `server/index.ts` | Dev server — exports `createApp()` used by both dev and production |
| `deploy/docker/Dockerfile` | Multi-stage build (builder → runtime) |
| `deploy/docker/docker-compose.yml` | App + Caddy orchestration |
| `deploy/docker/Caddyfile` | Reverse proxy, auto-HTTPS, security headers |
| `deploy/docker/.env.example` | Runtime secrets template |
| `.github/workflows/docker-deploy.yml` | CI: build image → push to GHCR |
| `.dockerignore` | Excludes test/docs/functions from Docker context |

### CI Pipeline

The `docker-deploy.yml` workflow triggers on push to `main` (same path filters as `deploy.yml`). It builds the Docker image with Vite build-time secrets (`VITE_FIREBASE_*`) passed as `--build-arg`, tags it with the commit SHA and `latest`, and pushes to GitHub Container Registry (GHCR). The build uses GitHub Actions cache (`type=gha`) for Docker layer caching.

### Deployment Guide

See [`deploy/docker/README.md`](../deploy/docker/README.md) for the complete step-by-step Synology deployment guide, including Watchtower auto-updates and Cloudflare Tunnel alternative.
