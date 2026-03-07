import { useEffect } from 'react';
import type maplibregl from 'maplibre-gl';

const SOURCE = 'hiking-route';
const LAYER = 'hiking-route-line';

interface Props {
  map: maplibregl.Map | null;
  /** GeoJSON geometry to display, or null to clear the route. */
  geometry: GeoJSON.Geometry | null;
}

/**
 * Renders a GeoJSON route line on the MapLibre map.
 * Manages its own source/layer lifecycle — cleans up on unmount or geometry=null.
 */
export default function RouteDisplay({ map, geometry }: Props) {
  useEffect(() => {
    if (!map) return;

    const remove = () => {
      try {
        if (map.getLayer(LAYER)) map.removeLayer(LAYER);
        if (map.getSource(SOURCE)) map.removeSource(SOURCE);
      } catch { /* Map may be mid-teardown on navigate-away; safe to ignore */ }
    };

    remove();
    if (!geometry) return;

    map.addSource(SOURCE, {
      type: 'geojson',
      data: { type: 'Feature', properties: {}, geometry },
    });
    map.addLayer({
      id: LAYER,
      type: 'line',
      source: SOURCE,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#3b82f6', 'line-width': 4 },
    });

    return remove;
  }, [map, geometry]);

  return null;
}
