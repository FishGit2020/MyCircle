import { describe, it, expect, beforeEach } from 'vitest';
import {
  getWeatherIconUrl,
  getWindDirection,
  getWeatherDescription,
  formatTemperature,
  formatTemperatureDiff,
  convertTemp,
  tempUnitSymbol,
  formatWindSpeed,
  formatDate,
  formatTime,
} from './weatherHelpers';

describe('getWeatherIconUrl', () => {
  it('returns the correct OpenWeatherMap icon URL', () => {
    expect(getWeatherIconUrl('01d')).toBe('https://openweathermap.org/img/wn/01d@2x.png');
    expect(getWeatherIconUrl('10n')).toBe('https://openweathermap.org/img/wn/10n@2x.png');
  });
});

describe('getWindDirection', () => {
  it('converts 0 degrees to N', () => {
    expect(getWindDirection(0)).toBe('N');
  });

  it('converts 90 degrees to E', () => {
    expect(getWindDirection(90)).toBe('E');
  });

  it('converts 180 degrees to S', () => {
    expect(getWindDirection(180)).toBe('S');
  });

  it('converts 270 degrees to W', () => {
    expect(getWindDirection(270)).toBe('W');
  });

  it('converts 45 degrees to NE', () => {
    expect(getWindDirection(45)).toBe('NE');
  });

  it('converts 135 degrees to SE', () => {
    expect(getWindDirection(135)).toBe('SE');
  });

  it('converts 225 degrees to SW', () => {
    expect(getWindDirection(225)).toBe('SW');
  });

  it('converts 315 degrees to NW', () => {
    expect(getWindDirection(315)).toBe('NW');
  });

  it('wraps around at 360 degrees (same as 0)', () => {
    expect(getWindDirection(360)).toBe('N');
  });
});

describe('getWeatherDescription', () => {
  it('returns correct colors for Clear', () => {
    const result = getWeatherDescription('Clear');
    expect(result.color).toBe('text-yellow-600');
    expect(result.bgColor).toBe('bg-yellow-100');
  });

  it('returns correct colors for Rain', () => {
    const result = getWeatherDescription('Rain');
    expect(result.color).toBe('text-blue-600');
    expect(result.bgColor).toBe('bg-blue-100');
  });

  it('returns correct colors for Snow', () => {
    const result = getWeatherDescription('Snow');
    expect(result.color).toBe('text-cyan-600');
    expect(result.bgColor).toBe('bg-cyan-100');
  });

  it('returns default gray for unknown weather', () => {
    const result = getWeatherDescription('Tornado');
    expect(result.color).toBe('text-gray-600');
    expect(result.bgColor).toBe('bg-gray-100');
  });
});

describe('formatTemperature', () => {
  it('formats Celsius correctly', () => {
    expect(formatTemperature(20, 'C')).toBe('20°C');
    expect(formatTemperature(20.7, 'C')).toBe('21°C');
  });

  it('converts and formats Fahrenheit correctly', () => {
    expect(formatTemperature(0, 'F')).toBe('32°F');
    expect(formatTemperature(100, 'F')).toBe('212°F');
  });
});

describe('formatTemperatureDiff', () => {
  it('formats Celsius difference correctly', () => {
    expect(formatTemperatureDiff(5, 'C')).toBe('5°C');
    expect(formatTemperatureDiff(7.4, 'C')).toBe('7°C');
  });

  it('scales Fahrenheit difference without +32 offset', () => {
    // 5°C diff = 5 * 9/5 = 9°F diff (NOT 5*9/5+32=41)
    expect(formatTemperatureDiff(5, 'F')).toBe('9°F');
    expect(formatTemperatureDiff(10, 'F')).toBe('18°F');
    expect(formatTemperatureDiff(0, 'F')).toBe('0°F');
  });
});

describe('convertTemp', () => {
  it('returns rounded Celsius', () => {
    expect(convertTemp(20.4, 'C')).toBe(20);
    expect(convertTemp(20.6, 'C')).toBe(21);
  });

  it('converts to Fahrenheit', () => {
    expect(convertTemp(0, 'F')).toBe(32);
    expect(convertTemp(100, 'F')).toBe(212);
  });
});

describe('tempUnitSymbol', () => {
  it('returns °C for Celsius', () => {
    expect(tempUnitSymbol('C')).toBe('°C');
  });

  it('returns °F for Fahrenheit', () => {
    expect(tempUnitSymbol('F')).toBe('°F');
  });
});

describe('formatWindSpeed', () => {
  it('formats m/s correctly', () => {
    expect(formatWindSpeed(5, 'ms')).toBe('5 m/s');
  });

  it('converts to mph', () => {
    // 5 m/s * 2.237 = 11.185, rounded to 11
    expect(formatWindSpeed(5, 'mph')).toBe('11 mph');
  });

  it('converts to km/h', () => {
    // 5 m/s * 3.6 = 18
    expect(formatWindSpeed(5, 'kmh')).toBe('18 km/h');
  });
});

describe('formatDate', () => {
  it('formats a Unix timestamp as a readable date', () => {
    // 2024-01-15 12:00:00 UTC = 1705320000
    const result = formatDate(1705320000);
    // Should contain a day, month, date
    expect(result).toMatch(/\w+,?\s*\w+\s+\d+/);
  });
});

describe('formatTime', () => {
  it('formats a Unix timestamp as a readable time', () => {
    const result = formatTime(1705320000);
    // Should contain hour and minute
    expect(result).toMatch(/\d+:\d+/);
  });
});
