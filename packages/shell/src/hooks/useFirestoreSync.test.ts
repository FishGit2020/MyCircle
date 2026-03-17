import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFirestoreSync } from './useFirestoreSync';

const mockUpdateUserBabyDueDate = vi.fn();
const mockUpdateUserBottomNavOrder = vi.fn();
const mockUpdateBibleBookmarks = vi.fn();
const mockUpdateWorshipFavorites = vi.fn();
const mockUpdateChildData = vi.fn();
const mockUpdateWidgetLayout = vi.fn();
const mockUpdateBookBookmarks = vi.fn();
const mockUpdateBookAudioProgress = vi.fn();
const mockUpdateBookPlayedChapters = vi.fn();
const mockUpdateBookLastPlayed = vi.fn();

vi.mock('@mycircle/shared', () => ({
  WindowEvents: {
    BABY_DUE_DATE_CHANGED: 'baby-due-date-changed',
    BOTTOM_NAV_ORDER_CHANGED: 'bottom-nav-order-changed',
    BIBLE_BOOKMARKS_CHANGED: 'bible-bookmarks-changed',
    WORSHIP_FAVORITES_CHANGED: 'worship-favorites-changed',
    CHILD_DATA_CHANGED: 'child-data-changed',
    WIDGET_LAYOUT_CHANGED: 'widget-layout-changed',
    BOOK_BOOKMARKS_CHANGED: 'book-bookmarks-changed',
    BOOK_PLAYED_CHAPTERS_CHANGED: 'book-played-chapters-changed',
    BOOK_LAST_PLAYED_CHANGED: 'book-last-played-changed',
  },
  StorageKeys: {
    BABY_DUE_DATE: 'baby-due-date',
    BOTTOM_NAV_ORDER: 'bottom-nav-order',
    BIBLE_BOOKMARKS: 'bible-bookmarks',
    WORSHIP_FAVORITES: 'worship-favorites',
    CHILD_NAME: 'child-name',
    CHILD_BIRTH_DATE: 'child-birth-date',
    WIDGET_LAYOUT: 'widget-dashboard-layout',
    BOOK_BOOKMARKS: 'book-bookmarks',
    BOOK_AUDIO_PROGRESS: 'book-audio-progress',
    BOOK_PLAYED_CHAPTERS: 'book-played-chapters',
    BOOK_LAST_PLAYED: 'book-last-played',
  },
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

vi.mock('../lib/firebase', () => ({
  updateUserBabyDueDate: (...args: unknown[]) => mockUpdateUserBabyDueDate(...args),
  updateUserBottomNavOrder: (...args: unknown[]) => mockUpdateUserBottomNavOrder(...args),
  updateBibleBookmarks: (...args: unknown[]) => mockUpdateBibleBookmarks(...args),
  updateWorshipFavorites: (...args: unknown[]) => mockUpdateWorshipFavorites(...args),
  updateChildData: (...args: unknown[]) => mockUpdateChildData(...args),
  updateWidgetLayout: (...args: unknown[]) => mockUpdateWidgetLayout(...args),
  updateBookBookmarks: (...args: unknown[]) => mockUpdateBookBookmarks(...args),
  updateBookAudioProgress: (...args: unknown[]) => mockUpdateBookAudioProgress(...args),
  updateBookPlayedChapters: (...args: unknown[]) => mockUpdateBookPlayedChapters(...args),
  updateBookLastPlayed: (...args: unknown[]) => mockUpdateBookLastPlayed(...args),
}));

const makeUser = (uid = 'user1') => ({ uid } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('useFirestoreSync', () => {
  it('does nothing when user is null', () => {
    renderHook(() => useFirestoreSync(null));
    localStorage.setItem('baby-due-date', '2026-06-01');
    window.dispatchEvent(new Event('baby-due-date-changed'));
    expect(mockUpdateUserBabyDueDate).not.toHaveBeenCalled();
  });

  it('syncs baby due date on event', () => {
    renderHook(() => useFirestoreSync(makeUser()));
    localStorage.setItem('baby-due-date', '2026-06-01');
    window.dispatchEvent(new Event('baby-due-date-changed'));
    expect(mockUpdateUserBabyDueDate).toHaveBeenCalledWith('user1', '2026-06-01');
  });

  it('syncs bottom nav order on event', () => {
    renderHook(() => useFirestoreSync(makeUser()));
    localStorage.setItem('bottom-nav-order', JSON.stringify(['a', 'b']));
    window.dispatchEvent(new Event('bottom-nav-order-changed'));
    expect(mockUpdateUserBottomNavOrder).toHaveBeenCalledWith('user1', ['a', 'b']);
  });

  it('syncs Bible bookmarks on event', () => {
    renderHook(() => useFirestoreSync(makeUser()));
    localStorage.setItem('bible-bookmarks', JSON.stringify([{ book: 'Gen' }]));
    window.dispatchEvent(new Event('bible-bookmarks-changed'));
    expect(mockUpdateBibleBookmarks).toHaveBeenCalledWith('user1', [{ book: 'Gen' }]);
  });

  it('syncs worship favorites on event', () => {
    renderHook(() => useFirestoreSync(makeUser()));
    localStorage.setItem('worship-favorites', JSON.stringify(['s1']));
    window.dispatchEvent(new Event('worship-favorites-changed'));
    expect(mockUpdateWorshipFavorites).toHaveBeenCalledWith('user1', ['s1']);
  });

  it('syncs child data and decodes btoa date on event', () => {
    renderHook(() => useFirestoreSync(makeUser()));
    localStorage.setItem('child-name', 'Alice');
    localStorage.setItem('child-birth-date', btoa('2024-01-15'));
    window.dispatchEvent(new Event('child-data-changed'));
    expect(mockUpdateChildData).toHaveBeenCalledWith('user1', {
      childName: 'Alice',
      childBirthDate: '2024-01-15',
    });
  });

  it('syncs widget layout on event', () => {
    renderHook(() => useFirestoreSync(makeUser()));
    const layout = { pinned: ['weather', 'stocks'], size: 'medium' };
    localStorage.setItem('widget-dashboard-layout', JSON.stringify(layout));
    window.dispatchEvent(new Event('widget-layout-changed'));
    expect(mockUpdateWidgetLayout).toHaveBeenCalledWith('user1', layout);
  });

  it('syncs book bookmarks on event', () => {
    renderHook(() => useFirestoreSync(makeUser()));
    localStorage.setItem('book-bookmarks', JSON.stringify([{ bookId: 'b1' }]));
    window.dispatchEvent(new Event('book-bookmarks-changed'));
    expect(mockUpdateBookBookmarks).toHaveBeenCalledWith('user1', [{ bookId: 'b1' }]);
  });

  it('syncs book audio progress on raw string event', () => {
    renderHook(() => useFirestoreSync(makeUser()));
    localStorage.setItem('book-audio-progress', JSON.stringify({ b1: { position: 10 } }));
    window.dispatchEvent(new Event('book-audio-progress-changed'));
    expect(mockUpdateBookAudioProgress).toHaveBeenCalledWith('user1', { b1: { position: 10 } });
  });

  it('syncs book played chapters on event', () => {
    renderHook(() => useFirestoreSync(makeUser()));
    localStorage.setItem('book-played-chapters', JSON.stringify({ b1: [0, 2, 3] }));
    window.dispatchEvent(new Event('book-played-chapters-changed'));
    expect(mockUpdateBookPlayedChapters).toHaveBeenCalledWith('user1', { b1: [0, 2, 3] });
  });

  it('syncs book last played on event', () => {
    renderHook(() => useFirestoreSync(makeUser()));
    localStorage.setItem('book-last-played', JSON.stringify({ bookId: 'b1' }));
    window.dispatchEvent(new Event('book-last-played-changed'));
    expect(mockUpdateBookLastPlayed).toHaveBeenCalledWith('user1', { bookId: 'b1' });
  });

  it('removes listeners on unmount', () => {
    const { unmount } = renderHook(() => useFirestoreSync(makeUser()));
    unmount();
    localStorage.setItem('baby-due-date', '2026-06-01');
    window.dispatchEvent(new Event('baby-due-date-changed'));
    expect(mockUpdateUserBabyDueDate).not.toHaveBeenCalled();
  });

  it('handles invalid JSON gracefully for bottom nav', () => {
    renderHook(() => useFirestoreSync(makeUser()));
    localStorage.setItem('bottom-nav-order', 'not-json');
    window.dispatchEvent(new Event('bottom-nav-order-changed'));
    expect(mockUpdateUserBottomNavOrder).not.toHaveBeenCalled();
  });
});
