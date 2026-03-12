import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TransitTracker from './TransitTracker';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  PageContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

vi.mock('../hooks/useTransitArrivals', () => ({
  useTransitArrivals: () => ({
    arrivals: [],
    stop: null,
    loading: false,
    error: null,
    refresh: vi.fn(),
    lastUpdated: null,
  }),
}));

vi.mock('../hooks/useNearbyStops', () => ({
  useNearbyStops: () => ({
    stops: [],
    loading: false,
    error: null,
    findNearby: vi.fn(),
  }),
}));

describe('TransitTracker', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the title and search form', () => {
    render(<TransitTracker />);
    expect(screen.getByText('transit.title')).toBeInTheDocument();
    expect(screen.getByText('transit.subtitle')).toBeInTheDocument();
  });

  it('renders the stop ID input', () => {
    render(<TransitTracker />);
    const input = screen.getByRole('textbox', { name: /transit\.stopIdPlaceholder/i });
    expect(input).toBeInTheDocument();
  });

  it('renders the find nearby button', () => {
    render(<TransitTracker />);
    expect(screen.getByRole('button', { name: /transit\.findNearby/i })).toBeInTheDocument();
  });

  it('selects a stop when form is submitted', () => {
    render(<TransitTracker />);
    const input = screen.getByRole('textbox', { name: /transit\.stopIdPlaceholder/i });
    fireEvent.change(input, { target: { value: '1_75403' } });
    fireEvent.submit(input.closest('form')!);
    // After selecting a stop, the back button should appear
    expect(screen.getByRole('button', { name: /transit\.back/i })).toBeInTheDocument();
  });

  it('shows recent stops after selecting one', () => {
    render(<TransitTracker />);
    const input = screen.getByRole('textbox', { name: /transit\.stopIdPlaceholder/i });
    fireEvent.change(input, { target: { value: '1_75403' } });
    fireEvent.submit(input.closest('form')!);

    // Go back
    fireEvent.click(screen.getByRole('button', { name: /transit\.back/i }));

    // Recent stops should show the ID
    expect(screen.getByText('1_75403')).toBeInTheDocument();
  });
});
