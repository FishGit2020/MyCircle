import { useState } from 'react';
import { useTranslation, PageContent } from '@mycircle/shared';
import type maplibregl from 'maplibre-gl';
import MapView from './MapView';
import GpsLocateButton from './GpsLocateButton';
import MapStyleSwitcher from './MapStyleSwitcher';
import RoutePlanner from './RoutePlanner';
import { MAP_CONFIG } from '../config/mapConfig';

export default function HikingMap() {
  const { t } = useTranslation();
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [styleId, setStyleId] = useState(MAP_CONFIG.tileProviders[0].id);
  const [styleUrl, setStyleUrl] = useState(MAP_CONFIG.tileProviders[0].styleUrl);

  const handleStyleChange = (id: string, url: string) => {
    setStyleId(id);
    setStyleUrl(url);
  };

  return (
    <PageContent>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('hiking.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('hiking.subtitle')}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-14rem)]">
        {/* Map */}
        <div className="relative flex-1 min-h-[60vh] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <MapView styleUrl={styleUrl} onMapReady={setMap} />

          {/* GPS button — bottom right */}
          <div className="absolute bottom-4 right-4 z-10">
            <GpsLocateButton map={map} />
          </div>

          {/* Style switcher — top left */}
          <div className="absolute top-4 left-4 z-10">
            <MapStyleSwitcher
              providers={MAP_CONFIG.tileProviders}
              activeId={styleId}
              onChange={handleStyleChange}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="md:w-72 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
          <RoutePlanner map={map} routingBaseUrl={MAP_CONFIG.routing.baseUrl} />
        </div>
      </div>
    </PageContent>
  );
}
