import fs from 'node:fs';
import path from 'node:path';
import { GoogleAuth } from 'google-auth-library';

// ─── Configuration ────────────────────────────────────────────

const ROOT = path.resolve(import.meta.dirname, '..', '..');

function loadEnvFile(): Record<string, string> {
  const envLocal = path.join(ROOT, '.env.local');
  const envFile = path.join(ROOT, '.env');
  const filePath = fs.existsSync(envLocal) ? envLocal : fs.existsSync(envFile) ? envFile : null;
  if (!filePath) return {};

  const content = fs.readFileSync(filePath, 'utf-8');
  const vars: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

function getPropertyId(): string {
  const envVars = loadEnvFile();
  return process.env.GA_PROPERTY_ID || envVars.GA_PROPERTY_ID || '';
}

const MISSING_PROPERTY_MSG = [
  'GA_PROPERTY_ID is not set.',
  '',
  'To use Analytics tools, set the GA_PROPERTY_ID environment variable or add it to .env.local:',
  '',
  '  export GA_PROPERTY_ID=123456789',
  '',
  'Find your GA4 property ID at:',
  '  https://analytics.google.com/ > Admin > Property Settings > Property ID',
  '',
  'The property ID is a numeric ID (e.g. 123456789), NOT the measurement ID (G-XXXXXXX).',
  '',
  'Auth uses Application Default Credentials (ADC). Ensure the account has',
  'GA4 Viewer access. Run `gcloud auth application-default login` if needed.',
].join('\n');

// ─── GA4 Data API (REST) ──────────────────────────────────────

type MetricType = 'pageViews' | 'activeUsers' | 'sessions';

const METRIC_MAP: Record<MetricType, string> = {
  pageViews: 'screenPageViews',
  activeUsers: 'activeUsers',
  sessions: 'sessions',
};

interface RunReportRequest {
  dateRanges: Array<{ startDate: string; endDate: string }>;
  dimensions?: Array<{ name: string }>;
  metrics: Array<{ name: string }>;
  orderBys?: Array<{ metric?: { metricName: string }; desc?: boolean }>;
  limit?: number;
}

interface RunReportRow {
  dimensionValues?: Array<{ value: string }>;
  metricValues?: Array<{ value: string }>;
}

interface RunReportResponse {
  rows?: RunReportRow[];
  totals?: Array<{ metricValues?: Array<{ value: string }> }>;
  rowCount?: number;
  metadata?: { currencyCode?: string; timeZone?: string };
}

async function getAccessToken(): Promise<string> {
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const token = typeof tokenResponse === 'string' ? tokenResponse : tokenResponse?.token;
  if (!token) throw new Error('Failed to obtain access token from ADC');
  return token;
}

async function runReport(
  propertyId: string,
  body: RunReportRequest,
): Promise<RunReportResponse> {
  const token = await getAccessToken();
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`GA4 API error: ${response.status} ${response.statusText}\n${text}`);
  }

  return (await response.json()) as RunReportResponse;
}

// ─── Helpers ──────────────────────────────────────────────────

function formatDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

// MFE route prefix -> display name
const MFE_ROUTE_MAP: Record<string, string> = {
  '/weather': 'Weather Display',
  '/stocks': 'Stock Tracker',
  '/podcasts': 'Podcast Player',
  '/ai': 'AI Assistant',
  '/bible': 'Bible Reader',
  '/worship': 'Worship Songs',
  '/notebook': 'Notebook',
  '/baby': 'Baby Tracker',
  '/child-development': 'Child Development',
  '/chinese': 'Chinese Learning',
  '/english': 'English Learning',
  '/flashcards': 'Flashcards',
  '/daily-log': 'Daily Log',
  '/cloud-files': 'Cloud Files',
  '/benchmark': 'Model Benchmark',
  '/immigration': 'Immigration Tracker',
  '/digital-library': 'Digital Library',
  '/family-games': 'Family Games',
  '/doc-scanner': 'Doc Scanner',
  '/hiking': 'Hiking Map',
  '/trip-planner': 'Trip Planner',
  '/polls': 'Poll System',
  '/radio': 'Radio Station',
  '/interview': 'AI Interviewer',
  '/transit': 'Transit Tracker',
  '/travel-map': 'Travel Map',
};

function getMfePrefix(pagePath: string): string | null {
  const match = pagePath.match(/^(\/[a-z][a-z0-9-]*)/);
  if (!match) return null;
  const prefix = match[1];
  return prefix in MFE_ROUTE_MAP ? prefix : null;
}

// ─── Public API ───────────────────────────────────────────────

export interface AnalyticsSummaryOptions {
  days?: number;
  metric?: MetricType;
}

/**
 * Get page view and user metrics from GA4.
 * Returns top pages by the selected metric, plus totals.
 */
export async function readAnalyticsSummary(options: AnalyticsSummaryOptions = {}): Promise<string> {
  const propertyId = getPropertyId();
  if (!propertyId) return MISSING_PROPERTY_MSG;

  const { days = 7, metric = 'pageViews' } = options;
  const gaMetric = METRIC_MAP[metric];

  try {
    // Run two reports in parallel: top pages and totals for all three metrics
    const [pagesReport, totalsReport] = await Promise.all([
      runReport(propertyId, {
        dateRanges: [{ startDate: formatDate(days), endDate: 'today' }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: gaMetric }],
        orderBys: [{ metric: { metricName: gaMetric }, desc: true }],
        limit: 20,
      }),
      runReport(propertyId, {
        dateRanges: [{ startDate: formatDate(days), endDate: 'today' }],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'activeUsers' },
          { name: 'sessions' },
        ],
      }),
    ]);

    const sections: string[] = [];

    // Totals
    const totalRow = totalsReport.rows?.[0];
    if (totalRow?.metricValues) {
      const [views, users, sessions] = totalRow.metricValues.map(v => Number(v.value).toLocaleString());
      sections.push(
        `# Analytics Summary (last ${days} day${days === 1 ? '' : 's'})`,
        '',
        `| Metric | Total |`,
        `|--------|-------|`,
        `| Page Views | ${views} |`,
        `| Active Users | ${users} |`,
        `| Sessions | ${sessions} |`,
      );
    } else {
      sections.push(
        `# Analytics Summary (last ${days} day${days === 1 ? '' : 's'})`,
        '',
        'No data available for the selected period.',
      );
    }

    // Top pages
    if (pagesReport.rows && pagesReport.rows.length > 0) {
      const metricLabel = metric === 'pageViews' ? 'Page Views' : metric === 'activeUsers' ? 'Active Users' : 'Sessions';
      sections.push('', `## Top Pages by ${metricLabel}`, '', `| # | Path | ${metricLabel} |`, `|---|------|${'-'.repeat(metricLabel.length + 2)}|`);

      for (let i = 0; i < pagesReport.rows.length; i++) {
        const row = pagesReport.rows[i];
        const pagePath = row.dimensionValues?.[0]?.value || '(unknown)';
        const value = Number(row.metricValues?.[0]?.value || 0).toLocaleString();
        sections.push(`| ${i + 1} | ${pagePath} | ${value} |`);
      }
    }

    return sections.join('\n');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return `Error reading GA4 analytics: ${msg}`;
  }
}

/**
 * Which MFE routes are most used.
 * Groups page paths by first segment and maps to MFE names.
 */
export async function readFeatureUsage(days: number = 7): Promise<string> {
  const propertyId = getPropertyId();
  if (!propertyId) return MISSING_PROPERTY_MSG;

  try {
    const report = await runReport(propertyId, {
      dateRanges: [{ startDate: formatDate(days), endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 1000, // Fetch many rows so we can aggregate by MFE
    });

    if (!report.rows || report.rows.length === 0) {
      return `No page view data in the last ${days} day(s).`;
    }

    // Aggregate views by MFE route prefix
    const mfeViews = new Map<string, number>();
    let homeViews = 0;
    let otherViews = 0;

    for (const row of report.rows) {
      const pagePath = row.dimensionValues?.[0]?.value || '';
      const views = Number(row.metricValues?.[0]?.value || 0);

      if (pagePath === '/' || pagePath === '') {
        homeViews += views;
        continue;
      }

      const prefix = getMfePrefix(pagePath);
      if (prefix) {
        mfeViews.set(prefix, (mfeViews.get(prefix) || 0) + views);
      } else {
        otherViews += views;
      }
    }

    // Sort by views descending
    const sorted = [...mfeViews.entries()].sort((a, b) => b[1] - a[1]);

    const sections: string[] = [
      `# MFE Feature Usage (last ${days} day${days === 1 ? '' : 's'})`,
      '',
      `| # | Route | MFE | Page Views |`,
      `|---|-------|-----|------------|`,
    ];

    let rank = 1;

    // Home page first if it has views
    if (homeViews > 0) {
      sections.push(`| ${rank++} | / | Dashboard (Home) | ${homeViews.toLocaleString()} |`);
    }

    for (const [prefix, views] of sorted) {
      const name = MFE_ROUTE_MAP[prefix] || prefix;
      sections.push(`| ${rank++} | ${prefix} | ${name} | ${views.toLocaleString()} |`);
    }

    if (otherViews > 0) {
      sections.push(`| ${rank} | (other) | Non-MFE pages | ${otherViews.toLocaleString()} |`);
    }

    const totalMfeViews = sorted.reduce((sum, [, v]) => sum + v, 0) + homeViews;
    sections.push('', `**Total MFE page views:** ${totalMfeViews.toLocaleString()}`);

    return sections.join('\n');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return `Error reading GA4 feature usage: ${msg}`;
  }
}
