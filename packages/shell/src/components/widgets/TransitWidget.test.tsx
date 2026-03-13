import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TransitWidget from './TransitWidget';

const mockNavigate = vi.fn();
vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  StorageKeys: { TRANSIT_FAVORITES: 'transit-favorites' },
  WindowEvents: { TRANSIT_FAVORITES_CHANGED: 'transit-favorites-changed' },
}));

const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

beforeEach(() => {
  getItemSpy.mockReturnValue(null);
  mockNavigate.mockClear();
});

describe('TransitWidget', () => {
  it('renders transit title', () => {
    render(<TransitWidget />);
    expect(screen.getByText('widgets.transit')).toBeInTheDocument();
  });

  it('shows no favorites message when empty', () => {
    render(<TransitWidget />);
    expect(screen.getByText('widgets.transitNoFavorites')).toBeInTheDocument();
  });

  it('renders favorite stops', () => {
    getItemSpy.mockImplementation((key: string) => {
      if (key === 'transit-favorites')
        return JSON.stringify([
          { stopId: 's1', stopName: 'Main St Station', direction: 'Northbound' },
          { stopId: 's2', stopName: 'Broadway & 5th', direction: 'Southbound' },
        ]);
      return null;
    });
    render(<TransitWidget />);
    expect(screen.getByText('Main St Station')).toBeInTheDocument();
    expect(screen.getByText('Broadway & 5th')).toBeInTheDocument();
  });

  it('shows favorite count text when favorites exist', () => {
    getItemSpy.mockImplementation((key: string) => {
      if (key === 'transit-favorites')
        return JSON.stringify([{ stopId: 's1', stopName: 'Main St', direction: '' }]);
      return null;
    });
    render(<TransitWidget />);
    expect(screen.getByText('widgets.transitFavoriteCount')).toBeInTheDocument();
  });

  it('navigates on stop click', () => {
    getItemSpy.mockImplementation((key: string) => {
      if (key === 'transit-favorites')
        return JSON.stringify([{ stopId: 's1', stopName: 'Main St', direction: '' }]);
      return null;
    });
    render(<TransitWidget />);
    fireEvent.click(screen.getByText('Main St'));
    expect(mockNavigate).toHaveBeenCalledWith('/transit/s1');
  });

  it('limits displayed stops to 3', () => {
    const stops = Array.from({ length: 5 }, (_, i) => ({
      stopId: `s${i}`,
      stopName: `Stop ${i}`,
      direction: '',
    }));
    getItemSpy.mockImplementation((key: string) => {
      if (key === 'transit-favorites') return JSON.stringify(stops);
      return null;
    });
    render(<TransitWidget />);
    expect(screen.getByText('Stop 0')).toBeInTheDocument();
    expect(screen.getByText('Stop 2')).toBeInTheDocument();
    expect(screen.queryByText('Stop 3')).not.toBeInTheDocument();
  });
});
