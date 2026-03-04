import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock firebase-admin modules
vi.mock('firebase-admin/app', () => ({
  getApps: () => [{}],
  initializeApp: vi.fn(),
}));
vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({ verifyIdToken: vi.fn().mockResolvedValue({ uid: 'test-user' }) }),
}));
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(),
  FieldValue: { serverTimestamp: vi.fn() },
}));
vi.mock('firebase-admin/messaging', () => ({
  getMessaging: vi.fn(),
}));
vi.mock('firebase-admin/app-check', () => ({
  getAppCheck: vi.fn(),
}));

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('firebase-functions', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock('firebase-functions/v2/https', () => ({
  onRequest: (_opts: any, handler: any) => handler,
  onCall: (_opts: any, handler: any) => handler,
  HttpsError: class HttpsError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
}));
vi.mock('firebase-functions/v2/scheduler', () => ({
  onSchedule: (_opts: any, handler: any) => handler,
}));
vi.mock('../recaptcha.js', () => ({
  verifyRecaptchaToken: vi.fn().mockResolvedValue({ valid: true, score: 0.9 }),
}));

import axios from 'axios';

// Use a counter to generate unique receipt numbers per test, avoiding cache collisions
let receiptCounter = 0;
function uniqueReceipt(): string {
  receiptCounter++;
  return `MSC${String(receiptCounter).padStart(10, '0')}`;
}

function createMockReq(overrides: Record<string, any> = {}) {
  return {
    method: 'GET',
    headers: { authorization: 'Bearer valid-token' },
    path: '/api/uscis/status',
    query: {},
    body: {},
    ip: '127.0.0.1',
    ...overrides,
  } as any;
}

function createMockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

const MOCK_USCIS_HTML = `
<html>
<body>
<div class="rows text-center">
  <h1>Case Was Approved</h1>
  <p>On October 19, 2023, we approved your Form I-765, Application for Employment Authorization.</p>
</div>
</body>
</html>
`;

const MOCK_API_RESPONSE = {
  case_status: {
    receiptNumber: 'MSC0000000099',
    formType: 'I-765',
    current_case_status_text_en: 'Case Was Approved',
    current_case_status_desc_en: 'On October 19, 2023, we approved your Form I-765.',
    submittedDate: '2023-06-15',
    modifiedDate: '2023-10-19',
    hist_case_status: [
      { date: '2023-10-19', case_status_text_en: 'Case Was Approved' },
      { date: '2023-06-15', case_status_text_en: 'Case Was Received' },
    ],
  },
};

describe('uscisStatus endpoint', () => {
  let uscisStatus: any;

  beforeEach(async () => {
    vi.mocked(axios.post).mockReset();
    vi.mocked(axios.get).mockReset();
    // No USCIS_CREDS by default — falls back to scraper
    delete process.env.USCIS_CREDS;
    const mod = await import('../index.js');
    uscisStatus = mod.uscisStatus;
  });

  it('returns 401 without auth token', async () => {
    const req = createMockReq({ headers: {} });
    const res = createMockRes();
    await uscisStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
  });

  it('returns 400 when receiptNumber is missing', async () => {
    const req = createMockReq({ query: {} });
    const res = createMockRes();
    await uscisStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'receiptNumber parameter required' });
  });

  it('returns 400 for invalid receipt number format', async () => {
    const req = createMockReq({ query: { receiptNumber: 'INVALID' } });
    const res = createMockRes();
    await uscisStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('Invalid receipt number format') }),
    );
  });

  it('returns 404 for non-status routes', async () => {
    const req = createMockReq({ path: '/api/uscis/other' });
    const res = createMockRes();
    await uscisStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('parses USCIS HTML response correctly (scraper fallback)', async () => {
    const receipt = uniqueReceipt();
    vi.mocked(axios.post).mockResolvedValueOnce({ data: MOCK_USCIS_HTML } as any);

    const req = createMockReq({ query: { receiptNumber: receipt } });
    const res = createMockRes();
    await uscisStatus(req, res);

    expect(axios.post).toHaveBeenCalledWith(
      'https://egov.uscis.gov/casestatus/mycasestatus.do',
      expect.stringContaining(`appReceiptNum=${receipt}`),
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/x-www-form-urlencoded' }),
      }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        receiptNumber: receipt,
        status: 'Case Was Approved',
        formType: 'Form I-765',
        statusDescription: expect.stringContaining('Application for Employment Authorization'),
        checkedAt: expect.any(String),
        source: 'scraper',
      }),
    );
  });

  it('handles USCIS 403 as 503', async () => {
    const receipt = uniqueReceipt();
    vi.mocked(axios.post).mockRejectedValueOnce({
      response: { status: 403 },
      message: 'Forbidden',
    });

    const req = createMockReq({ query: { receiptNumber: receipt } });
    const res = createMockRes();
    await uscisStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ error: 'USCIS service temporarily unavailable' });
  });

  it('handles timeout as 504', async () => {
    const receipt = uniqueReceipt();
    vi.mocked(axios.post).mockRejectedValueOnce({
      code: 'ECONNABORTED',
      message: 'timeout of 15000ms exceeded',
    });

    const req = createMockReq({ query: { receiptNumber: receipt } });
    const res = createMockRes();
    await uscisStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(504);
    expect(res.json).toHaveBeenCalledWith({ error: 'USCIS service timed out' });
  });

  it('returns cached result on repeated requests', async () => {
    const receipt = uniqueReceipt();
    vi.mocked(axios.post).mockResolvedValueOnce({ data: MOCK_USCIS_HTML } as any);

    const req1 = createMockReq({ query: { receiptNumber: receipt } });
    const res1 = createMockRes();
    await uscisStatus(req1, res1);
    expect(res1.status).toHaveBeenCalledWith(200);

    // Second request should use cache — axios.post should not be called again
    const req2 = createMockReq({ query: { receiptNumber: receipt } });
    const res2 = createMockRes();
    await uscisStatus(req2, res2);
    expect(res2.status).toHaveBeenCalledWith(200);
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  it('handles unknown USCIS errors as 500', async () => {
    const receipt = uniqueReceipt();
    vi.mocked(axios.post).mockRejectedValueOnce(new Error('Network error'));

    const req = createMockReq({ query: { receiptNumber: receipt } });
    const res = createMockRes();
    await uscisStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch USCIS case status' });
  });

  it('returns Unknown Status when HTML has no h1', async () => {
    const receipt = uniqueReceipt();
    vi.mocked(axios.post).mockResolvedValueOnce({ data: '<html><body>No status here</body></html>' } as any);

    const req = createMockReq({ query: { receiptNumber: receipt } });
    const res = createMockRes();
    await uscisStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'Unknown Status', formType: '' }),
    );
  });
});

describe('fetchUscisStatus (uscisApi module)', () => {
  let fetchUscisStatus: any;
  let _resetTokenCache: any;

  beforeEach(async () => {
    vi.mocked(axios.post).mockReset();
    vi.mocked(axios.get).mockReset();
    const mod = await import('../uscisApi.js');
    fetchUscisStatus = mod.fetchUscisStatus;
    _resetTokenCache = mod._resetTokenCache;
    _resetTokenCache();
  });

  afterEach(() => {
    delete process.env.USCIS_CREDS;
  });

  it('uses official API when USCIS_CREDS are configured', async () => {
    process.env.USCIS_CREDS = JSON.stringify({ clientId: 'test-id', clientSecret: 'test-secret' });

    // Mock OAuth token response
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: { access_token: 'mock-token', expires_in: 3600 },
    } as any);

    // Mock case status API response
    vi.mocked(axios.get).mockResolvedValueOnce({ data: MOCK_API_RESPONSE } as any);

    const result = await fetchUscisStatus('MSC0000000099');

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/oauth/accesstoken'),
      'grant_type=client_credentials',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': expect.stringContaining('Basic '),
        }),
      }),
    );
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/case-status/MSC0000000099'),
      expect.objectContaining({
        headers: { 'Authorization': 'Bearer mock-token' },
      }),
    );
    expect(result).toEqual(expect.objectContaining({
      receiptNumber: 'MSC0000000099',
      formType: 'I-765',
      status: 'Case Was Approved',
      submittedDate: '2023-06-15',
      modifiedDate: '2023-10-19',
      source: 'api',
      history: [
        { date: '2023-10-19', status: 'Case Was Approved' },
        { date: '2023-06-15', status: 'Case Was Received' },
      ],
    }));
  });

  it('falls back to scraper when API returns 404', async () => {
    process.env.USCIS_CREDS = JSON.stringify({ clientId: 'test-id', clientSecret: 'test-secret' });

    // Mock OAuth token response
    vi.mocked(axios.post)
      .mockResolvedValueOnce({ data: { access_token: 'mock-token', expires_in: 3600 } } as any)
      // Mock scraper response (second axios.post call)
      .mockResolvedValueOnce({ data: MOCK_USCIS_HTML } as any);

    // Mock API 404
    vi.mocked(axios.get).mockRejectedValueOnce({ response: { status: 404 }, message: 'Not Found' });

    const receipt = uniqueReceipt();
    const result = await fetchUscisStatus(receipt);

    expect(result.source).toBe('scraper');
    expect(result.status).toBe('Case Was Approved');
  });

  it('refreshes token on 401 and retries', async () => {
    process.env.USCIS_CREDS = JSON.stringify({ clientId: 'test-id', clientSecret: 'test-secret' });

    // First OAuth token
    vi.mocked(axios.post)
      .mockResolvedValueOnce({ data: { access_token: 'token-1', expires_in: 3600 } } as any)
      // Second OAuth token (after refresh)
      .mockResolvedValueOnce({ data: { access_token: 'token-2', expires_in: 3600 } } as any);

    // First API call fails with 401, second succeeds
    vi.mocked(axios.get)
      .mockRejectedValueOnce({ response: { status: 401 }, message: 'Unauthorized' })
      .mockResolvedValueOnce({ data: MOCK_API_RESPONSE } as any);

    const result = await fetchUscisStatus('MSC0000000099');

    // Should have made 2 token requests and 2 API calls
    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(result.source).toBe('api');
    expect(result.status).toBe('Case Was Approved');
  });

  it('falls back to scraper when no USCIS_CREDS configured', async () => {
    delete process.env.USCIS_CREDS;

    vi.mocked(axios.post).mockResolvedValueOnce({ data: MOCK_USCIS_HTML } as any);

    const receipt = uniqueReceipt();
    const result = await fetchUscisStatus(receipt);

    // Should not have called the official API
    expect(axios.get).not.toHaveBeenCalled();
    // Should have called the scraper
    expect(axios.post).toHaveBeenCalledWith(
      'https://egov.uscis.gov/casestatus/mycasestatus.do',
      expect.any(String),
      expect.any(Object),
    );
    expect(result.source).toBe('scraper');
    expect(result.status).toBe('Case Was Approved');
  });

  it('caches OAuth token across calls', async () => {
    process.env.USCIS_CREDS = JSON.stringify({ clientId: 'test-id', clientSecret: 'test-secret' });

    // Single OAuth token response
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: { access_token: 'cached-token', expires_in: 3600 },
    } as any);

    // Two API responses
    vi.mocked(axios.get)
      .mockResolvedValueOnce({ data: MOCK_API_RESPONSE } as any)
      .mockResolvedValueOnce({ data: MOCK_API_RESPONSE } as any);

    await fetchUscisStatus('MSC0000000099');
    await fetchUscisStatus('MSC0000000098');

    // OAuth token should only be fetched once
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  it('handles missing case_status in API response by falling back to scraper', async () => {
    process.env.USCIS_CREDS = JSON.stringify({ clientId: 'test-id', clientSecret: 'test-secret' });

    vi.mocked(axios.post)
      .mockResolvedValueOnce({ data: { access_token: 'mock-token', expires_in: 3600 } } as any)
      .mockResolvedValueOnce({ data: MOCK_USCIS_HTML } as any);

    // API returns unexpected shape
    vi.mocked(axios.get).mockResolvedValueOnce({ data: {} } as any);

    const receipt = uniqueReceipt();
    const result = await fetchUscisStatus(receipt);

    expect(result.source).toBe('scraper');
  });
});
