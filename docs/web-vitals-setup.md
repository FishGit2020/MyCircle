# Web Vitals GA4 Setup Guide

MyCircle reports Core Web Vitals (LCP, CLS, INP, FCP, TTFB) to Google Analytics via Firebase `logEvent('web_vitals', ...)`. This guide walks through configuring GA4 to visualize the data.

## Prerequisites

- Firebase project with Google Analytics enabled
- Access to the [GA4 console](https://analytics.google.com/) for the MyCircle property

## How It Works

```
Browser (web-vitals lib)
  -> reportWebVitals(logEvent)     # packages/shared/src/utils/webVitals.ts
    -> logEvent('web_vitals', {    # packages/shell/src/lib/firebase.ts
         metric_name,              # LCP | CLS | INP | FCP | TTFB
         metric_value,             # rounded integer (CLS * 1000)
         metric_rating,            # good | needs-improvement | poor
         metric_delta,             # change since last report
         metric_id,                # unique ID per metric instance
         route,                    # window.location.pathname
       })
    -> GA4 receives event
```

In development, metrics log to the browser console instead.

---

## Step 1: Register Custom Dimensions & Metrics

GA4 does not automatically index custom event parameters. You must register them as custom dimensions/metrics before they appear in reports.

### 1a. Open Custom Definitions

1. Go to [Google Analytics](https://analytics.google.com/)
2. Select the **MyCircle** property
3. Click **Admin** (gear icon, bottom-left)
4. Under **Data display**, click **Custom definitions**

### 1b. Create Custom Dimensions

Click **Create custom dimension** for each row:

| Display name | Event parameter | Scope |
|---|---|---|
| Web Vital Name | `metric_name` | Event |
| Web Vital Rating | `metric_rating` | Event |
| Web Vital Route | `route` | Event |
| Web Vital ID | `metric_id` | Event |

### 1c. Create Custom Metrics

Click the **Custom metrics** tab, then **Create custom metric** for each row:

| Display name | Event parameter | Unit of measurement |
|---|---|---|
| Web Vital Value | `metric_value` | Standard |
| Web Vital Delta | `metric_delta` | Standard |

> After creating these, allow **24-48 hours** for GA4 to start populating data. You can verify events are flowing immediately in **Reports > Realtime**.

---

## Step 2: Verify Events in Realtime

1. Deploy the app (or test with `pnpm dev` — dev mode logs to console, not GA4)
2. Go to **GA4 > Reports > Realtime**
3. Scroll to **Event count by Event name**
4. Look for `web_vitals` — click it to see parameter breakdowns
5. Confirm you see `metric_name` values like `LCP`, `CLS`, `INP`

If you don't see events, check:
- Firebase Analytics is initialized (`analytics` is not null in `firebase.ts`)
- The app is running in production mode (`import.meta.env.PROD === true`)
- Ad blockers are not blocking `google-analytics.com`

---

## Step 3: Create an Exploration Report

### 3a. Overview Table

1. Go to **GA4 > Explore** (left sidebar)
2. Click **Blank** to start a new exploration
3. Name it **"Web Vitals Dashboard"**

**Add dimensions** (click + next to Dimensions):
- Web Vital Name
- Web Vital Rating
- Web Vital Route

**Add metrics** (click + next to Metrics):
- Web Vital Value
- Event count

**Configure the table:**
- Technique: **Free form**
- Rows: `Web Vital Name`, `Web Vital Route`
- Columns: `Web Vital Rating`
- Values: `Web Vital Value` (change aggregation to **Average**), `Event count`

This produces a table like:

```
              |    good     | needs-improvement |    poor
--------------+-------------+-------------------+----------
LCP  /        | 1,240 (45)  |    2,800 (12)     | 4,100 (3)
LCP  /weather | 1,100 (30)  |    2,500 (8)      |    —
CLS  /        |    12 (52)  |      150 (8)      |  310 (2)
INP  /bible   |    85 (38)  |      220 (5)      |    —
```

### 3b. Trend Over Time

Add a second tab in the same exploration:
1. Click **+** to add a new tab
2. Name it **"Vitals Trend"**
3. Technique: **Line chart**
4. Rows (X-axis): Date
5. Values (Y-axis): `Web Vital Value` (Average)
6. Breakdown: `Web Vital Name`
7. Add a filter: `Web Vital Name` matches `LCP|CLS|INP` (the three Core Web Vitals)

### 3c. Route Performance Comparison

Add a third tab:
1. Technique: **Bar chart**
2. Rows: `Web Vital Route`
3. Values: `Web Vital Value` (Average)
4. Add a filter: `Web Vital Name` exactly matches `LCP`

This shows which routes have the slowest Largest Contentful Paint.

---

## Step 4: Monitoring Strategy

GA4 Custom Insights does not support filtering by custom event parameters, so automated per-metric alerting isn't possible through the GA4 UI alone.

**Recommended approach:** Check the Exploration report from Step 3 weekly. The `Web Vital Rating` column split (good / needs-improvement / poor) gives you an at-a-glance view of performance health per route.

**For automated alerting**, use one of these approaches:

### Option A: BigQuery + Cloud Scheduler (requires Blaze plan)
Export GA4 data to BigQuery (see Step 5), then create a scheduled query that checks for poor vitals and sends email via Cloud Functions.

### Option B: Lighthouse CI in GitHub Actions
Add [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) to your CI pipeline to catch performance regressions before they reach production. This is a **proactive** approach vs. GA4's reactive monitoring.

### Option C: Google Search Console
For real-user Core Web Vitals data aggregated by Google, check **Search Console > Core Web Vitals** report. This uses Chrome UX Report (CrUX) data from real users and flags poor URLs.

---

## Step 5: BigQuery Export (Optional, Blaze Plan)

For advanced analysis, enable BigQuery export:

1. **GA4 > Admin > BigQuery Links > Link**
2. Select your BigQuery project
3. Enable **Daily export** (free tier) or **Streaming** (paid)

Sample query for average vitals by route:

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

---

## Reference: Metric Thresholds

| Metric | Good | Needs Improvement | Poor | Notes |
|---|---|---|---|---|
| **LCP** | < 2,500ms | 2,500 - 4,000ms | > 4,000ms | Largest Contentful Paint |
| **CLS** | < 100 | 100 - 250 | > 250 | Cumulative Layout Shift (x1000) |
| **INP** | < 200ms | 200 - 500ms | > 500ms | Interaction to Next Paint |
| **FCP** | < 1,800ms | 1,800 - 3,000ms | > 3,000ms | First Contentful Paint |
| **TTFB** | < 800ms | 800 - 1,800ms | > 1,800ms | Time to First Byte |

> CLS is multiplied by 1000 in our implementation so GA4 can store it as an integer. A raw CLS of 0.1 is stored as `metric_value: 100`.

---

## Troubleshooting

| Issue | Solution |
|---|---|
| No `web_vitals` events in Realtime | Check `import.meta.env.PROD` — dev mode logs to console only |
| Events visible but custom dimensions empty | Wait 24-48h after registering dimensions |
| Missing INP data | INP only fires after user interaction (click, tap, keypress) |
| CLS values seem high | Remember values are x1000 — a value of 50 means CLS = 0.05 (good) |
| Events blocked | Disable ad blockers; check CSP headers allow `google-analytics.com` |
