import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

vi.mock('@mycircle/shared', () => ({
  PageContent: ({ children, className = '' }: any) => <div className={className}>{children}</div>, // eslint-disable-line @typescript-eslint/no-explicit-any
  useTranslation: () => ({ t: (key: string) => key }),
  WindowEvents: { AUTH_STATE_CHANGED: 'auth-state-changed', BOOKS_CHANGED: 'books-changed', BREADCRUMB_DETAIL: 'breadcrumb-detail' },
  createLogger: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() }),
  useQuery: () => ({ data: undefined, loading: false, refetch: vi.fn() }),
  useMutation: () => [vi.fn()],
  useLazyQuery: () => [vi.fn().mockResolvedValue({ data: { bookChapters: [] } })],
  GET_BOOKS: {},
  GET_DELETED_BOOKS: {},
  GET_BOOK_CHAPTERS: {},
  DELETE_BOOK: {},
  RESTORE_BOOK: {},
  PERMANENT_DELETE_BOOK: {},
  UPLOAD_BOOK: {},
  GET_NAS_CONNECTION_STATUS: {},
  ARCHIVE_EPUB_TO_NAS: {},
  RESTORE_EPUB_FROM_NAS: {},
  GET_TTS_QUOTA: {},
  StorageKeys: { LIBRARY_SORT: 'library-sort' },
}));

// Mock BookReader to avoid epubjs dependency in tests
vi.mock('./BookReader', () => ({
  default: () => <div data-testid="book-reader">BookReader</div>,
}));

import DigitalLibrary from './DigitalLibrary';

const renderWithRouter = () =>
  render(
    <MemoryRouter>
      <DigitalLibrary />
    </MemoryRouter>
  );

describe('DigitalLibrary', () => {
  it('renders the library title', () => {
    renderWithRouter();
    expect(screen.getByText('library.title')).toBeInTheDocument();
  });

  it('renders upload area', () => {
    renderWithRouter();
    expect(screen.getByText('library.dropEpub')).toBeInTheDocument();
  });

  it('shows empty state when no books loaded', async () => {
    renderWithRouter();
    const emptyMsg = await screen.findByText('library.emptyLibrary');
    expect(emptyMsg).toBeInTheDocument();
  });
});
