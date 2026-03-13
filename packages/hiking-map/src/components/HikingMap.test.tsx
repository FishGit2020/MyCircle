import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HikingMap from './HikingMap';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  PageContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  MapControls: ({ showStyleSwitcher, onLocate }: { map: unknown; showStyleSwitcher?: boolean; onStyleChange?: (style: string) => void; onLocate?: (lngLat: [number, number]) => void }) => (
    <div data-testid="map-controls">
      <button type="button" aria-label="map.zoomIn">+</button>
      <button type="button" aria-label="map.zoomOut">-</button>
      <button type="button" aria-label="map.fullscreen">FS</button>
      <button type="button" aria-label="map.myLocation" onClick={() => onLocate?.([0, 0])}>GPS</button>
      {showStyleSwitcher && (
        <button type="button" aria-label="map.streetView">Style</button>
      )}
    </div>
  ),
  setCircleLayer: vi.fn(),
  removeSourceAndLayers: vi.fn(),
}));

vi.mock('../config/mapConfig', () => ({
  MAP_CONFIG: {
    defaultCenter: [-122.4194, 37.7749],
    defaultZoom: 10,
    tileProviders: [
      { id: 'street', labelKey: 'hiking.styleStreet', style: 'https://example.com/street.json' },
      { id: 'topo', labelKey: 'hiking.styleTopo', style: 'https://example.com/topo.json' },
    ],
    routing: { baseUrl: 'https://router.example.com', profile: 'foot' },
  },
}));

vi.mock('./MapView', () => ({
  default: ({ onMapReady }: { onMapReady: (map: unknown) => void; onMapClick?: (lngLat: [number, number]) => void }) => {
    onMapReady(null);
    return <div role="application" aria-label="Map" />;
  },
}));

vi.mock('./SavedRoutes', () => ({
  default: () => <div data-testid="saved-routes" />,
}));

vi.mock('./OfflineTileManager', () => ({
  default: () => <div data-testid="offline-tile-manager" />,
}));

vi.mock('./TileCacheOverlay', () => ({
  default: () => null,
}));

vi.mock('./RouteDisplay', () => ({
  default: () => null,
}));

vi.mock('./RoutePlanner', () => ({
  default: () => (
    <>
      <div>
        <span>hiking.routePlanner</span>
        <input placeholder="hiking.startPoint" />
        <input placeholder="hiking.endPoint" />
        <button type="button">hiking.planRoute</button>
      </div>
    </>
  ),
}));

describe('HikingMap', () => {
  it('renders title and subtitle', () => {
    render(<HikingMap />);
    expect(screen.getByText('hiking.title')).toBeInTheDocument();
    expect(screen.getByText('hiking.subtitle')).toBeInTheDocument();
  });

  it('renders the map container', () => {
    render(<HikingMap />);
    expect(screen.getByRole('application', { name: 'Map' })).toBeInTheDocument();
  });

  it('renders the GPS locate button', () => {
    render(<HikingMap />);
    expect(screen.getByRole('button', { name: 'map.myLocation' })).toBeInTheDocument();
  });

  it('renders the route planner section', () => {
    render(<HikingMap />);
    expect(screen.getByText('hiking.routePlanner')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('hiking.startPoint')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('hiking.endPoint')).toBeInTheDocument();
  });

  it('renders shared map controls with style switcher', () => {
    render(<HikingMap />);
    expect(screen.getByTestId('map-controls')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'map.streetView' })).toBeInTheDocument();
  });

  it('renders plan route button', () => {
    render(<HikingMap />);
    expect(screen.getByRole('button', { name: 'hiking.planRoute' })).toBeInTheDocument();
  });
});
