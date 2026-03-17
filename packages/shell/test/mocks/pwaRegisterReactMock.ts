import { vi } from 'vitest';

export function useRegisterSW(_opts?: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  return {
    needRefresh: [false, vi.fn()] as [boolean, (v: boolean) => void],
    updateServiceWorker: vi.fn().mockResolvedValue(undefined),
  };
}
