/**
 * Route storage service.
 * - Personal routes: Firebase (window.__hikingRoutes) when logged in, IndexedDB fallback
 * - Public/shared routes: Firebase only (requires login to view or share)
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
  distance: number;  // meters
  duration: number;  // seconds
  geometry: GeoJSON.LineString;
  startLabel?: string;
  endLabel?: string;
  sharedId?: string | null; // set when this route is also in publicHikingRoutes
}

export interface PublicRoute {
  id: string;
  name: string;
  distance: number;
  duration: number;
  geometry: GeoJSON.LineString;
  startLabel?: string;
  endLabel?: string;
  sharedBy: { uid: string; displayName: string };
  sharedAt: number;
}

// ─── IndexedDB fallback ────────────────────────────────────────────────────

type RouteDb = IDBPDatabase<{ 'saved-routes': { key: string; value: SavedRoute } }>;
let dbPromise: Promise<RouteDb> | null = null;

function getDb(): Promise<RouteDb> {
  if (!dbPromise) {
    dbPromise = openDB<any>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
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
    sharedId: raw.sharedId ?? null,
  };
}

function normalizePublicRoute(raw: Record<string, any>): PublicRoute {
  return {
    id: raw.id,
    name: raw.name ?? 'Route',
    distance: raw.distance ?? 0,
    duration: raw.duration ?? 0,
    geometry: raw.geometry as GeoJSON.LineString,
    startLabel: raw.startLabel,
    endLabel: raw.endLabel,
    sharedBy: raw.sharedBy ?? { uid: '', displayName: 'Unknown' },
    sharedAt: raw.sharedAt?.toMillis?.() ?? raw.sharedAt ?? Date.now(),
  };
}

// ─── Personal routes ───────────────────────────────────────────────────────

export async function saveRoute(route: Omit<SavedRoute, 'id' | 'createdAt' | 'sharedId'>): Promise<SavedRoute> {
  const fb = window.__hikingRoutes;
  if (fb) {
    const id = await fb.add({ name: route.name, distance: route.distance, duration: route.duration, geometry: route.geometry, startLabel: route.startLabel, endLabel: route.endLabel });
    return { ...route, id, createdAt: Date.now(), sharedId: null };
  }
  const db = await getDb();
  const full: SavedRoute = { ...route, id: `route-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: Date.now(), sharedId: null };
  await db.put(STORE, full);
  return full;
}

export async function listRoutes(): Promise<SavedRoute[]> {
  const fb = window.__hikingRoutes;
  if (fb) return (await fb.getAll()).map(normalizeRoute);
  const db = await getDb();
  return (await db.getAll(STORE)).sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteRoute(id: string): Promise<void> {
  const fb = window.__hikingRoutes;
  if (fb) return fb.delete(id);
  const db = await getDb();
  await db.delete(STORE, id);
}

export async function renameRoute(id: string, name: string): Promise<void> {
  const fb = window.__hikingRoutes;
  if (fb) return fb.update(id, { name });
}

export function subscribeRoutes(callback: (routes: SavedRoute[]) => void): () => void {
  const fb = window.__hikingRoutes;
  if (fb) return fb.subscribe((raw) => callback(raw.map(normalizeRoute)));
  return () => {};
}

// ─── Share / unshare ───────────────────────────────────────────────────────

export async function shareRoute(route: SavedRoute): Promise<void> {
  const fb = window.__hikingRoutes;
  if (!fb) throw new Error('Not authenticated');
  await fb.share(route.id, {
    name: route.name, distance: route.distance, duration: route.duration,
    geometry: route.geometry, startLabel: route.startLabel, endLabel: route.endLabel,
  });
}

export async function unshareRoute(routeId: string): Promise<void> {
  const fb = window.__hikingRoutes;
  if (!fb) throw new Error('Not authenticated');
  await fb.unshare(routeId);
}

// ─── Public/community routes ───────────────────────────────────────────────

export async function listPublicRoutes(): Promise<PublicRoute[]> {
  const fb = window.__hikingRoutes;
  if (!fb) return [];
  return (await fb.getAllPublic()).map(normalizePublicRoute);
}

export function subscribePublicRoutes(callback: (routes: PublicRoute[]) => void): () => void {
  const fb = window.__hikingRoutes;
  if (!fb) return () => {};
  return fb.subscribePublic((raw) => callback(raw.map(normalizePublicRoute)));
}
