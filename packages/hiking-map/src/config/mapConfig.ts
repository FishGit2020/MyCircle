export interface TileProviderConfig {
  id: string;
  labelKey: string;
  /** Either a URL string (vector style) or a MapLibre StyleSpecification object (raster). */
  style: string | Record<string, unknown>;
}

export interface RoutingProviderConfig {
  baseUrl: string;
  profile: string;
}

export interface MapConfig {
  defaultCenter: [number, number];
  defaultZoom: number;
  tileProviders: TileProviderConfig[];
  routing: RoutingProviderConfig;
}

// OpenTopoMap raster style — shows contour lines, elevation shading, hiking paths
const TOPO_RASTER_STYLE: Record<string, unknown> = {
  version: 8,
  sources: {
    'open-topo': {
      type: 'raster',
      tiles: ['https://tile.opentopomap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution:
        'Map data: © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
        '<a href="http://viewfinderpanoramas.org">SRTM</a> | Map display: © <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
      maxzoom: 17,
    },
  },
  layers: [{ id: 'topo-tiles', type: 'raster', source: 'open-topo' }],
};

// Public free-tier config using OpenFreeMap (street) and OpenTopoMap (topo)
const PUBLIC_CONFIG: MapConfig = {
  defaultCenter: [-122.4194, 37.7749], // San Francisco — replaced by GPS auto-locate
  defaultZoom: 10,
  tileProviders: [
    {
      id: 'street',
      labelKey: 'hiking.styleStreet',
      style: 'https://tiles.openfreemap.org/styles/liberty',
    },
    {
      id: 'topo',
      labelKey: 'hiking.styleTopo',
      style: TOPO_RASTER_STYLE,
    },
  ],
  routing: {
    baseUrl: 'https://router.project-osrm.org',
    profile: 'foot',
  },
};

// Self-hosted NAS config (Protomaps tiles + Valhalla routing)
// Swap MAP_CONFIG = NAS_CONFIG to use your own infrastructure
//
// const NAS_CONFIG: MapConfig = {
//   defaultCenter: [-122.4194, 37.7749],
//   defaultZoom: 10,
//   tileProviders: [
//     { id: 'street', labelKey: 'hiking.styleStreet', style: 'https://YOUR_NAS/tiles/street.json' },
//     { id: 'topo',   labelKey: 'hiking.styleTopo',   style: 'https://YOUR_NAS/tiles/topo.json'   },
//   ],
//   routing: { baseUrl: 'https://YOUR_NAS/valhalla', profile: 'pedestrian' },
// };

export const MAP_CONFIG: MapConfig = PUBLIC_CONFIG;
