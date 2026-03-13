import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import GpsLocateButton from './GpsLocateButton';
vi.mock('@mycircle/shared', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
function createMockMap() { return { flyTo: vi.fn(), on: vi.fn(), off: vi.fn(), remove: vi.fn(), resize: vi.fn(), zoomIn: vi.fn(), zoomOut: vi.fn() } as any; }
describe('GpsLocateButton', () => {
  it('renders', () => { render(<GpsLocateButton map={null} />); expect(screen.getByRole('button', { name: 'hiking.locateMe' })).toBeInTheDocument(); });
  it('noop null', () => { render(<GpsLocateButton map={null} />); fireEvent.click(screen.getByRole('button')); expect(navigator.geolocation.getCurrentPosition).not.toHaveBeenCalled(); });
  it('geolocation', () => { render(<GpsLocateButton map={createMockMap()} />); fireEvent.click(screen.getByRole('button')); expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalled(); });
  it('locating', () => { render(<GpsLocateButton map={createMockMap()} />); fireEvent.click(screen.getByRole('button')); expect(screen.getByRole('button', { name: 'hiking.locating' })).toBeDisabled(); });
  it('success', () => { const map = createMockMap(); const onLocate = vi.fn(); (navigator.geolocation.getCurrentPosition as ReturnType<typeof vi.fn>).mockImplementation((s: PositionCallback) => { s({ coords: { latitude: 47.6, longitude: -122.3, accuracy: 10, altitude: null, altitudeAccuracy: null, heading: null, speed: null }, timestamp: Date.now() } as GeolocationPosition); }); render(<GpsLocateButton map={map} onLocate={onLocate} />); act(() => { fireEvent.click(screen.getByRole('button')); }); expect(map.flyTo).toHaveBeenCalledWith({ center: [-122.3, 47.6], zoom: 14 }); expect(onLocate).toHaveBeenCalledWith([-122.3, 47.6]); });
  it('error', () => { const map = createMockMap(); (navigator.geolocation.getCurrentPosition as ReturnType<typeof vi.fn>).mockImplementation((_s: PositionCallback, e: PositionErrorCallback) => { e({ code: 1, message: 'd', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError); }); render(<GpsLocateButton map={map} />); act(() => { fireEvent.click(screen.getByRole('button')); }); expect(screen.getByRole('button', { name: 'hiking.locationError' })).toBeInTheDocument(); });
});
