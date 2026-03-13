import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import QuickAccessTiles from './QuickAccessTiles';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  StorageKeys: { WIDGET_LAYOUT: 'widget-dashboard-layout' },
  WindowEvents: { WIDGET_LAYOUT_CHANGED: 'widget-layout-changed' },
}));

vi.mock('../../hooks/useWidgetPinned', () => ({
  useWidgetPinned: () => ({ pinned: false, toggle: vi.fn() }),
}));

describe('QuickAccessTiles', () => {
  it('renders the section with title', () => {
    render(<MemoryRouter><QuickAccessTiles /></MemoryRouter>);
    expect(screen.getByText('home.quickAccess')).toBeInTheDocument();
  });

  it('renders the section with proper aria label', () => {
    render(<MemoryRouter><QuickAccessTiles /></MemoryRouter>);
    expect(screen.getByRole('region', { name: 'home.quickAccess' })).toBeInTheDocument();
  });

  it('renders tile links for weather, stocks, podcasts, bible', () => {
    render(<MemoryRouter><QuickAccessTiles /></MemoryRouter>);
    expect(screen.getByText('nav.weather')).toBeInTheDocument();
    expect(screen.getByText('nav.stocks')).toBeInTheDocument();
    expect(screen.getByText('nav.podcasts')).toBeInTheDocument();
    expect(screen.getByText('nav.bible')).toBeInTheDocument();
  });

  it('renders pin buttons for each tile', () => {
    render(<MemoryRouter><QuickAccessTiles /></MemoryRouter>);
    const pinButtons = screen.getAllByRole('button', { name: 'home.pinWidget' });
    expect(pinButtons.length).toBeGreaterThan(0);
  });

  it('renders multiple feature links', () => {
    render(<MemoryRouter><QuickAccessTiles /></MemoryRouter>);
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(20);
  });
});
