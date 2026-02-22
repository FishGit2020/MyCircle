import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

// Track the mutate function so tests can inspect calls
const mockMutate = vi.fn();

vi.mock('@mycircle/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@mycircle/shared')>();
  return {
    ...actual,
    getRecaptchaToken: vi.fn().mockResolvedValue(''),
    // Mock useMutation to return our mock function
    useMutation: vi.fn(() => [mockMutate]),
    // AI_CHAT is just a gql document — provide a stub
    AI_CHAT: {},
    createLogger: vi.fn(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() })),
  };
});

import { useAiChat } from './useAiChat';

describe('useAiChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockMutate.mockResolvedValue({
      data: {
        aiChat: {
          response: 'Hello!',
          toolCalls: [],
          actions: null,
        },
      },
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

  it('sends context data with the mutation', async () => {
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

    expect(mockMutate).toHaveBeenCalledTimes(1);
    const variables = mockMutate.mock.calls[0][0].variables;

    // Should include context object
    expect(variables.context).toBeDefined();
    expect(variables.context.stockWatchlist).toEqual(['AAPL', 'GOOGL']);
    expect(variables.context.favoriteCities).toEqual(['Tokyo']);
    expect(variables.context.locale).toBe('en');
    expect(variables.context.tempUnit).toBe('C');
    expect(variables.context.currentPage).toBeDefined();
  });

  it('handles empty localStorage gracefully', async () => {
    const { result } = renderHook(() => useAiChat());

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    const variables = mockMutate.mock.calls[0][0].variables;

    // Context should exist but be sparse
    expect(variables.context).toBeDefined();
    expect(variables.context.stockWatchlist).toBeUndefined();
    expect(variables.context.favoriteCities).toBeUndefined();
  });

  it('includes message and history in mutation variables', async () => {
    const { result } = renderHook(() => useAiChat());

    await act(async () => {
      await result.current.sendMessage('What is the weather?');
    });

    const variables = mockMutate.mock.calls[0][0].variables;

    expect(variables.message).toBe('What is the weather?');
    expect(variables.history).toBeDefined();
    expect(Array.isArray(variables.history)).toBe(true);
  });

  it('clears chat', () => {
    const { result } = renderHook(() => useAiChat());

    act(() => {
      result.current.clearChat();
    });

    expect(result.current.messages).toEqual([]);
  });

  it('handles actions from the response', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    mockMutate.mockResolvedValue({
      data: {
        aiChat: {
          response: 'Navigating to stocks...',
          toolCalls: [{ name: 'navigateTo', args: { page: 'stocks' }, result: '{"navigateTo":"stocks"}' }],
          actions: [{ type: 'navigateTo', payload: { page: 'stocks' } }],
        },
      },
    });

    const { result } = renderHook(() => useAiChat());

    await act(async () => {
      await result.current.sendMessage('Go to stocks');
    });

    // Should dispatch a navigate event
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'navigate' })
    );
    dispatchSpy.mockRestore();
  });
});
