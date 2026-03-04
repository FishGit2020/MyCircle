import axios from 'axios';
import { logger } from 'firebase-functions';

// ─── OAuth Token Cache (ephemeral per function instance) ─────────────
let oauthToken: string | null = null;
let tokenExpiresAt = 0;

const DEFAULT_API_BASE = 'https://api.uscis.gov';
const DEFAULT_OAUTH_URL = 'https://api.uscis.gov/oauth/accesstoken';

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
}

// ─── RFC-9457 Error Extraction ───────────────────────────────────────
function extractErrorMessage(err: any): string {
  // RFC-9457 errors array format
  const rfcMessage = err.response?.data?.errors?.[0]?.message;
  if (rfcMessage) return rfcMessage;

  // Simple message format (e.g. 404 "receipt not recognized")
  const simpleMessage = err.response?.data?.message;
  if (simpleMessage) return simpleMessage;

  return err.message || 'Unknown USCIS API error';
}

// ─── OAuth Access Token ──────────────────────────────────────────────
async function getAccessToken(
  clientId: string,
  clientSecret: string,
  oauthUrl: string,
): Promise<string> {
  const now = Date.now();
  if (oauthToken && now < tokenExpiresAt) {
    return oauthToken;
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const resp = await axios.post(
    oauthUrl,
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
  apiBase: string,
  oauthUrl: string,
  demoId?: string,
  retried = false,
): Promise<UscisResult> {
  const token = await getAccessToken(clientId, clientSecret, oauthUrl);

  try {
    const headers: Record<string, string> = { 'Authorization': `Bearer ${token}` };
    if (demoId) {
      headers['demo_id'] = demoId;
    }

    const resp = await axios.get(
      `${apiBase}/case-status/${receiptNumber}`,
      { headers, timeout: 10000 },
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
      return fetchFromUscisApi(receiptNumber, clientId, clientSecret, apiBase, oauthUrl, demoId, true);
    }
    // Extract RFC-9457 or simple error message
    const message = extractErrorMessage(err);
    const status = err.response?.status;
    const enriched = new Error(message);
    (enriched as any).statusCode = status;
    throw enriched;
  }
}

// ─── Entry Point ─────────────────────────────────────────────────────
export async function fetchUscisStatus(receiptNumber: string): Promise<UscisResult> {
  const creds = JSON.parse(process.env.USCIS_CREDS || '{}');
  const { clientId, clientSecret, apiBase, oauthUrl, demoId } = creds;

  if (!clientId || !clientSecret) {
    throw new Error('USCIS_CREDS secret not configured');
  }

  const resolvedApiBase = apiBase || DEFAULT_API_BASE;
  const resolvedOauthUrl = oauthUrl || DEFAULT_OAUTH_URL;

  const result = await fetchFromUscisApi(
    receiptNumber, clientId, clientSecret, resolvedApiBase, resolvedOauthUrl, demoId,
  );
  logger.info('USCIS status fetched', { receiptNumber, status: result.status });
  return result;
}

// Export to allow tests to reset token state
export function _resetTokenCache(): void {
  oauthToken = null;
  tokenExpiresAt = 0;
}
