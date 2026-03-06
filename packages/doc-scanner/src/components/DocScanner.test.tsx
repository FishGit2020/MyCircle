import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DocScanner from './DocScanner';

// Mock @mycircle/shared
vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
  PageContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

// Mock the worker
vi.mock('../hooks/useEdgeDetection', () => ({
  useEdgeDetection: () => ({
    detectEdges: vi.fn(),
    warpPerspective: vi.fn(),
    enhanceBW: vi.fn(),
    corners: null,
    warpedImage: null,
    enhancedImage: null,
    isProcessing: false,
    error: null,
  }),
}));

// Mock scan storage
vi.mock('../hooks/useScanStorage', () => ({
  useScanStorage: () => ({
    scans: [],
    isLoading: false,
    saveStatus: 'idle' as const,
    saveScan: vi.fn(),
    deleteScan: vi.fn(),
    refreshScans: vi.fn(),
  }),
}));

// Mock camera
vi.mock('../hooks/useCamera', () => ({
  useCamera: () => ({
    videoRef: { current: null },
    stream: null,
    error: null,
    isActive: false,
    startCamera: vi.fn(),
    stopCamera: vi.fn(),
    captureFrame: vi.fn(),
  }),
}));

describe('DocScanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders in capture state with title', () => {
    render(<DocScanner />);
    expect(screen.getByText('docScanner.title')).toBeInTheDocument();
  });

  it('shows capture and upload buttons', () => {
    render(<DocScanner />);
    expect(screen.getByText('docScanner.capture')).toBeInTheDocument();
    expect(screen.getByText('docScanner.uploadImage')).toBeInTheDocument();
  });

  it('shows empty scan history message', () => {
    render(<DocScanner />);
    expect(screen.getByText('docScanner.noScansYet')).toBeInTheDocument();
  });
});
