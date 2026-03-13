import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HikingMapWidget from './HikingMapWidget';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  WindowEvents: { HIKING_ROUTES_CHANGED: 'hiking-routes-changed' },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

describe('HikingMapWidget', () => {
  it('renders without crashing', () => {
    render(<HikingMapWidget />);
    expect(screen.getByText('widgets.hikingMap')).toBeInTheDocument();
  });

  it('shows description text', () => {
    render(<HikingMapWidget />);
    expect(screen.getByText('widgets.hikingMapDesc')).toBeInTheDocument();
  });

  it('has proper heading structure', () => {
    const { container } = render(<HikingMapWidget />);
    const heading = container.querySelector('h4');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('widgets.hikingMap');
  });
});
