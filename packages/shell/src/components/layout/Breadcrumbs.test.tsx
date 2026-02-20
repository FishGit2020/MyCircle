import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Breadcrumbs from './Breadcrumbs';

const mockLocation = { pathname: '/', search: '', hash: '', state: null, key: 'default' };
let mockSearchParams = new URLSearchParams();

vi.mock('react-router', () => ({
  Link: ({ to, children, ...props }: any) => <a href={to} {...props}>{children}</a>,
  useLocation: () => mockLocation,
  useSearchParams: () => [mockSearchParams],
}));

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'nav.home': 'Home',
        'nav.weather': 'Weather',
        'nav.stocks': 'Stocks',
        'nav.podcasts': 'Podcasts',
        'nav.ai': 'AI',
        'nav.bible': 'Bible',
        'nav.worship': 'Worship',
        'nav.notebook': 'Notebook',
        'nav.baby': 'Baby',
        'nav.compare': 'Compare',
        'nav.breadcrumbLabel': 'Breadcrumb',
        'nav.detail': 'Details',
        'worship.newSong': 'New Song',
        'worship.editSong': 'Edit Song',
        'notebook.newNote': 'New Note',
        'notebook.editNote': 'Edit Note',
      };
      return map[key] ?? key;
    },
  }),
}));

describe('Breadcrumbs', () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams();
  });

  it('renders nothing on the home page', () => {
    mockLocation.pathname = '/';
    const { container } = render(<Breadcrumbs />);
    expect(container.innerHTML).toBe('');
  });

  it('shows breadcrumbs on a feature page', () => {
    mockLocation.pathname = '/weather';
    render(<Breadcrumbs />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Weather')).toBeInTheDocument();
  });

  it('links Home to /', () => {
    mockLocation.pathname = '/stocks';
    render(<Breadcrumbs />);
    const homeLink = screen.getByText('Home');
    expect(homeLink.closest('a')).toHaveAttribute('href', '/');
  });

  it('marks the current page with aria-current', () => {
    mockLocation.pathname = '/bible';
    render(<Breadcrumbs />);
    const current = screen.getByText('Bible');
    expect(current).toHaveAttribute('aria-current', 'page');
  });

  it('has a nav element with breadcrumb aria-label', () => {
    mockLocation.pathname = '/worship';
    render(<Breadcrumbs />);
    expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument();
  });

  it('renders nothing for unknown routes', () => {
    mockLocation.pathname = '/unknown-route';
    const { container } = render(<Breadcrumbs />);
    expect(container.innerHTML).toBe('');
  });

  // Drilldown (3-level) breadcrumb tests

  it('shows stock symbol as detail label on /stocks/AAPL', () => {
    mockLocation.pathname = '/stocks/AAPL';
    render(<Breadcrumbs />);
    expect(screen.getByText('Home').closest('a')).toHaveAttribute('href', '/');
    const stocksLink = screen.getByText('Stocks');
    expect(stocksLink.closest('a')).toHaveAttribute('href', '/stocks');
    const detail = screen.getByText('AAPL');
    expect(detail).toHaveAttribute('aria-current', 'page');
  });

  it('shows city name from query param on /weather/:coords?name=New+York', () => {
    mockLocation.pathname = '/weather/40.7,-74.0';
    mockSearchParams = new URLSearchParams('name=New+York');
    render(<Breadcrumbs />);
    const weatherLink = screen.getByText('Weather');
    expect(weatherLink.closest('a')).toHaveAttribute('href', '/weather');
    const detail = screen.getByText('New York');
    expect(detail).toHaveAttribute('aria-current', 'page');
  });

  it('falls back to Details for weather without name param', () => {
    mockLocation.pathname = '/weather/12.34,56.78';
    render(<Breadcrumbs />);
    const weatherLink = screen.getByText('Weather');
    expect(weatherLink.closest('a')).toHaveAttribute('href', '/weather');
    expect(screen.getByText('Details')).toHaveAttribute('aria-current', 'page');
  });

  it('shows New Song on /worship/new', () => {
    mockLocation.pathname = '/worship/new';
    render(<Breadcrumbs />);
    const worshipLink = screen.getByText('Worship');
    expect(worshipLink.closest('a')).toHaveAttribute('href', '/worship');
    expect(screen.getByText('New Song')).toHaveAttribute('aria-current', 'page');
  });

  it('shows Edit Song on /worship/:songId/edit', () => {
    mockLocation.pathname = '/worship/abc123/edit';
    render(<Breadcrumbs />);
    expect(screen.getByText('Worship').closest('a')).toHaveAttribute('href', '/worship');
    expect(screen.getByText('Edit Song')).toHaveAttribute('aria-current', 'page');
  });

  it('shows Details on /worship/:songId (view)', () => {
    mockLocation.pathname = '/worship/xyz';
    render(<Breadcrumbs />);
    expect(screen.getByText('Worship').closest('a')).toHaveAttribute('href', '/worship');
    expect(screen.getByText('Details')).toHaveAttribute('aria-current', 'page');
  });

  it('shows Edit Note on /notebook/:noteId', () => {
    mockLocation.pathname = '/notebook/abc123';
    render(<Breadcrumbs />);
    expect(screen.getByText('Notebook').closest('a')).toHaveAttribute('href', '/notebook');
    expect(screen.getByText('Edit Note')).toHaveAttribute('aria-current', 'page');
  });

  it('shows New Note on /notebook/new', () => {
    mockLocation.pathname = '/notebook/new';
    render(<Breadcrumbs />);
    expect(screen.getByText('Notebook').closest('a')).toHaveAttribute('href', '/notebook');
    expect(screen.getByText('New Note')).toHaveAttribute('aria-current', 'page');
  });
});
