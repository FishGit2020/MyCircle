import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Breadcrumbs from './Breadcrumbs';

const mockLocation = { pathname: '/', search: '', hash: '', state: null, key: 'default' };

vi.mock('react-router', () => ({
  Link: ({ to, children, ...props }: any) => <a href={to} {...props}>{children}</a>,
  useLocation: () => mockLocation,
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
      };
      return map[key] ?? key;
    },
  }),
}));

describe('Breadcrumbs', () => {
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

  it('handles nested weather routes (e.g. /weather/12.34,56.78)', () => {
    mockLocation.pathname = '/weather/12.34,56.78';
    render(<Breadcrumbs />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Weather')).toBeInTheDocument();
  });

  it('renders nothing for unknown routes', () => {
    mockLocation.pathname = '/unknown-route';
    const { container } = render(<Breadcrumbs />);
    expect(container.innerHTML).toBe('');
  });
});
