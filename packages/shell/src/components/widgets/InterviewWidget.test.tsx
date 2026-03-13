import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import InterviewWidget from './InterviewWidget';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  WindowEvents: { AUTH_STATE_CHANGED: 'auth-state-changed' },
}));

describe('InterviewWidget', () => {
  it('renders without crashing', () => {
    render(<InterviewWidget />);
    expect(screen.getByText('widgets.interview')).toBeInTheDocument();
  });

  it('shows description text', () => {
    render(<InterviewWidget />);
    expect(screen.getByText('widgets.interviewDesc')).toBeInTheDocument();
  });

  it('shows start first interview link when no sessions', () => {
    render(<InterviewWidget />);
    expect(screen.getByText('aiInterviewer.startFirstInterview')).toBeInTheDocument();
  });

  it('has proper heading structure', () => {
    const { container } = render(<InterviewWidget />);
    const heading = container.querySelector('h4');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('widgets.interview');
  });
});
