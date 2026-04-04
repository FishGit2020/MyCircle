# MyCircle — Personal Dashboard

A modern personal dashboard built with **micro frontend architecture**, React, GraphQL, and deployed on Firebase. MyCircle brings together 27 micro frontends — weather, stocks, podcasts, AI chat, Bible reading, worship songs, digital library, transit tracking, travel maps, coding interviews, web crawling, and much more — into a single unified experience.

**Live Demo:** https://mycircle-dash.web.app

[![CI](https://github.com/FishGit2020/MyCircle/actions/workflows/ci.yml/badge.svg)](https://github.com/FishGit2020/MyCircle/actions/workflows/ci.yml)
[![E2E Tests](https://github.com/FishGit2020/MyCircle/actions/workflows/e2e.yml/badge.svg)](https://github.com/FishGit2020/MyCircle/actions/workflows/e2e.yml)
[![Deploy](https://github.com/FishGit2020/MyCircle/actions/workflows/deploy.yml/badge.svg)](https://github.com/FishGit2020/MyCircle/actions/workflows/deploy.yml)
[![Lighthouse CI](https://github.com/FishGit2020/MyCircle/actions/workflows/lighthouse.yml/badge.svg)](https://github.com/FishGit2020/MyCircle/actions/workflows/lighthouse.yml)
[![CodeQL](https://github.com/FishGit2020/MyCircle/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/FishGit2020/MyCircle/actions/workflows/github-code-scanning/codeql)
[![Docker Deploy](https://github.com/FishGit2020/MyCircle/actions/workflows/docker-deploy.yml/badge.svg)](https://github.com/FishGit2020/MyCircle/actions/workflows/docker-deploy.yml)
[![Dependabot](https://img.shields.io/badge/dependabot-enabled-blue?logo=dependabot)](https://github.com/FishGit2020/MyCircle/security/dependabot)

![Built with React](https://img.shields.io/badge/React-18.2-blue)
![Micro Frontends](https://img.shields.io/badge/Micro%20Frontends-Vite%20Federation-green)
![Firebase](https://img.shields.io/badge/Firebase-Hosting%20%2B%20Functions-orange)
![Node.js](https://img.shields.io/badge/Node.js-22-brightgreen)

## Features

### Dashboard
- Dashboard homepage with quick-access cards for all features
- **Customizable widget dashboard** — drag-and-drop reordering (desktop), tap-to-move buttons (mobile), visibility toggles, layout persistence
- **Smart widget visibility** — widgets only appear when the user has engagement data (e.g., stock watchlist, baby due date, learning progress); Weather and Verse always visible
- **Desktop Quick Access tiles** — responsive grid of navigation tiles to all features (hidden on mobile, where BottomNav serves the same purpose)
- **Per-widget error boundaries** — a crash in one widget doesn't take down the entire dashboard
- Favorite cities quick-access chips on weather widget
- Recent city searches for quick navigation
- **Customizable bottom navigation** — reorderable nav items with drag-and-drop, persisted per user (Firestore when signed in, localStorage fallback)
- **PWA Install Prompt** — Add to Home Screen banner with 7-day dismissal memory
- **PWA Home Screen Shortcuts** — long-press shortcuts to top features from the installed app icon (max 10 per browser spec)

### Weather
- **Enhanced city autocomplete** — inline recent city matching during search, localStorage fallback for non-auth users, "Clear all" recents
- Search for cities worldwide with autocomplete
- Current weather conditions with real-time live polling
- **7-day forecast** with expandable daily details (day/night temps, humidity, wind speed) and 48-hour hourly forecast with wind speed indicators
- Sun & visibility details (sunrise, sunset, daylight, visibility)
- "What to Wear" clothing suggestions
- **Activity suggestions** — weather-based outdoor/indoor activity recommendations (hiking, swimming, skiing, etc.) with collapsible card UI
- Geolocation ("Use My Location")
- Favorite & recent cities (synced via Firestore)
- **Weather comparison** — compare two cities side-by-side with inline city search, prominent "Compare" button in header, always-visible comparison section
- **Historical weather** — "This day last year" comparison using Open-Meteo archive API
- **Air Quality Index** — real-time AQI with color-coded levels, expandable pollutant breakdown (PM2.5, PM10, O₃, NO₂, SO₂, CO)
- Visible live/paused toggle with clear state indication
- **Widget settings** — show/hide individual weather widgets with Show All, Hide All, and Reset to defaults controls
- **Weather alerts** — subscribe to severe weather push notifications for your favorite cities; Cloud Function checks conditions every 30 minutes and sends FCM alerts for thunderstorms, heavy rain/snow, tornadoes, and other severe events

### Stocks & Crypto
- Real-time stock quotes via Finnhub API
- Symbol search and **watchlist** (shown first for quick access)
- Manual refresh button
- **Collapsible crypto tracker** — live BTC, ETH, SOL, ADA, DOGE prices via CoinGecko API with 7-day sparkline, market cap, 24h volume, and expandable detail cards; entire section collapses with persisted state

### Podcasts
- **Podcast browsing without login** — discover trending podcasts and search without authentication
- Episode playback with built-in audio player and adjustable playback speed
- **Persistent audio player** — continues playing across all routes (navigate to Stocks, Weather, etc. without interrupting playback)
- **Category/genre filtering** — browse trending podcasts by genre with filter chips, category badges on cards
- **Share episode clip** — share currently playing episode with timestamp via Web Share API or clipboard fallback; URL-based autoplay and episode share links for deep linking
- **Offline support** — podcast artwork cached by service worker (CacheFirst, 30-day TTL), playback speed and episode progress persisted to localStorage for seamless resume
- **Firestore progress persistence** — episode playback progress synced to Firestore for cross-device resume; progress bar on dashboard widget shows listening progress
- **Mark as played** — toggle episodes as played/unplayed with Firestore sync across devices; merges with auto-complete detection (95%+ progress)
- **Queue management** — inline queue dropdown on podcast detail page showing queued episode titles with remove buttons
- **Media Session API** — lock screen / notification media controls with artwork, title, and transport buttons (play, pause, skip forward/back)
- Podcast subscriptions with "My Subscriptions" tab (visible only when signed in)
- Subscribe/unsubscribe from any podcast feed

### Bible Reader
- Browse all 66 canonical books (Old & New Testament)
- Chapter selection grid and passage reading
- **Dynamic Bible version selector** — 19+ English translations (KJV, NIV, AMP, NASB, etc.) fetched from YouVersion API with localStorage persistence
- Verse of the Day
- Font size adjustment (14-22px) with persistence
- Bookmarks with localStorage persistence — clicking a bookmark navigates directly to the passage
- **Shareable URLs** — `?book=Genesis&chapter=1&version=111` search params for deep-linking and sharing passages
- Copy passage text to clipboard, share link button copies URL
- Copyright notice display for licensed translations
- **Daily devotional** — curated 30-entry reading plan cycled by day-of-year, with themed passage and "Read Passage" button, completion tracking (green checkmark persisted in localStorage, 90-day rolling window)

### Worship Songs
- Add, edit, and browse worship songs with ChordPro or plain text format
- Real-time transposition with direct key picker and semitone controls
- Auto-scroll with adjustable speed for live performance
- Copy lyrics to clipboard, **print support** — `@media print` CSS hides UI chrome and forces light theme for clean song output on paper
- **YouTube link integration** — optional YouTube URL per song; renders a styled "Watch on YouTube" button in the song viewer that opens in a new tab
- **Built-in metronome** — Web Audio API-powered metronome with BPM from song metadata (30-240 range), +/- controls, tap tempo (4-tap average), beat indicator flash, always visible in song viewer
- **Capo calculator** — collapsible panel showing all capo positions with resulting chord shapes, easy guitar keys (C, G, D, A, E) highlighted, one-click capo selection that adjusts displayed chords to shape key
- **Server-side search & filters** — GraphQL-powered search with server-side filtering by tag, key, and favorites; paginated results with page navigation instead of infinite scroll; Firestore composite indexes for fast queries
- **ProPresenter import** — import `.pro` files from ProPresenter to bulk-add songs with lyrics, keys, and metadata
- **CCLI Top 100** — browse and import from the CCLI Top 100 worship songs list
- **Download as file** — export songs for offline use or sharing
- Favorites, search, tag filtering
- **Real-time sync** — Firestore `onSnapshot` pushes changes instantly across devices/tabs; localStorage cache used as initial data

### Notebook
- Personal note-taking with Firestore persistence (user-scoped subcollection)
- Create, edit, and delete notes with search/filter
- Privacy: each user can only see their own notes
- **Public Notes**: publish notes to a shared `publicNotes` collection visible to all authenticated users, with **real-time sync** via Firestore `onSnapshot`
- Creator badge and green card styling distinguish public notes
- Note count cached for dashboard tile

### Baby Growth Tracker
- Week-by-week baby development tracking with fruit size comparisons
- Encouraging pregnancy Bible verses fetched from YouVersion API with shuffle
- Estimated length/weight measurements with typical range display
- Due date input with dual persistence (localStorage + Firestore)
- Gestational week calculation, trimester display, progress bar
- **Development timeline** — 10-stage visual timeline showing completed milestones (green checkmarks), currently developing stage (highlighted with badge), and upcoming stages; grouped by biological systems (heart, senses, brain, etc.) rather than individual weeks
- Dark mode, full i18n (English, Spanish, Chinese)

### Child Development Guide
- Informational developmental milestone reference from birth through age 5 (CDC guidelines)
- 5 developmental domains aligned with CDC/AAP guidelines: Physical & Motor, Language & Communication, Cognitive, Social & Emotional, Sensory (baby ages only)
- 195 milestones across 9 age ranges organized in a vertical timeline
- **Vertical timeline** — progressive disclosure with color-coded stage dots (green = past, blue = current, gray = upcoming); past and current stages auto-expand, future stages collapse; domain filter chips to toggle visibility
- **CDC & AAP resource links** — each age range stage links to corresponding CDC and AAP (HealthyChildren.org) developmental guidelines
- Auto-calculated age from birth date, current age range highlighted
- Red flag indicators for milestones that warrant pediatrician consultation
- Encouraging Bible verses for parents with shuffle
- Dark mode, full i18n (English, Spanish, Chinese)

### AI Assistant
- Conversational AI chat powered by Google Gemini via **GraphQL mutation** (`Mutation.aiChat`) with **SSE streaming** (`POST /ai/chat/stream`) for incremental token delivery (~200ms to first token, automatic GraphQL fallback)
- **Context-aware responses** — automatically gathers user data (stock watchlist, favorite cities, podcast subscriptions, preferences) and injects into Gemini system instruction for personalized answers
- **10 AI tools**: weather lookup, city search, stock quotes, crypto prices, page navigation, flashcard creation, Bible verse lookup, podcast search, Bible bookmarks, flashcard listing
- **Shared tool registry** — tool definitions in Zod (`scripts/mcp-tools/mfe-tools.ts`), auto-converted to Gemini format via bridge, eliminating duplicated declarations
- **Frontend actions** — tools like `navigateTo`, `addFlashcard`, `addBookmark` return actions that the frontend executes locally (cross-MFE events, localStorage writes)
- **Expandable debug panel** — click any tool call badge to see input args and raw JSON result; toggle debug mode via header button (persisted in localStorage)
- **Voice input** — microphone button using Web Speech API (`SpeechRecognition`) with pulsing visual feedback, graceful fallback (hidden when unsupported)
- Suggested prompt chips with crypto, weather, stock, navigation, flashcard, Bible, and podcast prompts

### Doc Scanner
- Pure Canvas/TypeScript document scanning — zero external image processing dependencies
- Camera capture (rear camera) + file upload fallback
- Automatic document edge detection via Canny edge detection + contour tracing + quad detection
- Manual corner adjustment with draggable handles
- Perspective correction via 4-point homography with bilinear interpolation
- B&W enhancement using adaptive threshold for scanned document look
- Auto-save to Cloud Files, scan history with thumbnails
- Download as JPEG + Web Share API support
- All image processing runs in a Web Worker for non-blocking UI

### AI Interviewer
- Coding interview practice with AI-generated questions and real-time evaluation
- **Working document** — live code editor for writing solutions during the interview
- **Typewriter effect** — AI responses stream in with a typewriter animation for natural conversation feel
- **Firebase persistence** — interview sessions and progress saved to Firestore per user
- Supports multiple programming languages and difficulty levels

### Transit Tracker
- Real-time bus arrival times via **OneBusAway API** (Puget Sound region)
- Search for transit stops by name or stop number
- **Favorite stops** — save frequently used stops for quick access, persisted to Firestore
- **URL routing** — deep-link to specific stops via `/transit/:stopId` for sharing and bookmarking
- Live countdown timers for upcoming arrivals

### Travel Map
- Interactive **world map** with color-coded pins for places lived, visited, and on your wishlist
- **Per-user Firestore storage** — each user's travel pins are private and synced across devices
- Add, edit, and remove pins with location search
- Visual distinction between lived (green), visited (blue), and wishlist (orange) locations

### Digital Library
- Personal e-book and audiobook library with Firestore-backed collection management
- **Audiobook chapter progress** — playback position persisted to Firestore per chapter for cross-device resume
- **Continue/autoplay from widget** — dashboard widget shows current book with resume button; autoplay continues from last position
- **Download support** — download books for offline reading
- Table of contents navigation, reader controls (font size, theme)
- Browser TTS (text-to-speech) fallback for books without audio

### Daily Log
- Firestore-backed daily journal with timeline view
- Create timestamped entries with rich text
- Visual timeline of past entries organized by day
- Real-time sync across devices

### Immigration Tracker
- Track immigration case timelines and status updates
- Add cases with receipt numbers, case types, and filing dates
- Visual case cards showing processing status and elapsed time
- Firestore persistence for cross-device access

### Family Games
- Collection of 12+ multiplayer party games: Memory, Simon Says, Trivia, Math Challenge, Anagram, Color Match, Reaction Time, Sequence, Maze, Word Game, and more
- **Scoreboard** — track scores across rounds with timer
- Heads Up-style category guessing game
- Family-friendly content with i18n support

### Poll System
- Create and vote on polls with real-time results
- Multiple poll types with customizable options
- Live vote tallying via Firestore real-time listeners
- Poll detail view with result visualization

### Radio Station
- Internet radio streaming with curated station directory
- Persistent player bar that continues across route navigation
- Station cards with genre categorization
- Background audio playback

### Trip Planner
- Plan and organize trips with itinerary management
- Trip detail view with day-by-day planning
- Create, edit, and delete trip entries
- Firestore persistence for cross-device access

### General
- Dark / light theme with system preference detection
- Multi-language support (i18n: English, Spanish, Chinese)
- Temperature (°C / °F) and wind speed (m/s, mph, km/h) unit toggles
- **Push notifications** — multi-category preferences (weather alerts, announcements) via Firebase Cloud Messaging, synced per user to Firestore for cross-device persistence
- **"What's New" announcements** — Firestore-backed changelog with sparkle icon, unread badge; auto-popup toast for unread announcements (1.5s delay, one-time per batch); dedicated `/whats-new` page with all announcements, NEW badges on unread, blue highlight; per-user read tracking (Firestore for signed-in, localStorage for anonymous)
- **Feedback without login** — anyone can submit feedback (Firestore rules validate data structure without requiring auth)
- **Offline sync** — Firestore offline persistence via `persistentLocalCache` with multi-tab support; floating `SyncIndicator` shows offline/synced status
- Offline indicator & PWA support with **fast update detection** (30s polling + visibility-change check, prompt-based reload banner)
- **Unified logger** — `createLogger('namespace')` utility in shared package for consistent, namespace-prefixed logging across all packages
- **Mobile UX** — safe area insets for notched devices (iPhone X+), enlarged touch targets (40-48px) on audio player controls and nav editor, active state feedback on mobile buttons, **refresh buttons** on Weather, Stocks, Crypto, Notebook, and Worship Songs pages
- Firebase Auth (Google OAuth + email/password) with cross-device profile sync; **sign-out clears user-specific localStorage and Apollo cache** to prevent data leaking between accounts
- Firebase App Check for API protection
- Firebase Remote Config for feature flags
- GraphQL API with Apollo Client caching and Automatic Persisted Queries (APQ)
- **Centralized Tailwind CSS** — single Tailwind build in the shell host scans all MFE sources, eliminating duplicate utility classes and specificity conflicts
- **Navigation & discovery** — breadcrumb trail on all feature pages, recently-visited pages in command palette (Ctrl+K), **cross-package content search** (stocks, Bible bookmarks searchable from Ctrl+K palette), focus management on route change for screen readers
- **Keyboard shortcuts** — `Ctrl/Cmd+K` command palette, `Ctrl/Cmd+D` dark mode toggle, `g` then letter for quick navigation (e.g., `g w` for Weather), `?` for shortcuts help
- **Accessibility** — ARIA live regions for loading/offline states, `role="alert"` for toast notifications, `aria-expanded`/`aria-haspopup` on menus, sr-only text for color-dependent stock indicators, `aria-valuetext` on audio progress bars, keyboard-focusable scroll regions, WCAG AA color contrast compliance (≥ 4.5:1 on all text elements including widget placeholders, buttons, and footer badges), 24px minimum touch targets
- **Performance** — production JS minification via esbuild with `drop: ['console', 'debugger']` and `legalComments: 'none'` (shell host + all 25 remote MFEs), CSS minification via cssnano in PostCSS pipeline, lazy federation shared deps (`eager: false` on `@apollo/client` and `graphql`), CSS code splitting, **code-split i18n** (Spanish/Chinese lazy-loaded, English synchronous fallback), `React.memo` on all dashboard widgets and list item components, `useReducer` for consolidated dashboard state, paginated episode list with "Show more" button, `useCallback` for stable handler references, **safe storage utility** (`safeGetItem`/`safeSetItem`/`safeGetJSON`) for localStorage resilience
- **Lighthouse CI** — automated Lighthouse scoring on every PR (accessibility ≥ 90 required, performance/SEO/best-practices ≥ 80-90 warned)

## Architecture

MyCircle uses a **micro frontend architecture** with Vite Module Federation. Each area of the app is an independently built and deployed module composed at runtime by the Shell host.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                               Firebase Hosting                                    │
├──────────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────┐ ┌─────────────┐ ┌─────────────────┐ ┌───────────────┐             │
│  │   Shell   │ │ City Search │ │ Weather Display │ │ Stock Tracker │             │
│  │  (Host)   │ │    (MFE)    │ │      (MFE)      │ │     (MFE)     │             │
│  │ Port 3000 │ │  Port 3001  │ │   Port 3002     │ │  Port 3005    │             │
│  └───────────┘ └─────────────┘ └─────────────────┘ └───────────────┘             │
│  ┌─────────────────┐ ┌──────────────┐ ┌───────────────┐ ┌────────────┐            │
│  │ Podcast Player  │ │ AI Assistant │ │ Bible Reader  │ │  Worship   │            │
│  │     (MFE)       │ │    (MFE)     │ │    (MFE)      │ │   Songs    │            │
│  │   Port 3006     │ │  Port 3007   │ │  Port 3008    │ │ Port 3009  │            │
│  └─────────────────┘ └──────────────┘ └───────────────┘ └────────────┘            │
│  ┌────────────┐ ┌──────────────┐ ┌───────────────────┐ ┌──────────────┐           │
│  │  Notebook  │ │ Baby Tracker │ │ Child Development │ │  Flashcards  │           │
│  │   (MFE)    │ │    (MFE)     │ │       (MFE)       │ │    (MFE)     │           │
│  │ Port 3010  │ │  Port 3011   │ │    Port 3012      │ │  Port 3015   │           │
│  └────────────┘ └──────────────┘ └───────────────────┘ └──────────────┘           │
│  ┌──────────────┐ ┌─────────────┐ ┌──────────────────┐ ┌───────────────┐          │
│  │  Daily Log   │ │ Cloud Files │ │  Model Benchmark │ │ Immigration   │          │
│  │    (MFE)     │ │    (MFE)    │ │      (MFE)       │ │   Tracker     │          │
│  │  Port 3016   │ │  Port 3017  │ │   Port 3004      │ │  Port 3018    │          │
│  └──────────────┘ └─────────────┘ └──────────────────┘ └───────────────┘          │
│  ┌──────────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────────────┐       │
│  │ Digital Library  │ │ Family Games │ │ Doc Scanner  │ │   Hiking Map    │       │
│  │      (MFE)       │ │    (MFE)     │ │    (MFE)     │ │     (MFE)       │       │
│  │   Port 3019      │ │  Port 3020   │ │  Port 3021   │ │   Port 3022     │       │
│  └──────────────────┘ └──────────────┘ └──────────────┘ └─────────────────┘       │
│  ┌──────────────┐ ┌─────────────┐ ┌──────────────────┐ ┌──────────────────┐       │
│  │ Trip Planner │ │ Poll System │ │  Radio Station   │ │ AI Interviewer   │       │
│  │    (MFE)     │ │    (MFE)    │ │      (MFE)       │ │      (MFE)       │       │
│  │  Port 3024   │ │  Port 3025  │ │   Port 3026      │ │   Port 3027      │       │
│  └──────────────┘ └─────────────┘ └──────────────────┘ └──────────────────┘       │
│  ┌─────────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────────────┐       │
│  │ Transit Tracker │ │  Travel Map  │ │ Deal Finder  │ │   Web Crawler   │       │
│  │      (MFE)      │ │    (MFE)     │ │    (MFE)     │ │      (MFE)      │       │
│  │   Port 3028     │ │  Port 3029   │ │  Port 3030   │ │   Port 3031     │       │
│  └─────────────────┘ └──────────────┘ └──────────────┘ └─────────────────┘       │
│  ┌────────────────┐ ┌─────────────────────┐                                      │
│  │ Resume Tailor  │ │ HSA Expense Tracker │                                      │
│  │     (MFE)      │ │       (MFE)         │                                      │
│  │  Port 3023     │ │    Port 3033        │                                      │
│  └────────────────┘ └─────────────────────┘                                      │
└──────────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                          Firebase Cloud Functions                                 │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │  GraphQL API (Apollo Server) · Stock Proxy · Podcast Proxy · AI · Transit │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│  OpenWeather · Finnhub · CoinGecko · PodcastIndex · Gemini · OneBusAway · OSRM   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Micro Frontends

| Module | Description | Exposes |
|--------|-------------|---------|
| **Shell** | Host app — routing, layout, auth, theme, notifications | — |
| **City Search** | City search with autocomplete & recent cities | `CitySearch` |
| **Weather Display** | Current weather, hourly & 7-day forecast, sun/visibility, clothing tips | `WeatherDisplay` |
| **Stock Tracker** | Real-time stock quotes, watchlist, and company news | `StockTracker` |
| **Podcast Player** | Podcast search, discovery, and episode playback | `PodcastPlayer` |
| **AI Assistant** | Conversational AI chat (Gemini) | `AiAssistant` |
| **Bible Reader** | Bible reading with daily devotionals and community notes | `BibleReader` |
| **Worship Songs** | Song library with lyrics, chord editor, YouTube links, metronome | `WorshipSongs` |
| **Notebook** | Personal & public note-taking with search and Firestore sync | `Notebook` |
| **Baby Tracker** | Baby growth tracking with weekly fruit comparisons and Bible verses | `BabyTracker` |
| **Child Development** | Postnatal milestone tracker (birth–5 years) across 5 CDC/AAP-aligned domains | `ChildDevelopment` |
| **Flashcards** | Unified learning hub: quiz mode, handwriting practice canvas, character editor with Pinyin keyboard, 88 English phrases, 3D flip cards, Bible verses, custom cards, and mastery tracking | `FlashCards` |
| **Daily Log** | Firestore-backed daily journal with timeline view and real-time sync | `DailyLog` |
| **Cloud Files** | Upload, share, and download files (images, PDFs, docs) via Cloud Function | `CloudFiles` |
| **Model Benchmark** | Compare AI model performance across Ollama endpoints (CPU vs GPU), nanosecond-precision timing | `ModelBenchmark` |
| **Hiking Map** | Interactive trail map with GPS auto-locate, tap-to-place waypoints, foot-routing via OSRM, offline tile cache (IndexedDB), saved routes, and topo/street style switcher | `HikingMap` |
| **Daily Log** | Firestore-backed daily journal with timeline view and real-time sync | `DailyLog` |
| **Immigration Tracker** | Immigration case timeline tracker with receipt numbers, status updates, and processing time | `ImmigrationTracker` |
| **Digital Library** | E-book and audiobook library with chapter progress, TTS fallback, and Firestore persistence | `DigitalLibrary` |
| **Family Games** | 12+ multiplayer party games (Memory, Simon, Trivia, Math, Anagram, Maze, etc.) with scoreboard | `FamilyGames` |
| **Doc Scanner** | Canvas-based document scanning with edge detection, perspective correction, and Web Worker processing | `DocScanner` |
| **Trip Planner** | Trip itinerary management with day-by-day planning and Firestore persistence | `TripPlanner` |
| **Poll System** | Create and vote on polls with real-time Firestore results | `PollSystem` |
| **Radio Station** | Internet radio streaming with curated station directory and persistent player bar | `RadioStation` |
| **AI Interviewer** | Coding interview practice with AI evaluation, working document, typewriter effect, and Firebase persistence | `AiInterviewer` |
| **Transit Tracker** | Real-time bus arrivals via OneBusAway API (Puget Sound), favorite stops, URL routing | `TransitTracker` |
| **Travel Map** | World map with color-coded pins (lived/visited/wishlist) and per-user Firestore storage | `TravelMap` |
| **Deal Finder** | Curated deals and discounts discovery | `DealFinder` |
| **Web Crawler** | Submit URLs for crawling, extract content, view documents and real-time trace logs, search history | `WebCrawler` |
| **Resume Tailor** | AI-powered resume customization with fact bank, job description parsing, and application tracking | `ResumeTailor` |
| **HSA Expense Tracker** | Personal HSA expense tracker with receipt upload and reimbursement tracking | `HsaExpenses` |
| **Shared** | Apollo client, GraphQL queries, event bus, i18n, types, hooks, utilities | Library (not standalone) |

### Dashboard Widgets

The homepage features a customizable widget dashboard with drag-and-drop reordering and visibility toggles (layout persisted in localStorage):

| Widget | Icon | Data Source | Smart Visibility |
|--------|------|-------------|------------------|
| **Weather** | Cloud/sun | Favorite cities as quick-access chips | Always visible |
| **Bible Verse** | Book | Verse of the Day from curated collection | Always visible |
| **Podcasts** | Headphones | Latest episodes from subscribed feeds | Has subscriptions |
| **Notebook** | Pencil | Recent notes count from Firestore | Has saved notes |
| **Baby Tracker** | Heart | Current week + fruit comparison from localStorage | Has due date set |
| **Child Dev** | Shield | Child name + age + milestone progress from localStorage | Has birth date set |

### Routes

| Path | Page |
|------|------|
| `/` | Dashboard — quick access cards, city search, favorites, recents |
| `/weather/:lat,:lon` | Weather detail (with inline comparison) |
| `/stocks` | Stock tracker — watchlist + crypto overview |
| `/stocks/:symbol` | Stock drill-down — quote, chart, news |
| `/podcasts` | Podcast player (discover + subscriptions tabs) |
| `/podcasts/:podcastId` | Podcast drill-down — episode list |
| `/ai` | AI assistant |
| `/bible` | Bible reader with daily devotionals (supports `?book=X&chapter=Y&version=N`) |
| `/worship` | Worship song library — song list |
| `/worship/new` | New worship song editor |
| `/worship/:songId` | Worship song viewer |
| `/worship/:songId/edit` | Worship song editor |
| `/notebook` | Notebook — personal notes list |
| `/notebook/new` | New note editor |
| `/notebook/:noteId` | Note editor |
| `/baby` | Baby growth tracker with weekly development |
| `/child-dev` | Child development milestone tracker (birth–5 years) |
| `/flashcards` | Flashcards — quiz mode, handwriting practice, character editor, English phrases |
| `/hiking` | Hiking Map — GPS locate, tap-to-set waypoints, route planning, offline tiles |
| `/daily-log` | Daily Log — journal with timeline view |
| `/immigration` | Immigration Tracker — case timelines and status |
| `/library` | Digital Library — e-books and audiobooks |
| `/library/:bookId` | Book reader / audiobook player |
| `/family-games` | Family Games — 12+ party games |
| `/family-games/:gameType` | Individual game session |
| `/trips` | Trip Planner — itinerary management |
| `/polls` | Poll System — create and vote on polls |
| `/radio` | Radio Station — internet radio streaming |
| `/interview` | AI Interviewer — coding interview practice |
| `/transit` | Transit Tracker — real-time bus arrivals |
| `/transit/:stopId` | Transit stop detail with live arrivals |
| `/travel-map` | Travel Map — world map with travel pins |
| `/deals` | Deal Finder — curated deals and discounts |
| `/web-crawler` | Web Crawler — submit URLs, extract content, view documents and traces |
| `/resume` | Resume Tailor — AI-powered resume customization |
| `/hsa-expenses` | HSA Expense Tracker — healthcare expense and reimbursement tracking |
| `/compare` | Legacy multi-city comparison (still accessible) |

### Technology Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Build:** Vite 5, Module Federation
- **API:** Apollo Server 5, GraphQL
- **Data Sources:** OpenWeather API, Finnhub API, CoinGecko API, PodcastIndex API, Google Gemini, OneBusAway API, OSRM
- **Auth:** Firebase Auth (Google OAuth + email/password)
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
│   │       ├── i18n/            # Internationalization (code-split: en sync, es/zh lazy)
│   │       │   └── locales/    # Per-locale translation files (en.ts, es.ts, zh.ts)
│   │       ├── types/           # TypeScript interfaces
│   │       ├── utils/           # Event bus, weather helpers, logger, safeStorage
│   │       └── data/            # Static data files
│   ├── shell/                   # Host micro frontend
│   │   └── src/
│   │       ├── components/
│   │       │   ├── layout/      # Layout, BottomNav, ThemeToggle, UserMenu, etc.
│   │       │   ├── widgets/     # WidgetDashboard, CitySearchWrapper, FavoriteCities
│   │       │   ├── notifications/ # NotificationBell, WhatsNew, WhatsNewButton
│   │       │   ├── player/      # GlobalAudioPlayer
│   │       │   ├── common/      # Loading, ErrorBoundary
│   │       │   ├── settings/    # UnitToggle, SpeedToggle
│   │       │   └── sync/        # ThemeSync, DataSync, ReloadPrompt, Onboarding
│   │       ├── context/         # AuthContext, ThemeContext, RemoteConfigContext
│   │       ├── hooks/           # useDailyVerse, useAnnouncements, useOnlineStatus, etc.
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
│   ├── notebook/                # Notebook MFE
│   ├── baby-tracker/            # Baby growth tracker MFE
│   ├── child-development/       # Child development guide MFE
│   ├── flashcards/              # Flashcards learning hub MFE
│   ├── daily-log/               # Daily journal MFE
│   ├── cloud-files/             # Cloud file storage MFE
│   ├── model-benchmark/         # AI model benchmark MFE
│   ├── immigration-tracker/     # Immigration case tracker MFE
│   ├── digital-library/         # E-book & audiobook library MFE
│   ├── family-games/            # Multiplayer party games MFE
│   ├── doc-scanner/             # Document scanner MFE
│   ├── hiking-map/              # Hiking trail map MFE
│   ├── trip-planner/            # Trip itinerary planner MFE
│   ├── poll-system/             # Poll creation & voting MFE
│   ├── radio-station/           # Internet radio streaming MFE
│   ├── ai-interviewer/          # Coding interview practice MFE
│   ├── transit-tracker/         # Real-time bus arrivals MFE
│   ├── travel-map/              # World travel map MFE
│   ├── deal-finder/             # Deals and discounts discovery MFE
│   └── web-crawler/             # URL crawling and content extraction MFE
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
│   ├── architecture.md          # Detailed architecture analysis
│   ├── data-patterns.md         # Data refresh, notifications & real-time sync patterns
│   (agent-guide.md removed — see CLAUDE.md at repo root)
│   └── analytics-and-tracking.md # Analytics & performance monitoring (Web Vitals, Firebase Perf, Lighthouse)
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
   | `PODCASTINDEX_API_KEY` / `SECRET` | [podcastindex.org](https://api.podcastindex.org/) (combined as `PODCASTINDEX_CREDS` JSON in Firebase) |
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
   - All 29 MFE preview servers (City Search, Weather, Stocks, Podcasts, AI Assistant, Bible Reader, Worship Songs, Notebook, Baby Tracker, Child Development, Flashcards, Daily Log, Cloud Files, Model Benchmark, Immigration Tracker, Digital Library, Family Games, Doc Scanner, Hiking Map, Trip Planner, Poll System, Radio Station, AI Interviewer, Transit Tracker, Travel Map, Deal Finder, Web Crawler, Resume Tailor, HSA Expense Tracker)

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
| `pnpm typecheck:all` | TypeScript type checking across root + all packages |
| `pnpm check:shared-versions` | Verify shared deps are consistent across MFEs |
| `pnpm build:shared` | Build only the shared package |
| `pnpm firebase:build` | Full production build (shared + MFEs + shell + functions) |
| `pnpm firebase:deploy` | Full Firebase deployment (hosting + functions + firestore) |
| `pnpm clean` | Remove all dist directories and node_modules |

### MCP Server (Claude Code Integration)

MyCircle includes a custom MCP server that provides project health validators and an AI tool registry for Claude Code.

**Setup:** The `.mcp.json` config is already in the project root. After starting a new Claude Code session, the `mycircle` server is available with these tools:

| Tool | Description |
|------|-------------|
| `validate_i18n` | Check all 3 locale files have the same keys |
| `validate_dockerfile` | Check Dockerfile references all packages |
| `validate_pwa_shortcuts` | Count PWA shortcuts (max 10) |
| `validate_widget_registry` | Check widget registry consistency |
| `validate_all` | Run all validators |
| `list_ai_tools` | List all AI assistant tool definitions |

**AI Tool Registry:** AI tool definitions are shared between the MCP server and the Gemini backend. Defined once in `scripts/mcp-tools/mfe-tools.ts` using Zod schemas, they are auto-converted to Gemini's format. See [docs/mcp.md](./docs/mcp.md) for the full guide.

## CI/CD

MyCircle uses **GitHub Actions** for continuous integration and deployment:

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| **CI** (`ci.yml`) | PR to `main` | Installs deps, checks shared dep versions, builds shared, runs `typecheck:all`, runs `test:all` |
| **Deploy** (`deploy.yml`) | Push to `main` | Builds full app (with `VITE_*` secrets), deploys Hosting then Functions+Firestore, smoke test |
| **E2E** (`e2e.yml`) | PR to `main` | Builds the app, installs Playwright browsers, runs `test:e2e` (mocked) and `emulator:test` (full-stack) |

All workflows use `pnpm/action-setup@v4` with Node 22 and pnpm caching for fast installs.

The Deploy workflow authenticates via **Workload Identity Federation** (keyless). The service account requires IAM roles including Cloud Scheduler Admin (for scheduled functions) and Secret Manager Viewer (for function secrets). See the [WIF setup guide](docs/workload-identity-federation-setup.md) for the full role list. If the pipeline deploy fails with a 403, you can deploy locally via `pnpm firebase:deploy` as a fallback.

See [docs/cicd.md](docs/cicd.md) for a detailed CI/CD flow guide with setup instructions and deploy troubleshooting.
See [docs/workload-identity-federation-setup.md](docs/workload-identity-federation-setup.md) for keyless Firebase deployment using Workload Identity Federation.
See [docs/announcements.md](docs/announcements.md) for how to add in-app "What's New" announcements.
See [docs/data-patterns.md](docs/data-patterns.md) for all data refresh, notification, and real-time sync patterns.

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
printf "value" | npx firebase functions:secrets:set OPENWEATHER_API_KEY
printf "value" | npx firebase functions:secrets:set FINNHUB_API_KEY
printf '{"apiKey":"...","apiSecret":"..."}' | npx firebase functions:secrets:set PODCASTINDEX_CREDS
printf "value" | npx firebase functions:secrets:set GEMINI_API_KEY
printf "value" | npx firebase functions:secrets:set YOUVERSION_APP_KEY
printf "value" | npx firebase functions:secrets:set RECAPTCHA_SECRET_KEY
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
| `aiChat` | GraphQL `Mutation.aiChat` | Gemini AI chat with function calling (10 tools: weather, stocks, crypto, navigation, flashcards, Bible, podcasts, bookmarks) | 10 req/min/IP |
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

1. **Shell (Host)** loads 25 remote modules at runtime via `remoteEntry.js`
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
    '@apollo/client':   { singleton: true, requiredVersion: '^4.1.1', eager: false },
    graphql:            { singleton: true, requiredVersion: '^16.12.0', eager: false },
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
    '@apollo/client':   { singleton: true, requiredVersion: '^4.1.1', eager: false },
    graphql:            { singleton: true, requiredVersion: '^16.12.0', eager: false },
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
| `PODCASTINDEX_API_KEY` | PodcastIndex API key | For podcasts (local dev) |
| `PODCASTINDEX_API_SECRET` | PodcastIndex API secret | For podcasts (local dev) |
| `GEMINI_API_KEY` | Google Gemini API key | For AI chat |
| `RECAPTCHA_SECRET_KEY` | reCAPTCHA v3 secret | For bot protection |

> **Firebase secrets:** In production, PodcastIndex key+secret are combined into `PODCASTINDEX_CREDS` JSON secret. See [API Keys](./docs/api-keys.md) for details.
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
| `YOUVERSION_API_BASE_URL` | `https://api.youversion.com/v1` | Redirect to mock server |
| `OPEN_METEO_BASE_URL` | `https://archive-api.open-meteo.com` | Redirect to mock server |
| `FIRESTORE_EMULATOR_HOST` | — | `localhost:8080` |
| `FIREBASE_AUTH_EMULATOR_HOST` | — | `localhost:9099` |

> **Note:** Firebase is optional — the app works without it (auth, push notifications, and profile sync are disabled).

## Monitoring

- **Sentry** (`@sentry/react`): Client-side error tracking with session replay. Initialized in `main.tsx` (production only). Errors from React `ErrorBoundary` components are automatically captured with component stack traces.
- **Structured Logging**: Firebase Cloud Functions use `firebase-functions/logger` for structured, queryable logs in Google Cloud Logging.
- **Web Vitals**: Core Web Vitals (LCP, CLS, INP, FCP, TTFB) measured via `web-vitals` library. Reported per route for MFE-level performance analysis.
- **Firebase Performance Custom Traces**: Each MFE chunk load is instrumented via `tracedLazy()` — traces appear as `mfe_*` in Firebase Console > Performance > Custom traces. See [`docs/analytics-and-tracking.md`](docs/analytics-and-tracking.md).

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

### Firebase Auth Issues

**`auth/unauthorized-domain` on Google sign-in**
- Verify `VITE_FIREBASE_API_KEY` in `packages/shell/.env` belongs to the correct Firebase project
- Test with: `curl "https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=YOUR_KEY"` — the response should show `mycircle-dash` authorized domains
- If the key belongs to a different project, update it in `packages/shell/.env` and the `VITE_FIREBASE_API_KEY` GitHub secret, then redeploy
- Also verify the domain is listed in Firebase Console → Authentication → Settings → Authorized domains

**Firebase features not working locally**
- Ensure `packages/shell/.env` has valid `VITE_FIREBASE_*` values
- Firebase is optional — the app runs without it (auth disabled)

### Cloud Functions / API Issues

**API returning 401 (e.g., weather, stocks)**
- Check for trailing whitespace/newlines in Firebase secrets: `firebase functions:secrets:access SECRET_NAME | xxd | tail -3`
- If trailing bytes are present, re-set the secret cleanly: `printf 'your-key-value' | firebase functions:secrets:set SECRET_NAME --data-file=-`
- After updating a secret, **redeploy the affected functions**: `firebase deploy --only functions --force`
- Running function instances cache secrets — they won't pick up new secret versions until redeployed

**Cloud Functions timeout during deployment**
- Ensure lazy initialization pattern in `functions/src/index.ts`
- Avoid importing heavy modules at top level

**API key not working in production**
- Verify secrets are set: `firebase functions:secrets:access OPENWEATHER_API_KEY`
- Check function config includes the secret in its `secrets` array

### Deploy Pipeline Issues

**403 IAM permission errors in GitHub Actions deploy**
- The WIF service account needs specific IAM roles — see [deploy troubleshooting in cicd.md](docs/cicd.md#deploy-troubleshooting)
- Common missing roles: Cloud Scheduler Admin, Secret Manager Viewer, Service Account User
- Quick workaround: deploy locally with `pnpm firebase:deploy` (uses your personal Firebase credentials)

## Docker Self-Hosting (Synology NAS)

MyCircle can be self-hosted on a Synology DS1525+ NAS (or any Docker host) as an alternative to Firebase Hosting. A single Docker container serves static assets and API routes, with Caddy providing automatic HTTPS.

```
Internet → Caddy (auto-HTTPS) → Node.js :3000
                                   ├─ /graphql, /ai/chat   → Apollo + Gemini
                                   ├─ /stock/*, /podcast/*  → API proxies
                                   └─ /*                    → Static SPA
```

Firebase client SDKs (Auth, Firestore, FCM) still talk to Google's cloud — only hosting is self-hosted.

**Quick start:**
```bash
# On the NAS
cd ~/mycircle
cp .env.example .env        # Fill in API keys
nano Caddyfile               # Set your domain
docker compose pull && docker compose up -d
```

The Docker image is built automatically in CI and pushed to GHCR on every push to `main`.

See [`deploy/docker/README.md`](deploy/docker/README.md) for the full deployment guide.

## Mobile (iOS)

MyCircle can be shipped as a native iOS app via [Capacitor](https://capacitorjs.com/), wrapping the existing web build in a WKWebView with zero UI rewrite.

```bash
pnpm cap:build    # Full web build + sync to native project
pnpm cap:open     # Open in Xcode (macOS required)
```

Platform detection (`isNativePlatform()`, `getPlatform()`) is available in `@mycircle/shared`. Web-only features (service worker updates, FCM push, PWA install prompt) are automatically disabled in the native shell.

See [`docs/mobile-ios.md`](docs/mobile-ios.md) for the full setup guide, live reload instructions, and App Store submission steps.

## License

MIT
