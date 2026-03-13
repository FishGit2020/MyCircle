import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DailyLogWidget from './DailyLogWidget';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  StorageKeys: { DAILY_LOG_CACHE: 'daily_log_cache' },
  WindowEvents: { DAILY_LOG_CHANGED: 'daily-log-changed' },
}));

describe('DailyLogWidget', () => {
  it('renders without crashing', () => {
    render(<DailyLogWidget />);
    expect(screen.getByText('widgets.dailyLog')).toBeInTheDocument();
  });

  it('shows description text', () => {
    render(<DailyLogWidget />);
    expect(screen.getByText('widgets.dailyLogDesc')).toBeInTheDocument();
  });

  it('shows no entries message when no data', () => {
    render(<DailyLogWidget />);
    expect(screen.getByText('widgets.noDailyLogEntries')).toBeInTheDocument();
  });

  it('has proper heading structure', () => {
    const { container } = render(<DailyLogWidget />);
    const heading = container.querySelector('h4');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('widgets.dailyLog');
  });
});
