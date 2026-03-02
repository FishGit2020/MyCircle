import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WeatherAlerts from './WeatherAlerts';
import type { CurrentWeather, ForecastDay } from '@mycircle/shared';

vi.mock('@mycircle/shared', () => {
  const t = (key: string) => {
    const map: Record<string, string> = {
      'alert.extremeHeat': 'Extreme Heat Warning',
      'alert.heatAdvisory': 'Heat Advisory',
      'alert.extremeCold': 'Extreme Cold Warning',
      'alert.coldAdvisory': 'Cold Advisory',
      'alert.highWindWarning': 'High Wind Warning',
      'alert.windAdvisory': 'Wind Advisory',
      'alert.thunderstorm': 'Thunderstorm Warning',
      'alert.uvWarning': 'UV Warning',
      'alert.rainExpected': 'Rain Expected',
      'alert.tempSwing': 'Temperature Swing',
      'alert.lowVisibility': 'Low Visibility',
      'alert.dismiss': 'Dismiss',
      'alert.showDismissed': 'Show dismissed alerts',
      'alert.severity.warning': 'warning',
      'alert.severity.watch': 'watch',
      'alert.severity.info': 'info',
    };
    return map[key] ?? key;
  };
  return {
    useTranslation: () => ({ t, locale: 'en-US' }),
  };
});

function makeCurrent(overrides: Partial<CurrentWeather> = {}): CurrentWeather {
  return {
    temp: 22,
    feels_like: 20,
    temp_min: 18,
    temp_max: 25,
    pressure: 1013,
    humidity: 65,
    weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
    wind: { speed: 5, deg: 180 },
    clouds: { all: 10 },
    dt: 1620000000,
    timezone: 0,
    ...overrides,
  };
}

function makeForecast(overrides: Partial<ForecastDay>[] = []): ForecastDay[] {
  const defaults: ForecastDay[] = [
    {
      dt: 1620000000,
      temp: { min: 15, max: 22, day: 20, night: 16 },
      weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
      humidity: 60,
      wind_speed: 5,
      pop: 0,
    },
    {
      dt: 1620086400,
      temp: { min: 14, max: 20, day: 18, night: 15 },
      weather: [{ id: 500, main: 'Rain', description: 'light rain', icon: '10d' }],
      humidity: 75,
      wind_speed: 8,
      pop: 0.3,
    },
    {
      dt: 1620172800,
      temp: { min: 12, max: 18, day: 16, night: 13 },
      weather: [{ id: 803, main: 'Clouds', description: 'broken clouds', icon: '04d' }],
      humidity: 70,
      wind_speed: 6,
      pop: 0.2,
    },
  ];
  return defaults.map((d, i) => ({ ...d, ...(overrides[i] || {}) }));
}

describe('WeatherAlerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('returns null when no alert conditions are met (mild weather)', () => {
    // Mild weather: 22C, light wind, clear, no rain
    const current = makeCurrent();
    const forecast = makeForecast();

    const { container } = render(<WeatherAlerts current={current} forecast={forecast} />);

    expect(container.innerHTML).toBe('');
  });

  it('renders extreme heat warning when temp >= 38', () => {
    const current = makeCurrent({ temp: 40 });
    const forecast = makeForecast();

    render(<WeatherAlerts current={current} forecast={forecast} />);

    expect(screen.getByText('Extreme Heat Warning')).toBeInTheDocument();
    expect(screen.getByText(/Stay hydrated/)).toBeInTheDocument();
  });

  it('renders heat advisory when temp >= 33 and < 38', () => {
    const current = makeCurrent({ temp: 35 });
    const forecast = makeForecast();

    render(<WeatherAlerts current={current} forecast={forecast} />);

    expect(screen.getByText('Heat Advisory')).toBeInTheDocument();
  });

  it('renders extreme cold warning when temp <= -20', () => {
    const current = makeCurrent({ temp: -25 });
    const forecast = makeForecast();

    render(<WeatherAlerts current={current} forecast={forecast} />);

    expect(screen.getByText('Extreme Cold Warning')).toBeInTheDocument();
    expect(screen.getByText(/frostbite/i)).toBeInTheDocument();
  });

  it('renders cold advisory when temp <= -10 and > -20', () => {
    const current = makeCurrent({ temp: -15 });
    const forecast = makeForecast();

    render(<WeatherAlerts current={current} forecast={forecast} />);

    expect(screen.getByText('Cold Advisory')).toBeInTheDocument();
  });

  it('renders high wind warning when wind speed >= 20', () => {
    const current = makeCurrent({ wind: { speed: 25, deg: 180, gust: 35 } });
    const forecast = makeForecast();

    render(<WeatherAlerts current={current} forecast={forecast} />);

    expect(screen.getByText('High Wind Warning')).toBeInTheDocument();
    expect(screen.getByText(/gusts up to 35 m\/s/)).toBeInTheDocument();
  });

  it('renders wind advisory when wind speed >= 13 and < 20', () => {
    const current = makeCurrent({ wind: { speed: 15, deg: 180 } });
    const forecast = makeForecast();

    render(<WeatherAlerts current={current} forecast={forecast} />);

    expect(screen.getByText('Wind Advisory')).toBeInTheDocument();
  });

  it('renders thunderstorm warning for weather ID 200-299', () => {
    const current = makeCurrent({
      weather: [{ id: 211, main: 'Thunderstorm', description: 'thunderstorm', icon: '11d' }],
    });
    const forecast = makeForecast();

    render(<WeatherAlerts current={current} forecast={forecast} />);

    expect(screen.getByText('Thunderstorm Warning')).toBeInTheDocument();
  });

  it('renders UV warning for clear sky and temp >= 28', () => {
    const current = makeCurrent({
      temp: 30,
      weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
    });
    const forecast = makeForecast();

    render(<WeatherAlerts current={current} forecast={forecast} />);

    expect(screen.getByText('UV Warning')).toBeInTheDocument();
  });

  it('renders rain expected alert when forecast has high rain probability', () => {
    const current = makeCurrent();
    const forecast = makeForecast([
      { pop: 0.8 },
      { pop: 0.75 },
      {},
    ]);

    render(<WeatherAlerts current={current} forecast={forecast} />);

    expect(screen.getByText('Rain Expected')).toBeInTheDocument();
  });

  it('renders temperature swing alert when forecast shows >= 10C swing', () => {
    const current = makeCurrent();
    const forecast = makeForecast([
      { temp: { min: 15, max: 22, day: 20, night: 16 } },
      { temp: { min: 28, max: 35, day: 32, night: 28 } },
    ]);

    render(<WeatherAlerts current={current} forecast={forecast} />);

    expect(screen.getByText('Temperature Swing')).toBeInTheDocument();
  });

  it('renders low visibility alert for fog conditions', () => {
    const current = makeCurrent({
      weather: [{ id: 741, main: 'Fog', description: 'Heavy fog', icon: '50d' }],
    });
    const forecast = makeForecast();

    render(<WeatherAlerts current={current} forecast={forecast} />);

    expect(screen.getByText('Low Visibility')).toBeInTheDocument();
  });

  it('dismisses an alert when dismiss button is clicked', () => {
    const current = makeCurrent({ temp: 40 });
    const forecast = makeForecast();

    render(<WeatherAlerts current={current} forecast={forecast} />);

    expect(screen.getByText('Extreme Heat Warning')).toBeInTheDocument();

    // Find dismiss buttons (there may be multiple alerts)
    const dismissButtons = screen.getAllByLabelText('Dismiss');
    // Click the first dismiss button (for the extreme heat alert)
    fireEvent.click(dismissButtons[0]);

    expect(screen.queryByText('Extreme Heat Warning')).not.toBeInTheDocument();
  });

  it('shows restore button when all alerts are dismissed', () => {
    // Only one alert: extreme heat
    const current = makeCurrent({ temp: 40 });
    const forecast = makeForecast();

    render(<WeatherAlerts current={current} forecast={forecast} />);

    // Dismiss all visible alerts
    const dismissButtons = screen.getAllByLabelText('Dismiss');
    dismissButtons.forEach(btn => fireEvent.click(btn));

    expect(screen.getByText(/Show dismissed alerts/)).toBeInTheDocument();
  });

  it('restores dismissed alerts when restore button is clicked', () => {
    const current = makeCurrent({ temp: 40 });
    const forecast = makeForecast();

    render(<WeatherAlerts current={current} forecast={forecast} />);

    // Dismiss all
    const dismissButtons = screen.getAllByLabelText('Dismiss');
    dismissButtons.forEach(btn => fireEvent.click(btn));

    // Click restore
    fireEvent.click(screen.getByText(/Show dismissed alerts/));

    expect(screen.getByText('Extreme Heat Warning')).toBeInTheDocument();
  });

  it('renders severity badges for visible alerts', () => {
    // Create multiple types of alerts
    const current = makeCurrent({
      temp: 40, // extreme heat = warning
      wind: { speed: 15, deg: 180 }, // wind advisory = watch
    });
    const forecast = makeForecast([
      { pop: 0.8 }, // rain expected = info
    ]);

    render(<WeatherAlerts current={current} forecast={forecast} />);

    expect(screen.getByText(/1.*warning/)).toBeInTheDocument();
  });
});
