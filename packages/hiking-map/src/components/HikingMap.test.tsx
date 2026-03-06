import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HikingMap from './HikingMap';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  PageContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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

vi.mock('./GpsLocateButton', () => ({
  default: () => <button type="button" aria-label="hiking.locateMe">GPS</button>,
}));

vi.mock('./ZoomControls', () => ({
  default: () => <div data-testid="zoom-controls" />,
}));

vi.mock('./MapStyleSwitcher', () => ({
  default: ({ providers, onChange }: { providers: Array<{ id: string; labelKey: string; style: string | Record<string, unknown> }>; activeId: string; onChange: (id: string, style: string | Record<string, unknown>) => void }) => (
    <div>
      <span>hiking.mapStyle</span>
      {providers.map(p => (
        <button key={p.id} type="button" onClick={() => onChange(p.id, p.style)}>
          {p.labelKey}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('./RoutePlanner', () => ({
  default: () => (
    <div>
      <span>hiking.routePlanner</span>
      <input placeholder="hiking.startPoint" />
      <input placeholder="hiking.endPoint" />
      <button type="button">hiking.planRoute</button>
    </div>
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
    expect(screen.getByRole('button', { name: 'hiking.locateMe' })).toBeInTheDocument();
  });

  it('renders the route planner section', () => {
    render(<HikingMap />);
    expect(screen.getByText('hiking.routePlanner')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('hiking.startPoint')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('hiking.endPoint')).toBeInTheDocument();
  });

  it('renders map style switcher with providers', () => {
    render(<HikingMap />);
    expect(screen.getByText('hiking.mapStyle')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'hiking.styleStreet' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'hiking.styleTopo' })).toBeInTheDocument();
  });

  it('renders plan route button', () => {
    render(<HikingMap />);
    expect(screen.getByRole('button', { name: 'hiking.planRoute' })).toBeInTheDocument();
  });
});
