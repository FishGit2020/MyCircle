import { describe, it, expect, vi, beforeEach } from 'vitest';

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

describe('uscisStatus', () => {
  let uscisStatus: any;

  beforeEach(async () => {
    vi.mocked(axios.post).mockReset();
    vi.mocked(axios.get).mockReset();
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

  it('parses USCIS HTML response correctly', async () => {
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
