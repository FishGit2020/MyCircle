import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import CloudFiles from './CloudFiles';

// Mock @mycircle/shared
vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    locale: 'en',
    setLocale: vi.fn(),
  }),
  WindowEvents: {
    CLOUD_FILES_CHANGED: 'cloud-files-changed',
    SHARED_FILES_CHANGED: 'shared-files-changed',
  },
  StorageKeys: {
    CLOUD_FILES_CACHE: 'cloud-files-cache',
  },
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

function mockCloudFilesApi() {
  (window as any).__getFirebaseIdToken = vi.fn();
  (window as any).__cloudFiles = {
    getAll: vi.fn(() => Promise.resolve([])),
    subscribe: vi.fn(() => () => {}),
    getAllShared: vi.fn(() => Promise.resolve([])),
    subscribeShared: vi.fn(() => () => {}),
  };
}

describe('CloudFiles', () => {
  beforeEach(() => {
    delete (window as any).__getFirebaseIdToken;
    delete (window as any).__cloudFiles;
  });

  it('shows login prompt when not authenticated', () => {
    render(
      <MemoryRouter>
        <CloudFiles />
      </MemoryRouter>
    );
    expect(screen.getByText('cloudFiles.loginToUse')).toBeInTheDocument();
  });

  it('renders tabs when authenticated', async () => {
    mockCloudFilesApi();

    await act(async () => {
      render(
        <MemoryRouter>
          <CloudFiles />
        </MemoryRouter>
      );
    });
    expect(screen.getByRole('tab', { name: /cloudFiles\.myFiles/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /cloudFiles\.sharedFiles/i })).toBeInTheDocument();
  });

  it('shows title', async () => {
    mockCloudFilesApi();

    await act(async () => {
      render(
        <MemoryRouter>
          <CloudFiles />
        </MemoryRouter>
      );
    });
    expect(screen.getByText('cloudFiles.title')).toBeInTheDocument();
  });
});
