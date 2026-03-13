import { useEffect, useRef } from 'react';
import { useMapLibre, setCircleLayer } from '@mycircle/shared';
import type maplibregl from 'maplibre-gl';

interface TripMapPreviewProps {
  lat: number;
  lon: number;
  destinationName: string;
}

export default function TripMapPreview({ lat, lon, destinationName }: TripMapPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const { map, mapReady } = useMapLibre(containerRef, {
    center: [lon, lat],
    zoom: 10,
    preserveDrawingBuffer: true,
    interactive: true,
  });

  // Add zoom control once when map is ready
  useEffect(() => {
    if (!map || !mapReady) return;

    import('maplibre-gl').then(({ default: ml }) => {
      try {
        map.addControl(new ml.NavigationControl({ showCompass: false }), 'top-right');
      } catch {
        // GL operations may fail if map is destroyed
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, mapReady]);

  // Update marker and position when lat/lon/name change
  useEffect(() => {
    if (!map || !mapReady) return;

    // Remove old marker
    try {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    } catch {
      // Marker may have been destroyed
    }

    // Fly to new location
    try {
      map.flyTo({ center: [lon, lat], zoom: 10, duration: 800 });
    } catch {
      // Map may have been destroyed
    }

    // Add destination marker + popup
    import('maplibre-gl').then(({ default: ml }) => {
      try {
        const popup = new ml.Popup({ offset: 25, closeButton: false })
          .setText(destinationName);
        const marker = new ml.Marker({ color: '#06b6d4' })
          .setLngLat([lon, lat])
          .setPopup(popup)
          .addTo(map);
        popup.addTo(map);
        markerRef.current = marker;
      } catch {
        // GL operations may fail if map is destroyed
      }
    });

    // Add a circle layer for the destination point
    setCircleLayer(map, 'dest-source', 'dest-circle',
      [{ lon, lat, color: '#06b6d4' }],
      { radius: 6, color: '#06b6d4', strokeWidth: 2, strokeColor: '#ffffff' },
    );
  }, [map, mapReady, lat, lon, destinationName]);

  return (
    <div
      ref={containerRef}
      className="w-full h-48"
      role="img"
      aria-label={destinationName}
    />
  );
}
