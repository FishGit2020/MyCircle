import { useEffect, useRef } from 'react';
import type maplibregl from 'maplibre-gl';

interface Props {
  styleUrl: string;
  onMapReady: (map: maplibregl.Map) => void;
}

export default function MapView({ styleUrl, onMapReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let map: maplibregl.Map;
    import('maplibre-gl').then(({ default: maplibregl }) => {
      import('maplibre-gl/dist/maplibre-gl.css').catch(() => {});
      map = new maplibregl.Map({
        container: containerRef.current!,
        style: styleUrl,
        center: [-122.4194, 37.7749],
        zoom: 10,
      });
      map.addControl(new maplibregl.NavigationControl(), 'top-right');
      map.on('load', () => {
        mapRef.current = map;
        onMapReady(map);
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
      mapRef.current.setStyle(styleUrl);
    }
  }, [styleUrl]);

  return <div ref={containerRef} className="w-full h-full" role="application" aria-label="Map" />;
}
