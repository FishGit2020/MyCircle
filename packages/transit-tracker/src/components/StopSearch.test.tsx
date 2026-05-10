import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StopSearch from './StopSearch';
import type { RecentStopEntry } from '../types';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const noop = () => {};

describe('StopSearch — recent stops rendering', () => {
  it('renders cached metadata (name, direction, route badges) without fetching', () => {
    const recent: RecentStopEntry[] = [
      {
        stopId: '1_29248',
        name: 'Pine St & 5th Ave',
        direction: 'Eastbound',
        routeIds: ['1_44', '1_67', '1_550'],
        lastSeenAt: 0,
      },
    ];

    render(
      <StopSearch
        onSelectStop={noop}
        nearbyStops={[]}
        nearbyLoading={false}
        nearbyError={null}
        onFindNearby={noop}
        recentStops={recent}
        favorites={[]}
        onToggleFavorite={noop}
      />,
    );

    expect(screen.getByText('Pine St & 5th Ave')).toBeInTheDocument();
    expect(screen.getByText('Eastbound')).toBeInTheDocument();
    expect(screen.getByText('44')).toBeInTheDocument();
    expect(screen.getByText('67')).toBeInTheDocument();
    expect(screen.getByText('550')).toBeInTheDocument();
  });

  it('falls back to stopId when name is empty (e.g. seeded entry)', () => {
    const recent: RecentStopEntry[] = [
      { stopId: '1_75403', name: '', direction: '', routeIds: [], lastSeenAt: 0 },
    ];

    render(
      <StopSearch
        onSelectStop={noop}
        nearbyStops={[]}
        nearbyLoading={false}
        nearbyError={null}
        onFindNearby={noop}
        recentStops={recent}
        favorites={[]}
        onToggleFavorite={noop}
      />,
    );

    expect(screen.getByText('1_75403')).toBeInTheDocument();
  });

  it('hides the recent-stops section when the list is empty', () => {
    render(
      <StopSearch
        onSelectStop={noop}
        nearbyStops={[]}
        nearbyLoading={false}
        nearbyError={null}
        onFindNearby={noop}
        recentStops={[]}
        favorites={[]}
        onToggleFavorite={noop}
      />,
    );

    expect(screen.queryByText('transit.recentStops')).not.toBeInTheDocument();
  });
});

describe('StopSearch — failure states', () => {
  it('renders the location-permission-denied prompt', () => {
    render(
      <StopSearch
        onSelectStop={noop}
        nearbyStops={[]}
        nearbyLoading={false}
        nearbyError="denied"
        nearbyPermission="denied"
        onFindNearby={noop}
        recentStops={[]}
        favorites={[]}
        onToggleFavorite={noop}
      />,
    );
    expect(screen.getByText('transit.locationPermissionDenied')).toBeInTheDocument();
    expect(screen.getByText('transit.locationPermissionExplain')).toBeInTheDocument();
  });

  it('renders the location-unavailable message', () => {
    render(
      <StopSearch
        onSelectStop={noop}
        nearbyStops={[]}
        nearbyLoading={false}
        nearbyError="not supported"
        nearbyPermission="unavailable"
        onFindNearby={noop}
        recentStops={[]}
        favorites={[]}
        onToggleFavorite={noop}
      />,
    );
    expect(screen.getByText('transit.locationUnavailable')).toBeInTheDocument();
  });

  it('renders no-search-match when the query has zero matches', () => {
    render(
      <StopSearch
        onSelectStop={noop}
        nearbyStops={[{ id: '1', name: 'Pine', direction: '', lat: 0, lon: 0, distance: 0 }]}
        nearbyLoading={false}
        nearbyError={null}
        onFindNearby={noop}
        recentStops={[]}
        favorites={[]}
        onToggleFavorite={noop}
      />,
    );
    const input = screen.getByRole('textbox', { name: /transit\.stopSearchPlaceholder/i });
    fireEvent.change(input, { target: { value: 'no-such-stop' } });
    expect(screen.getByText('transit.noSearchMatch')).toBeInTheDocument();
  });

  it('does not render no-search-match when the query is empty', () => {
    render(
      <StopSearch
        onSelectStop={noop}
        nearbyStops={[]}
        nearbyLoading={false}
        nearbyError={null}
        onFindNearby={noop}
        recentStops={[]}
        favorites={[]}
        onToggleFavorite={noop}
      />,
    );
    expect(screen.queryByText('transit.noSearchMatch')).not.toBeInTheDocument();
  });
});
