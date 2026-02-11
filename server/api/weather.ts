import axios from 'axios';
import type { OpenWeatherResponse, ForecastResponse } from '../types/api.js';
import type { CurrentWeather, ForecastDay, HourlyForecast } from '../types/weather.js';

const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

const weatherClient = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
  params: {
    appid: API_KEY,
    units: 'metric'
  }
});

export async function getCurrentWeather(lat: number, lon: number): Promise<CurrentWeather> {
  const response = await weatherClient.get<OpenWeatherResponse>('/weather', {
    params: { lat, lon }
  });

  return transformCurrentWeather(response.data);
}

export async function getForecast(lat: number, lon: number): Promise<ForecastDay[]> {
  const response = await weatherClient.get<ForecastResponse>('/forecast', {
    params: { lat, lon, cnt: 40 }
  });

  return transformForecast(response.data);
}

export async function getHourlyForecast(lat: number, lon: number): Promise<HourlyForecast[]> {
  const response = await weatherClient.get<ForecastResponse>('/forecast', {
    params: { lat, lon, cnt: 16 }
  });

  return transformHourlyForecast(response.data);
}

function transformCurrentWeather(data: OpenWeatherResponse): CurrentWeather {
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
    sunrise: data.sys.sunrise,
    sunset: data.sys.sunset,
    visibility: data.visibility,
  };
}

function transformForecast(data: ForecastResponse): ForecastDay[] {
  const dailyData = new Map<string, any[]>();

  data.list.forEach(item => {
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

function transformHourlyForecast(data: ForecastResponse): HourlyForecast[] {
  return data.list.map(item => ({
    dt: item.dt,
    temp: Math.round(item.main.temp),
    weather: item.weather,
    pop: item.pop,
    wind_speed: item.wind.speed
  }));
}
