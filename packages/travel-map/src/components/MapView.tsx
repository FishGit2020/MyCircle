import { useEffect, useRef } from 'react';
import type maplibregl from 'maplibre-gl';

interface Props {
  onMapReady: (map: maplibregl.Map) => void;
  onMapClick?: (lngLat: [number, number]) => void;
  onStyleLoad?: () => void;
}

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

export default function MapView({ onMapReady, onMapClick, onStyleLoad }: Props) {
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
    import('maplibre-gl').then(({ default: ml }) => {
      import('maplibre-gl/dist/maplibre-gl.css').catch(() => {});
      map = new ml.Map({
        container: containerRef.current!,
        style: MAP_STYLE,
        center: [0, 20],
        zoom: 2,
        preserveDrawingBuffer: true,
        pitchWithRotate: true,
        dragRotate: true,
        touchPitch: true,
        maxPitch: 85,
      });

      // Navigation controls (zoom + compass/rotate)
      map.addControl(new ml.NavigationControl({ visualizePitch: true }), 'top-right');

      // Scale bar
      map.addControl(new ml.ScaleControl({ maxWidth: 150 }), 'bottom-left');

      // Geolocation (fly to user's location)
      map.addControl(new ml.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
        showUserLocation: true,
      }), 'top-right');

      // Fullscreen
      map.addControl(new ml.FullscreenControl(), 'top-right');

      map.on('load', () => {
        mapRef.current = map;
        onMapReady(map);
        map.resize();
      });

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
      mapRef.current = null;
      try {
        map?.remove();
      } catch {
        // Map may have been destroyed during navigation
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="w-full h-full" role="application" aria-label="Map" />;
}
