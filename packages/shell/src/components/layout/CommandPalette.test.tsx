import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import CommandPalette from './CommandPalette';

const mockNavigate = vi.fn();

vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/', search: '', hash: '', state: null, key: 'default' }),
}));

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  StorageKeys: {
    STOCK_WATCHLIST: 'stock-tracker-watchlist',
    BIBLE_BOOKMARKS: 'bible-bookmarks',
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  // scrollIntoView is not available in jsdom
  Element.prototype.scrollIntoView = vi.fn();
});

describe('CommandPalette', () => {
  it('does not render palette by default', () => {
    render(<CommandPalette />);
    expect(screen.queryByPlaceholderText('commandPalette.placeholder')).not.toBeInTheDocument();
  });

  it('opens on Ctrl+K', () => {
    render(<CommandPalette />);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    });
    expect(screen.getByPlaceholderText('commandPalette.placeholder')).toBeInTheDocument();
  });

  it('closes on Escape', () => {
    render(<CommandPalette />);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    });
    expect(screen.getByPlaceholderText('commandPalette.placeholder')).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(screen.queryByPlaceholderText('commandPalette.placeholder')).not.toBeInTheDocument();
  });

  it('shows all nav items when no query', () => {
    render(<CommandPalette />);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    });
    expect(screen.getByText('bottomNav.home')).toBeInTheDocument();
    expect(screen.getByText('commandPalette.goToWeather')).toBeInTheDocument();
    expect(screen.getByText('commandPalette.goToStocks')).toBeInTheDocument();
  });

  it('filters items by query', () => {
    render(<CommandPalette />);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    });
    const input = screen.getByPlaceholderText('commandPalette.placeholder');
    fireEvent.change(input, { target: { value: 'weather' } });

    expect(screen.getByText('commandPalette.goToWeather')).toBeInTheDocument();
    expect(screen.queryByText('commandPalette.goToStocks')).not.toBeInTheDocument();
  });

  it('shows no results message for non-matching query', () => {
    render(<CommandPalette />);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    });
    const input = screen.getByPlaceholderText('commandPalette.placeholder');
    fireEvent.change(input, { target: { value: 'zzzznotfound' } });

    expect(screen.getByText('commandPalette.noResults')).toBeInTheDocument();
  });

  it('navigates on Enter key', () => {
    render(<CommandPalette />);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    });
    const input = screen.getByPlaceholderText('commandPalette.placeholder');

    // First item is home (/)
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('navigates with arrow keys and Enter', () => {
    render(<CommandPalette />);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    });
    const input = screen.getByPlaceholderText('commandPalette.placeholder');

    // Arrow down to second item (weather)
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockNavigate).toHaveBeenCalledWith('/weather');
  });

  it('closes palette when backdrop is clicked', () => {
    render(<CommandPalette />);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    });
    expect(screen.getByPlaceholderText('commandPalette.placeholder')).toBeInTheDocument();

    // Click the backdrop (first child div with bg-black/50)
    const backdrop = document.querySelector('.bg-black\\/50');
    if (backdrop) fireEvent.click(backdrop);
    expect(screen.queryByPlaceholderText('commandPalette.placeholder')).not.toBeInTheDocument();
  });

  it('displays footer navigation hints', () => {
    render(<CommandPalette />);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    });
    expect(screen.getByText('commandPalette.navigate')).toBeInTheDocument();
    expect(screen.getByText('commandPalette.select')).toBeInTheDocument();
    expect(screen.getByText('commandPalette.close')).toBeInTheDocument();
  });

  it('shows recent pages section when recentPages prop is provided', () => {
    const recentPages = [
      { path: '/weather', visitedAt: Date.now() },
      { path: '/stocks', visitedAt: Date.now() - 1000 },
    ];
    render(<CommandPalette recentPages={recentPages} />);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    });
    expect(screen.getByText('commandPalette.recentPages')).toBeInTheDocument();
  });

  it('does not show recent pages section when recentPages is empty', () => {
    render(<CommandPalette recentPages={[]} />);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    });
    expect(screen.queryByText('commandPalette.recentPages')).not.toBeInTheDocument();
  });

  it('navigates to recent page on Enter', () => {
    const recentPages = [
      { path: '/bible', visitedAt: Date.now() },
    ];
    render(<CommandPalette recentPages={recentPages} />);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    });
    const input = screen.getByPlaceholderText('commandPalette.placeholder');
    // First item should be the recent page
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockNavigate).toHaveBeenCalledWith('/bible');
  });

  it('shows content section when stocks exist in localStorage', () => {
    localStorage.setItem('stock-tracker-watchlist', JSON.stringify([
      { symbol: 'AAPL', companyName: 'Apple Inc' },
    ]));
    render(<CommandPalette />);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    });
    expect(screen.getByText('commandPalette.yourContent')).toBeInTheDocument();
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    localStorage.removeItem('stock-tracker-watchlist');
  });

  it('shows bookmark content when Bible bookmarks exist', () => {
    localStorage.setItem('bible-bookmarks', JSON.stringify([
      { book: 'John', chapter: 3, label: 'John 3:16' },
    ]));
    render(<CommandPalette />);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    });
    expect(screen.getByText('John 3:16')).toBeInTheDocument();
    localStorage.removeItem('bible-bookmarks');
  });

  it('filters content items by query', () => {
    localStorage.setItem('stock-tracker-watchlist', JSON.stringify([
      { symbol: 'AAPL', companyName: 'Apple Inc' },
      { symbol: 'MSFT', companyName: 'Microsoft Corp' },
    ]));
    render(<CommandPalette />);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    });
    const input = screen.getByPlaceholderText('commandPalette.placeholder');
    fireEvent.change(input, { target: { value: 'Apple' } });

    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.queryByText('MSFT')).not.toBeInTheDocument();
    localStorage.removeItem('stock-tracker-watchlist');
  });
});
