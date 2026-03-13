import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import TravelMapWidget from './TravelMapWidget';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  StorageKeys: { TRAVEL_PINS: 'travel-pins-cache' },
  WindowEvents: { TRAVEL_PINS_CHANGED: 'travel-pins-changed' },
}));

const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

beforeEach(() => {
  getItemSpy.mockReturnValue(null);
});

describe('TravelMapWidget', () => {
  it('renders travel map title', () => {
    render(<TravelMapWidget />);
    expect(screen.getByText('widgets.travelMap')).toBeInTheDocument();
  });

  it('shows no pins message when empty', () => {
    render(<TravelMapWidget />);
    expect(screen.getByText('widgets.travelMapNoPins')).toBeInTheDocument();
  });

  it('shows pin count text when pins exist', () => {
    getItemSpy.mockImplementation((key: string) => {
      if (key === 'travel-pins-cache')
        return JSON.stringify([{ id: 1 }, { id: 2 }, { id: 3 }]);
      return null;
    });
    render(<TravelMapWidget />);
    expect(screen.getByText('widgets.travelMapPinCount')).toBeInTheDocument();
  });

  it('updates when pins change via window event', () => {
    render(<TravelMapWidget />);
    expect(screen.getByText('widgets.travelMapNoPins')).toBeInTheDocument();

    getItemSpy.mockImplementation((key: string) => {
      if (key === 'travel-pins-cache') return JSON.stringify([{ id: 1 }]);
      return null;
    });
    act(() => {
      window.dispatchEvent(new Event('travel-pins-changed'));
    });
    expect(screen.getByText('widgets.travelMapPinCount')).toBeInTheDocument();
  });

  it('handles non-array data gracefully', () => {
    getItemSpy.mockImplementation((key: string) => {
      if (key === 'travel-pins-cache') return JSON.stringify({ not: 'array' });
      return null;
    });
    render(<TravelMapWidget />);
    expect(screen.getByText('widgets.travelMapNoPins')).toBeInTheDocument();
  });
});
