# Data Refresh & Notification Patterns

MyCircle uses six distinct patterns for keeping data fresh and notifying users. Each pattern targets a specific data characteristic — where it lives, how often it changes, and whether the user needs to know while the app is closed.

---

## Overview

| # | Pattern | Latency | Works Offline | Works When Closed | Network Cost | Used For |
|---|---------|---------|--------------|-------------------|-------------|----------|
| 1 | Firestore `onSnapshot` | ~instant | Yes (cached) | No | Per-read billing | User content (notes, songs, files) |
| 2 | Apollo `pollInterval` | Up to 60s | No | No | 1 req/min per active tab | External APIs (weather, stocks) |
| 3 | FCM Push Notifications | ~seconds | No | **Yes** | Near-zero (server-initiated) | Urgent alerts (weather, announcements) |
| 4 | Client-Side Threshold Alerts | Instant | Yes (in-memory) | No | Zero (derived) | Weather conditions on current page |
| 5 | EventBus / WindowEvents | Instant | Yes (in-memory) | No | Zero (in-process) | Cross-MFE state sync |
| 6 | localStorage Cache | Instant | **Yes** | N/A (startup optimization) | Zero (local read) | Loading state elimination |

---

## 1. Firestore `onSnapshot` (Real-time Listeners)

### Where Used

| Collection | Subscription Function | File |
|---|---|---|
| Worship songs | `subscribeToWorshipSongs` | `firebase.ts` |
| Private notes | `subscribeToUserNotes` | `firebase.ts` |
| Public notes | `subscribeToPublicNotes` | `firebase.ts` |
| Chinese characters | `subscribeToChineseCharacters` | `firebase.ts` |
| Work entries | `subscribeToWorkEntries` | `firebase.ts` |
| Public flashcards | `subscribeToPublicFlashcards` | `firebase.ts` |
| User flashcards | `subscribeToUserFlashcards` | `firebase.ts` |
| User files | `subscribeToUserFiles` | `firebase.ts` |
| Shared files | `subscribeToSharedFiles` | `firebase.ts` |

### How It Works

```
Firestore server
    │ (persistent WebSocket connection)
    ▼
onSnapshot callback fires instantly when ANY client writes
    │
    ▼
React setState → UI updates
```

Each MFE hook (e.g., `useWorshipSongs`, `useNotes`, `useFiles`) calls `subscribe()` in a `useEffect`, which returns an unsubscribe function for cleanup.

### Why This Pattern

- Data is **user-generated content** that can be edited from multiple devices/tabs simultaneously
- Firestore's real-time sync is **push-based** — zero polling, zero wasted requests
- Works **offline** — `persistentLocalCache` (configured in `firebase.ts:36`) serves cached data when offline and syncs on reconnection
- Updates are **granular** — only changed documents are transmitted, not the whole collection

### When NOT to Use

- Data from external APIs (weather, stocks) — Firestore can't subscribe to data it doesn't own
- High-frequency data where per-document-read billing is a concern

---

## 2. Apollo `pollInterval` (Timed Polling via GraphQL)

### Where Used

| Data | Hook | File | Interval |
|---|---|---|---|
| Weather | `useWeatherData` | `packages/shared/src/hooks/useWeatherData.ts` | 60s |
| Stock quotes | `useStockQuote` | `packages/stock-tracker/src/hooks/useStockData.ts` | 60s |

### How It Works

```
Apollo Client
    │ (every 60 seconds)
    ▼
GraphQL query → Cloud Function → External API (OpenWeatherMap / Finnhub)
    │
    ▼
Apollo cache updates → React re-renders
```

### Weather Data Hook

```typescript
function useWeatherData(lat, lon, enableRealtime, pollInterval = 60_000) {
  // Always runs: HTTP query with polling
  const { data } = useQuery(GET_WEATHER, {
    variables: { lat, lon },
    fetchPolicy: 'cache-and-network',
    pollInterval: effectivePollInterval,
  });

  // Dev only: WebSocket subscription (Firebase doesn't support WebSockets in prod)
  useSubscription(WEATHER_UPDATES, {
    skip: isProduction || !enableRealtime,
  });

  return { current, forecast, hourly, isLive };
}
```

In local development, real-time weather updates work over WebSocket via `useSubscription`. In production, Firebase Cloud Functions don't support WebSocket connections, so it falls back to polling.

### Why This Pattern

- Data comes from **third-party APIs** — not Firestore, so `onSnapshot` isn't possible
- Weather and stocks change **gradually** — 60-second intervals balance freshness vs. API rate limits
- Apollo's `cache-and-network` shows cached data instantly, then updates when the network response arrives
- Polling **stops automatically** when the component unmounts

---

## 3. FCM Push Notifications (Firebase Cloud Messaging)

### Where Used

| Alert Type | Mechanism | Cloud Function |
|---|---|---|
| Weather alerts | Per-token subscription → Firestore `alertSubscriptions` | `subscribeToAlerts` |
| Announcement alerts | FCM topic subscription (`announcements`) | `manageTopicSubscription` |

### How It Works

```
User enables alerts via NotificationBell
    │
    ▼
requestNotificationPermission()                    ← messaging.ts
    ├─ Notification.requestPermission()            ← browser prompt
    ├─ Register firebase-messaging-sw.js           ← separate from PWA SW
    └─ getToken(messaging, { vapidKey })           ← returns FCM token
    │
    ▼
subscribeToWeatherAlerts(token, cities)            ← calls Cloud Function
    │
    ▼
Cloud Function upserts Firestore doc:
    alertSubscriptions/{docId} = {
      token, uid, cities: [{ lat, lon, name }],
      createdAt, updatedAt
    }
    │
    ... time passes, app may be closed ...
    │
    ▼
checkWeatherAlerts (scheduled, every 30 min)
    ├─ Fetch weather for all subscribed cities
    ├─ Check for severe conditions (19 OpenWeather IDs)
    └─ Send FCM push to matching tokens
    │
    ▼
firebase-messaging-sw.js → OS notification (background)
   OR
onForegroundMessage() → in-app toast (foreground)
```

### FCM Service Worker Scope

The FCM service worker (`firebase-messaging-sw.js`) **must** register with scope `/firebase-cloud-messaging-push-scope` to avoid colliding with the PWA service worker at scope `/`. Without this, the FCM SW replaces the PWA registration, causing `useRegisterSW` to detect a false "update" in an infinite loop.

### Two Subscription Models

1. **Per-token** (weather) — each device has its own FCM token and its own subscription document in Firestore. Unsubscribing deletes all docs for the authenticated `uid` (cross-device cleanup).
2. **Topic-based** (announcements) — all subscribers receive the same broadcast via `messaging.subscribeToTopic(token, 'announcements')`.

### Why This Pattern

- The only pattern that can **wake up the device** and show a notification when the app is closed
- Weather alerts are **urgent and infrequent** — server pushes only when conditions trigger, not on a timer
- Stale FCM tokens are automatically cleaned up after failed send attempts

### Limitations

- Not available in Capacitor's WKWebView (iOS native wrapper) — `requestNotificationPermission()` returns `null` on native platforms
- Requires `VITE_FIREBASE_VAPID_KEY` environment variable

---

## 4. Client-Side Threshold Alerts

### Where Used

| Component | File |
|---|---|
| `WeatherAlerts` | `packages/weather-display/src/components/WeatherAlerts.tsx` |

### How It Works

```
Weather API response (already fetched by pattern #2)
    │
    ▼
generateAlerts(current, forecast) — pure function, runs in browser
    │
    ├─ temp >= 38°C?         → "Extreme Heat" warning
    ├─ temp <= -20°C?        → "Extreme Cold" warning
    ├─ wind >= 20m/s?        → "High Wind" warning
    ├─ thunderstorm?         → "Thunderstorm" warning
    ├─ clear + temp >= 28°C? → "UV Warning" watch
    ├─ forecast pop >= 0.7?  → "Rain Expected" info
    ├─ temp swing >= 10°C?   → "Temperature Swing" info
    └─ fog/mist/haze?        → "Low Visibility" info
    │
    ▼
Colored alert cards (severity: warning > watch > info)
    │
    ▼
Dismissed state stored in sessionStorage (resets each session)
```

### Why This Pattern

- Zero network cost — alerts are **derived data** from the weather response already in memory
- Deterministic — given the same input, always produces the same output
- `sessionStorage` (not `localStorage`) for dismissals — intentional: alerts reappear each session in case conditions persist
- Complements FCM push alerts: this system covers "user is on the weather page", FCM covers "user is not in the app"

---

## 5. EventBus / WindowEvents (Cross-MFE Communication)

### Architecture

MyCircle's micro frontends are separate webpack bundles loaded via Module Federation. They can't import each other's state directly. Two event mechanisms bridge this gap:

#### EventBus (MFEvents) — Structured Data Transfer

```typescript
// packages/shared/src/utils/eventBus.ts
class EventBusImpl {
  private listeners: Map<string, Set<EventCallback>>;

  subscribe(event, callback)  // In-process listener, returns unsubscribe fn
  publish(event, data)        // Fires local listeners + dispatches DOM CustomEvent
}

// Cross-MFE listening (DOM-level)
function subscribeToMFEvent(event, callback)  // window.addEventListener wrapper
```

Used for high-frequency bidirectional communication with payloads (e.g., podcast playback state broadcasts ~4x/sec).

#### WindowEvents — Lightweight Signals

```typescript
// Fire-and-forget signal, no payload
window.dispatchEvent(new Event(WindowEvents.NOTEBOOK_CHANGED));

// Any code can listen
window.addEventListener(WindowEvents.NOTEBOOK_CHANGED, handler);
```

Used for "something changed, refetch if you care" notifications.

### Key Communication Flows

**City Selection:**
```
CitySearch (MFE) ──CITY_SELECTED──► CitySearchWrapper (shell) → Firestore
                                  ► WeatherDisplay (MFE) → fetch weather
```

**Podcast Player:**
```
PodcastPlayer (MFE) ──PODCAST_PLAY_EPISODE──► GlobalAudioPlayer (shell)
                    ──PODCAST_QUEUE_EPISODE──►

GlobalAudioPlayer ──PODCAST_PLAYBACK_STATE──► InlinePlaybackControls (MFE)

InlinePlaybackControls ──PODCAST_TOGGLE_PLAY──► GlobalAudioPlayer
                       ──PODCAST_SEEK──────────►
                       ──PODCAST_SKIP_*────────►
```

**Auth State Sync (shell → all MFEs):**
```
AuthContext ──WindowEvents.AUTH_STATE_CHANGED──► all MFEs
           ──WindowEvents.WATCHLIST_CHANGED───► StockTracker
           ──WindowEvents.SUBSCRIPTIONS_CHANGED─► PodcastPlayer
           ──WindowEvents.UNITS_CHANGED──────► WeatherDisplay
           ... ~20 more events
```

### Event Types

```typescript
const MFEvents = {
  CITY_SELECTED:          'mf:city-selected',
  WEATHER_LOADED:         'mf:weather-loaded',
  NAVIGATION_REQUEST:     'mf:navigation-request',
  THEME_CHANGED:          'mf:theme-changed',
  USER_LOCATION_CHANGED:  'mf:user-location-changed',
  PODCAST_PLAY_EPISODE:   'mf:podcast-play-episode',
  PODCAST_CLOSE_PLAYER:   'mf:podcast-close-player',
  PODCAST_QUEUE_EPISODE:  'mf:podcast-queue-episode',
  PODCAST_PLAYBACK_STATE: 'mf:podcast-playback-state',
  PODCAST_TOGGLE_PLAY:    'mf:podcast-toggle-play',
  PODCAST_SEEK:           'mf:podcast-seek',
  PODCAST_SKIP_FORWARD:   'mf:podcast-skip-forward',
  PODCAST_SKIP_BACK:      'mf:podcast-skip-back',
  PODCAST_CHANGE_SPEED:   'mf:podcast-change-speed',
  PODCAST_SET_SLEEP_TIMER:'mf:podcast-set-sleep-timer',
  PODCAST_REMOVE_FROM_QUEUE:'mf:podcast-remove-from-queue',
};
```

### Why Two Event Systems

| | EventBus (MFEvents) | WindowEvents |
|---|---|---|
| **Payload** | Structured data (`{ episode, podcast }`) | No payload (signal only) |
| **Frequency** | Up to ~4x/sec (playback state) | On-demand (user actions) |
| **Direction** | Bidirectional (MFE ↔ shell) | Usually shell → MFEs |
| **Use case** | Podcast player, city selection | Auth sync, cache invalidation |

### Cleanup Requirements

Both mechanisms require cleanup in `useEffect` return functions:

```typescript
useEffect(() => {
  const unsub = subscribeToMFEvent(MFEvents.PODCAST_PLAY_EPISODE, handler);
  return unsub;
}, []);

useEffect(() => {
  window.addEventListener(WindowEvents.NOTEBOOK_CHANGED, handler);
  return () => window.removeEventListener(WindowEvents.NOTEBOOK_CHANGED, handler);
}, []);
```

Failing to unsubscribe causes memory leaks and stale callbacks after MFE hot-reloads.

---

## 6. localStorage Cache + Lazy Hydration (Stale-While-Revalidate)

### Where Used

| Cache Key | Hook / Component | Data |
|---|---|---|
| `WORSHIP_SONGS_CACHE` | `useWorshipSongs` | Worship song list |
| `NOTEBOOK_CACHE` | `useNotes` | Note count |
| `CLOUD_FILES_CACHE` | `useFiles` | User file list |
| `BABY_MILESTONES_CACHE` | `useBabyPhotos` | Baby milestone photos |
| `WORK_TRACKER_CACHE` | Widget dashboard | Work log entries |

### How It Works

```
Component mounts
    │
    ├─ 1. Read localStorage cache → show stale data immediately (no spinner)
    │
    ├─ 2. Subscribe via onSnapshot OR fetch from API
    │
    └─ 3. Fresh data arrives → update UI + overwrite localStorage cache
```

### Why This Pattern

- Eliminates the **loading flash** on page load — users see data instantly from cache
- The cache is a **read-through optimization**, not a source of truth — always overwritten by fresh data
- Bridges the gap between "page loaded" and "WebSocket connected" for `onSnapshot` patterns
- Provides **basic offline support** — if the network is down, at least the last known state is visible

---

## Decision Tree

```
Is the data stored in Firestore?
├─ YES → Use onSnapshot (pattern 1)
│        + localStorage cache (pattern 6) for instant load
│
└─ NO → Is it from an external API?
         ├─ YES → Use pollInterval (pattern 2)
         │
         └─ NO → Is it derived from existing data?
                  └─ YES → Use threshold alerts (pattern 4)

Does the user need to know when the app is CLOSED?
├─ YES → Use FCM push (pattern 3)
└─ NO  → In-app patterns (1, 2, 4) are sufficient

Does data need to cross an MFE boundary?
├─ YES, with payload → Use eventBus / MFEvents (pattern 5)
├─ YES, signal only  → Use WindowEvents (pattern 5)
└─ NO → Use React state, props, or context
```

---

## Key Files

| File | Role |
|------|------|
| `packages/shell/src/lib/firebase.ts` | All Firestore CRUD + `onSnapshot` subscriptions |
| `packages/shell/src/lib/messaging.ts` | FCM token management, push subscription |
| `packages/shell/src/components/notifications/NotificationBell.tsx` | Push notification toggle UI |
| `packages/shell/src/context/AuthContext.tsx` | WindowEvents dispatch hub |
| `packages/shared/src/utils/eventBus.ts` | EventBus, MFEvents, WindowEvents, StorageKeys |
| `packages/shared/src/hooks/useWeatherData.ts` | Apollo polling + WebSocket subscription |
| `packages/stock-tracker/src/hooks/useStockData.ts` | Apollo polling for stock quotes |
| `packages/weather-display/src/components/WeatherAlerts.tsx` | Client-side threshold alerts |
| `functions/src/index.ts` | `subscribeToAlerts`, `manageTopicSubscription`, `checkWeatherAlerts` |
