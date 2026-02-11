export function getWeatherIconUrl(iconCode: string): string {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

export function getWindDirection(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

export function getWeatherDescription(main: string): { color: string; bgColor: string } {
  const weatherColors: Record<string, { color: string; bgColor: string }> = {
    Clear: { color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    Clouds: { color: 'text-gray-600', bgColor: 'bg-gray-100' },
    Rain: { color: 'text-blue-600', bgColor: 'bg-blue-100' },
    Drizzle: { color: 'text-blue-400', bgColor: 'bg-blue-50' },
    Thunderstorm: { color: 'text-purple-600', bgColor: 'bg-purple-100' },
    Snow: { color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
    Mist: { color: 'text-gray-500', bgColor: 'bg-gray-50' },
    Fog: { color: 'text-gray-500', bgColor: 'bg-gray-50' }
  };

  return weatherColors[main] || { color: 'text-gray-600', bgColor: 'bg-gray-100' };
}

export type TemperatureUnit = 'C' | 'F';
export type SpeedUnit = 'ms' | 'mph' | 'kmh';

export function getStoredUnits(): { tempUnit: TemperatureUnit; speedUnit: SpeedUnit } {
  try {
    const tempUnit = (localStorage.getItem('tempUnit') as TemperatureUnit) || 'C';
    const speedUnit = (localStorage.getItem('speedUnit') as SpeedUnit) || 'ms';
    return { tempUnit, speedUnit };
  } catch {
    return { tempUnit: 'C', speedUnit: 'ms' };
  }
}

export function formatTemperature(temp: number, unit?: TemperatureUnit): string {
  const u = unit ?? getStoredUnits().tempUnit;
  if (u === 'F') {
    return `${Math.round(temp * 9/5 + 32)}°F`;
  }
  return `${Math.round(temp)}°C`;
}

export function convertTemp(temp: number, unit?: TemperatureUnit): number {
  const u = unit ?? getStoredUnits().tempUnit;
  if (u === 'F') return Math.round(temp * 9/5 + 32);
  return Math.round(temp);
}

export function tempUnitSymbol(unit?: TemperatureUnit): string {
  const u = unit ?? getStoredUnits().tempUnit;
  return u === 'F' ? '°F' : '°C';
}

export function formatWindSpeed(speed: number, unit?: SpeedUnit): string {
  const u = unit ?? getStoredUnits().speedUnit;
  switch (u) {
    case 'mph': return `${Math.round(speed * 2.237)} mph`;
    case 'kmh': return `${Math.round(speed * 3.6)} km/h`;
    default: return `${Math.round(speed)} m/s`;
  }
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
}
