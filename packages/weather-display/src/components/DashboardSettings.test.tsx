import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DashboardSettings, { loadWidgetVisibility } from './DashboardSettings';
import type { WidgetVisibility } from './DashboardSettings';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
  StorageKeys: {
    DASHBOARD_WIDGETS: 'dashboard-widgets',
  },
}));

const allTrue: WidgetVisibility = {
  currentWeather: true,
  forecast: true,
  hourlyForecast: true,
  hourlyChart: true,
  weatherAlerts: true,
  whatToWear: true,
  sunriseSunset: true,
  weatherMap: true,
  historicalWeather: true,
  airQuality: true,
  activitySuggestions: true,
};

describe('DashboardSettings', () => {
  const onChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders settings button', () => {
    render(<DashboardSettings visibility={allTrue} onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'dashboard.settings' })).toBeInTheDocument();
  });

  it('shows dropdown when clicked', () => {
    render(<DashboardSettings visibility={allTrue} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'dashboard.settings' }));
    expect(screen.getByText('dashboard.showWidgets')).toBeInTheDocument();
  });

  it('renders all widget checkboxes', () => {
    render(<DashboardSettings visibility={allTrue} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'dashboard.settings' }));
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(11);
  });

  it('toggles a widget when checkbox is clicked', () => {
    render(<DashboardSettings visibility={allTrue} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'dashboard.settings' }));
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]); // Toggle currentWeather
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ currentWeather: false }));
  });

  it('Show All sets all widgets to true', () => {
    const allFalse = Object.fromEntries(Object.keys(allTrue).map(k => [k, false])) as WidgetVisibility;
    render(<DashboardSettings visibility={allFalse} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'dashboard.settings' }));
    fireEvent.click(screen.getByText('dashboard.showAll'));
    expect(onChange).toHaveBeenCalledWith(allTrue);
  });

  it('Hide All sets all widgets to false', () => {
    render(<DashboardSettings visibility={allTrue} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'dashboard.settings' }));
    fireEvent.click(screen.getByText('dashboard.hideAll'));
    const expected = Object.fromEntries(Object.keys(allTrue).map(k => [k, false]));
    expect(onChange).toHaveBeenCalledWith(expected);
  });

  it('Reset restores default visibility (all true)', () => {
    const partial = { ...allTrue, weatherMap: false, airQuality: false };
    render(<DashboardSettings visibility={partial} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'dashboard.settings' }));
    fireEvent.click(screen.getByText('dashboard.resetDefaults'));
    expect(onChange).toHaveBeenCalledWith(allTrue);
  });
});

describe('loadWidgetVisibility', () => {
  beforeEach(() => localStorage.clear());

  it('returns defaults when nothing is stored', () => {
    const result = loadWidgetVisibility();
    expect(result.currentWeather).toBe(true);
    expect(result.weatherMap).toBe(true);
  });

  it('merges stored values with defaults', () => {
    localStorage.setItem('dashboard-widgets', JSON.stringify({ weatherMap: false }));
    const result = loadWidgetVisibility();
    expect(result.weatherMap).toBe(false);
    expect(result.currentWeather).toBe(true);
  });
});
