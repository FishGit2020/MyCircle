import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useJournalPhotos } from './useJournalPhotos';

const mockPhotos = [
  {
    id: 'photo1',
    childId: null,
    photoUrl: 'https://example.com/photo.jpg',
    storagePath: 'users/uid/journal-photos/photo1.jpg',
    caption: 'First smile',
    stageLabel: null,
    photoDate: '2026-01-20',
    createdAt: '2026-01-20T10:00:00Z',
  },
];

vi.mock('@mycircle/shared', async () => {
  const actual = await vi.importActual<object>('@mycircle/shared');
  return {
    ...actual,
    useQuery: vi.fn(() => ({
      data: { journalPhotos: mockPhotos },
      loading: false,
      error: undefined,
    })),
    useMutation: vi.fn(() => [vi.fn().mockResolvedValue({}), { loading: false }]),
  };
});

describe('useJournalPhotos', () => {
  it('returns photos from query', () => {
    const { result } = renderHook(() => useJournalPhotos());
    expect(result.current.photos).toHaveLength(1);
    expect(result.current.photos[0].caption).toBe('First smile');
  });

  it('returns loading=false', () => {
    const { result } = renderHook(() => useJournalPhotos());
    expect(result.current.loading).toBe(false);
  });

  it('exposes upload and deletePhoto functions', () => {
    const { result } = renderHook(() => useJournalPhotos());
    expect(typeof result.current.upload).toBe('function');
    expect(typeof result.current.deletePhoto).toBe('function');
  });

});
