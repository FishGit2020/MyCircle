export interface RouteResult {
  geometry: GeoJSON.LineString;
  distance: number; // meters
  duration: number; // seconds
}

export interface RoutingProvider {
  getRoute(start: [number, number], end: [number, number]): Promise<RouteResult>;
}

class OsrmProvider implements RoutingProvider {
  constructor(private baseUrl: string, private profile = 'foot') {}

  async getRoute(start: [number, number], end: [number, number]): Promise<RouteResult> {
    const url = `${this.baseUrl}/route/v1/${this.profile}/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Route fetch failed');
    const data = await res.json();
    if (!data.routes?.[0]) throw new Error('No route found');
    const route = data.routes[0];
    return {
      geometry: route.geometry as GeoJSON.LineString,
      distance: route.distance,
      duration: route.duration,
    };
  }
}

/** Decode Valhalla's encoded polyline (precision 6 by default). */
function decodePolyline(encoded: string, precision = 6): [number, number][] {
  const factor = Math.pow(10, precision);
  const coords: [number, number][] = [];
  let lat = 0, lng = 0, i = 0;
  while (i < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(i++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(i++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    coords.push([lng / factor, lat / factor]);
  }
  return coords;
}

class ValhallaProvider implements RoutingProvider {
  constructor(private baseUrl: string, private costing = 'pedestrian') {}

  async getRoute(start: [number, number], end: [number, number]): Promise<RouteResult> {
    const body = {
      locations: [
        { lon: start[0], lat: start[1] },
        { lon: end[0], lat: end[1] },
      ],
      costing: this.costing,
      directions_options: { units: 'kilometers' },
    };
    const res = await fetch(`${this.baseUrl}/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Route fetch failed');
    const data = await res.json();
    if (!data.trip?.legs?.[0]) throw new Error('No route found');
    const leg = data.trip.legs[0];
    const coords = decodePolyline(leg.shape);
    return {
      geometry: { type: 'LineString', coordinates: coords },
      distance: leg.summary.length * 1000, // km → meters
      duration: leg.summary.time,
    };
  }
}

export function createRoutingProvider(config: {
  baseUrl: string;
  type?: 'osrm' | 'valhalla';
  profile?: string;
}): RoutingProvider {
  if (config.type === 'valhalla') {
    return new ValhallaProvider(config.baseUrl, config.profile ?? 'pedestrian');
  }
  return new OsrmProvider(config.baseUrl, config.profile ?? 'foot');
}
