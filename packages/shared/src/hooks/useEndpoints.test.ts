import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn();

vi.mock('@apollo/client/react', () => ({
  useQuery: (...args: any[]) => mockUseQuery(...args), // eslint-disable-line @typescript-eslint/no-explicit-any
  useMutation: (...args: any[]) => mockUseMutation(...args), // eslint-disable-line @typescript-eslint/no-explicit-any
}));

vi.mock('../utils/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import { useEndpoints } from './useEndpoints';

describe('useEndpoints', () => {
  const mockSaveMutation = vi.fn().mockResolvedValue({});
  const mockDeleteMutation = vi.fn().mockResolvedValue({});
  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      refetch: mockRefetch,
    });
    mockUseMutation
      .mockReturnValueOnce([mockSaveMutation, { loading: false }])
      .mockReturnValueOnce([mockDeleteMutation]);
  });

  it('returns empty endpoints initially', () => {
    const { result } = renderHook(() => useEndpoints());

    expect(result.current.endpoints).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.saving).toBe(false);
  });

  it('returns endpoint data on success', () => {
    const mockEndpoints = [
      { id: '1', url: 'https://api.example.com', name: 'Test API' },
    ];
    mockUseQuery.mockReturnValue({
      data: { benchmarkEndpoints: mockEndpoints },
      loading: false,
      refetch: mockRefetch,
    });

    const { result } = renderHook(() => useEndpoints());

    expect(result.current.endpoints).toEqual(mockEndpoints);
  });

  it('calls save mutation with correct input', async () => {
    const { result } = renderHook(() => useEndpoints());

    const input = { url: 'https://api.example.com', name: 'New Endpoint' };
    await act(async () => {
      await result.current.saveEndpoint(input);
    });

    expect(mockSaveMutation).toHaveBeenCalledWith({
      variables: { input },
    });
  });

  it('calls delete mutation with correct id', async () => {
    const { result } = renderHook(() => useEndpoints());

    await act(async () => {
      await result.current.deleteEndpoint('endpoint-123');
    });

    expect(mockDeleteMutation).toHaveBeenCalledWith({
      variables: { id: 'endpoint-123' },
    });
  });
});
