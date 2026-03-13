import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import YouthTrackerWidget from './YouthTrackerWidget';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  StorageKeys: { CHILDREN_CACHE: 'children_cache' },
  WindowEvents: { CHILDREN_CHANGED: 'children-changed' },
  getAgeInMonths: () => 72,
}));

describe('YouthTrackerWidget', () => {
  it('renders without crashing', () => {
    render(<YouthTrackerWidget />);
    expect(screen.getByText('widgets.youthTracker')).toBeInTheDocument();
  });

  it('shows description text', () => {
    render(<YouthTrackerWidget />);
    expect(screen.getByText('widgets.youthTrackerDesc')).toBeInTheDocument();
  });

  it('shows no children message when no data', () => {
    render(<YouthTrackerWidget />);
    expect(screen.getByText('children.noChildren')).toBeInTheDocument();
  });

  it('has proper heading structure', () => {
    const { container } = render(<YouthTrackerWidget />);
    const heading = container.querySelector('h4');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('widgets.youthTracker');
  });
});
