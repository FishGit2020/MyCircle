import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ImmigrationWidget from './ImmigrationWidget';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('ImmigrationWidget', () => {
  it('renders without crashing', () => {
    render(<ImmigrationWidget />);
    expect(screen.getByText('widgets.immigration')).toBeInTheDocument();
  });

  it('shows description text', () => {
    render(<ImmigrationWidget />);
    expect(screen.getByText('widgets.immigrationDesc')).toBeInTheDocument();
  });

  it('has proper heading structure', () => {
    const { container } = render(<ImmigrationWidget />);
    const heading = container.querySelector('h4');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('widgets.immigration');
  });
});
