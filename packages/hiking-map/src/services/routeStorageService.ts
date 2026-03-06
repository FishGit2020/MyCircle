/**
 * Route storage service — uses Firebase (window.__hikingRoutes) when the user
 * is logged in, falls back to IndexedDB for unauthenticated / offline use.
 */
import { openDB } from 'idb';
import type { IDBPDatabase } from 'idb';

const DB_NAME = 'hiking-map-routes';
const STORE = 'saved-routes';
const DB_VERSION = 1;

export interface SavedRoute {
  id: string;
  name: string;
  createdAt: number; // Unix ms
  distance: number; // meters
  duration: number; // seconds
  geometry: GeoJSON.LineString;
  startLabel?: string;
  endLabel?: string;
}

// ─── IndexedDB fallback ────────────────────────────────────────────────────

type RouteDb = IDBPDatabase<{ 'saved-routes': { key: string; value: SavedRoute } }>;
let dbPromise: Promise<RouteDb> | null = null;

function getDb(): Promise<RouteDb> {
  if (!dbPromise) {
    dbPromise = openDB<any>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

function normalizeRoute(raw: Record<string, any>): SavedRoute {
  return {
    id: raw.id,
    name: raw.name ?? 'Route',
    createdAt: raw.createdAt?.toMillis?.() ?? raw.createdAt ?? Date.now(),
    distance: raw.distance ?? 0,
    duration: raw.duration ?? 0,
    geometry: raw.geometry as GeoJSON.LineString,
    startLabel: raw.startLabel,
    endLabel: raw.endLabel,
  };
}

// ─── Public API ────────────────────────────────────────────────────────────

/** Save a route. Uses Firebase if authenticated, IndexedDB otherwise. */
export async function saveRoute(route: Omit<SavedRoute, 'id' | 'createdAt'>): Promise<SavedRoute> {
  const fb = window.__hikingRoutes;
  if (fb) {
    const id = await fb.add({
      name: route.name,
      distance: route.distance,
      duration: route.duration,
      geometry: route.geometry,
      startLabel: route.startLabel,
      endLabel: route.endLabel,
    });
    return { ...route, id, createdAt: Date.now() };
  }
  // IndexedDB fallback
  const db = await getDb();
  const full: SavedRoute = {
    ...route,
    id: `route-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
  };
  await db.put(STORE, full);
  return full;
}

/** List routes. Uses Firebase if authenticated, IndexedDB otherwise. */
export async function listRoutes(): Promise<SavedRoute[]> {
  const fb = window.__hikingRoutes;
  if (fb) {
    const raw = await fb.getAll();
    return raw.map(normalizeRoute);
  }
  const db = await getDb();
  const all = await db.getAll(STORE);
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

/** Delete a route. */
export async function deleteRoute(id: string): Promise<void> {
  const fb = window.__hikingRoutes;
  if (fb) return fb.delete(id);
  const db = await getDb();
  await db.delete(STORE, id);
}

/** Rename a route. Firebase only (IndexedDB routes auto-named). */
export async function renameRoute(id: string, name: string): Promise<void> {
  const fb = window.__hikingRoutes;
  if (fb) return fb.update(id, { name });
}

/**
 * Subscribe to real-time route updates.
 * Returns an unsubscribe function. No-op for IndexedDB.
 */
export function subscribeRoutes(callback: (routes: SavedRoute[]) => void): () => void {
  const fb = window.__hikingRoutes;
  if (fb) {
    return fb.subscribe((raw) => callback(raw.map(normalizeRoute)));
  }
  return () => {};
}
