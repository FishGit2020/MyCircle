import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock @mycircle/shared
vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  WindowEvents: {
    AUTH_STATE_CHANGED: 'auth-state-changed',
    IMMIGRATION_CASES_CHANGED: 'immigration-cases-changed',
  },
  StorageKeys: {
    IMMIGRATION_CASES_CACHE: 'immigration-cases-cache',
  },
  createLogger: (ns: string) => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
  useLazyQuery: vi.fn().mockReturnValue([vi.fn(), { loading: false, data: null }]),
  CHECK_CASE_STATUS: 'CHECK_CASE_STATUS',
}));
