import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import VerseWidget from './VerseWidget';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  StorageKeys: { BIBLE_BOOKMARKS: 'bible_bookmarks' },
  WindowEvents: { BIBLE_BOOKMARKS_CHANGED: 'bible-bookmarks-changed' },
}));

vi.mock('react-router', () => ({
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

describe('VerseWidget', () => {
  it('renders without crashing', () => {
    render(<VerseWidget />);
    expect(screen.getByText('widgets.bible')).toBeInTheDocument();
  });

  it('shows description text', () => {
    render(<VerseWidget />);
    expect(screen.getByText('widgets.bibleDesc')).toBeInTheDocument();
  });

  it('shows no bookmarks message when no data', () => {
    render(<VerseWidget />);
    expect(screen.getByText('widgets.noBookmarks')).toBeInTheDocument();
  });

  it('has proper heading structure', () => {
    const { container } = render(<VerseWidget />);
    const heading = container.querySelector('h4');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('widgets.bible');
  });
});
