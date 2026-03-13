import type maplibregl from 'maplibre-gl';

/**
 * Add or update a GeoJSON circle layer with point features.
 * All GL operations are wrapped in try/catch per project conventions
 * (map.getLayer() crashes after navigation when this.style is null).
 */
export function setCircleLayer(
  map: maplibregl.Map,
  sourceId: string,
  layerId: string,
  features: Array<{ lon: number; lat: number; color?: string; id?: string }>,
  options?: {
    radius?: number;
    color?: string;
    strokeColor?: string;
    strokeWidth?: number;
    opacity?: number;
  },
): void {
  try {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
    if (features.length === 0) return;

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: features.map((f) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [f.lon, f.lat] },
        properties: {
          ...(f.id != null ? { id: f.id } : {}),
          ...(f.color != null ? { color: f.color } : {}),
        },
      })),
    };

    map.addSource(sourceId, { type: 'geojson', data: geojson });
    map.addLayer({
      id: layerId,
      type: 'circle',
      source: sourceId,
      paint: {
        'circle-radius': options?.radius ?? 8,
        'circle-color': options?.color ?? '#3b82f6',
        'circle-stroke-width': options?.strokeWidth ?? 2,
        'circle-stroke-color': options?.strokeColor ?? '#ffffff',
        ...(options?.opacity != null ? { 'circle-opacity': options.opacity } : {}),
      },
    });
  } catch {
    // Map may have been destroyed during navigation
  }
}

/**
 * Add or update a GeoJSON line layer.
 * All GL operations are wrapped in try/catch per project conventions.
 */
export function setLineLayer(
  map: maplibregl.Map,
  sourceId: string,
  layerId: string,
  coordinates: [number, number][],
  options?: {
    color?: string;
    width?: number;
    opacity?: number;
  },
): void {
  try {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
    if (coordinates.length === 0) return;

    const geojson: GeoJSON.Feature = {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates },
      properties: {},
    };

    map.addSource(sourceId, { type: 'geojson', data: geojson });
    map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': options?.color ?? '#3b82f6',
        'line-width': options?.width ?? 3,
        ...(options?.opacity != null ? { 'line-opacity': options.opacity } : {}),
      },
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
    });
  } catch {
    // Map may have been destroyed during navigation
  }
}

/**
 * Safely remove a source and its associated layers.
 * All GL operations are wrapped in try/catch per project conventions.
 */
export function removeSourceAndLayers(
  map: maplibregl.Map,
  sourceId: string,
  layerIds: string[],
): void {
  try {
    for (const layerId of layerIds) {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
    }
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  } catch {
    // Map may have been destroyed during navigation
  }
}
