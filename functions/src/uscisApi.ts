import axios from 'axios';
import { logger } from 'firebase-functions';

// ─── OAuth Token Cache (ephemeral per function instance) ─────────────
let oauthToken: string | null = null;
let tokenExpiresAt = 0;

// Sandbox base URL — change to https://api.uscis.gov for production
const USCIS_API_BASE = 'https://api-int.uscis.gov';

interface UscisHistoryEntry {
  date: string;
  status: string;
}

interface UscisResult {
  receiptNumber: string;
  formType: string;
  status: string;
  statusDescription: string;
  checkedAt: string;
  submittedDate?: string;
  modifiedDate?: string;
  history?: UscisHistoryEntry[];
  source?: 'api' | 'scraper';
}

// ─── OAuth Access Token ──────────────────────────────────────────────
async function getAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const now = Date.now();
  if (oauthToken && now < tokenExpiresAt) {
    return oauthToken;
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const resp = await axios.post(
    `${USCIS_API_BASE}/oauth/accesstoken`,
    'grant_type=client_credentials',
    {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 10000,
    },
  );

  const { access_token, expires_in } = resp.data;
  oauthToken = access_token;
  // Cache with 60s buffer before actual expiry
  tokenExpiresAt = now + (expires_in - 60) * 1000;

  return access_token;
}

// ─── Official USCIS API ──────────────────────────────────────────────
async function fetchFromUscisApi(
  receiptNumber: string,
  clientId: string,
  clientSecret: string,
  retried = false,
): Promise<UscisResult> {
  let token = await getAccessToken(clientId, clientSecret);

  try {
    const resp = await axios.get(
      `${USCIS_API_BASE}/case-status/${receiptNumber}`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 10000,
      },
    );

    const cs = resp.data?.case_status;
    if (!cs) {
      throw new Error('Unexpected API response: missing case_status');
    }

    const result: UscisResult = {
      receiptNumber: cs.receiptNumber || receiptNumber,
      formType: cs.formType || '',
      status: cs.current_case_status_text_en || 'Unknown Status',
      statusDescription: cs.current_case_status_desc_en || '',
      checkedAt: new Date().toISOString(),
      source: 'api',
    };

    if (cs.submittedDate) result.submittedDate = cs.submittedDate;
    if (cs.modifiedDate) result.modifiedDate = cs.modifiedDate;

    if (Array.isArray(cs.hist_case_status) && cs.hist_case_status.length > 0) {
      result.history = cs.hist_case_status.map((h: any) => ({
        date: h.date || '',
        status: h.case_status_text_en || h.status || '',
      }));
    }

    return result;
  } catch (err: any) {
    // On 401, invalidate token and retry once
    if (err.response?.status === 401 && !retried) {
      oauthToken = null;
      tokenExpiresAt = 0;
      return fetchFromUscisApi(receiptNumber, clientId, clientSecret, true);
    }
    throw err;
  }
}

// ─── HTML Scraper (fallback) ─────────────────────────────────────────
async function fetchFromHtmlScraper(receiptNumber: string): Promise<UscisResult> {
  const response = await axios.post(
    'https://egov.uscis.gov/casestatus/mycasestatus.do',
    `appReceiptNum=${encodeURIComponent(receiptNumber)}`,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Origin': 'https://egov.uscis.gov',
        'Referer': 'https://egov.uscis.gov/casestatus/landing.do',
      },
      timeout: 15000,
    },
  );

  const html = response.data as string;

  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const status = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : 'Unknown Status';

  const pMatch = html.match(/<h1[^>]*>[\s\S]*?<\/h1>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
  const statusDescription = pMatch ? pMatch[1].replace(/<[^>]+>/g, '').trim() : '';

  const formMatch = statusDescription.match(/Form I-\d+/i);
  const formType = formMatch ? formMatch[0] : '';

  return {
    receiptNumber,
    formType,
    status,
    statusDescription,
    checkedAt: new Date().toISOString(),
    source: 'scraper',
  };
}

// ─── Unified Entry Point ─────────────────────────────────────────────
export async function fetchUscisStatus(receiptNumber: string): Promise<UscisResult> {
  const creds = JSON.parse(process.env.USCIS_CREDS || '{}');
  const { clientId, clientSecret } = creds;

  // Try official API first if credentials are configured
  if (clientId && clientSecret) {
    try {
      const result = await fetchFromUscisApi(receiptNumber, clientId, clientSecret);
      logger.info('USCIS status via official API', { receiptNumber, status: result.status });
      return result;
    } catch (err: any) {
      const status = err.response?.status;
      // 404/422 = receipt not found in API (e.g. sandbox limitations) — fall back to scraper
      // Network errors also fall back
      logger.warn('USCIS API failed, falling back to scraper', {
        receiptNumber,
        error: err.message,
        status,
      });
    }
  }

  // Fallback to HTML scraper
  const result = await fetchFromHtmlScraper(receiptNumber);
  logger.info('USCIS status via scraper', { receiptNumber, status: result.status });
  return result;
}

// Export for testing
export { getAccessToken as _getAccessToken, fetchFromUscisApi as _fetchFromApi, fetchFromHtmlScraper as _fetchFromScraper };
// Export to allow tests to reset token state
export function _resetTokenCache(): void {
  oauthToken = null;
  tokenExpiresAt = 0;
}
