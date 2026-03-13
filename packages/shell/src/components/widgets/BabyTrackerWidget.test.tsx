import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import BabyTrackerWidget from './BabyTrackerWidget';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  StorageKeys: { BABY_DUE_DATE: 'baby_due_date' },
}));

describe('BabyTrackerWidget', () => {
  it('renders without crashing', () => {
    render(<BabyTrackerWidget />);
    expect(screen.getByText('widgets.babyTracker')).toBeInTheDocument();
  });

  it('shows description text', () => {
    render(<BabyTrackerWidget />);
    expect(screen.getByText('widgets.babyTrackerDesc')).toBeInTheDocument();
  });

  it('shows no due date message when no data', () => {
    render(<BabyTrackerWidget />);
    expect(screen.getByText('widgets.noDueDate')).toBeInTheDocument();
  });

  it('has proper heading structure', () => {
    const { container } = render(<BabyTrackerWidget />);
    const heading = container.querySelector('h4');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('widgets.babyTracker');
  });
});
