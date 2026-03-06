/**
 * Renders a semi-transparent green overlay on tiles that are cached in IndexedDB.
 * Uses a MapLibre GeoJSON fill layer — updated on map move/zoom.
 */
import { useEffect, useRef } from 'react';
import type maplibregl from 'maplibre-gl';
import { getAllCachedKeys, tileKey } from '../services/tileCacheService';

const SOURCE_ID = 'tile-cache-overlay';
const LAYER_ID = 'tile-cache-overlay-fill';
const BORDER_ID = 'tile-cache-overlay-border';

/** Convert tile (z,x,y) → SW and NE corners as [lng, lat] */
function tileToLngLat(x: number, y: number, z: number): [number, number] {
  const n = Math.pow(2, z);
  const lng = (x / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
  return [lng, (latRad * 180) / Math.PI];
}

function tileToPolygon(z: number, x: number, y: number): GeoJSON.Feature {
  const sw = tileToLngLat(x, y + 1, z);
  const ne = tileToLngLat(x + 1, y, z);
  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[[sw[0], sw[1]], [ne[0], sw[1]], [ne[0], ne[1]], [sw[0], ne[1]], [sw[0], sw[1]]]],
    },
    properties: {},
  };
}

/** Visible tile indices for the map at its current zoom. */
function getVisibleTiles(map: maplibregl.Map): Array<{ z: number; x: number; y: number }> {
  const zoom = Math.floor(map.getZoom());
  const bounds = map.getBounds();
  const n = Math.pow(2, zoom);

  const lng2x = (lng: number) => Math.floor(((lng + 180) / 360) * n);
  const lat2y = (lat: number) => {
    const sinLat = Math.sin((lat * Math.PI) / 180);
    return Math.floor(((1 - Math.log((1 + sinLat) / (1 - sinLat)) / (2 * Math.PI)) / 2) * n);
  };

  const xMin = Math.max(0, lng2x(bounds.getWest()));
  const xMax = Math.min(n - 1, lng2x(bounds.getEast()));
  const yMin = Math.max(0, lat2y(bounds.getNorth()));
  const yMax = Math.min(n - 1, lat2y(bounds.getSouth()));

  // Guard against absurdly large tile counts (e.g. zoomed way out)
  if ((xMax - xMin + 1) * (yMax - yMin + 1) > 2000) return [];

  const tiles: Array<{ z: number; x: number; y: number }> = [];
  for (let x = xMin; x <= xMax; x++) {
    for (let y = yMin; y <= yMax; y++) {
      tiles.push({ z: zoom, x, y });
    }
  }
  return tiles;
}

interface Props {
  map: maplibregl.Map | null;
  visible: boolean;
  /** Bump this counter whenever the tile cache changes to force a refresh. */
  cacheVersion?: number;
}

export default function TileCacheOverlay({ map, visible, cacheVersion = 0 }: Props) {
  const cachedKeysRef = useRef<Set<string>>(new Set());

  // Load all cached keys once and on cacheVersion bump
  useEffect(() => {
    getAllCachedKeys().then((keys) => { cachedKeysRef.current = keys; });
  }, [cacheVersion]);

  // Manage GL source/layers
  useEffect(() => {
    if (!map) return;

    const removeOverlay = () => {
      if (map.getLayer(BORDER_ID)) map.removeLayer(BORDER_ID);
      if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
    };

    if (!visible) {
      removeOverlay();
      return;
    }

    // Add source + layers if not present
    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: LAYER_ID,
        type: 'fill',
        source: SOURCE_ID,
        paint: { 'fill-color': '#22c55e', 'fill-opacity': 0.25 },
      });
      map.addLayer({
        id: BORDER_ID,
        type: 'line',
        source: SOURCE_ID,
        paint: { 'line-color': '#16a34a', 'line-width': 0.5, 'line-opacity': 0.6 },
      });
    }

    const updateOverlay = () => {
      const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
      if (!source) return;
      const tiles = getVisibleTiles(map);
      const features = tiles
        .filter(({ z, x, y }) => cachedKeysRef.current.has(tileKey(z, x, y)))
        .map(({ z, x, y }) => tileToPolygon(z, x, y));
      source.setData({ type: 'FeatureCollection', features });
    };

    updateOverlay();
    map.on('moveend', updateOverlay);
    map.on('zoomend', updateOverlay);

    return () => {
      map.off('moveend', updateOverlay);
      map.off('zoomend', updateOverlay);
      removeOverlay();
    };
  }, [map, visible, cacheVersion]);

  return null;
}
