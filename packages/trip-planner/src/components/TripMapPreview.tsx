import { useEffect, useRef } from 'react';
import type maplibregl from 'maplibre-gl';

interface TripMapPreviewProps {
  lat: number;
  lon: number;
  destinationName: string;
}

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

export default function TripMapPreview({ lat, lon, destinationName }: TripMapPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let map: maplibregl.Map;
    let ro: ResizeObserver | undefined;

    import('maplibre-gl').then(({ default: ml }) => {
      import('maplibre-gl/dist/maplibre-gl.css').catch(() => {});

      if (!containerRef.current) return;

      map = new ml.Map({
        container: containerRef.current,
        style: MAP_STYLE,
        center: [lon, lat],
        zoom: 10,
        preserveDrawingBuffer: true,
        interactive: true,
      });

      // Only zoom control
      map.addControl(new ml.NavigationControl({ showCompass: false }), 'top-right');

      map.on('load', () => {
        mapRef.current = map;
        map.resize();

        // Add destination marker
        try {
          const popup = new ml.Popup({ offset: 25, closeButton: false })
            .setText(destinationName);
          new ml.Marker({ color: '#06b6d4' })
            .setLngLat([lon, lat])
            .setPopup(popup)
            .addTo(map);
          popup.addTo(map);
        } catch {
          // GL operations may fail if map is destroyed
        }
      });

      ro = new ResizeObserver(() => {
        try {
          mapRef.current?.resize();
        } catch {
          // Map may have been destroyed
        }
      });
      if (containerRef.current) ro.observe(containerRef.current);
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
  }, [lat, lon, destinationName]);

  return (
    <div
      ref={containerRef}
      className="w-full h-48"
      role="img"
      aria-label={destinationName}
    />
  );
}
