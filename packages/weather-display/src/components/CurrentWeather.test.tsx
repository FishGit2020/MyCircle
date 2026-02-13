import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CurrentWeather from './CurrentWeather';
import { CurrentWeather as CurrentWeatherType } from '@mycircle/shared';

const mockWeatherData: CurrentWeatherType = {
  temp: 22,
  feels_like: 20,
  temp_min: 18,
  temp_max: 25,
  pressure: 1013,
  humidity: 65,
  weather: [
    {
      id: 800,
      main: 'Clear',
      description: 'clear sky',
      icon: '01d'
    }
  ],
  wind: {
    speed: 5.5,
    deg: 180,
    gust: 8
  },
  clouds: {
    all: 10
  },
  dt: 1620000000,
  timezone: 0
};

describe('CurrentWeather', () => {
  it('renders current temperature', () => {
    render(<CurrentWeather data={mockWeatherData} />);

    expect(screen.getByText('22°C')).toBeInTheDocument();
  });

  it('renders feels like temperature', () => {
    render(<CurrentWeather data={mockWeatherData} />);

    expect(screen.getByText('Feels like 20°C')).toBeInTheDocument();
  });

  it('renders weather description', () => {
    render(<CurrentWeather data={mockWeatherData} />);

    expect(screen.getByText('clear sky')).toBeInTheDocument();
  });

  it('renders humidity', () => {
    render(<CurrentWeather data={mockWeatherData} />);

    expect(screen.getByText('Humidity')).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();
  });

  it('renders wind speed and direction', () => {
    render(<CurrentWeather data={mockWeatherData} />);

    expect(screen.getByText('Wind')).toBeInTheDocument();
    expect(screen.getByText(/6 m\/s/)).toBeInTheDocument(); // Math.round(5.5) = 6
  });

  it('renders pressure', () => {
    render(<CurrentWeather data={mockWeatherData} />);

    expect(screen.getByText('Pressure')).toBeInTheDocument();
    expect(screen.getByText('1013 hPa')).toBeInTheDocument();
  });

  it('renders cloudiness', () => {
    render(<CurrentWeather data={mockWeatherData} />);

    expect(screen.getByText('Cloudiness')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();
  });

  it('renders weather icon', () => {
    render(<CurrentWeather data={mockWeatherData} />);

    const icon = screen.getByRole('img');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('alt', 'clear sky');
  });

  it('handles different weather conditions', () => {
    const rainyData = {
      ...mockWeatherData,
      weather: [
        {
          id: 500,
          main: 'Rain',
          description: 'light rain',
          icon: '10d'
        }
      ]
    };

    render(<CurrentWeather data={rainyData} />);

    expect(screen.getByText('light rain')).toBeInTheDocument();
  });

  it('handles extreme temperatures', () => {
    const extremeData = {
      ...mockWeatherData,
      temp: -15,
      feels_like: -20
    };

    render(<CurrentWeather data={extremeData} />);

    expect(screen.getByText('-15°C')).toBeInTheDocument();
    expect(screen.getByText('Feels like -20°C')).toBeInTheDocument();
  });
});
