import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import WeatherMap from './WeatherMap';

vi.mock('@mycircle/shared', () => {
  const t = (key: string) => {
    const map: Record<string, string> = {
      'map.title': 'Weather Map',
      'map.temperature': 'Temperature',
      'map.rain': 'Rain',
      'map.clouds': 'Clouds',
      'map.wind': 'Wind',
      'map.zoomIn': 'Zoom in',
      'map.zoomOut': 'Zoom out',
      'map.fullscreen': 'Fullscreen',
      'map.exitFullscreen': 'Exit fullscreen',
      'map.waitingForLocation': 'Waiting for location...',
      'map.loading': 'Loading map...',
    };
    return map[key] ?? key;
  };
  return {
    useTranslation: () => ({ t, locale: 'en-US' }),
  };
});

// Class-based IntersectionObserver mock (vi.fn arrow fns can't be called with `new`)
let intersectionCallback: IntersectionObserverCallback;
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  class TestIntersectionObserver {
    constructor(cb: IntersectionObserverCallback) {
      intersectionCallback = cb;
    }
    observe = mockObserve;
    unobserve = vi.fn();
    disconnect = mockDisconnect;
  }
  global.IntersectionObserver = TestIntersectionObserver as any;
});

function simulateIntersection(isIntersecting: boolean) {
  act(() => {
    intersectionCallback(
      [{ isIntersecting } as IntersectionObserverEntry],
      {} as IntersectionObserver
    );
  });
}

describe('WeatherMap', () => {
  it('renders the map title', () => {
    render(<WeatherMap lat={40.7} lon={-74.0} />);

    expect(screen.getByText('Weather Map')).toBeInTheDocument();
  });

  it('shows skeleton placeholder before intersection', () => {
    render(<WeatherMap lat={40.7} lon={-74.0} />);

    // Before intersection, should show skeleton, not iframe
    expect(screen.getByTestId('map-skeleton')).toBeInTheDocument();
    expect(screen.getByText('Loading map...')).toBeInTheDocument();
    expect(document.querySelector('iframe')).not.toBeInTheDocument();
  });

  it('renders iframe after intersection', () => {
    render(<WeatherMap lat={40.7} lon={-74.0} />);

    // Simulate scroll into view
    simulateIntersection(true);

    const iframe = document.querySelector('iframe');
    expect(iframe).toBeInTheDocument();
    expect(iframe?.getAttribute('title')).toBe('Weather map - temp');
    expect(iframe?.getAttribute('src')).toContain('lat=40.7');
    expect(iframe?.getAttribute('src')).toContain('lon=-74');
    expect(screen.queryByTestId('map-skeleton')).not.toBeInTheDocument();
  });

  it('disconnects observer after intersection', () => {
    render(<WeatherMap lat={40.7} lon={-74.0} />);

    simulateIntersection(true);

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('shows waiting message when coordinates are 0,0', () => {
    render(<WeatherMap lat={0} lon={0} />);

    expect(screen.getByText('Waiting for location...')).toBeInTheDocument();
    expect(document.querySelector('iframe')).not.toBeInTheDocument();
  });

  it('renders when only lat is zero (lon is non-zero)', () => {
    render(<WeatherMap lat={0} lon={-74.0} />);

    // hasCoords is true when lat !== 0 || lon !== 0
    // Should show skeleton (not waiting message)
    expect(screen.getByTestId('map-skeleton')).toBeInTheDocument();
  });

  it('renders layer selection buttons', () => {
    render(<WeatherMap lat={40.7} lon={-74.0} />);

    // Layer buttons have title attributes
    expect(screen.getByTitle('Temperature')).toBeInTheDocument();
    expect(screen.getByTitle('Rain')).toBeInTheDocument();
    expect(screen.getByTitle('Clouds')).toBeInTheDocument();
    expect(screen.getByTitle('Wind')).toBeInTheDocument();
  });

  it('switches layer when a layer button is clicked', () => {
    render(<WeatherMap lat={40.7} lon={-74.0} />);

    simulateIntersection(true);

    // Click the Rain layer button
    fireEvent.click(screen.getByTitle('Rain'));

    const iframe = document.querySelector('iframe');
    expect(iframe?.getAttribute('src')).toContain('precipitation_new');
    expect(iframe?.getAttribute('title')).toBe('Weather map - precipitation');
  });

  it('highlights the active layer button', () => {
    render(<WeatherMap lat={40.7} lon={-74.0} />);

    // Default is 'temp', so the temperature button should be active
    const tempButton = screen.getByTitle('Temperature');
    expect(tempButton.className).toContain('bg-blue-500');

    const rainButton = screen.getByTitle('Rain');
    expect(rainButton.className).not.toContain('bg-blue-500');
  });

  it('renders zoom in and zoom out buttons', () => {
    render(<WeatherMap lat={40.7} lon={-74.0} />);

    expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
  });

  it('shows current zoom level', () => {
    render(<WeatherMap lat={40.7} lon={-74.0} />);

    // Default zoom is 6
    expect(screen.getByText('6x')).toBeInTheDocument();
  });

  it('increments zoom when zoom in is clicked', () => {
    render(<WeatherMap lat={40.7} lon={-74.0} />);

    fireEvent.click(screen.getByLabelText('Zoom in'));
    expect(screen.getByText('7x')).toBeInTheDocument();
  });

  it('decrements zoom when zoom out is clicked', () => {
    render(<WeatherMap lat={40.7} lon={-74.0} />);

    fireEvent.click(screen.getByLabelText('Zoom out'));
    expect(screen.getByText('5x')).toBeInTheDocument();
  });

  it('disables zoom in at max zoom (12)', () => {
    render(<WeatherMap lat={40.7} lon={-74.0} />);

    // Click zoom in until we reach max (default 6, max 12 = 6 clicks)
    for (let i = 0; i < 6; i++) {
      fireEvent.click(screen.getByLabelText('Zoom in'));
    }
    expect(screen.getByText('12x')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom in')).toBeDisabled();
  });

  it('disables zoom out at min zoom (3)', () => {
    render(<WeatherMap lat={40.7} lon={-74.0} />);

    // Click zoom out until we reach min (default 6, min 3 = 3 clicks)
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByLabelText('Zoom out'));
    }
    expect(screen.getByText('3x')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom out')).toBeDisabled();
  });

  it('displays coordinates in the overlay', () => {
    render(<WeatherMap lat={40.7} lon={-74.0} />);

    expect(screen.getByText('40.70, -74.00')).toBeInTheDocument();
  });

  it('renders fullscreen toggle button', () => {
    render(<WeatherMap lat={40.7} lon={-74.0} />);

    expect(screen.getByLabelText('Fullscreen')).toBeInTheDocument();
  });
});
