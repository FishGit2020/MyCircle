import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PollSystemWidget from './PollSystemWidget';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  WindowEvents: {
    AUTH_STATE_CHANGED: 'auth-state-changed',
    POLL_SYSTEM_CHANGED: 'poll-system-changed',
  },
}));

describe('PollSystemWidget', () => {
  it('renders without crashing', () => {
    render(<PollSystemWidget />);
    expect(screen.getByText('widgets.pollSystem')).toBeInTheDocument();
  });

  it('shows description text', () => {
    render(<PollSystemWidget />);
    expect(screen.getByText('widgets.pollSystemDesc')).toBeInTheDocument();
  });

  it('shows no active polls message when no data', () => {
    render(<PollSystemWidget />);
    expect(screen.getByText('widgets.noActivePolls')).toBeInTheDocument();
  });

  it('has proper heading structure', () => {
    const { container } = render(<PollSystemWidget />);
    const heading = container.querySelector('h4');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('widgets.pollSystem');
  });
});
