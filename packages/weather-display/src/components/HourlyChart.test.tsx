import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HourlyChart from './HourlyChart';
import type { HourlyForecast } from '@mycircle/shared';

vi.mock('@mycircle/shared', () => {
  const t = (key: string) => {
    const map: Record<string, string> = {
      'weather.temperature': 'Temperature',
      'weather.rainPercent': 'Rain %',
      'weather.now': 'Now',
    };
    return map[key] ?? key;
  };
  return {
    useTranslation: () => ({ t, locale: 'en-US' }),
    useUnits: () => ({ tempUnit: 'C' }),
    convertTemp: (temp: number, _unit?: string) => Math.round(temp),
    tempUnitSymbol: (_unit?: string) => '\u00B0C',
  };
});

const now = Math.floor(Date.now() / 1000);

function makeHourlyData(count: number): HourlyForecast[] {
  return Array.from({ length: count }, (_, i) => ({
    dt: now + i * 3600,
    temp: 18 + i,
    weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
    pop: i === 3 ? 0.5 : 0,
    wind_speed: 3 + i * 0.5,
  }));
}

describe('HourlyChart', () => {
  it('renders SVG chart with valid data', () => {
    const data = makeHourlyData(12);
    const { container } = render(<HourlyChart data={data} />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders temperature legend', () => {
    const data = makeHourlyData(12);
    render(<HourlyChart data={data} />);

    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(screen.getByText('Rain %')).toBeInTheDocument();
  });

  it('shows "Now" label for the first data point', () => {
    const data = makeHourlyData(12);
    render(<HourlyChart data={data} />);

    expect(screen.getByText('Now')).toBeInTheDocument();
  });

  it('returns null when data has fewer than 2 items', () => {
    const data = makeHourlyData(1);
    const { container } = render(<HourlyChart data={data} />);

    expect(container.innerHTML).toBe('');
  });

  it('returns null for empty data array', () => {
    const { container } = render(<HourlyChart data={[]} />);

    expect(container.innerHTML).toBe('');
  });

  it('renders with exactly 2 data points (minimum valid)', () => {
    const data = makeHourlyData(2);
    const { container } = render(<HourlyChart data={data} />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders temperature line path', () => {
    const data = makeHourlyData(8);
    const { container } = render(<HourlyChart data={data} />);

    // Should have at least a path element for the temperature line
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThanOrEqual(1);
  });

  it('renders precipitation bars for hours with rain', () => {
    const data = makeHourlyData(8);
    // data[3] has pop = 0.5
    const { container } = render(<HourlyChart data={data} />);

    // Should have rect elements for precipitation
    const rects = container.querySelectorAll('rect');
    expect(rects.length).toBeGreaterThanOrEqual(1);
  });

  it('renders data point circles', () => {
    const data = makeHourlyData(8);
    const { container } = render(<HourlyChart data={data} />);

    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(8);
  });

  it('limits display to 24 hours from input data', () => {
    const data = makeHourlyData(48);
    const { container } = render(<HourlyChart data={data} />);

    // The component slices to first 24 hours
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(24);
  });

  it('renders temperature labels at regular intervals', () => {
    const data = makeHourlyData(24);
    const { container } = render(<HourlyChart data={data} />);

    // Temperature labels are text elements with degree symbol
    const tempTexts = container.querySelectorAll('text');
    expect(tempTexts.length).toBeGreaterThan(0);
  });
});
