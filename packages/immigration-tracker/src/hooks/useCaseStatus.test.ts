import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('@mycircle/shared', () => ({
  useLazyQuery: vi.fn().mockReturnValue([vi.fn(), { loading: false, data: null }]),
  CHECK_CASE_STATUS: 'CHECK_CASE_STATUS',
}));

import { useLazyQuery } from '@mycircle/shared';
import { useCaseStatus } from './useCaseStatus';

const mockUseLazyQuery = vi.mocked(useLazyQuery);

const mockStatusResponse = {
  receiptNumber: 'IOE0912345678',
  formType: 'I-485',
  status: 'Case Was Received',
  statusDescription: 'On March 1, 2026, we received your Form I-485.',
  checkedAt: '2026-03-01T12:00:00Z',
};

describe('useCaseStatus', () => {
  let mockExecute: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute = vi.fn();
    mockUseLazyQuery.mockReturnValue([mockExecute, { loading: false, data: null } as any]);
  });

  it('initializes with empty statuses and no error', () => {
    const { result } = renderHook(() => useCaseStatus());
    expect(result.current.statuses.size).toBe(0);
    expect(result.current.loadingReceipt).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('fetches status successfully via GraphQL', async () => {
    mockExecute.mockResolvedValue({
      data: { checkCaseStatus: mockStatusResponse },
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
    expect(mockExecute).toHaveBeenCalledWith({
      variables: { receiptNumber: 'IOE0912345678' },
    });
  });

  it('sets loadingReceipt during fetch', async () => {
    let resolvePromise!: (value: any) => void;
    mockExecute.mockReturnValue(new Promise(r => { resolvePromise = r; }));

    const { result } = renderHook(() => useCaseStatus());

    let fetchPromise: Promise<any>;
    act(() => {
      fetchPromise = result.current.fetchStatus('IOE0912345678');
    });

    expect(result.current.loadingReceipt).toBe('IOE0912345678');

    await act(async () => {
      resolvePromise({ data: { checkCaseStatus: mockStatusResponse } });
      await fetchPromise!;
    });

    expect(result.current.loadingReceipt).toBeNull();
  });

  it('handles GraphQL error', async () => {
    mockExecute.mockResolvedValue({
      error: { message: 'Invalid receipt number format' },
    });

    const { result } = renderHook(() => useCaseStatus());

    let data: any;
    await act(async () => {
      data = await result.current.fetchStatus('IOE0912345678');
    });

    expect(data).toBeNull();
    expect(result.current.error).toBe('Invalid receipt number format');
    expect(result.current.loadingReceipt).toBeNull();
  });

  it('handles missing data response', async () => {
    mockExecute.mockResolvedValue({ data: null });

    const { result } = renderHook(() => useCaseStatus());

    let data: any;
    await act(async () => {
      data = await result.current.fetchStatus('IOE0912345678');
    });

    expect(data).toBeNull();
    expect(result.current.error).toBe('No data returned');
  });

  it('handles network error', async () => {
    mockExecute.mockRejectedValue(new Error('Network failure'));

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

    mockExecute
      .mockResolvedValueOnce({ data: { checkCaseStatus: status1 } })
      .mockResolvedValueOnce({ data: { checkCaseStatus: status2 } });

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
    mockExecute.mockResolvedValueOnce({
      error: { message: 'Server Error' },
    });

    const { result } = renderHook(() => useCaseStatus());

    await act(async () => {
      await result.current.fetchStatus('IOE0912345678');
    });

    expect(result.current.error).toBe('Server Error');

    mockExecute.mockResolvedValueOnce({
      data: { checkCaseStatus: mockStatusResponse },
    });

    await act(async () => {
      await result.current.fetchStatus('IOE0912345678');
    });

    expect(result.current.error).toBeNull();
  });
});
