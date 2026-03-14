import { useEffect, useRef } from 'react';
import type maplibregl from 'maplibre-gl';
import { useMapLibre, MapControls } from '@mycircle/shared';

interface Props {
  onMapReady: (map: maplibregl.Map) => void;
  onMapClick?: (lngLat: [number, number]) => void;
  onStyleLoad?: () => void;
}

export default function MapView({ onMapReady, onMapClick, onStyleLoad }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onMapClickRef = useRef(onMapClick);
  const onStyleLoadRef = useRef(onStyleLoad);
  const onMapReadyRef = useRef(onMapReady);
  onMapClickRef.current = onMapClick;
  onStyleLoadRef.current = onStyleLoad;
  onMapReadyRef.current = onMapReady;

  const { map, mapReady } = useMapLibre(containerRef, {
    center: [0, 20],
    zoom: 2,
    preserveDrawingBuffer: true,
    maxPitch: 85,
  });

  // Notify parent when map is ready
  useEffect(() => {
    if (!map || !mapReady) return;
    onMapReadyRef.current(map);
   
  }, [map, mapReady]);

  // Style load handler
  useEffect(() => {
    if (!map) return;
    const handler = () => { onStyleLoadRef.current?.(); };
    map.on('style.load', handler);
    return () => {
      try { map.off('style.load', handler); } catch { /* destroyed */ }
    };
  }, [map]);

  // Click handler
  useEffect(() => {
    if (!map) return;
    const handler = (e: maplibregl.MapMouseEvent) => {
      onMapClickRef.current?.([e.lngLat.lng, e.lngLat.lat]);
    };
    map.on('click', handler);
    return () => {
      try { map.off('click', handler); } catch { /* destroyed */ }
    };
  }, [map]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" role="application" aria-label="Map" />
      <MapControls map={map} />
    </div>
  );
}
