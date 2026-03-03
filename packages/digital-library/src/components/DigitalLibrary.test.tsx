import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  WindowEvents: { AUTH_STATE_CHANGED: 'auth-state-changed', BOOKS_CHANGED: 'books-changed' },
  createLogger: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() }),
}));

// Mock BookReader to avoid epubjs dependency in tests
vi.mock('./BookReader', () => ({
  default: () => <div data-testid="book-reader">BookReader</div>,
}));

import DigitalLibrary from './DigitalLibrary';

describe('DigitalLibrary', () => {
  it('renders the library title', () => {
    render(<DigitalLibrary />);
    expect(screen.getByText('library.title')).toBeInTheDocument();
  });

  it('renders upload area', () => {
    render(<DigitalLibrary />);
    expect(screen.getByText('library.dropEpub')).toBeInTheDocument();
  });

  it('shows empty state when no books loaded', async () => {
    render(<DigitalLibrary />);
    // After loading completes, should show empty state
    const emptyMsg = await screen.findByText('library.emptyLibrary');
    expect(emptyMsg).toBeInTheDocument();
  });
});
