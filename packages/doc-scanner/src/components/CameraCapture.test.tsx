import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CameraCapture from './CameraCapture';

// Mock @mycircle/shared
vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

const mockStartCamera = vi.fn();
const mockStopCamera = vi.fn();
const mockCaptureFrame = vi.fn();

vi.mock('../hooks/useCamera', () => ({
  useCamera: () => ({
    videoRef: { current: null },
    stream: null,
    error: null,
    isActive: false,
    startCamera: mockStartCamera,
    stopCamera: mockStopCamera,
    captureFrame: mockCaptureFrame,
  }),
}));

describe('CameraCapture', () => {
  const onCapture = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders capture and upload buttons', () => {
    render(<CameraCapture onCapture={onCapture} />);
    expect(screen.getByText('docScanner.capture')).toBeInTheDocument();
    expect(screen.getByText('docScanner.uploadImage')).toBeInTheDocument();
  });

  it('has a file input for image upload', () => {
    render(<CameraCapture onCapture={onCapture} />);
    const fileInput = screen.getByTestId('file-input');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('accept', 'image/*');
  });

  it('starts camera when capture button clicked', async () => {
    render(<CameraCapture onCapture={onCapture} />);
    const captureBtn = screen.getByText('docScanner.capture');
    fireEvent.click(captureBtn);
    expect(mockStartCamera).toHaveBeenCalled();
  });
});
