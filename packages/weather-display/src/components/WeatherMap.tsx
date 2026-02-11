import React, { useState } from 'react';

interface Props {
  lat: number;
  lon: number;
}

type MapLayer = 'temp' | 'precipitation' | 'clouds' | 'wind';

const layers: { id: MapLayer; label: string }[] = [
  { id: 'temp', label: 'Temperature' },
  { id: 'precipitation', label: 'Rain' },
  { id: 'clouds', label: 'Clouds' },
  { id: 'wind', label: 'Wind' },
];

const layerCodes: Record<MapLayer, string> = {
  temp: 'temp_new',
  precipitation: 'precipitation_new',
  clouds: 'clouds_new',
  wind: 'wind_new',
};

export default function WeatherMap({ lat, lon }: Props) {
  const [activeLayer, setActiveLayer] = useState<MapLayer>('temp');
  const zoom = 6;

  // OpenWeather map tile URL uses the same API key from the env
  // The map uses OpenStreetMap as base + OpenWeather tile overlay
  const mapUrl = `https://openweathermap.org/weathermap?basemap=map&cities=true&layer=${layerCodes[activeLayer]}&lat=${lat}&lon=${lon}&zoom=${zoom}`;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Weather Map
        </h3>
        <div className="flex gap-1">
          {layers.map(layer => (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                activeLayer === layer.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {layer.label}
            </button>
          ))}
        </div>
      </div>
      <div className="relative" style={{ height: 350 }}>
        <iframe
          src={mapUrl}
          className="w-full h-full border-0"
          title={`Weather map - ${activeLayer}`}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
}
