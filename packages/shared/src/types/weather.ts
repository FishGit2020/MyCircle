export interface CurrentWeather {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  pressure: number;
  humidity: number;
  weather: WeatherCondition[];
  wind: Wind;
  clouds: { all: number };
  dt: number;
  timezone: number;
  sunrise?: number;
  sunset?: number;
  visibility?: number;
}

export interface WeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface Wind {
  speed: number;
  deg: number;
  gust?: number;
}

export interface ForecastDay {
  dt: number;
  temp: {
    min: number;
    max: number;
    day: number;
    night: number;
  };
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

export interface AirQuality {
  aqi: number;
  co: number;
  no: number;
  no2: number;
  o3: number;
  so2: number;
  pm2_5: number;
  pm10: number;
}

export interface HistoricalWeatherDay {
  date: string;
  temp_max: number;
  temp_min: number;
  precipitation: number;
  wind_speed_max: number;
  weather_description: string;
  weather_icon: string;
}
