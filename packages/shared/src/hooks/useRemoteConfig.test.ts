import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../utils/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import { useRemoteConfig } from './useRemoteConfig';

describe('useRemoteConfig', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Clear any previous config
    delete (window as any).__REMOTE_CONFIG__;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns empty object when no remote config is set', () => {
    const { result } = renderHook(() => useRemoteConfig());

    expect(result.current).toEqual({});
  });

  it('returns config values when window.__REMOTE_CONFIG__ is set before mount', () => {
    (window as any).__REMOTE_CONFIG__ = { feature_flag: 'true', max_items: '10' };

    const { result } = renderHook(() => useRemoteConfig());

    expect(result.current).toEqual({ feature_flag: 'true', max_items: '10' });
  });

  it('picks up config set after mount via polling', async () => {
    const { result } = renderHook(() => useRemoteConfig());

    expect(result.current).toEqual({});

    // Set config after mount
    (window as any).__REMOTE_CONFIG__ = { late_flag: 'yes' };

    // Advance past one polling interval, wrapped in act to handle state update
    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });

    expect(result.current).toEqual({ late_flag: 'yes' });
  });
});
