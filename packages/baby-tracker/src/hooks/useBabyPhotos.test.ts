import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBabyPhotos } from './useBabyPhotos';

// Apollo mock state
let mockBabyPhotosData: any = undefined; // eslint-disable-line @typescript-eslint/no-explicit-any
let mockNotesData: any = undefined; // eslint-disable-line @typescript-eslint/no-explicit-any
let mockQueryLoading = false;
const mockRefetch = vi.fn().mockResolvedValue({});
const mockRefetchNotes = vi.fn().mockResolvedValue({});
const mockDeleteMutation = vi.fn().mockResolvedValue({});
const mockSaveNotesMutation = vi.fn().mockResolvedValue({});

// Track which query is being called
let queryCallCount = 0;
let mutationCallCount = 0;

vi.mock('@mycircle/shared', () => ({
  useQuery: (_doc: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const isNotesQuery = queryCallCount++ % 2 === 1;
    return isNotesQuery
      ? { data: mockNotesData, loading: mockQueryLoading, refetch: mockRefetchNotes }
      : { data: mockBabyPhotosData, loading: mockQueryLoading, refetch: mockRefetch };
  },
  useMutation: () => {
    const isSaveNotes = mutationCallCount++ % 2 === 1;
    return isSaveNotes ? [mockSaveNotesMutation] : [mockDeleteMutation];
  },
  WindowEvents: {
    BABY_MILESTONES_CHANGED: 'baby-milestones-changed',
  },
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
  GET_BABY_PHOTOS: {},
  DELETE_BABY_PHOTO: {},
  GET_BABY_MILESTONE_NOTES: {},
  SAVE_BABY_MILESTONE_NOTES: {},
}));

vi.mock('../utils/compressImage', () => ({
  compressImage: vi.fn((file: File) => Promise.resolve(file)),
}));

const mockGqlPhotos = [
  { stageId: 5, photoId: 'photo-a', photoUrl: 'https://example.com/5a.jpg', caption: 'Week 5', uploadedAt: new Date().toISOString() },
  { stageId: 5, photoId: 'photo-b', photoUrl: 'https://example.com/5b.jpg', caption: null, uploadedAt: new Date().toISOString() },
  { stageId: 10, photoId: 'photo-c', photoUrl: 'https://example.com/10.jpg', caption: null, uploadedAt: new Date().toISOString() },
];

describe('useBabyPhotos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryCallCount = 0;
    mutationCallCount = 0;
    mockBabyPhotosData = undefined;
    mockNotesData = undefined;
    mockQueryLoading = false;
    delete window.__babyPhotos;
    delete window.__getFirebaseIdToken;
    delete window.__logAnalyticsEvent;
  });

  afterEach(() => {
    delete window.__babyPhotos;
    delete window.__getFirebaseIdToken;
    delete window.__logAnalyticsEvent;
  });

  it('starts with empty photos map when no data', () => {
    const { result } = renderHook(() => useBabyPhotos());
    expect(result.current.photos).toBeInstanceOf(Map);
    expect(result.current.photos.size).toBe(0);
  });

  it('sets isAuthenticated to false when no auth token', async () => {
    const { result } = renderHook(() => useBabyPhotos());
    await waitFor(() => expect(result.current.isAuthenticated).toBe(false));
  });

  it('detects authenticated state from __getFirebaseIdToken', async () => {
    window.__getFirebaseIdToken = vi.fn().mockResolvedValue('mock-token');
    const { result } = renderHook(() => useBabyPhotos());
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
  });

  it('builds photos map with arrays from GraphQL data', () => {
    mockBabyPhotosData = { babyPhotos: mockGqlPhotos };
    const { result } = renderHook(() => useBabyPhotos());
    expect(result.current.photos.size).toBe(2);
    const stage5 = result.current.photos.get(5);
    expect(stage5).toHaveLength(2);
    expect(stage5?.[0]).toEqual({ photoId: 'photo-a', photoUrl: 'https://example.com/5a.jpg', caption: 'Week 5' });
    expect(stage5?.[1]).toEqual({ photoId: 'photo-b', photoUrl: 'https://example.com/5b.jpg', caption: undefined });
    expect(result.current.photos.get(10)).toHaveLength(1);
  });

  it('builds notes map from GraphQL data', () => {
    mockNotesData = { babyMilestoneNotes: [{ stageId: 3, notes: 'Some notes' }] };
    const { result } = renderHook(() => useBabyPhotos());
    expect(result.current.notes.get(3)).toBe('Some notes');
  });

  it('shows loading when query is loading', () => {
    mockQueryLoading = true;
    const { result } = renderHook(() => useBabyPhotos());
    expect(result.current.loading).toBe(true);
  });

  it('uploadPhoto calls window.__babyPhotos.upload and refetches', async () => {
    const uploadFn = vi.fn().mockResolvedValue('https://example.com/new.jpg');
    window.__getFirebaseIdToken = vi.fn().mockResolvedValue('token');
    window.__babyPhotos = { upload: uploadFn };
    window.__logAnalyticsEvent = vi.fn();

    const { result } = renderHook(() => useBabyPhotos());
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    await act(async () => {
      await result.current.uploadPhoto(5, file, 'My caption');
    });

    expect(uploadFn).toHaveBeenCalledWith(5, file, 'My caption');
    expect(mockRefetch).toHaveBeenCalled();
    expect(window.__logAnalyticsEvent).toHaveBeenCalledWith('baby_milestone_photo_upload', { stageId: 5 });
  });

  it('isUploading returns true during upload for that stageId', async () => {
    let resolveUpload: (val: string) => void;
    const uploadFn = vi.fn().mockImplementation(
      () => new Promise<string>((resolve) => { resolveUpload = resolve; })
    );
    window.__getFirebaseIdToken = vi.fn().mockResolvedValue('token');
    window.__babyPhotos = { upload: uploadFn };

    const { result } = renderHook(() => useBabyPhotos());
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    let uploadPromise: Promise<void>;
    act(() => {
      uploadPromise = result.current.uploadPhoto(5, file);
    });

    await waitFor(() => expect(result.current.isUploading(5)).toBe(true));
    expect(result.current.isUploading(3)).toBe(false);

    await act(async () => {
      resolveUpload!('https://example.com/new.jpg');
      await uploadPromise!;
    });

    expect(result.current.isUploading(5)).toBe(false);
  });

  it('sets error on upload failure', async () => {
    window.__getFirebaseIdToken = vi.fn().mockResolvedValue('token');
    window.__babyPhotos = {
      upload: vi.fn().mockRejectedValue(new Error('Upload failed')),
    };
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useBabyPhotos());
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    await act(async () => {
      await result.current.uploadPhoto(5, file);
    });

    expect(result.current.error).toBe('Upload failed');
    expect(result.current.errorStageId).toBe(5);
    expect(result.current.isUploading(5)).toBe(false);
    vi.restoreAllMocks();
  });

  it('clearError resets error and errorStageId', async () => {
    window.__getFirebaseIdToken = vi.fn().mockResolvedValue('token');
    window.__babyPhotos = {
      upload: vi.fn().mockRejectedValue(new Error('fail')),
    };
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useBabyPhotos());
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    await act(async () => {
      await result.current.uploadPhoto(5, file);
    });
    expect(result.current.error).toBe('fail');

    act(() => { result.current.clearError(); });
    expect(result.current.error).toBeNull();
    expect(result.current.errorStageId).toBeNull();
    vi.restoreAllMocks();
  });

  it('deletePhoto calls mutation with stageId and photoId', async () => {
    window.__logAnalyticsEvent = vi.fn();
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    const { result } = renderHook(() => useBabyPhotos());

    await act(async () => {
      await result.current.deletePhoto(5, 'photo-a');
    });

    expect(mockDeleteMutation).toHaveBeenCalledWith({ variables: { stageId: 5, photoId: 'photo-a' } });
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'baby-milestones-changed' })
    );
    expect(window.__logAnalyticsEvent).toHaveBeenCalledWith('baby_milestone_photo_delete', { stageId: 5 });
    dispatchSpy.mockRestore();
  });

  it('saveNotes calls mutation and refetches notes', async () => {
    const { result } = renderHook(() => useBabyPhotos());

    await act(async () => {
      await result.current.saveNotes(3, 'Great week!');
    });

    expect(mockSaveNotesMutation).toHaveBeenCalledWith({ variables: { stageId: 3, notes: 'Great week!' } });
    expect(mockRefetchNotes).toHaveBeenCalled();
  });

  it('throws when uploadPhoto is called without bridge API', async () => {
    const { result } = renderHook(() => useBabyPhotos());

    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    await expect(
      act(async () => { await result.current.uploadPhoto(5, file); })
    ).rejects.toThrow('Baby photos API not available');
  });

  it('dispatches BABY_MILESTONES_CHANGED event after upload', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    window.__getFirebaseIdToken = vi.fn().mockResolvedValue('token');
    window.__babyPhotos = {
      upload: vi.fn().mockResolvedValue('https://example.com/new.jpg'),
    };

    const { result } = renderHook(() => useBabyPhotos());
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    await act(async () => {
      await result.current.uploadPhoto(5, file);
    });

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'baby-milestones-changed' })
    );
    dispatchSpy.mockRestore();
  });

  it('handles auth check failure gracefully', async () => {
    window.__getFirebaseIdToken = vi.fn().mockRejectedValue(new Error('auth error'));
    const { result } = renderHook(() => useBabyPhotos());
    await waitFor(() => expect(result.current.isAuthenticated).toBe(false));
  });
});
