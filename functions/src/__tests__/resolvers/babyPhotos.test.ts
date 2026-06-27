import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Firestore mock ──────────────────────────────────────────────
// Models the "missing parent document" case: a milestone doc that was
// never written directly but has a `photos` subcollection. listDocuments()
// must surface it even though get() on the collection would omit it.

const photoDoc = {
  id: 'ff218a77-e8fa-4afa-ac07-6b99d3dabe12',
  data: () => ({
    photoUrl: 'https://example.com/photo.jpg',
    caption: null,
    uploadedAt: { toMillis: () => 1_700_000_000_000 },
  }),
};

const photosSubcollection = {
  orderBy: vi.fn().mockReturnValue({
    get: vi.fn().mockResolvedValue({ docs: [photoDoc] }),
  }),
};

// Parent milestone doc that does NOT exist as a real document (only a
// subcollection was written) — exists === false, data() === undefined.
const milestoneRef = {
  id: '10',
  get: vi.fn().mockResolvedValue({ exists: false, data: () => undefined }),
  collection: vi.fn().mockReturnValue(photosSubcollection),
};

const listDocuments = vi.fn().mockResolvedValue([milestoneRef]);
const collectionGet = vi.fn().mockResolvedValue({ docs: [] }); // get() omits missing parents

const mockCollection = vi.fn().mockReturnValue({
  listDocuments,
  get: collectionGet,
});

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({ collection: mockCollection, doc: vi.fn() }),
}));

vi.mock('firebase-admin/storage', () => ({
  getStorage: () => ({ bucket: () => ({ file: vi.fn() }) }),
}));

import { createBabyPhotoResolvers } from '../../resolvers/babyPhotos.js';

describe('babyPhotos resolver', () => {
  let resolvers: ReturnType<typeof createBabyPhotoResolvers>;

  beforeEach(() => {
    vi.clearAllMocks();
    resolvers = createBabyPhotoResolvers();
  });

  it('requires authentication', async () => {
    await expect(resolvers.Query.babyPhotos(null, {}, { uid: null }))
      .rejects.toThrow('Authentication required');
  });

  it('returns photos from a "missing" parent milestone document', async () => {
    const result = await resolvers.Query.babyPhotos(null, {}, { uid: 'user-1' });

    // Regression: previously the resolver used collection().get(), which omits
    // missing parent docs, so this returned [] despite the photo existing.
    expect(listDocuments).toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      stageId: 10,
      photoId: 'ff218a77-e8fa-4afa-ac07-6b99d3dabe12',
      photoUrl: 'https://example.com/photo.jpg',
    });
  });
});
