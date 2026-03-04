import { describe, it, expect, vi, beforeEach } from 'vitest';

const FIXED_TOKEN = '00000000-0000-0000-0000-000000000001';

// Mock crypto.randomUUID to return a fixed token
vi.mock('crypto', async () => {
  const actual = await vi.importActual<typeof import('crypto')>('crypto');
  return { ...actual, default: { ...actual, randomUUID: vi.fn(() => FIXED_TOKEN) } };
});

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
vi.mock('firebase-admin/storage', () => ({
  getStorage: vi.fn(),
}));
vi.mock('firebase-admin/app-check', () => ({
  getAppCheck: vi.fn(),
}));
vi.mock('axios', () => ({
  default: { get: vi.fn() },
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
vi.mock('firebase-functions/v2/firestore', () => ({
  onDocumentCreated: (_opts: any, handler: any) => handler,
}));
vi.mock('../recaptcha.js', () => ({
  verifyRecaptchaToken: vi.fn().mockResolvedValue({ valid: true, score: 0.9 }),
}));

function createMockBucket(bucketName = 'test-bucket') {
  const mockFile = {
    save: vi.fn().mockResolvedValue(undefined),
    setMetadata: vi.fn().mockResolvedValue(undefined),
  };
  return {
    name: bucketName,
    file: vi.fn().mockReturnValue(mockFile),
    _mockFile: mockFile,
  };
}

describe('uploadToStorage', () => {
  let uploadToStorage: typeof import('../index.js')['uploadToStorage'];

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('../index.js');
    uploadToStorage = mod.uploadToStorage;
  });

  it('calls file.save with correct contentType and token metadata', async () => {
    const bucket = createMockBucket();
    const data = Buffer.from('hello');

    await uploadToStorage(bucket as any, 'path/to/file.txt', data, 'text/plain');

    expect(bucket.file).toHaveBeenCalledWith('path/to/file.txt');
    expect(bucket._mockFile.save).toHaveBeenCalledWith(data, {
      contentType: 'text/plain',
      metadata: {
        metadata: { firebaseStorageDownloadTokens: FIXED_TOKEN },
      },
    });
  });

  it('returns a valid download URL with the token', async () => {
    const bucket = createMockBucket('my-bucket');
    const data = Buffer.from('test');

    const result = await uploadToStorage(bucket as any, 'users/abc/photo.jpg', data, 'image/jpeg');

    expect(result.downloadUrl).toBe(
      `https://firebasestorage.googleapis.com/v0/b/my-bucket/o/${encodeURIComponent('users/abc/photo.jpg')}?alt=media&token=${FIXED_TOKEN}`,
    );
    expect(result.downloadToken).toBe(FIXED_TOKEN);
  });

  it('passes cacheControl when provided', async () => {
    const bucket = createMockBucket();
    const data = Buffer.from('data');

    await uploadToStorage(bucket as any, 'file.bin', data, 'application/octet-stream', {
      cacheControl: 'public, max-age=31536000',
    });

    expect(bucket._mockFile.save).toHaveBeenCalledWith(data, {
      contentType: 'application/octet-stream',
      metadata: {
        cacheControl: 'public, max-age=31536000',
        metadata: { firebaseStorageDownloadTokens: FIXED_TOKEN },
      },
    });
  });

  it('passes customMetadata when provided', async () => {
    const bucket = createMockBucket();
    const data = Buffer.from('epub');

    await uploadToStorage(bucket as any, 'books/1/original.epub', data, 'application/epub+zip', {
      customMetadata: { uploadedBy: 'user-123' },
    });

    expect(bucket._mockFile.save).toHaveBeenCalledWith(data, {
      contentType: 'application/epub+zip',
      metadata: {
        metadata: { firebaseStorageDownloadTokens: FIXED_TOKEN, uploadedBy: 'user-123' },
      },
    });
  });

  it('omits cacheControl from metadata when not provided', async () => {
    const bucket = createMockBucket();
    const data = Buffer.from('audio');

    await uploadToStorage(bucket as any, 'audio.mp3', data, 'audio/mpeg');

    const saveCall = bucket._mockFile.save.mock.calls[0];
    expect(saveCall[1].metadata).not.toHaveProperty('cacheControl');
  });
});

describe('getStorageDownloadUrl', () => {
  let getStorageDownloadUrl: typeof import('../index.js')['getStorageDownloadUrl'];

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('../index.js');
    getStorageDownloadUrl = mod.getStorageDownloadUrl;
  });

  it('calls setMetadata with token on the file', async () => {
    const bucket = createMockBucket();

    await getStorageDownloadUrl(bucket as any, 'shared-files/abc/doc.pdf');

    expect(bucket.file).toHaveBeenCalledWith('shared-files/abc/doc.pdf');
    expect(bucket._mockFile.setMetadata).toHaveBeenCalledWith({
      metadata: { firebaseStorageDownloadTokens: FIXED_TOKEN },
    });
  });

  it('returns a valid download URL with the token', async () => {
    const bucket = createMockBucket('prod-bucket');

    const result = await getStorageDownloadUrl(bucket as any, 'shared/file.txt');

    expect(result.downloadUrl).toBe(
      `https://firebasestorage.googleapis.com/v0/b/prod-bucket/o/${encodeURIComponent('shared/file.txt')}?alt=media&token=${FIXED_TOKEN}`,
    );
    expect(result.downloadToken).toBe(FIXED_TOKEN);
  });
});
