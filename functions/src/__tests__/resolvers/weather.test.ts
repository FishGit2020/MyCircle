import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import {
  getCurrentWeather,
  getForecast,
  getHourlyForecast,
  searchCities,
  reverseGeocode,
  getCacheKey,
  weatherCache,
  createWeatherQueryResolvers,
} from '../../resolvers/weather.js';

vi.mock('axios', () => {
  const mockCreate = vi.fn(() => ({
    get: vi.fn(),
  }));
  return {
    default: {
      get: vi.fn(),
      create: mockCreate,
    },
  };
});

describe('weather resolvers', () => {
  let mockClient: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    weatherCache.flushAll();
    // Each call to axios.create returns a fresh mock client
    mockClient = { get: vi.fn() };
    vi.mocked(axios.create).mockReturnValue(mockClient as any);
  });

  // ─── getCacheKey ──────────────────────────────────────────────

  it('generates deterministic cache keys with 2-decimal precision', () => {
    expect(getCacheKey(37.7749, -122.4194, 'current')).toBe('current:37.77:-122.42');
    expect(getCacheKey(37.7749, -122.4194, 'forecast')).toBe('forecast:37.77:-122.42');
  });

  // ─── getCurrentWeather ────────────────────────────────────────

  it('getCurrentWeather transforms API response to expected shape', async () => {
    mockClient.get.mockResolvedValueOnce({
      data: {
        main: { temp: 22.4, feels_like: 20.1, temp_min: 18.9, temp_max: 25.6, pressure: 1013, humidity: 60 },
        weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
        wind: { speed: 3.5, deg: 180 },
        clouds: { all: 0 },
        dt: 1700000000,
        timezone: -28800,
        sys: { sunrise: 1699990000, sunset: 1700030000 },
        visibility: 10000,
      },
    });

    const result = await getCurrentWeather('test-key', 37.77, -122.42);

    expect(result.temp).toBe(22); // rounded
    expect(result.feels_like).toBe(20);
    expect(result.humidity).toBe(60);
    expect(result.weather).toHaveLength(1);
    expect(result.sunrise).toBe(1699990000);
    expect(result.visibility).toBe(10000);
  });

  // ─── getForecast ──────────────────────────────────────────────

  it('getForecast groups 3-hour intervals into daily forecasts', async () => {
    // Simulate two days worth of data (3-hour intervals)
    const baseDt = 1700000000; // some fixed timestamp
    const items = Array.from({ length: 16 }, (_, i) => ({
      dt: baseDt + i * 3 * 3600,
      main: { temp: 20 + i, temp_min: 18 + i, temp_max: 22 + i, humidity: 50 + i },
      weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
      wind: { speed: 3.0 },
      pop: 0.1 * i,
    }));

    mockClient.get.mockResolvedValueOnce({ data: { list: items } });

    const result = await getForecast('test-key', 37.77, -122.42);

    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.length).toBeLessThanOrEqual(7);
    expect(result[0]).toHaveProperty('temp');
    expect(result[0].temp).toHaveProperty('min');
    expect(result[0].temp).toHaveProperty('max');
    expect(result[0]).toHaveProperty('humidity');
    expect(result[0]).toHaveProperty('pop');
  });

  // ─── getHourlyForecast ────────────────────────────────────────

  it('getHourlyForecast returns mapped hourly items', async () => {
    const items = Array.from({ length: 8 }, (_, i) => ({
      dt: 1700000000 + i * 3600,
      main: { temp: 20 + i },
      weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
      pop: 0.0,
      wind: { speed: 2.5 },
    }));
    mockClient.get.mockResolvedValueOnce({ data: { list: items } });

    const result = await getHourlyForecast('test-key', 37.77, -122.42);

    expect(result).toHaveLength(8);
    expect(result[0].temp).toBe(20);
    expect(result[0]).toHaveProperty('wind_speed');
  });

  // ─── searchCities ─────────────────────────────────────────────

  it('searchCities maps geo API response to City[]', async () => {
    mockClient.get.mockResolvedValueOnce({
      data: [
        { name: 'San Francisco', country: 'US', state: 'California', lat: 37.77, lon: -122.42 },
      ],
    });

    const result = await searchCities('test-key', 'San Francisco');

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: '37.77,-122.42',
      name: 'San Francisco',
      country: 'US',
      state: 'California',
      lat: 37.77,
      lon: -122.42,
    });
  });

  // ─── reverseGeocode ───────────────────────────────────────────

  it('reverseGeocode returns null when no results', async () => {
    mockClient.get.mockResolvedValueOnce({ data: [] });
    const result = await reverseGeocode('test-key', 0, 0);
    expect(result).toBeNull();
  });

  // ─── createWeatherQueryResolvers caching ──────────────────────

  it('resolver returns cached data on second call without hitting API', async () => {
    const resolvers = createWeatherQueryResolvers(() => 'test-key');

    // Pre-populate cache
    const mockCurrent = { temp: 20 } as any;
    const mockForecast = [{ dt: 1 }] as any;
    const mockHourly = [{ dt: 1 }] as any;
    weatherCache.set(getCacheKey(37.77, -122.42, 'current'), mockCurrent);
    weatherCache.set(getCacheKey(37.77, -122.42, 'forecast'), mockForecast);
    weatherCache.set(getCacheKey(37.77, -122.42, 'hourly'), mockHourly);

    const result = await resolvers.weather(null, { lat: 37.77, lon: -122.42 });

    expect(result.current).toStrictEqual(mockCurrent);
    expect(result.forecast).toStrictEqual(mockForecast);
    // axios.create should not have been called since we hit cache
    expect(axios.create).not.toHaveBeenCalled();
  });
});
