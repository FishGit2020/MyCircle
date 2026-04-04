import { getFirestore } from 'firebase-admin/firestore';

export interface NasConnectionConfig {
  nasUrl: string;
  username: string;
  password: string;
  destFolder: string;
  status: string;
  lastTestedAt?: string;
}

export class NasFileStationClient {
  private sid: string | null = null;

  constructor(private baseUrl: string) {}

  async login(username: string, password: string): Promise<void> {
    const url = new URL('/webapi/auth.cgi', this.baseUrl);
    url.searchParams.set('api', 'SYNO.API.Auth');
    url.searchParams.set('version', '3');
    url.searchParams.set('method', 'login');
    url.searchParams.set('account', username);
    url.searchParams.set('passwd', password);
    url.searchParams.set('session', 'FileStation');
    url.searchParams.set('format', 'sid');

    const resp = await fetch(url.toString(), {
      method: 'GET',
      signal: AbortSignal.timeout(15_000),
    });
    if (!resp.ok) {
      throw new Error(`NAS login HTTP error: ${resp.status}`);
    }
    const data = await resp.json() as { success: boolean; data?: { sid: string }; error?: { code: number } };
    if (!data.success || !data.data?.sid) {
      throw new Error(`NAS login failed: error code ${data.error?.code ?? 'unknown'}`);
    }
    this.sid = data.data.sid;
  }

  async logout(): Promise<void> {
    if (!this.sid) return;
    try {
      const url = new URL('/webapi/auth.cgi', this.baseUrl);
      url.searchParams.set('api', 'SYNO.API.Auth');
      url.searchParams.set('version', '3');
      url.searchParams.set('method', 'logout');
      url.searchParams.set('session', 'FileStation');
      url.searchParams.set('_sid', this.sid);
      await fetch(url.toString(), { signal: AbortSignal.timeout(10_000) });
    } catch {
      // Logout failures are non-fatal
    } finally {
      this.sid = null;
    }
  }

  /** Create a folder. Treats error code 1101 (already exists) as success. */
  async createFolder(folderPath: string, name: string): Promise<void> {
    if (!this.sid) throw new Error('Not logged in');
    const url = new URL('/webapi/entry.cgi', this.baseUrl);
    const body = new URLSearchParams({
      api: 'SYNO.FileStation.CreateFolder',
      version: '2',
      method: 'create',
      folder_path: `["${folderPath}"]`,
      name: `["${name}"]`,
      force_parent: 'true',
      _sid: this.sid,
    });
    const resp = await fetch(url.toString(), {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(15_000),
    });
    if (!resp.ok) throw new Error(`NAS createFolder HTTP error: ${resp.status}`);
    const data = await resp.json() as { success: boolean; error?: { code: number } };
    // Error 1101 = folder already exists — treat as success
    if (!data.success && data.error?.code !== 1101) {
      throw new Error(`NAS createFolder failed: error code ${data.error?.code ?? 'unknown'}`);
    }
  }

  /** Upload a buffer to the NAS via FileStation Upload API. */
  async upload(destFolder: string, fileName: string, buffer: Buffer): Promise<void> {
    if (!this.sid) throw new Error('Not logged in');
    const url = new URL('/webapi/entry.cgi', this.baseUrl);
    url.searchParams.set('api', 'SYNO.FileStation.Upload');
    url.searchParams.set('version', '2');
    url.searchParams.set('method', 'upload');
    url.searchParams.set('_sid', this.sid);

    const formData = new FormData();
    formData.append('path', destFolder);
    formData.append('create_parents', 'true');
    formData.append('overwrite', 'true');
    const blob = new Blob([new Uint8Array(buffer)], { type: 'audio/mpeg' });
    formData.append('file', blob, fileName);

    const resp = await fetch(url.toString(), {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(120_000),
    });
    if (!resp.ok) throw new Error(`NAS upload HTTP error: ${resp.status}`);
    const data = await resp.json() as { success: boolean; error?: { code: number } };
    if (!data.success) {
      throw new Error(`NAS upload failed: error code ${data.error?.code ?? 'unknown'}`);
    }
  }

  /** Download a file from the NAS via FileStation Download API. Returns a Buffer. */
  async download(filePath: string): Promise<Buffer> {
    if (!this.sid) throw new Error('Not logged in');
    const url = new URL('/webapi/entry.cgi', this.baseUrl);
    url.searchParams.set('api', 'SYNO.FileStation.Download');
    url.searchParams.set('version', '2');
    url.searchParams.set('method', 'download');
    url.searchParams.set('path', JSON.stringify([filePath]));
    url.searchParams.set('mode', 'download');
    url.searchParams.set('_sid', this.sid);

    const resp = await fetch(url.toString(), {
      signal: AbortSignal.timeout(120_000),
    });
    if (!resp.ok) throw new Error(`NAS download HTTP error: ${resp.status}`);
    const arrayBuffer = await resp.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

/** Test a NAS connection by logging in and attempting to list the destination folder. */
export async function testNasConnection(
  config: NasConnectionConfig,
): Promise<{ ok: boolean; error?: string }> {
  const client = new NasFileStationClient(config.nasUrl);
  try {
    await client.login(config.username, config.password);
    // List the dest folder as a connectivity check
    const url = new URL('/webapi/entry.cgi', config.nasUrl);
    url.searchParams.set('api', 'SYNO.FileStation.List');
    url.searchParams.set('version', '2');
    url.searchParams.set('method', 'list_share');
    // @ts-ignore — sid is private but we access via the workaround below
    const sid = (client as any).sid as string;
    url.searchParams.set('_sid', sid);
    const resp = await fetch(url.toString(), { signal: AbortSignal.timeout(15_000) });
    if (!resp.ok) return { ok: false, error: `HTTP ${resp.status}` };
    const data = await resp.json() as { success: boolean; error?: { code: number } };
    if (!data.success) return { ok: false, error: `FileStation error code ${data.error?.code}` };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || String(err) };
  } finally {
    await client.logout();
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
