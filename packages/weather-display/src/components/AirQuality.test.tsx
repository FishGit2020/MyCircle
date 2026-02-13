import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AirQuality from './AirQuality';
import type { AirQuality as AirQualityType } from '@mycircle/shared';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const baseData: AirQualityType = {
  aqi: 1,
  co: 201.9,
  no: 0.0,
  no2: 0.77,
  o3: 68.66,
  so2: 0.64,
  pm2_5: 0.5,
  pm10: 0.54,
};

function makeData(overrides: Partial<AirQualityType> = {}): AirQualityType {
  return { ...baseData, ...overrides };
}

describe('AirQuality', () => {
  it('renders the section heading', () => {
    render(<AirQuality data={makeData()} />);
    expect(screen.getByText('weather.airQuality')).toBeInTheDocument();
  });

  it('displays AQI value in the badge', () => {
    render(<AirQuality data={makeData({ aqi: 3 })} />);
    expect(screen.getByRole('img', { name: 'AQI 3' })).toHaveTextContent('3');
  });

  it('shows Good label for AQI 1', () => {
    render(<AirQuality data={makeData({ aqi: 1 })} />);
    expect(screen.getByText('weather.aqiGood')).toBeInTheDocument();
    expect(screen.getByText('weather.aqiGoodDesc')).toBeInTheDocument();
  });

  it('shows Fair label for AQI 2', () => {
    render(<AirQuality data={makeData({ aqi: 2 })} />);
    expect(screen.getByText('weather.aqiFair')).toBeInTheDocument();
    expect(screen.getByText('weather.aqiFairDesc')).toBeInTheDocument();
  });

  it('shows Moderate label for AQI 3', () => {
    render(<AirQuality data={makeData({ aqi: 3 })} />);
    expect(screen.getByText('weather.aqiModerate')).toBeInTheDocument();
  });

  it('shows Poor label for AQI 4', () => {
    render(<AirQuality data={makeData({ aqi: 4 })} />);
    expect(screen.getByText('weather.aqiPoor')).toBeInTheDocument();
  });

  it('shows Very Poor label for AQI 5', () => {
    render(<AirQuality data={makeData({ aqi: 5 })} />);
    expect(screen.getByText('weather.aqiVeryPoor')).toBeInTheDocument();
  });

  it('clamps AQI below 1 to Good', () => {
    render(<AirQuality data={makeData({ aqi: 0 })} />);
    expect(screen.getByText('weather.aqiGood')).toBeInTheDocument();
  });

  it('clamps AQI above 5 to Very Poor', () => {
    render(<AirQuality data={makeData({ aqi: 9 })} />);
    expect(screen.getByText('weather.aqiVeryPoor')).toBeInTheDocument();
  });

  it('does not show pollutant details initially', () => {
    render(<AirQuality data={makeData()} />);
    expect(screen.queryByText('PM2.5')).not.toBeInTheDocument();
  });

  it('toggles pollutant details on button click', () => {
    render(<AirQuality data={makeData()} />);
    const btn = screen.getByRole('button', { name: /weather\.pollutants/i });
    expect(btn).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('PM2.5')).toBeInTheDocument();
    expect(screen.getByText('PM10')).toBeInTheDocument();

    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('PM2.5')).not.toBeInTheDocument();
  });

  it('renders all six pollutants with correct values', () => {
    const data = makeData({
      pm2_5: 12.3,
      pm10: 45.6,
      o3: 78.9,
      no2: 10.1,
      so2: 5.5,
      co: 300.0,
    });
    render(<AirQuality data={data} />);
    fireEvent.click(screen.getByRole('button', { name: /weather\.pollutants/i }));

    expect(screen.getByText('12.3')).toBeInTheDocument();
    expect(screen.getByText('45.6')).toBeInTheDocument();
    expect(screen.getByText('78.9')).toBeInTheDocument();
    expect(screen.getByText('10.1')).toBeInTheDocument();
    expect(screen.getByText('5.5')).toBeInTheDocument();
    expect(screen.getByText('300.0')).toBeInTheDocument();
  });

  it('has correct ARIA structure', () => {
    render(<AirQuality data={makeData()} />);
    const section = screen.getByRole('region', { name: /weather\.airQuality/i });
    expect(section).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'AQI 1' })).toBeInTheDocument();
  });

  it('renders the AQI scale bar with 5 segments', () => {
    const { container } = render(<AirQuality data={makeData()} />);
    const scaleBar = container.querySelector('[aria-hidden="true"]');
    expect(scaleBar).toBeInTheDocument();
    const segments = scaleBar!.querySelectorAll('.flex-1');
    expect(segments).toHaveLength(5);
  });
});
