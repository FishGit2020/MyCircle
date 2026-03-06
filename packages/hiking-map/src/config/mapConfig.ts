export interface TileProviderConfig {
  id: string;
  labelKey: string;
  styleUrl: string;
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

// Public free-tier config using OSM/OpenFreeMap tiles and OSRM demo routing
const PUBLIC_CONFIG: MapConfig = {
  defaultCenter: [-122.4194, 37.7749], // San Francisco
  defaultZoom: 10,
  tileProviders: [
    {
      id: 'street',
      labelKey: 'hiking.styleStreet',
      styleUrl: 'https://tiles.openfreemap.org/styles/liberty',
    },
    {
      id: 'topo',
      labelKey: 'hiking.styleTopo',
      styleUrl: 'https://demotiles.maplibre.org/style.json',
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
//     { id: 'street', labelKey: 'hiking.styleStreet', styleUrl: 'https://YOUR_NAS/tiles/street.json' },
//     { id: 'topo',   labelKey: 'hiking.styleTopo',   styleUrl: 'https://YOUR_NAS/tiles/topo.json'   },
//   ],
//   routing: { baseUrl: 'https://YOUR_NAS/valhalla', profile: 'pedestrian' },
// };

export const MAP_CONFIG: MapConfig = PUBLIC_CONFIG;
