import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDocumentTitle } from './useDocumentTitle';

let mockPathname = '/';
const mockLogEvent = vi.fn();

vi.mock('react-router', () => ({
  useLocation: () => ({ pathname: mockPathname, search: '', hash: '', state: null, key: 'default' }),
}));

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

vi.mock('../lib/firebase', () => ({
  logEvent: (...args: unknown[]) => mockLogEvent(...args),
}));

beforeEach(() => {
  mockPathname = '/';
  mockLogEvent.mockClear();
  document.title = '';
});

describe('useDocumentTitle', () => {
  it('sets title to "MyCircle" on home route', () => {
    renderHook(() => useDocumentTitle());
    expect(document.title).toBe('MyCircle');
  });

  it('sets title for known routes using i18n key', () => {
    mockPathname = '/weather';
    renderHook(() => useDocumentTitle());
    expect(document.title).toBe('nav.weather - MyCircle');
  });

  it('sets title for detail routes using parent feature name', () => {
    mockPathname = '/weather/37.7749,-122.4194';
    renderHook(() => useDocumentTitle());
    expect(document.title).toBe('nav.weather - MyCircle');
  });

  it('sets title for whats-new route', () => {
    mockPathname = '/whats-new';
    renderHook(() => useDocumentTitle());
    expect(document.title).toBe('whatsNew.title - MyCircle');
  });

  it('sets "Page not found" title for unknown routes', () => {
    mockPathname = '/unknown-route';
    renderHook(() => useDocumentTitle());
    expect(document.title).toBe('app.pageNotFound - MyCircle');
  });

  it('does not fire page_view on initial render', () => {
    renderHook(() => useDocumentTitle());
    expect(mockLogEvent).not.toHaveBeenCalled();
  });

  it('fires page_view on subsequent route changes', () => {
    const { rerender } = renderHook(() => useDocumentTitle());
    expect(mockLogEvent).not.toHaveBeenCalled();

    mockPathname = '/stocks';
    rerender();

    expect(mockLogEvent).toHaveBeenCalledWith('page_view', {
      page_path: '/stocks',
      page_title: 'nav.stocks - MyCircle',
    });
  });

  it('updates title when route changes', () => {
    const { rerender } = renderHook(() => useDocumentTitle());
    expect(document.title).toBe('MyCircle');

    mockPathname = '/bible';
    rerender();
    expect(document.title).toBe('nav.bible - MyCircle');

    mockPathname = '/';
    rerender();
    expect(document.title).toBe('MyCircle');
  });

  it('fires page_view with correct params for each navigation', () => {
    const { rerender } = renderHook(() => useDocumentTitle());

    mockPathname = '/ai';
    rerender();
    expect(mockLogEvent).toHaveBeenCalledTimes(1);
    expect(mockLogEvent).toHaveBeenCalledWith('page_view', {
      page_path: '/ai',
      page_title: 'nav.ai - MyCircle',
    });

    mockPathname = '/';
    rerender();
    expect(mockLogEvent).toHaveBeenCalledTimes(2);
    expect(mockLogEvent).toHaveBeenCalledWith('page_view', {
      page_path: '/',
      page_title: 'MyCircle',
    });
  });
});
