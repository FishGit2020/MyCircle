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
vi.mock('../recaptcha.js', () => ({
  verifyRecaptchaToken: vi.fn().mockResolvedValue({ valid: true, score: 0.9 }),
}));

function createMockReq(overrides: Record<string, any> = {}) {
  return {
    method: 'POST',
    headers: { authorization: 'Bearer valid-token' },
    path: '/ai/chat',
    query: {},
    body: { message: 'Hello' },
    ...overrides,
  } as any;
}

function createMockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('aiChat', () => {
  let aiChat: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    const mod = await import('../index.js');
    aiChat = mod.aiChat;
  });

  it('returns 405 for non-POST methods', async () => {
    const req = createMockReq({ method: 'GET' });
    const res = createMockRes();
    await aiChat(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });

  it('returns 401 without auth token', async () => {
    const req = createMockReq({ headers: {} });
    const res = createMockRes();
    await aiChat(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
  });

  it('returns 400 when message is missing', async () => {
    const req = createMockReq({ body: {} });
    const res = createMockRes();
    await aiChat(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Invalid request body' }));
  });

  it('returns 400 when message is not a string', async () => {
    const req = createMockReq({ body: { message: 123 } });
    const res = createMockRes();
    await aiChat(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Invalid request body' }));
  });

  it('returns 500 when GEMINI_API_KEY is not set', async () => {
    delete process.env.GEMINI_API_KEY;
    const req = createMockReq({});
    const res = createMockRes();
    await aiChat(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'GEMINI_API_KEY not configured' });
  });
});
