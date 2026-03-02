import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCaseStatus } from './useCaseStatus';

// @mycircle/shared is already mocked in test/setup.ts

const mockStatusResponse = {
  receiptNumber: 'IOE0912345678',
  formType: 'I-485',
  status: 'Case Was Received',
  statusDescription: 'On March 1, 2026, we received your Form I-485.',
  checkedAt: '2026-03-01T12:00:00Z',
};

describe('useCaseStatus', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
    window.__getFirebaseIdToken = vi.fn().mockResolvedValue('mock-token');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete window.__getFirebaseIdToken;
  });

  it('initializes with empty statuses and no error', () => {
    const { result } = renderHook(() => useCaseStatus());
    expect(result.current.statuses.size).toBe(0);
    expect(result.current.loadingReceipt).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('fetches status successfully', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockStatusResponse),
    });

    const { result } = renderHook(() => useCaseStatus());

    let data: any;
    await act(async () => {
      data = await result.current.fetchStatus('IOE0912345678');
    });

    expect(data).toEqual(mockStatusResponse);
    expect(result.current.statuses.get('IOE0912345678')).toEqual(mockStatusResponse);
    expect(result.current.loadingReceipt).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('sets loadingReceipt during fetch', async () => {
    let resolvePromise!: (value: any) => void;
    mockFetch.mockReturnValue(new Promise(r => { resolvePromise = r; }));

    const { result } = renderHook(() => useCaseStatus());

    // Start fetch but don't await
    let fetchPromise: Promise<any>;
    act(() => {
      fetchPromise = result.current.fetchStatus('IOE0912345678');
    });

    expect(result.current.loadingReceipt).toBe('IOE0912345678');

    // Resolve the fetch
    await act(async () => {
      resolvePromise({
        ok: true,
        json: () => Promise.resolve(mockStatusResponse),
      });
      await fetchPromise!;
    });

    expect(result.current.loadingReceipt).toBeNull();
  });

  it('handles HTTP error response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error'),
    });

    const { result } = renderHook(() => useCaseStatus());

    let data: any;
    await act(async () => {
      data = await result.current.fetchStatus('IOE0912345678');
    });

    expect(data).toBeNull();
    expect(result.current.error).toBe('Internal Server Error');
    expect(result.current.loadingReceipt).toBeNull();
  });

  it('handles HTTP error with empty body', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      text: () => Promise.resolve(''),
    });

    const { result } = renderHook(() => useCaseStatus());

    await act(async () => {
      await result.current.fetchStatus('IOE0912345678');
    });

    expect(result.current.error).toBe('HTTP 404');
  });

  it('handles authentication failure', async () => {
    window.__getFirebaseIdToken = vi.fn().mockResolvedValue(null);

    const { result } = renderHook(() => useCaseStatus());

    let data: any;
    await act(async () => {
      data = await result.current.fetchStatus('IOE0912345678');
    });

    expect(data).toBeNull();
    expect(result.current.error).toBe('Not authenticated');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('handles network error', async () => {
    mockFetch.mockRejectedValue(new Error('Network failure'));

    const { result } = renderHook(() => useCaseStatus());

    let data: any;
    await act(async () => {
      data = await result.current.fetchStatus('IOE0912345678');
    });

    expect(data).toBeNull();
    expect(result.current.error).toBe('Network failure');
  });

  it('accumulates multiple status results', async () => {
    const status1 = { ...mockStatusResponse, receiptNumber: 'IOE1111111111' };
    const status2 = { ...mockStatusResponse, receiptNumber: 'IOE2222222222', status: 'Case Was Approved' };

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(status1) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(status2) });

    const { result } = renderHook(() => useCaseStatus());

    await act(async () => {
      await result.current.fetchStatus('IOE1111111111');
    });

    await act(async () => {
      await result.current.fetchStatus('IOE2222222222');
    });

    expect(result.current.statuses.size).toBe(2);
    expect(result.current.statuses.get('IOE1111111111')!.status).toBe('Case Was Received');
    expect(result.current.statuses.get('IOE2222222222')!.status).toBe('Case Was Approved');
  });

  it('clears previous error on new fetch', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Server Error'),
    });

    const { result } = renderHook(() => useCaseStatus());

    await act(async () => {
      await result.current.fetchStatus('IOE0912345678');
    });

    expect(result.current.error).toBe('Server Error');

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockStatusResponse),
    });

    await act(async () => {
      await result.current.fetchStatus('IOE0912345678');
    });

    expect(result.current.error).toBeNull();
  });

  it('uses localhost URL when on localhost', async () => {
    // jsdom defaults to localhost
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockStatusResponse),
    });

    const { result } = renderHook(() => useCaseStatus());

    await act(async () => {
      await result.current.fetchStatus('IOE0912345678');
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('http://localhost:5001/mycircle-app/us-central1/api/uscis/status'),
      expect.objectContaining({
        headers: { Authorization: 'Bearer mock-token' },
      })
    );
  });

  it('includes receipt number in URL query param', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockStatusResponse),
    });

    const { result } = renderHook(() => useCaseStatus());

    await act(async () => {
      await result.current.fetchStatus('IOE0912345678');
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('receiptNumber=IOE0912345678'),
      expect.any(Object)
    );
  });
});
