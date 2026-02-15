import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ActivitySuggestions from './ActivitySuggestions';
import { CurrentWeather } from '@mycircle/shared';

vi.mock('@mycircle/shared', async () => {
  const actual = await vi.importActual<typeof import('@mycircle/shared')>('@mycircle/shared');
  return {
    ...actual,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

function makeWeather(overrides: Partial<CurrentWeather> = {}): CurrentWeather {
  return {
    temp: 20,
    feels_like: 19,
    temp_min: 15,
    temp_max: 25,
    pressure: 1013,
    humidity: 50,
    weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
    wind: { speed: 3, deg: 180 },
    clouds: { all: 0 },
    dt: Date.now() / 1000,
    timezone: 0,
    ...overrides,
  };
}

describe('ActivitySuggestions', () => {
  it('shows outdoor activities for clear comfortable weather', () => {
    render(<ActivitySuggestions data={makeWeather({ temp: 22 })} />);
    expect(screen.getByText('activity.hiking')).toBeInTheDocument();
    expect(screen.getByText('activity.cycling')).toBeInTheDocument();
    expect(screen.getByText('activity.picnic')).toBeInTheDocument();
    expect(screen.getByText('activity.jogging')).toBeInTheDocument();
    expect(screen.getByText('activity.gardening')).toBeInTheDocument();
  });

  it('shows swimming and water sports for hot weather', () => {
    render(<ActivitySuggestions data={makeWeather({ temp: 35 })} />);
    expect(screen.getByText('activity.swimming')).toBeInTheDocument();
    expect(screen.getByText('activity.waterSports')).toBeInTheDocument();
    expect(screen.getByText('activity.gym')).toBeInTheDocument();
    expect(screen.getByText('activity.museum')).toBeInTheDocument();
    expect(screen.getByText('activity.shopping')).toBeInTheDocument();
  });

  it('shows brisk walk and indoor activities for cold weather', () => {
    render(<ActivitySuggestions data={makeWeather({ temp: 2 })} />);
    expect(screen.getByText('activity.briskWalk')).toBeInTheDocument();
    expect(screen.getByText('activity.gym')).toBeInTheDocument();
    expect(screen.getByText('activity.yoga')).toBeInTheDocument();
    expect(screen.getByText('activity.reading')).toBeInTheDocument();
  });

  it('shows indoor only for rainy weather', () => {
    const rainy = makeWeather({
      temp: 15,
      weather: [{ id: 500, main: 'Rain', description: 'light rain', icon: '10d' }],
    });
    render(<ActivitySuggestions data={rainy} />);
    expect(screen.getByText('activity.museum')).toBeInTheDocument();
    expect(screen.getByText('activity.movie')).toBeInTheDocument();
    expect(screen.getByText('activity.cooking')).toBeInTheDocument();
    expect(screen.getByText('activity.boardGames')).toBeInTheDocument();
    expect(screen.getByText('activity.reading')).toBeInTheDocument();
    // No outdoor
    expect(screen.queryByText('activity.outdoorTitle')).not.toBeInTheDocument();
  });

  it('shows skiing and snowman for snowy weather', () => {
    const snowy = makeWeather({
      temp: -2,
      weather: [{ id: 601, main: 'Snow', description: 'snow', icon: '13d' }],
    });
    render(<ActivitySuggestions data={snowy} />);
    expect(screen.getByText('activity.skiing')).toBeInTheDocument();
    expect(screen.getByText('activity.snowman')).toBeInTheDocument();
    expect(screen.getByText('activity.hotChocolate')).toBeInTheDocument();
    expect(screen.getByText('activity.boardGames')).toBeInTheDocument();
  });

  it('includes kite flying for windy weather', () => {
    render(<ActivitySuggestions data={makeWeather({ temp: 20, wind: { speed: 12, deg: 180 } })} />);
    expect(screen.getByText('activity.kiteFlying')).toBeInTheDocument();
  });

  it('collapse/expand toggle works', () => {
    render(<ActivitySuggestions data={makeWeather()} />);
    expect(screen.getByText('activity.hiking')).toBeInTheDocument();
    // Collapse
    fireEvent.click(screen.getByLabelText('Collapse'));
    expect(screen.queryByText('activity.hiking')).not.toBeInTheDocument();
    // Expand
    fireEvent.click(screen.getByLabelText('Expand'));
    expect(screen.getByText('activity.hiking')).toBeInTheDocument();
  });

  it('shows correct suggestion count', () => {
    render(<ActivitySuggestions data={makeWeather({ temp: 22 })} />);
    // 5 outdoor (hiking, cycling, picnic, jogging, gardening) + 2 indoor (yoga, reading) = 7
    expect(screen.getByText('7 activity.suggestions')).toBeInTheDocument();
  });
});
