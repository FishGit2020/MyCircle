# Analytics & Performance Monitoring

> Single-source-of-truth for every monitoring layer in MyCircle.

---

## Overview

MyCircle uses four complementary monitoring layers:

```
┌─────────────────────────────────────────────────────┐
│  1. Web Vitals → GA4       Real-user field metrics   │
│  2. Firebase Performance   Custom MFE load traces    │
│  3. Lighthouse CI          Synthetic lab audits      │
│  4. Sentry                 Error tracking + replay   │
└─────────────────────────────────────────────────────┘
```

| Layer | What it measures | Where to view |
|---|---|---|
| Web Vitals (GA4) | LCP, CLS, INP, FCP, TTFB per route | GA4 Explorations |
| Firebase Performance | MFE chunk download + eval time | Firebase Console > Performance |
| Lighthouse CI | Lab scores per PR | GitHub Actions artifacts |
| Sentry | Runtime errors, session replays | Sentry dashboard |

---

## Web Vitals (GA4)

### How It Works

```
Browser (web-vitals lib)
  → reportWebVitals(logEvent)     # packages/shared/src/utils/webVitals.ts
    → logEvent('web_vitals', {    # packages/shell/src/lib/firebase.ts
         metric_name,              # LCP | CLS | INP | FCP | TTFB
         metric_value,             # rounded integer (CLS × 1000)
         metric_rating,            # good | needs-improvement | poor
         metric_delta,             # change since last report
         metric_id,                # unique ID per metric instance
         route,                    # window.location.pathname
       })
    → GA4 receives event
```

In development, metrics log to the browser console instead.

### Register Custom Dimensions & Metrics

GA4 does not automatically index custom event parameters. You must register them before they appear in reports.

1. **GA4 > Admin > Data display > Custom definitions**
2. Create **custom dimensions** (Event scope):

| Display name | Event parameter |
|---|---|
| Web Vital Name | `metric_name` |
| Web Vital Rating | `metric_rating` |
| Web Vital Route | `route` |
| Web Vital ID | `metric_id` |

3. Create **custom metrics** (Custom metrics tab):

| Display name | Event parameter | Unit |
|---|---|---|
| Web Vital Value | `metric_value` | Standard |
| Web Vital Delta | `metric_delta` | Standard |

> Allow **24-48 hours** for GA4 to start populating data after registration.

### Verify Events in Realtime

1. Deploy the app (dev mode logs to console, not GA4)
2. **GA4 > Reports > Realtime**
3. Scroll to **Event count by Event name** → look for `web_vitals`
4. Click to see `metric_name` values like `LCP`, `CLS`, `INP`

**Not seeing events?**
- Verify `analytics` is not null in `firebase.ts`
- Confirm `import.meta.env.PROD === true`
- Disable ad blockers that may block `google-analytics.com`

### Exploration Reports

#### Overview Table

1. **GA4 > Explore > Blank**
2. Name: **"Web Vitals Dashboard"**
3. Add dimensions: Web Vital Name, Web Vital Rating, Web Vital Route
4. Add metrics: Web Vital Value, Event count
5. Configure:
   - Technique: **Free form**
   - Rows: `Web Vital Name`, `Web Vital Route`
   - Columns: `Web Vital Rating`
   - Values: `Web Vital Value` (Average), `Event count`

```
              |    good     | needs-improvement |    poor
--------------+-------------+-------------------+----------
LCP  /        | 1,240 (45)  |    2,800 (12)     | 4,100 (3)
LCP  /weather | 1,100 (30)  |    2,500 (8)      |    —
CLS  /        |    12 (52)  |      150 (8)      |  310 (2)
INP  /bible   |    85 (38)  |      220 (5)      |    —
```

#### Trend Over Time

1. Add new tab → **"Vitals Trend"**
2. Technique: **Line chart**
3. X-axis: Date
4. Y-axis: `Web Vital Value` (Average)
5. Breakdown: `Web Vital Name`
6. Filter: `Web Vital Name` matches `LCP|CLS|INP`

#### Route Performance Comparison

1. Add tab → Technique: **Bar chart**
2. Rows: `Web Vital Route`
3. Values: `Web Vital Value` (Average)
4. Filter: `Web Vital Name` exactly matches `LCP`

### Metric Thresholds

| Metric | Good | Needs Improvement | Poor | Notes |
|---|---|---|---|---|
| **LCP** | < 2,500 ms | 2,500–4,000 ms | > 4,000 ms | Largest Contentful Paint |
| **CLS** | < 100 | 100–250 | > 250 | Cumulative Layout Shift (×1000) |
| **INP** | < 200 ms | 200–500 ms | > 500 ms | Interaction to Next Paint |
| **FCP** | < 1,800 ms | 1,800–3,000 ms | > 3,000 ms | First Contentful Paint |
| **TTFB** | < 800 ms | 800–1,800 ms | > 1,800 ms | Time to First Byte |

> CLS is multiplied by 1000 so GA4 stores it as an integer. A raw CLS of 0.1 → `metric_value: 100`.

### BigQuery Export (Optional, Blaze Plan)

1. **GA4 > Admin > BigQuery Links > Link**
2. Select your BigQuery project
3. Enable **Daily export** (free tier) or **Streaming** (paid)

```sql
SELECT
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'metric_name') AS vital,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'route') AS route,
  AVG((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'metric_value')) AS avg_value,
  COUNT(*) AS samples,
  COUNTIF((SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'metric_rating') = 'poor') AS poor_count
FROM `your-project.analytics_NNNNNN.events_*`
WHERE event_name = 'web_vitals'
  AND _TABLE_SUFFIX BETWEEN
    FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
    AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
GROUP BY vital, route
ORDER BY vital, avg_value DESC
```

### Troubleshooting

| Issue | Solution |
|---|---|
| No `web_vitals` events in Realtime | Check `import.meta.env.PROD` — dev mode logs to console only |
| Events visible but custom dimensions empty | Wait 24-48h after registering dimensions |
| Missing INP data | INP only fires after user interaction (click, tap, keypress) |
| CLS values seem high | Values are ×1000 — a value of 50 means CLS = 0.05 (good) |
| Events blocked | Disable ad blockers; check CSP headers allow `google-analytics.com` |

---

## Custom GA4 Events

### Overview

MyCircle tracks 24 custom GA4 events across the shell and MFE packages. Shell components import `logEvent` directly; MFE packages use the `window.__logAnalyticsEvent` bridge.

### Event Catalog

| # | Event Name | Parameters | Source | Component |
|---|---|---|---|---|
| 1 | `login` | `{method}` | Shell | AuthModal |
| 2 | `city_searched` | `{query}` | Shell | CitySearch |
| 3 | `feedback_submitted` | `{category, rating}` | Shell | FeedbackButton |
| 4 | `web_vitals` | `{metric_name, metric_value, ...}` | Shell | webVitals.ts |
| 5 | `nav_dropdown_open` | `{group}` | Shell | Layout |
| 6 | `bottom_nav_tap` | `{item_path}` | Shell | BottomNav |
| 7 | `bottom_nav_more_open` | — | Shell | BottomNav |
| 8 | `command_palette_open` | — | Shell | CommandPalette |
| 9 | `command_palette_select` | `{category, item}` | Shell | CommandPalette |
| 10 | `theme_toggle` | `{new_theme}` | Shell | ThemeToggle |
| 11 | `language_change` | `{locale}` | Shell | LanguageSelector |
| 12 | `widget_toggle_visibility` | `{widget_id, visible}` | Shell | WidgetDashboard |
| 13 | `widget_reset` | — | Shell | WidgetDashboard |
| 14 | `onboarding_step` | `{step}` | Shell | Onboarding |
| 15 | `onboarding_complete` | — | Shell | Onboarding |
| 16 | `watchlist_toggle` | `{symbol, action}` | MFE | StockTracker |
| 17 | `episode_play` | `{podcast_title}` | MFE | PodcastPlayer |
| 18 | `podcast_subscribe` | `{podcast_title, action}` | MFE | PodcastPlayer |
| 19 | `bible_chapter_read` | `{book, chapter}` | MFE | BibleReader |
| 20 | `worship_song_favorite` | `{song_title}` | MFE | SongList |
| 21 | `note_save` | `{is_new}` | MFE | NoteEditor |
| 22 | `baby_due_date_save` | — | MFE | BabyTracker |
| 23 | `child_info_save` | — | MFE | ChildDevelopment |
| 24 | `chinese_character_mastered` | — | MFE | ChineseLearning |
| 25 | `english_lesson_complete` | — | MFE | EnglishLearning |

### MFE Analytics Bridge

MFE packages cannot import from the shell. The shell exposes a bridge on `window`:

```typescript
// Shell (firebase.ts) — sets up the bridge
window.__logAnalyticsEvent = (eventName, params) => logEvent(eventName, params);

// MFE component — calls via optional chaining (no-op when standalone)
window.__logAnalyticsEvent?.('watchlist_toggle', { symbol, action: 'add' });
```

The `?.` operator makes MFE analytics calls a **safe no-op** in:
- Unit tests (no bridge set up)
- Standalone dev mode (MFE running outside shell)
- Pre-Firebase initialization

The Window type declaration lives in `packages/shell/src/context/RemoteConfigContext.tsx` alongside other `window.__*` bridge types.

### Register Custom Dimensions in GA4

For event parameters to appear in GA4 reports, register them as custom dimensions:

**GA4 > Admin > Data display > Custom definitions > Create custom dimension**

| Display Name | Event Parameter | Scope |
|---|---|---|
| Nav Group | `group` | Event |
| Nav Item Path | `item_path` | Event |
| Command Category | `category` | Event |
| Command Item | `item` | Event |
| Theme | `new_theme` | Event |
| Locale | `locale` | Event |
| Widget ID | `widget_id` | Event |
| Widget Visible | `visible` | Event |
| Onboarding Step | `step` | Event |
| Stock Symbol | `symbol` | Event |
| Action | `action` | Event |
| Podcast Title | `podcast_title` | Event |
| Bible Book | `book` | Event |
| Bible Chapter | `chapter` | Event |
| Song Title | `song_title` | Event |
| Is New Note | `is_new` | Event |

---

## Firebase Performance Monitoring

### Automatic Traces

Firebase Performance SDK (`getPerformance()`) automatically captures:
- **Page load trace** (`_app_start`): time from page request to DOM interactive
- **HTTP request traces**: duration, response size, and status for network calls
- **Screen traces**: time spent on each "screen" (SPA route)

These appear in **Firebase Console > Performance > Dashboard** with no additional code.

### Custom MFE Load Traces

Each micro-frontend's chunk load is wrapped with a Firebase Performance `trace()` via the `tracedLazy()` utility (`packages/shell/src/lib/tracedLazy.ts`). This measures the wall-clock time from when React triggers the dynamic `import()` to when the module is fully evaluated.

**How it works:**

```typescript
// tracedLazy(name, importFn, getPerf) wraps React.lazy()
const WeatherDisplayMF = tracedLazy(
  'mfe_weather_load',
  () => import('weatherDisplay/WeatherDisplay'),
  getPerf,      // () => perf — getter defers read until chunk actually loads
);
```

The getter pattern (`getPerf`) is essential: `perf` is `null` at module parse time and only becomes a `FirebasePerformance` instance after Firebase initializes. The getter defers the read to actual chunk-load time.

**Trace name table:**

| Variable | Trace Name | MFE |
|---|---|---|
| `WeatherDisplayMF` | `mfe_weather_load` | Weather Display |
| `StockTrackerMF` | `mfe_stocks_load` | Stock Tracker |
| `PodcastPlayerMF` | `mfe_podcasts_load` | Podcast Player |
| `AiAssistantMF` | `mfe_ai_load` | AI Assistant |
| `BibleReaderMF` | `mfe_bible_load` | Bible Reader |
| `WorshipSongsMF` | `mfe_worship_load` | Worship Songs |
| `NotebookMF` | `mfe_notebook_load` | Notebook |
| `BabyTrackerMF` | `mfe_baby_load` | Baby Tracker |
| `ChildDevelopmentMF` | `mfe_childdev_load` | Child Development |
| `ChineseLearningMF` | `mfe_chinese_load` | Chinese Learning |
| `EnglishLearningMF` | `mfe_english_load` | English Learning |

### Viewing in Firebase Console

1. Open **Firebase Console > Performance**
2. Click the **Custom traces** tab
3. Filter or sort by trace name (`mfe_*`)
4. Click a trace to see: duration distribution, p50/p90/p99, trend over time
5. Use the device/country/OS breakdowns to isolate slow loads by segment

---

## Lighthouse CI

### Configuration

Lighthouse CI runs on every pull request via `.github/workflows/lighthouse.yml`. Configuration lives in `.lighthouserc.json`.

**Assertion thresholds:**

| Category | Level | Minimum Score |
|---|---|---|
| Accessibility | `error` (blocks merge) | 90 |
| Performance | `warn` | 80 |
| Best Practices | `warn` | 90 |
| SEO | `warn` | 80 |

### Viewing Results

1. Open the PR's **Checks** tab on GitHub
2. Click the **Lighthouse CI** check
3. Results are uploaded to Lighthouse's temporary public storage — click the link in the workflow output

---

## Dashboards You Can Build

| Dashboard | Tool | Data Source | Purpose |
|---|---|---|---|
| Web Vitals trends | Looker Studio | BigQuery (GA4 export) | Weekly/monthly vital trends per route |
| MFE load times | Firebase Console | Firebase Performance | p50/p90 chunk load by MFE |
| Error rate | Sentry | Sentry events | Errors by component/route over time |
| SEO health | Google Search Console | CrUX data | Core Web Vitals pass rate for indexed URLs |
| Lab performance | GitHub Actions | Lighthouse CI | PR-level score tracking |
| Custom KPIs | Google Sheets | BigQuery scheduled query | Lightweight weekly snapshot in a spreadsheet |

### Looker Studio Setup (BigQuery → Dashboard)

1. Enable GA4 BigQuery export (see [BigQuery Export](#bigquery-export-optional-blaze-plan))
2. Open [Looker Studio](https://lookerstudio.google.com/) → **Create > Data source > BigQuery**
3. Select your project → dataset `analytics_NNNNNN` → table `events_*`
4. Create a report with:
   - **Scorecard** for avg LCP, CLS, INP (use calculated fields to filter `event_name = 'web_vitals'`)
   - **Time series** chart broken down by `metric_name`
   - **Table** of routes sorted by worst LCP

---

## Google Suite Monitoring Tools

| Tool | What It Provides | Link |
|---|---|---|
| **Google Analytics (GA4)** | Real-user web vitals, custom events, user flows | [analytics.google.com](https://analytics.google.com/) |
| **Firebase Console** | Performance traces, crash reports, A/B testing | [console.firebase.google.com](https://console.firebase.google.com/) |
| **Google Search Console** | CrUX Core Web Vitals, indexing, SEO issues | [search.google.com/search-console](https://search.google.com/search-console) |
| **BigQuery** | Raw GA4 event data for SQL analysis | [console.cloud.google.com/bigquery](https://console.cloud.google.com/bigquery) |
| **Looker Studio** | Drag-and-drop dashboards from BigQuery/GA4 | [lookerstudio.google.com](https://lookerstudio.google.com/) |
| **Google Cloud Logging** | Firebase Functions structured logs | [console.cloud.google.com/logs](https://console.cloud.google.com/logs) |
| **Google Cloud Monitoring** | Alerts on function errors/latency | [console.cloud.google.com/monitoring](https://console.cloud.google.com/monitoring) |

---

## Monitoring Strategy

### Weekly Review Checklist

- [ ] **GA4 Exploration**: Check Web Vitals Dashboard — are any routes trending toward "poor"?
- [ ] **Firebase Performance**: Review `mfe_*` custom traces — are any MFE loads exceeding 3 s at p90?
- [ ] **Sentry**: Review new unresolved errors from the past week
- [ ] **Lighthouse CI**: Scan recent PR checks — any scores dropping below thresholds?
- [ ] **Search Console**: Check Core Web Vitals report — any URLs flagged as poor?

### Automated Alerting Options

| Method | Setup | Triggers |
|---|---|---|
| GA4 Custom Insights | GA4 > Admin > Custom Insights | Anomaly detection on event counts (limited to standard params) |
| BigQuery + Cloud Scheduler | Scheduled SQL query → Cloud Function → email/Slack | p90 LCP > 4000 ms over trailing 24 h |
| Sentry Alerts | Sentry > Alerts > Create Rule | New error, error spike, crash-free rate drops |
| Firebase Performance Alerts | Firebase Console > Performance > Alerts | Duration threshold on custom traces |
| Google Cloud Monitoring | Cloud Monitoring > Alerting policies | Cloud Function error rate, latency |
