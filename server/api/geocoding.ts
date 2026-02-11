import axios from 'axios';
import type { GeocodingResponse } from '../types/api.js';
import type { City } from '../types/city.js';

const API_KEY = process.env.OPENWEATHER_API_KEY;
const GEO_URL = 'https://api.openweathermap.org/geo/1.0';

const geoClient = axios.create({
  baseURL: GEO_URL,
  timeout: 5000,
  params: {
    appid: API_KEY
  }
});

export async function searchCities(query: string, limit: number = 5): Promise<City[]> {
  const response = await geoClient.get<GeocodingResponse[]>('/direct', {
    params: { q: query, limit }
  });

  return response.data.map(item => ({
    id: `${item.lat},${item.lon}`,
    name: item.name,
    country: item.country,
    state: item.state,
    lat: item.lat,
    lon: item.lon
  }));
}

export async function reverseGeocode(lat: number, lon: number): Promise<City | null> {
  const response = await geoClient.get<GeocodingResponse[]>('/reverse', {
    params: { lat, lon, limit: 1 }
  });

  if (response.data.length === 0) return null;

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
