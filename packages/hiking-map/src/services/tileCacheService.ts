import { openDB } from 'idb';
import type { IDBPDatabase } from 'idb';

const DB_NAME = 'hiking-map-tiles';
const STORE = 'tiles';
const DB_VERSION = 1;

type TileDb = IDBPDatabase<{
  tiles: {
    key: string; // "{z}/{x}/{y}"
    value: ArrayBuffer;
  };
}>;

let dbPromise: Promise<TileDb> | null = null;

function getDb(): Promise<TileDb> {
  if (!dbPromise) {
    dbPromise = openDB<any>(DB_NAME, DB_VERSION, { // eslint-disable-line @typescript-eslint/no-explicit-any
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      },
    });
  }
  return dbPromise;
}

export function tileKey(z: number, x: number, y: number) {
  return `${z}/${x}/${y}`;
}

export async function getTile(z: number, x: number, y: number): Promise<ArrayBuffer | undefined> {
  const db = await getDb();
  return db.get(STORE, tileKey(z, x, y));
}

export async function putTile(z: number, x: number, y: number, data: ArrayBuffer): Promise<void> {
  const db = await getDb();
  await db.put(STORE, data, tileKey(z, x, y));
}

export async function hasTile(z: number, x: number, y: number): Promise<boolean> {
  const db = await getDb();
  const key = await db.getKey(STORE, tileKey(z, x, y));
  return key !== undefined;
}

export async function getTileCount(): Promise<number> {
  const db = await getDb();
  return db.count(STORE);
}

export async function clearAllTiles(): Promise<void> {
  const db = await getDb();
  await db.clear(STORE);
}

/** Return all cached tile keys as a Set for fast lookup. */
export async function getAllCachedKeys(): Promise<Set<string>> {
  const db = await getDb();
  const keys = await db.getAllKeys(STORE);
  return new Set(keys as string[]);
}

/** Generate all tile coordinates for a bounding box at a given zoom level. */
function tilesForBbox(
  bbox: { minLng: number; minLat: number; maxLng: number; maxLat: number },
  zoom: number
): Array<{ z: number; x: number; y: number }> {
  const lat2tile = (lat: number, z: number) =>
    Math.floor(((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * Math.pow(2, z));
  const lng2tile = (lng: number, z: number) =>
    Math.floor(((lng + 180) / 360) * Math.pow(2, z));

  const xMin = lng2tile(bbox.minLng, zoom);
  const xMax = lng2tile(bbox.maxLng, zoom);
  const yMin = lat2tile(bbox.maxLat, zoom); // note: y is inverted
  const yMax = lat2tile(bbox.minLat, zoom);

  const tiles: Array<{ z: number; x: number; y: number }> = [];
  for (let x = xMin; x <= xMax; x++) {
    for (let y = yMin; y <= yMax; y++) {
      tiles.push({ z: zoom, x, y });
    }
  }
  return tiles;
}

/** Estimate how many tiles are needed for the given bbox across zoom levels. */
export function estimateTileCount(
  bbox: { minLng: number; minLat: number; maxLng: number; maxLat: number },
  minZoom = 10,
  maxZoom = 16
): number {
  let total = 0;
  for (let z = minZoom; z <= maxZoom; z++) {
    total += tilesForBbox(bbox, z).length;
  }
  return total;
}

export interface DownloadProgress {
  total: number;
  downloaded: number;
  failed: number;
}

/**
 * Download and cache tiles for a bounding box across zoom levels.
 * Calls `onProgress` after each tile. Returns when all tiles are attempted.
 */
export async function downloadTiles(
  bbox: { minLng: number; minLat: number; maxLng: number; maxLat: number },
  tileUrlTemplate: string, // e.g. "https://tile.opentopomap.org/{z}/{x}/{y}.png"
  minZoom = 10,
  maxZoom = 16,
  onProgress?: (progress: DownloadProgress) => void,
  signal?: AbortSignal
): Promise<DownloadProgress> {
  const allTiles: Array<{ z: number; x: number; y: number }> = [];
  for (let z = minZoom; z <= maxZoom; z++) {
    allTiles.push(...tilesForBbox(bbox, z));
  }

  const progress: DownloadProgress = { total: allTiles.length, downloaded: 0, failed: 0 };

  for (const tile of allTiles) {
    if (signal?.aborted) break;

    // Skip already-cached tiles
    if (await hasTile(tile.z, tile.x, tile.y)) {
      progress.downloaded++;
      onProgress?.({ ...progress });
      continue;
    }

    const url = tileUrlTemplate
      .replace('{z}', String(tile.z))
      .replace('{x}', String(tile.x))
      .replace('{y}', String(tile.y));

    try {
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.arrayBuffer();
      await putTile(tile.z, tile.x, tile.y, data);
      progress.downloaded++;
    } catch {
      progress.failed++;
    }
    onProgress?.({ ...progress });
  }

  return progress;
}
