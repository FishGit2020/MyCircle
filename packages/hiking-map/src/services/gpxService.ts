/**
 * GPX parsing and export service.
 * Uses the browser's built-in DOMParser — no external library needed.
 */
import type { SavedRoute } from './routeStorageService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GpxPoint {
  lat: number;
  lng: number;
  ele?: number; // elevation in metres
}

export interface GpxTrack {
  name: string;
  points: GpxPoint[];
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  distanceM: number;
  hasElevation: boolean;
}

// ─── Haversine distance (metres between two lat/lng points) ───────────────────

function haversine(a: GpxPoint, b: GpxPoint): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function computeDistance(points: GpxPoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversine(points[i - 1], points[i]);
  }
  return total;
}

function computeBounds(points: GpxPoint[]) {
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (const p of points) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }
  return { minLat, maxLat, minLng, maxLng };
}

// ─── Parse ────────────────────────────────────────────────────────────────────

/**
 * Parse GPX XML text into an array of GpxTrack objects.
 * Handles both <trk> (track) and <rte> (route) elements.
 * Returns [] on malformed input without throwing.
 */
export function parseGpx(xmlText: string): GpxTrack[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'application/xml');
    const parseError = doc.querySelector('parsererror');
    if (parseError) return [];

    const tracks: GpxTrack[] = [];

    // Process <trk> elements
    const trkEls = Array.from(doc.querySelectorAll('trk'));
    for (const trk of trkEls) {
      const name = trk.querySelector('name')?.textContent?.trim() || 'Track';
      const points: GpxPoint[] = [];
      const trkpts = trk.querySelectorAll('trkpt');
      for (const pt of Array.from(trkpts)) {
        const lat = parseFloat(pt.getAttribute('lat') ?? '');
        const lng = parseFloat(pt.getAttribute('lon') ?? '');
        if (isNaN(lat) || isNaN(lng)) continue;
        const eleText = pt.querySelector('ele')?.textContent;
        const ele = eleText ? parseFloat(eleText) : undefined;
        points.push({ lat, lng, ...(ele !== undefined && !isNaN(ele) ? { ele } : {}) });
      }
      if (points.length < 2) continue;
      tracks.push({
        name,
        points,
        bounds: computeBounds(points),
        distanceM: computeDistance(points),
        hasElevation: points.some(p => p.ele !== undefined),
      });
    }

    // Process <rte> elements (routes — flat point list, no segments)
    const rteEls = Array.from(doc.querySelectorAll('rte'));
    for (const rte of rteEls) {
      const name = rte.querySelector('name')?.textContent?.trim() || 'Route';
      const points: GpxPoint[] = [];
      const rtepts = rte.querySelectorAll('rtept');
      for (const pt of Array.from(rtepts)) {
        const lat = parseFloat(pt.getAttribute('lat') ?? '');
        const lng = parseFloat(pt.getAttribute('lon') ?? '');
        if (isNaN(lat) || isNaN(lng)) continue;
        const eleText = pt.querySelector('ele')?.textContent;
        const ele = eleText ? parseFloat(eleText) : undefined;
        points.push({ lat, lng, ...(ele !== undefined && !isNaN(ele) ? { ele } : {}) });
      }
      if (points.length < 2) continue;
      tracks.push({
        name,
        points,
        bounds: computeBounds(points),
        distanceM: computeDistance(points),
        hasElevation: points.some(p => p.ele !== undefined),
      });
    }

    return tracks;
  } catch {
    return [];
  }
}

// ─── Convert to SavedRoute ─────────────────────────────────────────────────────

/**
 * Convert a parsed GpxTrack to a partial SavedRoute (ready to persist).
 */
export function gpxTrackToSavedRoute(
  track: GpxTrack,
  name: string,
): Omit<SavedRoute, 'id' | 'createdAt' | 'sharedId'> {
  const geometry: GeoJSON.LineString = {
    type: 'LineString',
    coordinates: track.points.map((p) => [p.lng, p.lat] as [number, number]),
  };

  let elevationProfile: { distanceM: number; elevationM: number }[] | undefined;
  if (track.hasElevation) {
    let cumDist = 0;
    elevationProfile = track.points.map((p, i) => {
      if (i > 0) cumDist += haversine(track.points[i - 1], p);
      return { distanceM: cumDist, elevationM: p.ele ?? 0 };
    });
  }

  return {
    name,
    distance: track.distanceM,
    duration: 0, // GPX tracks don't carry travel-time estimates
    geometry,
    sourceFormat: 'gpx-import',
    ...(elevationProfile ? { elevationProfile } : {}),
  };
}

// ─── Export ───────────────────────────────────────────────────────────────────

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9 _-]/g, '').trim().slice(0, 60) || 'route';
}

/**
 * Serialize a SavedRoute to a GPX 1.1 XML string.
 */
export function exportGpx(route: SavedRoute): string {
  const coords = route.geometry.coordinates as [number, number][];
  const { elevationProfile } = route;

  const trkpts = coords
    .map(([lng, lat], i) => {
      const ele =
        elevationProfile?.[i] !== undefined
          ? `\n        <ele>${elevationProfile[i].elevationM.toFixed(1)}</ele>`
          : '';
      return `      <trkpt lat="${lat.toFixed(7)}" lon="${lng.toFixed(7)}">${ele}\n      </trkpt>`;
    })
    .join('\n');

  const wpts: string[] = [];
  if (route.startLabel) {
    const [sLng, sLat] = coords[0];
    wpts.push(`  <wpt lat="${sLat.toFixed(7)}" lon="${sLng.toFixed(7)}">\n    <name>${escapeXml(route.startLabel)}</name>\n  </wpt>`);
  }
  if (route.endLabel) {
    const [eLng, eLat] = coords[coords.length - 1];
    wpts.push(`  <wpt lat="${eLat.toFixed(7)}" lon="${eLng.toFixed(7)}">\n    <name>${escapeXml(route.endLabel)}</name>\n  </wpt>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="MyCircle" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${escapeXml(route.name)}</name>
  </metadata>
${wpts.join('\n')}
  <trk>
    <name>${escapeXml(route.name)}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export { sanitizeFilename };
