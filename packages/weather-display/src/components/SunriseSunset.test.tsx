import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SunriseSunset from './SunriseSunset';
import type { CurrentWeather } from '@mycircle/shared';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'weather.sunVisibility': 'Sun & Visibility',
        'weather.sunrise': 'Sunrise',
        'weather.sunset': 'Sunset',
        'weather.daylight': 'Daylight',
        'weather.visibility': 'Visibility',
      };
      return map[key] ?? key;
    },
    locale: 'en-US',
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

const baseCurrent: CurrentWeather = {
  temp: 22,
  feels_like: 20,
  temp_min: 18,
  temp_max: 25,
  pressure: 1013,
  humidity: 55,
  weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
  wind: { speed: 5, deg: 180 },
  clouds: { all: 10 },
  dt: 1620050000, // mid-day timestamp
  timezone: 0,
  sunrise: 1620018000, // 6:00 AM UTC
  sunset: 1620068400, // 8:00 PM UTC (14h daylight)
  visibility: 10000,
};

describe('SunriseSunset', () => {
  it('renders the section title', () => {
    render(<SunriseSunset data={baseCurrent} />);
    expect(screen.getByText('Sun & Visibility')).toBeInTheDocument();
  });

  it('shows sunrise and sunset labels', () => {
    render(<SunriseSunset data={baseCurrent} />);
    expect(screen.getByText('Sunrise')).toBeInTheDocument();
    expect(screen.getByText('Sunset')).toBeInTheDocument();
  });

  it('shows daylight duration', () => {
    render(<SunriseSunset data={baseCurrent} />);
    expect(screen.getByText('Daylight')).toBeInTheDocument();
    // 14 hours of daylight
    expect(screen.getByText('14h 0m')).toBeInTheDocument();
  });

  it('shows visibility in km', () => {
    render(<SunriseSunset data={baseCurrent} />);
    expect(screen.getByText('Visibility')).toBeInTheDocument();
    expect(screen.getByText('10.0 km')).toBeInTheDocument();
  });

  it('renders nothing when sunrise/sunset are missing', () => {
    const noSun = { ...baseCurrent, sunrise: 0, sunset: 0 };
    const { container } = render(<SunriseSunset data={noSun} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders SVG arc for sun position', () => {
    const { container } = render(<SunriseSunset data={baseCurrent} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('shows sun circle when it is daytime', () => {
    const { container } = render(<SunriseSunset data={baseCurrent} />);
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThan(0);
  });

  it('hides sun circle when it is nighttime', () => {
    const nightData = { ...baseCurrent, dt: baseCurrent.sunrise - 3600 }; // before sunrise
    const { container } = render(<SunriseSunset data={nightData} />);
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(0);
  });

  it('hides visibility section when visibility is null', () => {
    const noVis = { ...baseCurrent, visibility: undefined as any };
    render(<SunriseSunset data={noVis} />);
    expect(screen.queryByText('Visibility')).not.toBeInTheDocument();
  });
});
