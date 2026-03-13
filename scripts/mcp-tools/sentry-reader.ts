import fs from 'node:fs';
import path from 'node:path';

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
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

function getConfig() {
  const envVars = loadEnvFile();
  return {
    org: process.env.SENTRY_ORG || envVars.SENTRY_ORG || 'youpeng-huang',
    project: process.env.SENTRY_PROJECT || envVars.SENTRY_PROJECT || 'javascript-react',
    authToken: process.env.SENTRY_AUTH_TOKEN || envVars.SENTRY_AUTH_TOKEN || '',
  };
}

const MISSING_TOKEN_MSG = [
  'SENTRY_AUTH_TOKEN is not set.',
  '',
  'To use Sentry tools, set the SENTRY_AUTH_TOKEN environment variable or add it to .env.local:',
  '',
  '  export SENTRY_AUTH_TOKEN=sntrys_...',
  '',
  'You can create a token at: https://sentry.io/settings/account/api/auth-tokens/',
  'Required scope: project:read',
].join('\n');

// ─── API Helpers ──────────────────────────────────────────────

interface SentryRequestOptions {
  path: string;
  params?: Record<string, string>;
}

async function sentryFetch({ path: apiPath, params }: SentryRequestOptions): Promise<{ ok: boolean; data: unknown; status: number; statusText: string }> {
  const config = getConfig();
  if (!config.authToken) {
    return { ok: false, data: MISSING_TOKEN_MSG, status: 0, statusText: 'No token' };
  }

  const url = new URL(`https://sentry.io${apiPath}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${config.authToken}`,
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    return { ok: false, data: `Sentry API error: ${response.status} ${response.statusText}\n${text}`, status: response.status, statusText: response.statusText };
  }

  const data: unknown = await response.json();
  return { ok: true, data, status: response.status, statusText: response.statusText };
}

// ─── Tool: read_sentry_issues ─────────────────────────────────

interface ReadSentryIssuesOptions {
  limit?: number;
  query?: string;
  status?: 'unresolved' | 'resolved' | 'ignored';
}

interface SentryIssue {
  id: string;
  title: string;
  culprit: string;
  count: string;
  firstSeen: string;
  lastSeen: string;
  level: string;
  shortId: string;
  permalink: string;
  status: string;
  metadata?: { type?: string; value?: string };
}

export async function readSentryIssues(options: ReadSentryIssuesOptions = {}): Promise<string> {
  const config = getConfig();
  if (!config.authToken) return MISSING_TOKEN_MSG;

  const { limit = 10, query, status = 'unresolved' } = options;

  const params: Record<string, string> = {
    limit: String(limit),
    query: status === 'unresolved' ? 'is:unresolved' : status === 'resolved' ? 'is:resolved' : 'is:ignored',
  };

  if (query) {
    params.query = `${params.query} ${query}`;
  }

  const result = await sentryFetch({
    path: `/api/0/projects/${config.org}/${config.project}/issues/`,
    params,
  });

  if (!result.ok) return String(result.data);

  const issues = result.data as SentryIssue[];

  if (issues.length === 0) {
    return `No ${status} issues found${query ? ` matching "${query}"` : ''}.`;
  }

  const lines = issues.map((issue, i) => {
    const firstSeen = new Date(issue.firstSeen).toLocaleDateString();
    const lastSeen = new Date(issue.lastSeen).toLocaleDateString();
    return [
      `${i + 1}. **${issue.title}**`,
      `   ID: ${issue.id} | Level: ${issue.level} | Events: ${issue.count}`,
      `   Culprit: ${issue.culprit || '(unknown)'}`,
      `   First seen: ${firstSeen} | Last seen: ${lastSeen}`,
      `   URL: ${issue.permalink}`,
    ].join('\n');
  });

  return `# Sentry Issues (${status}) — ${issues.length} result(s)\n\n${lines.join('\n\n')}`;
}

// ─── Tool: read_sentry_issue_detail ───────────────────────────

interface SentryIssueDetail {
  id: string;
  title: string;
  culprit: string;
  count: string;
  firstSeen: string;
  lastSeen: string;
  level: string;
  status: string;
  permalink: string;
  userCount: number;
  metadata?: { type?: string; value?: string };
  tags?: Array<{ key: string; value: string; topValues?: Array<{ value: string; count: number }> }>;
}

interface SentryEvent {
  eventID: string;
  title: string;
  message: string;
  dateCreated: string;
  entries?: Array<{
    type: string;
    data?: {
      values?: Array<{
        type?: string;
        value?: string;
        stacktrace?: {
          frames?: Array<{
            filename?: string;
            function?: string;
            lineNo?: number;
            colNo?: number;
            absPath?: string;
            context?: Array<[number, string]>;
          }>;
        };
      }>;
    };
  }>;
  tags?: Array<{ key: string; value: string }>;
}

export async function readSentryIssueDetail(issueId: string): Promise<string> {
  const config = getConfig();
  if (!config.authToken) return MISSING_TOKEN_MSG;

  // Fetch issue details and latest event in parallel
  const [issueResult, eventsResult] = await Promise.all([
    sentryFetch({ path: `/api/0/issues/${issueId}/` }),
    sentryFetch({ path: `/api/0/issues/${issueId}/events/`, params: { limit: '1' } }),
  ]);

  if (!issueResult.ok) return String(issueResult.data);

  const issue = issueResult.data as SentryIssueDetail;
  const firstSeen = new Date(issue.firstSeen).toLocaleString();
  const lastSeen = new Date(issue.lastSeen).toLocaleString();

  const sections: string[] = [
    `# ${issue.title}`,
    '',
    `| Field | Value |`,
    `|-------|-------|`,
    `| ID | ${issue.id} |`,
    `| Level | ${issue.level} |`,
    `| Status | ${issue.status} |`,
    `| Events | ${issue.count} |`,
    `| Affected users | ${issue.userCount} |`,
    `| Culprit | ${issue.culprit || '(unknown)'} |`,
    `| First seen | ${firstSeen} |`,
    `| Last seen | ${lastSeen} |`,
    `| URL | ${issue.permalink} |`,
  ];

  // Tags
  if (issue.tags && issue.tags.length > 0) {
    sections.push('', '## Tags', '');
    for (const tag of issue.tags.slice(0, 15)) {
      const topVals = tag.topValues
        ? tag.topValues.slice(0, 3).map(v => `${v.value} (${v.count})`).join(', ')
        : tag.value;
      sections.push(`- **${tag.key}**: ${topVals}`);
    }
  }

  // Stack trace from latest event
  if (eventsResult.ok) {
    const events = eventsResult.data as SentryEvent[];
    if (events.length > 0) {
      const event = events[0];
      sections.push('', '## Latest Event', '');
      sections.push(`Event ID: ${event.eventID}`);
      sections.push(`Date: ${new Date(event.dateCreated).toLocaleString()}`);

      const exceptionEntry = event.entries?.find(e => e.type === 'exception');
      if (exceptionEntry?.data?.values) {
        for (const exc of exceptionEntry.data.values) {
          sections.push('', `### ${exc.type || 'Error'}: ${exc.value || '(no message)'}`);

          if (exc.stacktrace?.frames) {
            // Show frames in reverse (most recent call first), limit to 10
            const frames = [...exc.stacktrace.frames].reverse().slice(0, 10);
            sections.push('', '```');
            for (const frame of frames) {
              const loc = frame.lineNo ? `:${frame.lineNo}${frame.colNo ? `:${frame.colNo}` : ''}` : '';
              const file = frame.filename || frame.absPath || '(unknown)';
              const fn = frame.function || '(anonymous)';
              sections.push(`  at ${fn} (${file}${loc})`);
            }
            sections.push('```');
          }
        }
      }
    }
  }

  return sections.join('\n');
}
