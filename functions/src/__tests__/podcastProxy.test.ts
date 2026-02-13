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
  default: { get: vi.fn() },
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

import axios from 'axios';

function createMockReq(overrides: Record<string, any> = {}) {
  return {
    method: 'GET',
    headers: { authorization: 'Bearer valid-token' },
    path: '/podcast/search',
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

describe('podcastProxy', () => {
  let podcastProxy: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.PODCASTINDEX_API_KEY = 'test-key';
    process.env.PODCASTINDEX_API_SECRET = 'test-secret';
    const mod = await import('../index.js');
    podcastProxy = mod.podcastProxy;
  });

  it('returns 401 without auth token', async () => {
    const req = createMockReq({ headers: {} });
    const res = createMockRes();
    await podcastProxy(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
  });

  it('returns 400 when search q param is missing', async () => {
    const req = createMockReq({ path: '/podcast/search', query: {} });
    const res = createMockRes();
    await podcastProxy(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'q parameter required' });
  });

  it('returns 400 when episodes feedId is missing', async () => {
    const req = createMockReq({ path: '/podcast/episodes', query: {} });
    const res = createMockRes();
    await podcastProxy(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'feedId parameter required' });
  });

  it('returns 404 for unknown podcast route', async () => {
    const req = createMockReq({ path: '/podcast/unknown' });
    const res = createMockRes();
    await podcastProxy(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('proxies trending request to PodcastIndex', async () => {
    const mockData = { feeds: [{ id: 1, title: 'Test Podcast', categories: { '55': 'News' } }] };
    vi.mocked(axios.get).mockResolvedValueOnce({ data: mockData } as any);

    const req = createMockReq({ path: '/podcast/trending' });
    const res = createMockRes();
    await podcastProxy(req, res);

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('podcasts/trending'),
      expect.objectContaining({ headers: expect.objectContaining({ 'X-Auth-Key': 'test-key' }) }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
    // Verify categories are normalized from object to string
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        feeds: expect.arrayContaining([
          expect.objectContaining({ categories: 'News' }),
        ]),
      }),
    );
  });

  it('returns 500 when API credentials are missing', async () => {
    delete process.env.PODCASTINDEX_API_KEY;
    const req = createMockReq({});
    const res = createMockRes();
    await podcastProxy(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'PodcastIndex API credentials not configured' });
  });
});
