import { useEffect, useRef } from 'react';
import type maplibregl from 'maplibre-gl';

interface Props {
  style: string | Record<string, unknown>;
  onMapReady: (map: maplibregl.Map) => void;
  onMapClick?: (lngLat: [number, number]) => void;
}

export default function MapView({ style, onMapReady, onMapClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  useEffect(() => {
    if (!containerRef.current) return;

    let map: maplibregl.Map;
    import('maplibre-gl').then(({ default: maplibregl }) => {
      import('maplibre-gl/dist/maplibre-gl.css').catch(() => {});
      map = new maplibregl.Map({
        container: containerRef.current!,
        style: style as Parameters<typeof maplibregl.Map>[0]['style'],
        center: [-122.4194, 37.7749],
        zoom: 10,
        preserveDrawingBuffer: true, // needed for map.getCanvas().toDataURL()
      });

      map.on('load', () => {
        mapRef.current = map;
        onMapReady(map);
      });

      map.on('click', (e) => {
        onMapClickRef.current?.([e.lngLat.lng, e.lngLat.lat]);
      });
    });

    return () => {
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
