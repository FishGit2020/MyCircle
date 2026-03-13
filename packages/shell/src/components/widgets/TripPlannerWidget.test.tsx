import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TripPlannerWidget from './TripPlannerWidget';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('TripPlannerWidget', () => {
  it('renders without crashing', () => {
    render(<TripPlannerWidget />);
    expect(screen.getByText('widgets.tripPlanner')).toBeInTheDocument();
  });

  it('shows description text', () => {
    render(<TripPlannerWidget />);
    expect(screen.getByText('widgets.tripPlannerDesc')).toBeInTheDocument();
  });

  it('shows no upcoming trips message', () => {
    render(<TripPlannerWidget />);
    expect(screen.getByText('widgets.noUpcomingTrips')).toBeInTheDocument();
  });

  it('has proper heading structure', () => {
    const { container } = render(<TripPlannerWidget />);
    const heading = container.querySelector('h4');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('widgets.tripPlanner');
  });
});
