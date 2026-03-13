import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChildDevWidget from './ChildDevWidget';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  StorageKeys: { CHILDREN_CACHE: 'children_cache' },
  WindowEvents: { CHILDREN_CHANGED: 'children-changed' },
  getAgeInMonths: () => 6,
  getAgeRemainingDays: () => 10,
}));

describe('ChildDevWidget', () => {
  it('renders without crashing', () => {
    render(<ChildDevWidget />);
    expect(screen.getByText('widgets.childDev')).toBeInTheDocument();
  });

  it('shows description text', () => {
    render(<ChildDevWidget />);
    expect(screen.getByText('widgets.childDevDesc')).toBeInTheDocument();
  });

  it('shows no child data message when no data', () => {
    render(<ChildDevWidget />);
    expect(screen.getByText('widgets.noChildData')).toBeInTheDocument();
  });

  it('has proper heading structure', () => {
    const { container } = render(<ChildDevWidget />);
    const heading = container.querySelector('h4');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('widgets.childDev');
  });
});
