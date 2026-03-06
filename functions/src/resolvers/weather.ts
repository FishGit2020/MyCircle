import axios from 'axios';
import NodeCache from 'node-cache';

// Configurable base URLs — defaults to production, overridden in emulator via .env.emulator
const OPENWEATHER_BASE = process.env.OPENWEATHER_BASE_URL || 'https://api.openweathermap.org';
const OPEN_METEO_BASE = process.env.OPEN_METEO_BASE_URL || 'https://archive-api.open-meteo.com';

// Simple in-memory cache
export const weatherCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

export function getCacheKey(lat: number, lon: number, type: string): string {
  return `${type}:${lat.toFixed(2)}:${lon.toFixed(2)}`;
}

// Types
export interface WeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface CurrentWeather {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  pressure: number;
  humidity: number;
  weather: WeatherCondition[];
  wind: { speed: number; deg: number; gust?: number };
  clouds: { all: number };
  dt: number;
  timezone: number;
  sunrise?: number;
  sunset?: number;
  visibility?: number;
}

export interface ForecastDay {
  dt: number;
  temp: { min: number; max: number; day: number; night: number };
  weather: WeatherCondition[];
  humidity: number;
  wind_speed: number;
  pop: number;
}

export interface HourlyForecast {
  dt: number;
  temp: number;
  weather: WeatherCondition[];
  pop: number;
  wind_speed: number;
}

export interface City {
  id: string;
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
}

// Weather API functions
function createWeatherClient(apiKey: string) {
  return axios.create({
    baseURL: `${OPENWEATHER_BASE}/data/2.5`,
    timeout: 5000,
    params: {
      appid: apiKey,
      units: 'metric'
    }
  });
}

function createGeoClient(apiKey: string) {
  return axios.create({
    baseURL: `${OPENWEATHER_BASE}/geo/1.0`,
    timeout: 5000,
    params: {
      appid: apiKey
    }
  });
}

export async function getCurrentWeather(apiKey: string, lat: number, lon: number): Promise<CurrentWeather> {
  const client = createWeatherClient(apiKey);
  const response = await client.get('/weather', { params: { lat, lon } });
  const data = response.data;

  return {
    temp: Math.round(data.main.temp),
    feels_like: Math.round(data.main.feels_like),
    temp_min: Math.round(data.main.temp_min),
    temp_max: Math.round(data.main.temp_max),
    pressure: data.main.pressure,
    humidity: data.main.humidity,
    weather: data.weather,
    wind: data.wind,
    clouds: data.clouds,
    dt: data.dt,
    timezone: data.timezone,
    sunrise: data.sys?.sunrise,
    sunset: data.sys?.sunset,
    visibility: data.visibility,
  };
}

export async function getForecast(apiKey: string, lat: number, lon: number): Promise<ForecastDay[]> {
  const client = createWeatherClient(apiKey);
  const response = await client.get('/forecast', { params: { lat, lon, cnt: 40 } });
  const data = response.data;

  const dailyData = new Map<string, any[]>();
  data.list.forEach((item: any) => {
    const date = new Date(item.dt * 1000).toDateString();
    if (!dailyData.has(date)) {
      dailyData.set(date, []);
    }
    dailyData.get(date)!.push(item);
  });

  return Array.from(dailyData.values()).slice(0, 7).map(dayData => ({
    dt: dayData[0].dt,
    temp: {
      min: Math.round(Math.min(...dayData.map(d => d.main.temp_min))),
      max: Math.round(Math.max(...dayData.map(d => d.main.temp_max))),
      day: Math.round(dayData.find(d => {
        const hour = new Date(d.dt * 1000).getHours();
        return hour >= 12 && hour <= 15;
      })?.main.temp || dayData[0].main.temp),
      night: Math.round(dayData.find(d => {
        const hour = new Date(d.dt * 1000).getHours();
        return hour >= 0 && hour <= 3;
      })?.main.temp || dayData[dayData.length - 1].main.temp)
    },
    weather: dayData[Math.floor(dayData.length / 2)].weather,
    humidity: Math.round(dayData.reduce((sum, d) => sum + d.main.humidity, 0) / dayData.length),
    wind_speed: dayData[0].wind.speed,
    pop: Math.max(...dayData.map(d => d.pop))
  }));
}

export async function getHourlyForecast(apiKey: string, lat: number, lon: number): Promise<HourlyForecast[]> {
  // Use free /data/2.5/forecast (3-hour intervals) instead of paid /data/3.0/onecall
  const client = createWeatherClient(apiKey);
  const response = await client.get('/forecast', { params: { lat, lon, cnt: 8 } });

  return (response.data.list as any[]).map((item: any) => ({
    dt: item.dt,
    temp: Math.round(item.main.temp),
    weather: item.weather,
    pop: item.pop ?? 0,
    wind_speed: item.wind?.speed ?? 0,
  }));
}

// ─── Air Quality via OpenWeatherMap (free tier) ────────────────

async function getAirQuality(apiKey: string, lat: number, lon: number) {
  const cacheKey = `aqi:${lat.toFixed(2)}:${lon.toFixed(2)}`;
  const cached = weatherCache.get<any>(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${OPENWEATHER_BASE}/data/2.5/air_pollution`, {
    params: { lat, lon, appid: apiKey },
    timeout: 5000,
  });

  const item = response.data.list?.[0];
  if (!item) return null;

  const result = {
    aqi: item.main.aqi,
    co: item.components.co,
    no: item.components.no,
    no2: item.components.no2,
    o3: item.components.o3,
    so2: item.components.so2,
    pm2_5: item.components.pm2_5,
    pm10: item.components.pm10,
  };

  weatherCache.set(cacheKey, result, 600);
  return result;
}

// ─── Historical Weather via Open-Meteo (free, no API key) ──────

function wmoCodeToDescription(code: number): { description: string; icon: string } {
  if (code === 0) return { description: 'Clear sky', icon: '01d' };
  if (code <= 3) return { description: code === 1 ? 'Mainly clear' : code === 2 ? 'Partly cloudy' : 'Overcast', icon: code <= 1 ? '02d' : '04d' };
  if (code <= 48) return { description: 'Fog', icon: '50d' };
  if (code <= 55) return { description: 'Drizzle', icon: '09d' };
  if (code <= 65) return { description: 'Rain', icon: '10d' };
  if (code <= 75) return { description: 'Snow', icon: '13d' };
  if (code <= 82) return { description: 'Rain showers', icon: '09d' };
  if (code === 95) return { description: 'Thunderstorm', icon: '11d' };
  if (code <= 99) return { description: 'Thunderstorm with hail', icon: '11d' };
  return { description: 'Unknown', icon: '03d' };
}

async function getHistoricalWeather(lat: number, lon: number, date: string) {
  const cacheKey = `historical:${lat.toFixed(2)}:${lon.toFixed(2)}:${date}`;
  const cached = weatherCache.get<any>(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${OPEN_METEO_BASE}/v1/archive`, {
    params: {
      latitude: lat,
      longitude: lon,
      start_date: date,
      end_date: date,
      daily: 'temperature_2m_max,temperature_2m_min,weathercode,windspeed_10m_max,precipitation_sum',
      timezone: 'auto',
    },
    timeout: 10000,
  });

  const daily = response.data.daily;
  if (!daily || !daily.time || daily.time.length === 0) return null;

  const weatherCode = daily.weathercode?.[0] ?? 0;
  const { description, icon } = wmoCodeToDescription(weatherCode);
  const result = {
    date: daily.time[0],
    temp_max: Math.round(daily.temperature_2m_max[0]),
    temp_min: Math.round(daily.temperature_2m_min[0]),
    precipitation: daily.precipitation_sum?.[0] ?? 0,
    wind_speed_max: daily.windspeed_10m_max?.[0] ?? 0,
    weather_description: description,
    weather_icon: icon,
  };

  weatherCache.set(cacheKey, result, 86400); // Cache for 24h — historical data doesn't change
  return result;
}

export async function searchCities(apiKey: string, query: string, limit: number = 5): Promise<City[]> {
  const client = createGeoClient(apiKey);
  const response = await client.get('/direct', { params: { q: query, limit } });

  return response.data.map((item: any) => ({
    id: `${item.lat},${item.lon}`,
    name: item.name,
    country: item.country,
    state: item.state,
    lat: item.lat,
    lon: item.lon
  }));
}

export async function reverseGeocode(apiKey: string, lat: number, lon: number): Promise<City | null> {
  const client = createGeoClient(apiKey);
  const response = await client.get('/reverse', { params: { lat, lon, limit: 1 } });

  if (response.data && response.data.length > 0) {
    const item = response.data[0];
    return {
      id: `${item.lat},${item.lon}`,
      name: item.name,
      country: item.country,
      state: item.state,
      lat: item.lat,
      lon: item.lon
    };
  }
  return null;
}

// ─── Weather Query Resolvers ─────────────────────────────────

export function createWeatherQueryResolvers(getApiKey: () => string) {
  return {
    weather: async (_: any, { lat, lon }: { lat: number; lon: number }) => {
      const apiKey = getApiKey();

      // Try cache first
      const cachedCurrent = weatherCache.get<CurrentWeather>(getCacheKey(lat, lon, 'current'));
      const cachedForecast = weatherCache.get<ForecastDay[]>(getCacheKey(lat, lon, 'forecast'));
      const cachedHourly = weatherCache.get<HourlyForecast[]>(getCacheKey(lat, lon, 'hourly'));

      if (cachedCurrent && cachedForecast && cachedHourly) {
        return {
          current: cachedCurrent,
          forecast: cachedForecast,
          hourly: cachedHourly
        };
      }

      // Fetch all data in parallel
      const [current, forecast, hourly] = await Promise.all([
        getCurrentWeather(apiKey, lat, lon),
        getForecast(apiKey, lat, lon),
        getHourlyForecast(apiKey, lat, lon)
      ]);

      // Cache the results
      weatherCache.set(getCacheKey(lat, lon, 'current'), current);
      weatherCache.set(getCacheKey(lat, lon, 'forecast'), forecast);
      weatherCache.set(getCacheKey(lat, lon, 'hourly'), hourly);

      return { current, forecast, hourly };
    },

    currentWeather: async (_: any, { lat, lon }: { lat: number; lon: number }) => {
      const apiKey = getApiKey();
      const cacheKey = getCacheKey(lat, lon, 'current');
      const cached = weatherCache.get<CurrentWeather>(cacheKey);

      if (cached) return cached;

      const data = await getCurrentWeather(apiKey, lat, lon);
      weatherCache.set(cacheKey, data);
      return data;
    },

    forecast: async (_: any, { lat, lon }: { lat: number; lon: number }) => {
      const apiKey = getApiKey();
      const cacheKey = getCacheKey(lat, lon, 'forecast');
      const cached = weatherCache.get<ForecastDay[]>(cacheKey);

      if (cached) return cached;

      const data = await getForecast(apiKey, lat, lon);
      weatherCache.set(cacheKey, data);
      return data;
    },

    hourlyForecast: async (_: any, { lat, lon }: { lat: number; lon: number }) => {
      const apiKey = getApiKey();
      const cacheKey = getCacheKey(lat, lon, 'hourly');
      const cached = weatherCache.get<HourlyForecast[]>(cacheKey);

      if (cached) return cached;

      const data = await getHourlyForecast(apiKey, lat, lon);
      weatherCache.set(cacheKey, data);
      return data;
    },

    airQuality: async (_: any, { lat, lon }: { lat: number; lon: number }) => {
      const apiKey = getApiKey();
      return await getAirQuality(apiKey, lat, lon);
    },

    historicalWeather: async (_: any, { lat, lon, date }: { lat: number; lon: number; date: string }) => {
      return await getHistoricalWeather(lat, lon, date);
    },

    searchCities: async (_: any, { query, limit = 5 }: { query: string; limit?: number }) => {
      const apiKey = getApiKey();
      return await searchCities(apiKey, query, limit);
    },

    reverseGeocode: async (_: any, { lat, lon }: { lat: number; lon: number }) => {
      const apiKey = getApiKey();
      return await reverseGeocode(apiKey, lat, lon);
    },
  };
}
