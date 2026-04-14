import { useRef, useEffect } from 'react';
import { useMapLibre, useTranslation } from '@mycircle/shared';

interface MapLocation {
  lat: number;
  lon: number;
  label: string;
  anniversaryId: string;
  year?: number;
}

interface AnniversaryMapProps {
  locations: MapLocation[];
}

export default function AnniversaryMap({ locations }: AnniversaryMapProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);
  const { map, mapReady } = useMapLibre(containerRef, {
    zoom: 3,
    center: [-98.5, 39.8], // center of US
  });

  // Add/update markers when map is ready or locations change
  useEffect(() => {
    if (!map || !mapReady) return;

    // Remove existing markers
    markersRef.current.forEach((m) => {
      try {
        m.remove();
      } catch {
        // Marker may already be removed
      }
    });
    markersRef.current = [];

    if (locations.length === 0) return;

    // Dynamically import maplibre-gl for Marker and Popup classes.
    // maplibre-gl types are not a direct dep of this package; available at runtime via shared.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (import('maplibre-gl') as Promise<any>).then(({ default: ml }) => {
      const bounds = new ml.LngLatBounds();

      locations.forEach((loc) => {
        const el = document.createElement('div');
        el.className = 'anniversary-map-marker';
        el.style.cssText =
          'width:24px;height:24px;background:#3b82f6;border:2px solid white;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.3);';

        const yearSuffix = loc.year ? ` <span style="font-weight:400;color:#6b7280;">(${loc.year})</span>` : '';
        const popup = new ml.Popup({ offset: 25, closeButton: false, closeOnClick: false }).setHTML(
          `<div style="font-size:13px;font-weight:600;padding:2px 4px;">${loc.label}${yearSuffix}</div>`,
        );

        const marker = new ml.Marker({ element: el })
          .setLngLat([loc.lon, loc.lat])
          .setPopup(popup)
          .addTo(map);

        // Show label by default
        marker.togglePopup();

        bounds.extend([loc.lon, loc.lat]);
        markersRef.current.push(marker);
      });

      // Fit bounds with padding
      if (locations.length === 1) {
        try {
          map.flyTo({ center: [locations[0].lon, locations[0].lat], zoom: 10 });
        } catch {
          // Map may have been destroyed
        }
      } else {
        try {
          map.fitBounds(bounds, { padding: 50, maxZoom: 12 });
        } catch {
          // Map may have been destroyed
        }
      }
    });
  }, [map, mapReady, locations]);

  if (locations.length === 0) {
    return (
      <div
        className="flex h-48 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800"
        aria-label={t('anniversary.location')}
      >
        <p className="text-sm text-gray-400 dark:text-gray-500">
          {t('anniversary.location')}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-64 w-full overflow-hidden rounded-lg border border-gray-200 md:h-80 dark:border-gray-700"
      role="img"
      aria-label={t('anniversary.location')}
    />
  );
}
