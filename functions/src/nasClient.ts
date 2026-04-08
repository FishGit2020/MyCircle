import { getFirestore } from 'firebase-admin/firestore';

export interface NasConnectionConfig {
  nasUrl: string;
  username: string;
  password: string;
  destFolder: string;
  status: string;
  lastTestedAt?: string;
}

export class NasWebDavClient {
  private authHeader: string;

  constructor(
    private baseUrl: string,
    username: string,
    password: string,
  ) {
    this.authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
  }

  private url(path: string): string {
    const cleanBase = this.baseUrl.replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
  }

  /** Create a folder via MKCOL. Treats 405 (already exists) as success. */
  async createFolder(folderPath: string): Promise<void> {
    const resp = await fetch(this.url(folderPath), {
      method: 'MKCOL',
      headers: { Authorization: this.authHeader },
      signal: AbortSignal.timeout(15_000),
    });
    // 201 = created, 405 = already exists — both OK
    if (!resp.ok && resp.status !== 405) {
      throw new Error(`NAS createFolder '${folderPath}' failed: HTTP ${resp.status}`);
    }
  }

  /** Upload a buffer to the NAS via WebDAV PUT. */
  async upload(destFolder: string, fileName: string, buffer: Buffer): Promise<void> {
    const filePath = `${destFolder}/${fileName}`;
    const resp = await fetch(this.url(filePath), {
      method: 'PUT',
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/octet-stream',
      },
      body: new Uint8Array(buffer),
      signal: AbortSignal.timeout(120_000),
    });
    // 201 = created, 204 = overwritten
    if (!resp.ok) {
      throw new Error(`NAS upload failed: HTTP ${resp.status}`);
    }
  }

  /** Download a file from the NAS via WebDAV GET. Returns a Buffer. */
  async download(filePath: string): Promise<Buffer> {
    const resp = await fetch(this.url(filePath), {
      method: 'GET',
      headers: { Authorization: this.authHeader },
      signal: AbortSignal.timeout(120_000),
    });
    if (!resp.ok) throw new Error(`NAS download failed: HTTP ${resp.status}`);
    const arrayBuffer = await resp.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

/** Test a NAS connection by checking the destination folder via WebDAV PROPFIND. */
export async function testNasConnection(
  config: NasConnectionConfig,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const baseUrl = config.nasUrl.replace(/\/$/, '');
    const folder = config.destFolder.startsWith('/') ? config.destFolder : `/${config.destFolder}`;
    const resp = await fetch(`${baseUrl}${folder}`, {
      method: 'PROPFIND',
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.username}:${config.password}`).toString('base64')}`,
        Depth: '0',
      },
      signal: AbortSignal.timeout(15_000),
    });
    // 207 Multi-Status = PROPFIND success
    if (resp.status === 207) return { ok: true };
    return { ok: false, error: `HTTP ${resp.status}` };
  } catch (err: any) {
    return { ok: false, error: err.message || String(err) };
  }
}

// In-memory cache for NAS connection configs (60s TTL)
const nasConfigCache = new Map<string, { config: NasConnectionConfig | null; expiry: number }>();
const CACHE_TTL_MS = 60_000;

export async function getCachedNasConfig(uid: string): Promise<NasConnectionConfig | null> {
  const cached = nasConfigCache.get(uid);
  if (cached && Date.now() < cached.expiry) return cached.config;

  const db = getFirestore();
  const doc = await db.doc(`users/${uid}/nasConnection/config`).get();
  const config = doc.exists ? (doc.data() as NasConnectionConfig) : null;
  nasConfigCache.set(uid, { config, expiry: Date.now() + CACHE_TTL_MS });
  return config;
}

export function clearNasConfigCache(uid: string): void {
  nasConfigCache.delete(uid);
}
