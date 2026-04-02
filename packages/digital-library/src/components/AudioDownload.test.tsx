import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AudioDownload from './AudioDownload';

const mockRequestZip = vi.fn();

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string, opts?: Record<string, string>) => {
    if (opts) return `${key}:${JSON.stringify(opts)}`;
    return key;
  }}),
  useMutation: vi.fn(() => [mockRequestZip, { loading: false }]),
  REQUEST_BOOK_ZIP: {},
  DELETE_BOOK_ZIP: {},
}));

const BASE_PROPS = {
  bookId: 'book-1',
  bookTitle: 'My Book',
  chapters: [
    { index: 1, title: 'Chapter One', audioUrl: 'http://example.com/ch1.mp3' },
    { index: 2, title: 'Chapter Two', audioUrl: 'http://example.com/ch2.mp3' },
  ],
  zipStatus: 'none',
  onRefreshBook: vi.fn().mockResolvedValue(undefined),
};

beforeEach(() => {
  mockRequestZip.mockReset();
  mockRequestZip.mockResolvedValue({});
  (BASE_PROPS.onRefreshBook as ReturnType<typeof vi.fn>).mockReset();
  (BASE_PROPS.onRefreshBook as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── US1: Sequential Download ──────────────────────────────────────

describe('sequential download', () => {
  it('enables Download All Chapters when chapters have audioUrl', () => {
    render(<AudioDownload {...BASE_PROPS} />);
    const btn = screen.getByRole('button', { name: 'library.downloadAllChapters' });
    expect(btn).not.toBeDisabled();
  });

  it('disables Download All Chapters when no chapters have audioUrl', () => {
    const props = {
      ...BASE_PROPS,
      chapters: [{ index: 1, title: 'Ch1' }],
    };
    render(<AudioDownload {...props} />);
    const btn = screen.getByRole('button', { name: 'library.downloadAllChapters' });
    expect(btn).toBeDisabled();
  });

  it('calls fetch for each chapter when Download All Chapters is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    const fetchMock = vi.fn().mockResolvedValue({
      blob: () => Promise.resolve(new Blob(['audio'], { type: 'audio/mpeg' })),
    });
    global.fetch = fetchMock as typeof fetch;
    global.URL.createObjectURL = vi.fn(() => 'blob:fake');
    global.URL.revokeObjectURL = vi.fn();

    render(<AudioDownload {...BASE_PROPS} />);
    const btn = screen.getByRole('button', { name: 'library.downloadAllChapters' });
    await user.click(btn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('http://example.com/ch1.mp3', expect.any(Object));
    }, { timeout: 3000 });
  });

  it('cancel button aborts the download', async () => {
    const user = userEvent.setup({ delay: null });
    let rejectFetch!: () => void;
    const fetchMock = vi.fn().mockImplementation(() =>
      new Promise((_, reject) => { rejectFetch = () => reject(new DOMException('AbortError', 'AbortError')); })
    );
    global.fetch = fetchMock as typeof fetch;

    render(<AudioDownload {...BASE_PROPS} />);
    const btn = screen.getByRole('button', { name: 'library.downloadAllChapters' });
    await user.click(btn);

    await waitFor(() => screen.getByRole('button', { name: 'library.cancelDownload' }), { timeout: 3000 });
    const cancelBtn = screen.getByRole('button', { name: 'library.cancelDownload' });
    await user.click(cancelBtn);
    rejectFetch();

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'library.cancelDownload' })).toBeNull();
    }, { timeout: 3000 });
  });
});

// ── US2: ZIP Download ─────────────────────────────────────────────

describe('ZIP status states', () => {
  it("renders Generate Audiobook ZIP button when zipStatus is 'none'", () => {
    render(<AudioDownload {...BASE_PROPS} zipStatus="none" />);
    expect(screen.getByRole('button', { name: 'library.generateZip' })).toBeTruthy();
  });

  it("renders spinner and generatingZip text when zipStatus is 'processing'", () => {
    render(<AudioDownload {...BASE_PROPS} zipStatus="processing" />);
    expect(screen.getByText('library.generatingZip')).toBeTruthy();
  });

  it("calls onRefreshBook after 10s interval when processing", () => {
    vi.useFakeTimers();
    const onRefreshBook = vi.fn().mockResolvedValue(undefined);
    render(<AudioDownload {...BASE_PROPS} zipStatus="processing" onRefreshBook={onRefreshBook} />);

    act(() => { vi.advanceTimersByTime(10_000); });
    expect(onRefreshBook).toHaveBeenCalledTimes(1);

    act(() => { vi.advanceTimersByTime(10_000); });
    expect(onRefreshBook).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it("renders ZIP ready card with download link and Generate New ZIP button", () => {
    render(
      <AudioDownload
        {...BASE_PROPS}
        zipStatus="ready"
        zipUrl="http://example.com/audiobook.zip"
        zipSize={52428800}
        zipGeneratedAt="2026-03-31T12:00:00Z"
      />
    );
    expect(screen.getByText('library.zipReady')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'library.downloadZip' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'library.generateNewZip' })).toBeTruthy();
  });

  it("renders error message and Retry button when zipStatus is 'error'", () => {
    render(
      <AudioDownload
        {...BASE_PROPS}
        zipStatus="error"
        zipError="Worker timed out"
      />
    );
    expect(screen.getByText('Worker timed out')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'library.generateZip' })).toBeTruthy();
  });

  it('clicking Generate Audiobook ZIP calls REQUEST_BOOK_ZIP mutation', async () => {
    const user = userEvent.setup({ delay: null });
    render(<AudioDownload {...BASE_PROPS} zipStatus="none" />);
    await user.click(screen.getByRole('button', { name: 'library.generateZip' }));
    expect(mockRequestZip).toHaveBeenCalledWith({ variables: { bookId: 'book-1' } });
  });
});

// ── US3: ZIP Regeneration ─────────────────────────────────────────

describe('ZIP regeneration', () => {
  it('clicking Generate New ZIP when ready calls REQUEST_BOOK_ZIP mutation', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <AudioDownload
        {...BASE_PROPS}
        zipStatus="ready"
        zipUrl="http://example.com/audiobook.zip"
        zipSize={52428800}
        zipGeneratedAt="2026-03-31T12:00:00Z"
      />
    );
    await user.click(screen.getByRole('button', { name: 'library.generateNewZip' }));
    expect(mockRequestZip).toHaveBeenCalledWith({ variables: { bookId: 'book-1' } });
  });
});
