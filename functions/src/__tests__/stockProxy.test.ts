import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase-admin modules before importing anything
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

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

// Mock firebase-functions
vi.mock('firebase-functions/v2/https', () => {
  return {
    onRequest: (_opts: any, handler: any) => handler,
    onCall: (_opts: any, handler: any) => handler,
    HttpsError: class HttpsError extends Error {
      code: string;
      constructor(code: string, message: string) {
        super(message);
        this.code = code;
      }
    },
  };
});
vi.mock('firebase-functions/v2/scheduler', () => ({
  onSchedule: (_opts: any, handler: any) => handler,
}));

import axios from 'axios';

function createMockReq(overrides: Record<string, any> = {}) {
  return {
    method: 'GET',
    headers: { authorization: 'Bearer valid-token' },
    path: '/stock/search',
    query: {},
    body: {},
    ...overrides,
  } as any;
}

function createMockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('stockProxy', () => {
  let stockProxy: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.FINNHUB_API_KEY = 'test-key';
    // Re-import to get the handler
    const mod = await import('../index.js');
    stockProxy = mod.stockProxy;
  });

  it('returns 401 without auth token', async () => {
    const req = createMockReq({ headers: {} });
    const res = createMockRes();
    await stockProxy(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
  });

  it('returns 400 when search q param is missing', async () => {
    const req = createMockReq({ path: '/stock/search', query: {} });
    const res = createMockRes();
    await stockProxy(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'q parameter required' });
  });

  it('returns 400 when quote symbol param is missing', async () => {
    const req = createMockReq({ path: '/stock/quote', query: {} });
    const res = createMockRes();
    await stockProxy(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'symbol parameter required' });
  });

  it('returns 404 for unknown stock route', async () => {
    const req = createMockReq({ path: '/stock/unknown', query: {} });
    const res = createMockRes();
    await stockProxy(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('proxies search request to Finnhub', async () => {
    const mockData = { result: [{ symbol: 'AAPL' }] };
    vi.mocked(axios.get).mockResolvedValueOnce({ data: mockData } as any);

    const req = createMockReq({ path: '/stock/search', query: { q: 'apple' } });
    const res = createMockRes();
    await stockProxy(req, res);

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('search?q=apple'),
      expect.objectContaining({ headers: { 'X-Finnhub-Token': 'test-key' } }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockData);
  });

  it('returns 500 when FINNHUB_API_KEY is not set', async () => {
    delete process.env.FINNHUB_API_KEY;
    const req = createMockReq({});
    const res = createMockRes();
    await stockProxy(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'FINNHUB_API_KEY not configured' });
  });
});
