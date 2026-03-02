import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBabyPhotos } from './useBabyPhotos';

// Stable t reference prevents infinite re-renders
vi.mock('@mycircle/shared', () => {
  const t = (key: string) => key;
  return {
    useTranslation: () => ({ t }),
    WindowEvents: {
      BABY_MILESTONES_CHANGED: 'baby-milestones-changed',
    },
    StorageKeys: {
      BABY_MILESTONES_CACHE: 'baby-milestones-cache',
    },
  };
});

// Mock compressImage to return the input file directly
vi.mock('../utils/compressImage', () => ({
  compressImage: vi.fn((file: File) => Promise.resolve(file)),
}));

const mockDocs = [
  { id: '5', photoUrl: 'https://example.com/5.jpg', caption: 'Week 5' },
  { id: '10', photoUrl: 'https://example.com/10.jpg' },
];

describe('useBabyPhotos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    delete (window as any).__babyPhotos;
    delete (window as any).__getFirebaseIdToken;
    delete (window as any).__logAnalyticsEvent;
  });

  afterEach(() => {
    delete (window as any).__babyPhotos;
    delete (window as any).__getFirebaseIdToken;
    delete (window as any).__logAnalyticsEvent;
  });

  it('starts with empty photos map', async () => {
    const { result } = renderHook(() => useBabyPhotos());
    expect(result.current.photos).toBeInstanceOf(Map);
    expect(result.current.photos.size).toBe(0);
  });

  it('sets loading to false and isAuthenticated to false when no auth token', async () => {
    const { result } = renderHook(() => useBabyPhotos());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('detects authenticated state from __getFirebaseIdToken', async () => {
    (window as any).__getFirebaseIdToken = vi.fn().mockResolvedValue('mock-token');
    (window as any).__babyPhotos = {
      upload: vi.fn(),
      getAll: vi.fn().mockResolvedValue([]),
      delete: vi.fn(),
    };
    const { result } = renderHook(() => useBabyPhotos());
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
  });

  it('loads photos from Firestore when authenticated', async () => {
    (window as any).__getFirebaseIdToken = vi.fn().mockResolvedValue('token');
    (window as any).__babyPhotos = {
      upload: vi.fn(),
      getAll: vi.fn().mockResolvedValue(mockDocs),
      delete: vi.fn(),
    };
    const { result } = renderHook(() => useBabyPhotos());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.photos.size).toBe(2);
    expect(result.current.photos.get(5)).toEqual({ photoUrl: 'https://example.com/5.jpg', caption: 'Week 5' });
    expect(result.current.photos.get(10)).toEqual({ photoUrl: 'https://example.com/10.jpg', caption: undefined });
  });

  it('caches photos to localStorage', async () => {
    (window as any).__getFirebaseIdToken = vi.fn().mockResolvedValue('token');
    (window as any).__babyPhotos = {
      upload: vi.fn(),
      getAll: vi.fn().mockResolvedValue(mockDocs),
      delete: vi.fn(),
    };
    renderHook(() => useBabyPhotos());
    await waitFor(() => {
      const cached = localStorage.getItem('baby-milestones-cache');
      expect(cached).not.toBeNull();
      const parsed = JSON.parse(cached!);
      expect(parsed).toHaveLength(2);
    });
  });

  it('reads from cache on mount', () => {
    const cacheData = [[5, { photoUrl: 'cached.jpg', caption: 'Cached' }]];
    localStorage.setItem('baby-milestones-cache', JSON.stringify(cacheData));
    const { result } = renderHook(() => useBabyPhotos());
    expect(result.current.photos.size).toBe(1);
    expect(result.current.photos.get(5)?.photoUrl).toBe('cached.jpg');
  });

  it('uploadPhoto calls bridge upload with compressed file', async () => {
    const uploadFn = vi.fn().mockResolvedValue('https://example.com/new.jpg');
    // getAll returns the uploaded photo after the event is dispatched
    const getAllFn = vi.fn()
      .mockResolvedValueOnce([]) // Initial load
      .mockResolvedValue([{ id: '5', photoUrl: 'https://example.com/new.jpg', caption: 'My caption' }]); // After event
    (window as any).__getFirebaseIdToken = vi.fn().mockResolvedValue('token');
    (window as any).__babyPhotos = {
      upload: uploadFn,
      getAll: getAllFn,
      delete: vi.fn(),
    };
    (window as any).__logAnalyticsEvent = vi.fn();
    const { result } = renderHook(() => useBabyPhotos());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    await act(async () => {
      await result.current.uploadPhoto(5, file, 'My caption');
    });

    expect(uploadFn).toHaveBeenCalledWith(5, file, 'My caption');
    // After upload + re-fetch from event, photo should be present
    await waitFor(() => {
      expect(result.current.photos.get(5)).toEqual({
        photoUrl: 'https://example.com/new.jpg',
        caption: 'My caption',
      });
    });
    expect(result.current.uploading).toBeNull();
  });

  it('sets uploading stageId during upload', async () => {
    let resolveUpload: (val: string) => void;
    const uploadFn = vi.fn().mockImplementation(
      () => new Promise<string>((resolve) => { resolveUpload = resolve; })
    );
    (window as any).__getFirebaseIdToken = vi.fn().mockResolvedValue('token');
    (window as any).__babyPhotos = {
      upload: uploadFn,
      getAll: vi.fn().mockResolvedValue([]),
      delete: vi.fn(),
    };
    const { result } = renderHook(() => useBabyPhotos());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    let uploadPromise: Promise<void>;
    act(() => {
      uploadPromise = result.current.uploadPhoto(5, file);
    });

    await waitFor(() => expect(result.current.uploading).toBe(5));

    await act(async () => {
      resolveUpload!('https://example.com/new.jpg');
      await uploadPromise!;
    });

    expect(result.current.uploading).toBeNull();
  });

  it('sets error on upload failure', async () => {
    (window as any).__getFirebaseIdToken = vi.fn().mockResolvedValue('token');
    (window as any).__babyPhotos = {
      upload: vi.fn().mockRejectedValue(new Error('Upload failed')),
      getAll: vi.fn().mockResolvedValue([]),
      delete: vi.fn(),
    };
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useBabyPhotos());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    await act(async () => {
      await result.current.uploadPhoto(5, file);
    });

    expect(result.current.error).toBe('Upload failed');
    expect(result.current.errorStageId).toBe(5);
    expect(result.current.uploading).toBeNull();
    consoleSpy.mockRestore();
  });

  it('clearError resets error and errorStageId', async () => {
    (window as any).__getFirebaseIdToken = vi.fn().mockResolvedValue('token');
    (window as any).__babyPhotos = {
      upload: vi.fn().mockRejectedValue(new Error('fail')),
      getAll: vi.fn().mockResolvedValue([]),
      delete: vi.fn(),
    };
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useBabyPhotos());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    await act(async () => {
      await result.current.uploadPhoto(5, file);
    });
    expect(result.current.error).toBe('fail');

    act(() => {
      result.current.clearError();
    });
    expect(result.current.error).toBeNull();
    expect(result.current.errorStageId).toBeNull();
    vi.restoreAllMocks();
  });

  it('deletePhoto calls bridge delete and removes from map', async () => {
    const deleteFn = vi.fn().mockResolvedValue(undefined);
    // After delete, the event triggers getAll again — return only the remaining doc
    const getAllFn = vi.fn()
      .mockResolvedValueOnce(mockDocs) // Initial load
      .mockResolvedValue([{ id: '10', photoUrl: 'https://example.com/10.jpg' }]); // After delete event
    (window as any).__getFirebaseIdToken = vi.fn().mockResolvedValue('token');
    (window as any).__babyPhotos = {
      upload: vi.fn(),
      getAll: getAllFn,
      delete: deleteFn,
    };
    (window as any).__logAnalyticsEvent = vi.fn();
    const { result } = renderHook(() => useBabyPhotos());
    await waitFor(() => expect(result.current.photos.size).toBe(2));

    await act(async () => {
      await result.current.deletePhoto(5);
    });

    expect(deleteFn).toHaveBeenCalledWith(5);
    await waitFor(() => {
      expect(result.current.photos.has(5)).toBe(false);
      expect(result.current.photos.size).toBe(1);
    });
  });

  it('throws when uploadPhoto is called without bridge API', async () => {
    const { result } = renderHook(() => useBabyPhotos());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    await expect(
      act(async () => { await result.current.uploadPhoto(5, file); })
    ).rejects.toThrow('Baby photos API not available');
  });

  it('throws when deletePhoto is called without bridge API', async () => {
    const { result } = renderHook(() => useBabyPhotos());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(
      act(async () => { await result.current.deletePhoto(5); })
    ).rejects.toThrow('Baby photos API not available');
  });

  it('dispatches BABY_MILESTONES_CHANGED event after upload', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    (window as any).__getFirebaseIdToken = vi.fn().mockResolvedValue('token');
    (window as any).__babyPhotos = {
      upload: vi.fn().mockResolvedValue('https://example.com/new.jpg'),
      getAll: vi.fn().mockResolvedValue([]),
      delete: vi.fn(),
    };
    const { result } = renderHook(() => useBabyPhotos());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    await act(async () => {
      await result.current.uploadPhoto(5, file);
    });

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'baby-milestones-changed' })
    );
    dispatchSpy.mockRestore();
  });

  it('dispatches BABY_MILESTONES_CHANGED event after delete', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    (window as any).__getFirebaseIdToken = vi.fn().mockResolvedValue('token');
    (window as any).__babyPhotos = {
      upload: vi.fn(),
      getAll: vi.fn().mockResolvedValue(mockDocs),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    const { result } = renderHook(() => useBabyPhotos());
    await waitFor(() => expect(result.current.photos.size).toBe(2));

    await act(async () => {
      await result.current.deletePhoto(5);
    });

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'baby-milestones-changed' })
    );
    dispatchSpy.mockRestore();
  });

  it('reloads data on BABY_MILESTONES_CHANGED event', async () => {
    const getAllFn = vi.fn().mockResolvedValue([]);
    (window as any).__babyPhotos = {
      upload: vi.fn(),
      getAll: getAllFn,
      delete: vi.fn(),
    };

    renderHook(() => useBabyPhotos());

    // Dispatch the event
    act(() => {
      window.dispatchEvent(new Event('baby-milestones-changed'));
    });

    await waitFor(() => {
      expect(getAllFn).toHaveBeenCalled();
    });
  });

  it('handles auth check failure gracefully', async () => {
    (window as any).__getFirebaseIdToken = vi.fn().mockRejectedValue(new Error('auth error'));
    const { result } = renderHook(() => useBabyPhotos());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('handles Firestore getAll failure gracefully (uses cache)', async () => {
    localStorage.setItem('baby-milestones-cache', JSON.stringify([[1, { photoUrl: 'cached.jpg' }]]));
    (window as any).__getFirebaseIdToken = vi.fn().mockResolvedValue('token');
    (window as any).__babyPhotos = {
      upload: vi.fn(),
      getAll: vi.fn().mockRejectedValue(new Error('Firestore error')),
      delete: vi.fn(),
    };
    const { result } = renderHook(() => useBabyPhotos());
    await waitFor(() => expect(result.current.loading).toBe(false));
    // Should still have cached data
    expect(result.current.photos.get(1)?.photoUrl).toBe('cached.jpg');
  });
});
