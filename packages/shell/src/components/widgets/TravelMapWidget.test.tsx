import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TravelMapWidget from './TravelMapWidget';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  StorageKeys: { TRAVEL_PINS: 'travel_pins' },
  WindowEvents: { TRAVEL_PINS_CHANGED: 'travel-pins-changed' },
}));

describe('TravelMapWidget', () => {
  it('renders without crashing', () => {
    render(<TravelMapWidget />);
    expect(screen.getByText('widgets.travelMap')).toBeInTheDocument();
  });

  it('shows description text', () => {
    render(<TravelMapWidget />);
    expect(screen.getByText('widgets.travelMapDesc')).toBeInTheDocument();
  });

  it('shows no pins message when no data', () => {
    render(<TravelMapWidget />);
    expect(screen.getByText('widgets.travelMapNoPins')).toBeInTheDocument();
  });

  it('has proper heading structure', () => {
    const { container } = render(<TravelMapWidget />);
    const heading = container.querySelector('h4');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('widgets.travelMap');
  });
});
