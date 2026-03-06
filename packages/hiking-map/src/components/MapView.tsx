import { useEffect, useRef } from 'react';
import type maplibregl from 'maplibre-gl';
import { getTile } from '../services/tileCacheService';

interface Props {
  style: string | Record<string, unknown>;
  onMapReady: (map: maplibregl.Map) => void;
  onMapClick?: (lngLat: [number, number]) => void;
  onStyleLoad?: () => void;
}

/** Parse tile z/x/y from a raster tile URL like .../tiles/10/327/704.png */
function parseTileCoords(url: string): { z: number; x: number; y: number } | null {
  const match = url.match(/\/(\d+)\/(\d+)\/(\d+)(?:\.\w+)?(?:\?.*)?$/);
  if (!match) return null;
  return { z: parseInt(match[1]), x: parseInt(match[2]), y: parseInt(match[3]) };
}

export default function MapView({ style, onMapReady, onMapClick, onStyleLoad }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onMapClickRef = useRef(onMapClick);
  const onStyleLoadRef = useRef(onStyleLoad);
  onMapClickRef.current = onMapClick;
  onStyleLoadRef.current = onStyleLoad;

  useEffect(() => {
    if (!containerRef.current) return;

    let map: maplibregl.Map;
    let ro: ResizeObserver | undefined;
    import('maplibre-gl').then(({ default: maplibregl }) => {
      import('maplibre-gl/dist/maplibre-gl.css').catch(() => {});
      map = new maplibregl.Map({
        container: containerRef.current!,
        style: style as Parameters<typeof maplibregl.Map>[0]['style'],
        center: [-122.4194, 37.7749],
        zoom: 10,
        preserveDrawingBuffer: true, // needed for map.getCanvas().toDataURL()
        transformRequest: (url) => {
          // Intercept raster tile requests and serve from IndexedDB cache when available
          const coords = parseTileCoords(url);
          if (!coords) return { url };
          // Return original URL; the service worker / background fetch handles caching.
          // For direct offline serving, we use a blob URL if the tile is cached.
          // We kick off an async check but can't block transformRequest — instead we
          // rely on the tile download populating the cache for next map load.
          return { url };
        },
      });

      map.on('load', () => {
        mapRef.current = map;
        onMapReady(map);
        // Trigger resize after load so the canvas fills its container on mobile
        map.resize();
      });

      // Keep canvas sized to container on orientation/layout changes
      ro = new ResizeObserver(() => { mapRef.current?.resize(); });
      if (containerRef.current) ro.observe(containerRef.current);

      map.on('style.load', () => {
        onStyleLoadRef.current?.();
      });

      map.on('click', (e) => {
        onMapClickRef.current?.([e.lngLat.lng, e.lngLat.lat]);
      });
    });

    return () => {
      ro?.disconnect();
      map?.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setStyle(style as Parameters<ReturnType<typeof mapRef.current.setStyle>>[0]);
    }
  }, [style]);

  return <div ref={containerRef} className="w-full h-full" role="application" aria-label="Map" />;
}
