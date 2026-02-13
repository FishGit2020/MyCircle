import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock getRecaptchaToken before importing the hook
vi.mock('@mycircle/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@mycircle/shared')>();
  return {
    ...actual,
    getRecaptchaToken: vi.fn().mockResolvedValue(''),
  };
});

import { useAiChat } from './useAiChat';

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('useAiChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ response: 'Hello!', toolCalls: [] }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with empty messages', () => {
    const { result } = renderHook(() => useAiChat());
    expect(result.current.messages).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sends context data with the request', async () => {
    // Set up localStorage with user context
    localStorage.setItem('stock-watchlist', JSON.stringify([
      { symbol: 'AAPL', companyName: 'Apple' },
      { symbol: 'GOOGL', companyName: 'Google' },
    ]));
    localStorage.setItem('mycircle-favorite-cities', JSON.stringify([
      { name: 'Tokyo', lat: 35.68, lon: 139.76 },
    ]));
    localStorage.setItem('mycircle-locale', 'en');
    localStorage.setItem('mycircle-temp-unit', 'C');

    const { result } = renderHook(() => useAiChat());

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);

    // Should include context object
    expect(body.context).toBeDefined();
    expect(body.context.stockWatchlist).toEqual(['AAPL', 'GOOGL']);
    expect(body.context.favoriteCities).toEqual(['Tokyo']);
    expect(body.context.locale).toBe('en');
    expect(body.context.tempUnit).toBe('C');
    expect(body.context.currentPage).toBeDefined();
  });

  it('handles empty localStorage gracefully', async () => {
    const { result } = renderHook(() => useAiChat());

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);

    // Context should exist but be sparse
    expect(body.context).toBeDefined();
    expect(body.context.stockWatchlist).toBeUndefined();
    expect(body.context.favoriteCities).toBeUndefined();
  });

  it('includes message and history in request', async () => {
    const { result } = renderHook(() => useAiChat());

    await act(async () => {
      await result.current.sendMessage('What is the weather?');
    });

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);

    expect(body.message).toBe('What is the weather?');
    expect(body.history).toBeDefined();
    expect(Array.isArray(body.history)).toBe(true);
  });

  it('clears chat', () => {
    const { result } = renderHook(() => useAiChat());

    act(() => {
      result.current.clearChat();
    });

    expect(result.current.messages).toEqual([]);
  });
});
