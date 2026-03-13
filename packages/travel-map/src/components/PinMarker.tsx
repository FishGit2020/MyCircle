import { useEffect } from 'react';
import type maplibregl from 'maplibre-gl';
import type { TravelPin } from '../types';
import { PIN_COLORS } from '../types';

const SOURCE_ID = 'travel-pins-source';
const CIRCLE_LAYER_ID = 'travel-pins-circle';
const LABEL_LAYER_ID = 'travel-pins-label';

interface PinMarkerProps {
  map: maplibregl.Map | null;
  pins: TravelPin[];
  /** Bumped when the map style reloads, to re-add layers */
  styleVersion: number;
  onPinClick?: (pin: TravelPin) => void;
}

function buildGeoJSON(pins: TravelPin[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: pins.map((pin) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [pin.lon, pin.lat] },
      properties: {
        id: pin.id,
        name: pin.name,
        type: pin.type,
        color: PIN_COLORS[pin.type] || '#3b82f6',
      },
    })),
  };
}

export default function PinMarker({ map, pins, styleVersion, onPinClick }: PinMarkerProps) {
  useEffect(() => {
    if (!map) return;

    try {
      // Clean up existing layers/source
      if (map.getLayer(LABEL_LAYER_ID)) map.removeLayer(LABEL_LAYER_ID);
      if (map.getLayer(CIRCLE_LAYER_ID)) map.removeLayer(CIRCLE_LAYER_ID);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);

      if (pins.length === 0) return;

      const geojson = buildGeoJSON(pins);

      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: geojson,
      });

      map.addLayer({
        id: CIRCLE_LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        paint: {
          'circle-radius': 8,
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#ffffff',
        },
      });

      map.addLayer({
        id: LABEL_LAYER_ID,
        type: 'symbol',
        source: SOURCE_ID,
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 11,
          'text-offset': [0, 1.5],
          'text-anchor': 'top',
          'text-optional': true,
        },
        paint: {
          'text-color': '#374151',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1,
        },
      });

      // Click handler for pins
      const clickHandler = (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
        const feature = e.features?.[0];
        if (!feature) return;
        const pinId = feature.properties?.id;
        const clicked = pins.find((p) => p.id === pinId);
        if (clicked && onPinClick) {
          onPinClick(clicked);
        }
      };

      map.on('click', CIRCLE_LAYER_ID, clickHandler);

      // Cursor style
      const enterHandler = () => { map.getCanvas().style.cursor = 'pointer'; };
      const leaveHandler = () => { map.getCanvas().style.cursor = ''; };
      map.on('mouseenter', CIRCLE_LAYER_ID, enterHandler);
      map.on('mouseleave', CIRCLE_LAYER_ID, leaveHandler);

      return () => {
        try {
          map.off('click', CIRCLE_LAYER_ID, clickHandler);
          map.off('mouseenter', CIRCLE_LAYER_ID, enterHandler);
          map.off('mouseleave', CIRCLE_LAYER_ID, leaveHandler);
        } catch {
          // Map may have been destroyed
        }
      };
    } catch {
      // Map may have been destroyed during navigation
    }
  }, [map, pins, styleVersion, onPinClick]);

  return null;
}
