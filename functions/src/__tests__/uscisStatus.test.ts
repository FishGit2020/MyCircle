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

function mockOAuthToken() {
  vi.mocked(axios.post).mockResolvedValueOnce({
    data: { access_token: 'mock-token', expires_in: 3600 },
  } as any);
}

function mockApiResponse(receiptNumber?: string) {
  const resp = receiptNumber
    ? { case_status: { ...MOCK_API_RESPONSE.case_status, receiptNumber } }
    : MOCK_API_RESPONSE;
  vi.mocked(axios.get).mockResolvedValueOnce({ data: resp } as any);
}

describe('uscisStatus endpoint', () => {
  let uscisStatus: any;
  const CREDS = JSON.stringify({ clientId: 'test-id', clientSecret: 'test-secret' });

  beforeEach(async () => {
    vi.mocked(axios.post).mockReset();
    vi.mocked(axios.get).mockReset();
    process.env.USCIS_CREDS = CREDS;
    const mod = await import('../index.js');
    uscisStatus = mod.uscisStatus;
  });

  afterEach(() => {
    delete process.env.USCIS_CREDS;
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

  it('returns case status from official API', async () => {
    const receipt = uniqueReceipt();
    mockOAuthToken();
    mockApiResponse(receipt);

    const req = createMockReq({ query: { receiptNumber: receipt } });
    const res = createMockRes();
    await uscisStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        receiptNumber: receipt,
        status: 'Case Was Approved',
        formType: 'I-765',
        checkedAt: expect.any(String),
      }),
    );
  });

  it('handles timeout as 504', async () => {
    const receipt = uniqueReceipt();
    mockOAuthToken();
    vi.mocked(axios.get).mockRejectedValueOnce({
      code: 'ECONNABORTED',
      message: 'timeout of 10000ms exceeded',
    });

    const req = createMockReq({ query: { receiptNumber: receipt } });
    const res = createMockRes();
    await uscisStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(504);
    expect(res.json).toHaveBeenCalledWith({ error: 'USCIS service timed out' });
  });

  it('handles API 429 rate limit', async () => {
    const receipt = uniqueReceipt();
    mockOAuthToken();
    vi.mocked(axios.get).mockRejectedValueOnce({
      response: { status: 429 },
      message: 'Too Many Requests',
    });

    const req = createMockReq({ query: { receiptNumber: receipt } });
    const res = createMockRes();
    await uscisStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(429);
  });

  it('returns cached result on repeated requests', async () => {
    const receipt = uniqueReceipt();
    mockOAuthToken();
    mockApiResponse(receipt);

    const req1 = createMockReq({ query: { receiptNumber: receipt } });
    const res1 = createMockRes();
    await uscisStatus(req1, res1);
    expect(res1.status).toHaveBeenCalledWith(200);

    // Second request should use cache — axios.get should not be called again
    const req2 = createMockReq({ query: { receiptNumber: receipt } });
    const res2 = createMockRes();
    await uscisStatus(req2, res2);
    expect(res2.status).toHaveBeenCalledWith(200);
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it('handles unknown errors as 500', async () => {
    const receipt = uniqueReceipt();
    mockOAuthToken();
    vi.mocked(axios.get).mockRejectedValueOnce(new Error('Network error'));

    const req = createMockReq({ query: { receiptNumber: receipt } });
    const res = createMockRes();
    await uscisStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch USCIS case status' });
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

  it('fetches case status via official API', async () => {
    process.env.USCIS_CREDS = JSON.stringify({ clientId: 'test-id', clientSecret: 'test-secret' });
    mockOAuthToken();
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
      history: [
        { date: '2023-10-19', status: 'Case Was Approved' },
        { date: '2023-06-15', status: 'Case Was Received' },
      ],
    }));
  });

  it('refreshes token on 401 and retries', async () => {
    process.env.USCIS_CREDS = JSON.stringify({ clientId: 'test-id', clientSecret: 'test-secret' });

    // First + second OAuth token
    vi.mocked(axios.post)
      .mockResolvedValueOnce({ data: { access_token: 'token-1', expires_in: 3600 } } as any)
      .mockResolvedValueOnce({ data: { access_token: 'token-2', expires_in: 3600 } } as any);

    // First API call fails with 401, second succeeds
    vi.mocked(axios.get)
      .mockRejectedValueOnce({ response: { status: 401 }, message: 'Unauthorized' })
      .mockResolvedValueOnce({ data: MOCK_API_RESPONSE } as any);

    const result = await fetchUscisStatus('MSC0000000099');

    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(result.status).toBe('Case Was Approved');
  });

  it('throws when USCIS_CREDS is not configured', async () => {
    delete process.env.USCIS_CREDS;
    await expect(fetchUscisStatus('MSC0000000099')).rejects.toThrow('USCIS_CREDS secret not configured');
  });

  it('caches OAuth token across calls', async () => {
    process.env.USCIS_CREDS = JSON.stringify({ clientId: 'test-id', clientSecret: 'test-secret' });

    // Single OAuth token response
    mockOAuthToken();

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

  it('throws on unexpected API response shape', async () => {
    process.env.USCIS_CREDS = JSON.stringify({ clientId: 'test-id', clientSecret: 'test-secret' });
    mockOAuthToken();
    vi.mocked(axios.get).mockResolvedValueOnce({ data: {} } as any);

    await expect(fetchUscisStatus('MSC0000000099')).rejects.toThrow('missing case_status');
  });

  it('propagates API errors', async () => {
    process.env.USCIS_CREDS = JSON.stringify({ clientId: 'test-id', clientSecret: 'test-secret' });
    mockOAuthToken();
    vi.mocked(axios.get).mockRejectedValueOnce({ response: { status: 404 }, message: 'Not Found' });

    await expect(fetchUscisStatus('MSC0000000099')).rejects.toEqual(
      expect.objectContaining({ message: 'Not Found' }),
    );
  });
});
