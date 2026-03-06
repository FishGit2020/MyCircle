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

type RouteDb = IDBPDatabase<{
  'saved-routes': {
    key: string;
    value: SavedRoute;
  };
}>;

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

export async function saveRoute(route: Omit<SavedRoute, 'id' | 'createdAt'>): Promise<SavedRoute> {
  const db = await getDb();
  const full: SavedRoute = {
    ...route,
    id: `route-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
  };
  await db.put(STORE, full);
  return full;
}

export async function listRoutes(): Promise<SavedRoute[]> {
  const db = await getDb();
  const all = await db.getAll(STORE);
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteRoute(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE, id);
}

export async function getRoute(id: string): Promise<SavedRoute | undefined> {
  const db = await getDb();
  return db.get(STORE, id);
}
