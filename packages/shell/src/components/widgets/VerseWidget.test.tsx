import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import VerseWidget from './VerseWidget';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  StorageKeys: { BIBLE_BOOKMARKS: 'bible-bookmarks' },
  WindowEvents: { BIBLE_BOOKMARKS_CHANGED: 'bible-bookmarks-changed' },
}));

const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

beforeEach(() => {
  getItemSpy.mockReturnValue(null);
});

describe('VerseWidget', () => {
  it('renders bible title', () => {
    render(<MemoryRouter><VerseWidget /></MemoryRouter>);
    expect(screen.getByText('widgets.bible')).toBeInTheDocument();
  });

  it('shows no bookmarks message when empty', () => {
    render(<MemoryRouter><VerseWidget /></MemoryRouter>);
    expect(screen.getByText('widgets.noBookmarks')).toBeInTheDocument();
  });

  it('renders bookmark links', () => {
    getItemSpy.mockImplementation((key: string) => {
      if (key === 'bible-bookmarks')
        return JSON.stringify([
          { book: 'Genesis', chapter: 1, label: 'Genesis 1' },
          { book: 'Psalms', chapter: 23, label: 'Psalms 23' },
        ]);
      return null;
    });
    render(<MemoryRouter><VerseWidget /></MemoryRouter>);
    expect(screen.getByText('Genesis 1')).toBeInTheDocument();
    expect(screen.getByText('Psalms 23')).toBeInTheDocument();
  });

  it('renders links to correct bible pages', () => {
    getItemSpy.mockImplementation((key: string) => {
      if (key === 'bible-bookmarks')
        return JSON.stringify([{ book: 'Genesis', chapter: 1, label: 'Genesis 1' }]);
      return null;
    });
    render(<MemoryRouter><VerseWidget /></MemoryRouter>);
    const link = screen.getByText('Genesis 1').closest('a');
    expect(link).toHaveAttribute('href', '/bible?book=Genesis&chapter=1');
  });

  it('limits displayed bookmarks to 6 and shows overflow count', () => {
    const bookmarks = Array.from({ length: 8 }, (_, i) => ({
      book: `Book${i}`,
      chapter: i + 1,
      label: `Book${i} ${i + 1}`,
    }));
    getItemSpy.mockImplementation((key: string) => {
      if (key === 'bible-bookmarks') return JSON.stringify(bookmarks);
      return null;
    });
    render(<MemoryRouter><VerseWidget /></MemoryRouter>);
    expect(screen.getByText('Book0 1')).toBeInTheDocument();
    expect(screen.getByText('Book5 6')).toBeInTheDocument();
    expect(screen.queryByText('Book6 7')).not.toBeInTheDocument();
    expect(screen.getByText(/\+2/)).toBeInTheDocument();
  });

  it('falls back to book+chapter when label is absent', () => {
    getItemSpy.mockImplementation((key: string) => {
      if (key === 'bible-bookmarks')
        return JSON.stringify([{ book: 'Romans', chapter: 8, label: '' }]);
      return null;
    });
    render(<MemoryRouter><VerseWidget /></MemoryRouter>);
    expect(screen.getByText('Romans 8')).toBeInTheDocument();
  });
});
