import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { logger } from 'firebase-functions/v2';
import { GoogleAuth } from 'google-auth-library';

interface ResolverContext {
  uid?: string;
}

function requireAuth(context: ResolverContext): string {
  if (!context?.uid) throw new Error('Authentication required');
  return context.uid;
}

// ─── Free-tier limits ────────────────────────────────────────────────────────

const FREE_TIER = {
  cloudRun: { requests: 2_000_000 },
  functions: { invocations: 2_000_000 },
  storage: { bytes: 1_073_741_824, bandwidthBytes: 10_737_418_240 }, // 1 GB, 10 GB
  firestore: { readsPerDay: 50_000, writesPerDay: 20_000, deletesPerDay: 20_000 },
  tts: { wavenet: 4_000_000, neural2: 1_000_000, chirp3: 1_000_000 },
  artifactRegistry: { bytes: 536_870_912 }, // 0.5 GB
  hosting: { bytes: 10_737_418_240, dailyDownloadBytes: 377_487_360 }, // 10 GB, 360 MB/day
};

const COST_PER_UNIT = {
  cloudRun: { per1MRequests: 0.40 },
  functions: { per1MInvocations: 0.40 },
  storage: { perGBStored: 0.026, perGBBandwidth: 0.12 },
  firestore: { per100KReads: 0.06, per100KWrites: 0.18, per100KDeletes: 0.02 },
  tts: { wavenet: 0.000016, neural2: 0.000016, chirp3: 0.00003 },
  artifactRegistry: { perGB: 0.10 },
  hosting: { perGBStored: 0.026, perGBBandwidth: 0.15 },
};

function calcMtdCost(used: number, free: number, costPerUnit: number, unitSize: number): number {
  const overage = Math.max(0, used - free);
  return parseFloat(((overage / unitSize) * costPerUnit).toFixed(4));
}

function calcProjected(mtd: number, elapsedDays: number, daysInMonth: number): number {
  if (elapsedDays <= 0) return 0;
  return parseFloat(((mtd / elapsedDays) * daysInMonth).toFixed(4));
}

function getDaysInMonth(now: Date): number {
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

function getMonthStart(now: Date): string {
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

function getDayStart(now: Date): string {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

// ─── GCP API helpers ─────────────────────────────────────────────────────────

const PROJECT_ID = 'mycircle-dash';

async function getAccessToken(): Promise<string> {
  const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
  const token = await auth.getAccessToken();
  return token || '';
}

async function fetchMonitoringTimeSeries(
  token: string,
  filter: string,
  startTime: string,
  endTime: string,
  groupBy?: string[],
): Promise<any[]> {
  const params = new URLSearchParams({
    filter,
    'interval.startTime': startTime,
    'interval.endTime': endTime,
    'aggregation.alignmentPeriod': `${(new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000}s`,
    'aggregation.crossSeriesReducer': 'REDUCE_SUM',
    'aggregation.perSeriesAligner': 'ALIGN_SUM',
  });
  if (groupBy) groupBy.forEach(g => params.append('aggregation.groupByFields', g));

  const url = `https://monitoring.googleapis.com/v3/projects/${PROJECT_ID}/timeSeries?${params}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloud Monitoring error (${res.status}): ${text.slice(0, 200)}`);
  }
  const json: any = await res.json();
  return json.timeSeries || [];
}

function sumTimeSeries(series: any[]): number {
  return series.reduce((sum: number, ts: any) => {
    return sum + (ts.points || []).reduce((s: number, p: any) => s + (p.value?.int64Value ? parseInt(p.value.int64Value, 10) : (p.value?.doubleValue || 0)), 0);
  }, 0);
}

// ─── Collectors ──────────────────────────────────────────────────────────────

async function collectCloudRunRequests(token: string, now: Date) {
  const series = await fetchMonitoringTimeSeries(
    token,
    'metric.type="run.googleapis.com/request_count"',
    getMonthStart(now),
    now.toISOString(),
    ['resource.labels.service_name'],
  );
  const byService = series.map((ts: any) => ({
    serviceName: ts.resource?.labels?.service_name || 'unknown',
    requests: (ts.points || []).reduce((s: number, p: any) => s + (parseInt(p.value?.int64Value || '0', 10)), 0),
  }));
  const totalRequests = byService.reduce((s: number, b: any) => s + b.requests, 0);
  const mtdCostUsd = calcMtdCost(totalRequests, FREE_TIER.cloudRun.requests, COST_PER_UNIT.cloudRun.per1MRequests, 1_000_000);
  return { totalRequests, byService, freeTierLimit: FREE_TIER.cloudRun.requests, mtdCostUsd };
}

async function collectFunctionsInvocations(token: string, now: Date) {
  const series = await fetchMonitoringTimeSeries(
    token,
    'metric.type="cloudfunctions.googleapis.com/function/execution_count"',
    getMonthStart(now),
    now.toISOString(),
    ['resource.labels.function_name'],
  );
  const byFunction = series.map((ts: any) => ({
    functionName: ts.resource?.labels?.function_name || 'unknown',
    invocations: (ts.points || []).reduce((s: number, p: any) => s + (parseInt(p.value?.int64Value || '0', 10)), 0),
  }));
  const totalInvocations = byFunction.reduce((s: number, b: any) => s + b.invocations, 0);
  const mtdCostUsd = calcMtdCost(totalInvocations, FREE_TIER.functions.invocations, COST_PER_UNIT.functions.per1MInvocations, 1_000_000);
  return { totalInvocations, byFunction, freeTierLimit: FREE_TIER.functions.invocations, mtdCostUsd };
}

async function collectStorageSizes(token: string, now: Date) {
  const bucket = getStorage().bucket();
  const [files] = await bucket.getFiles({ autoPaginate: true });
  const folderMap: Record<string, number> = {};
  let totalBytes = 0;
  for (const file of files) {
    const size = parseInt((file.metadata as any).size || '0', 10);
    totalBytes += size;
    const folder = file.name.includes('/') ? file.name.split('/')[0] : '(root)';
    folderMap[folder] = (folderMap[folder] || 0) + size;
  }
  const byFolder = Object.entries(folderMap).map(([folder, bytes]) => ({ folder, bytes }));

  // Bandwidth via Cloud Monitoring
  let bandwidthBytes = 0;
  try {
    const bwSeries = await fetchMonitoringTimeSeries(
      token,
      'metric.type="storage.googleapis.com/network/sent_bytes_count"',
      getMonthStart(now),
      now.toISOString(),
    );
    bandwidthBytes = sumTimeSeries(bwSeries);
  } catch {
    logger.warn('quota: could not fetch storage bandwidth, defaulting to 0');
  }

  const storageCost = calcMtdCost(totalBytes, FREE_TIER.storage.bytes, COST_PER_UNIT.storage.perGBStored, 1_073_741_824);
  const bandwidthCost = calcMtdCost(bandwidthBytes, FREE_TIER.storage.bandwidthBytes, COST_PER_UNIT.storage.perGBBandwidth, 1_073_741_824);
  const mtdCostUsd = parseFloat((storageCost + bandwidthCost).toFixed(4));
  return {
    totalBytes,
    byFolder,
    bandwidthBytes,
    freeTierStorageBytes: FREE_TIER.storage.bytes,
    freeTierBandwidthBytes: FREE_TIER.storage.bandwidthBytes,
    mtdCostUsd,
  };
}

async function collectFirestoreMetrics(token: string, now: Date) {
  const dayStart = getDayStart(now);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const ops = ['read_count', 'write_count', 'delete_count'] as const;
  const results: Record<string, { today: number; peak7d: number; freeTierLimit: number; exceeded7d: boolean }> = {};

  for (const op of ops) {
    let today = 0;
    let peak7d = 0;
    try {
      // Today's usage
      const todaySeries = await fetchMonitoringTimeSeries(
        token,
        `metric.type="firestore.googleapis.com/document/${op}"`,
        dayStart,
        now.toISOString(),
      );
      today = sumTimeSeries(todaySeries);

      // 7-day daily breakdown for peak
      const params7d = new URLSearchParams({
        filter: `metric.type="firestore.googleapis.com/document/${op}"`,
        'interval.startTime': sevenDaysAgo,
        'interval.endTime': now.toISOString(),
        'aggregation.alignmentPeriod': '86400s',
        'aggregation.crossSeriesReducer': 'REDUCE_SUM',
        'aggregation.perSeriesAligner': 'ALIGN_SUM',
      });
      const url7d = `https://monitoring.googleapis.com/v3/projects/${PROJECT_ID}/timeSeries?${params7d}`;
      const res7d = await fetch(url7d, { headers: { Authorization: `Bearer ${token}` } });
      if (res7d.ok) {
        const json7d: any = await res7d.json();
        const allPoints: number[] = (json7d.timeSeries || []).flatMap((ts: any) =>
          (ts.points || []).map((p: any) => p.value?.int64Value ? parseInt(p.value.int64Value, 10) : (p.value?.doubleValue || 0))
        );
        peak7d = allPoints.length ? Math.max(...allPoints) : 0;
      }
    } catch (err) {
      logger.warn(`quota: could not fetch firestore ${op}`, err);
    }

    const key = op === 'read_count' ? 'reads' : op === 'write_count' ? 'writes' : 'deletes';
    const limit = op === 'read_count' ? FREE_TIER.firestore.readsPerDay : op === 'write_count' ? FREE_TIER.firestore.writesPerDay : FREE_TIER.firestore.deletesPerDay;
    results[key] = { today, peak7d, freeTierLimit: limit, exceeded7d: peak7d > limit };
  }

  // Firestore cost: approximate monthly from today's reads/writes/deletes
  // Daily overage × 30 days estimate
  const readOveragePerDay = Math.max(0, results.reads.today - FREE_TIER.firestore.readsPerDay);
  const writeOveragePerDay = Math.max(0, results.writes.today - FREE_TIER.firestore.writesPerDay);
  const mtdCostUsd = parseFloat((
    readOveragePerDay * 30 * (COST_PER_UNIT.firestore.per100KReads / 100_000) +
    writeOveragePerDay * 30 * (COST_PER_UNIT.firestore.per100KWrites / 100_000)
  ).toFixed(4));

  return { reads: results.reads, writes: results.writes, deletes: results.deletes, mtdCostUsd };
}

async function collectTtsQuota(uid: string) {
  const db = getFirestore();
  const month = new Date().toISOString().slice(0, 7);
  const snap = await db.collection('ttsUsage').doc(month).get();
  const data = snap.data() || {};
  const ws = data.wavenet_standard ?? 0;
  const np = data.neural2_polyglot ?? 0;
  const c3 = data.chirp3 ?? 0;
  const TTS_LIMITS = { wavenet_standard: FREE_TIER.tts.wavenet, neural2_polyglot: FREE_TIER.tts.neural2, chirp3: FREE_TIER.tts.chirp3 };
  return {
    wavenetStandard: { used: ws, limit: TTS_LIMITS.wavenet_standard, remaining: Math.max(0, TTS_LIMITS.wavenet_standard - ws) },
    neural2Polyglot: { used: np, limit: TTS_LIMITS.neural2_polyglot, remaining: Math.max(0, TTS_LIMITS.neural2_polyglot - np) },
    chirp3:          { used: c3, limit: TTS_LIMITS.chirp3,           remaining: Math.max(0, TTS_LIMITS.chirp3           - c3) },
  };
}

async function collectArtifactRegistry(token: string) {
  const url = `https://artifactregistry.googleapis.com/v1/projects/${PROJECT_ID}/locations/-/repositories`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Artifact Registry error (${res.status})`);
  const json: any = await res.json();
  const repos: any[] = json.repositories || [];
  const byRepository = repos.map((r: any) => ({
    repository: r.name?.split('/').pop() || 'unknown',
    bytes: r.sizeBytes ? parseFloat(r.sizeBytes) : 0,
  }));
  const totalBytes = byRepository.reduce((s: number, r: any) => s + r.bytes, 0);
  const mtdCostUsd = calcMtdCost(totalBytes, FREE_TIER.artifactRegistry.bytes, COST_PER_UNIT.artifactRegistry.perGB, 1_073_741_824);
  return { totalBytes, byRepository, freeTierBytes: FREE_TIER.artifactRegistry.bytes, mtdCostUsd };
}

async function collectHostingMetrics(token: string, now: Date) {
  // Firebase Hosting storage is not easily available via Cloud Monitoring.
  // Try to get download bandwidth; gracefully degrade if unavailable.
  let dailyDownloadBytes: number | null = null;
  let storageBytes: number | null = null;
  let unavailable = false;

  try {
    const dayStart = getDayStart(now);
    const dlSeries = await fetchMonitoringTimeSeries(
      token,
      'metric.type="firebasehosting.googleapis.com/network/sent_bytes_count"',
      dayStart,
      now.toISOString(),
    );
    dailyDownloadBytes = sumTimeSeries(dlSeries);
  } catch {
    unavailable = true;
    logger.warn('quota: Firebase Hosting metrics unavailable via Cloud Monitoring');
  }

  const dlCost = dailyDownloadBytes !== null
    ? calcMtdCost(dailyDownloadBytes, FREE_TIER.hosting.dailyDownloadBytes, COST_PER_UNIT.hosting.perGBBandwidth, 1_073_741_824)
    : 0;
  const storageCost = storageBytes !== null
    ? calcMtdCost(storageBytes, FREE_TIER.hosting.bytes, COST_PER_UNIT.hosting.perGBStored, 1_073_741_824)
    : 0;
  const mtdCostUsd = parseFloat((dlCost + storageCost).toFixed(4));

  return {
    storageBytes,
    dailyDownloadBytes,
    freeTierStorageBytes: FREE_TIER.hosting.bytes,
    freeTierDailyDownloadBytes: FREE_TIER.hosting.dailyDownloadBytes,
    mtdCostUsd,
    unavailable,
  };
}

// ─── Snapshot builder ────────────────────────────────────────────────────────

function snapshotFromDoc(doc: FirebaseFirestore.DocumentSnapshot): any {
  const d = doc.data();
  if (!d) return null;
  return { id: doc.id, ...d };
}

// ─── Resolvers ───────────────────────────────────────────────────────────────

export function createQuotaQueryResolvers() {
  return {
    quotaSnapshots: async (_: unknown, { limit = 10 }: { limit?: number }, context: ResolverContext) => {
      requireAuth(context);
      const clampedLimit = Math.min(Math.max(1, limit), 90);
      const db = getFirestore();
      const snap = await db
        .collection(`quotaSnapshots`)
        .orderBy('collectedAt', 'desc')
        .limit(clampedLimit)
        .get();
      const snapshots = snap.docs.map(snapshotFromDoc).filter(Boolean);
      return { snapshots, total: snap.size };
    },
  };
}

export function createQuotaMutationResolvers() {
  return {
    collectQuotaSnapshot: async (_: unknown, __: unknown, context: ResolverContext) => {
      const uid = requireAuth(context);
      const now = new Date();
      const elapsedDays = now.getDate();
      const daysInMonth = getDaysInMonth(now);
      const errors: string[] = [];

      let token = '';
      try {
        token = await getAccessToken();
      } catch (err) {
        logger.error('quota: failed to get GCP access token', err);
        throw new Error('GCP credentials unavailable');
      }

      // Run all 7 collectors in parallel, tolerate individual failures
      const [
        cloudRunResult,
        functionsResult,
        storageResult,
        firestoreResult,
        ttsResult,
        artifactResult,
        hostingResult,
      ] = await Promise.allSettled([
        collectCloudRunRequests(token, now),
        collectFunctionsInvocations(token, now),
        collectStorageSizes(token, now),
        collectFirestoreMetrics(token, now),
        collectTtsQuota(uid),
        collectArtifactRegistry(token),
        collectHostingMetrics(token, now),
      ]);

      const serviceNames = ['Cloud Run', 'Firebase Functions', 'Firebase Storage', 'Cloud Firestore', 'TTS', 'Artifact Registry', 'Firebase Hosting'];
      const results = [cloudRunResult, functionsResult, storageResult, firestoreResult, ttsResult, artifactResult, hostingResult];
      results.forEach((r, i) => { if (r.status === 'rejected') { errors.push(serviceNames[i]); logger.error(`quota: ${serviceNames[i]} failed`, r.reason); } });

      const cloudRun = cloudRunResult.status === 'fulfilled' ? cloudRunResult.value : { totalRequests: 0, byService: [], freeTierLimit: FREE_TIER.cloudRun.requests, mtdCostUsd: 0 };
      const functions = functionsResult.status === 'fulfilled' ? functionsResult.value : { totalInvocations: 0, byFunction: [], freeTierLimit: FREE_TIER.functions.invocations, mtdCostUsd: 0 };
      const storage = storageResult.status === 'fulfilled' ? storageResult.value : { totalBytes: 0, byFolder: [], bandwidthBytes: 0, freeTierStorageBytes: FREE_TIER.storage.bytes, freeTierBandwidthBytes: FREE_TIER.storage.bandwidthBytes, mtdCostUsd: 0 };
      const firestore = firestoreResult.status === 'fulfilled' ? firestoreResult.value : { reads: { today: 0, peak7d: 0, freeTierLimit: FREE_TIER.firestore.readsPerDay, exceeded7d: false }, writes: { today: 0, peak7d: 0, freeTierLimit: FREE_TIER.firestore.writesPerDay, exceeded7d: false }, deletes: { today: 0, peak7d: 0, freeTierLimit: FREE_TIER.firestore.deletesPerDay, exceeded7d: false }, mtdCostUsd: 0 };
      const tts = ttsResult.status === 'fulfilled' ? ttsResult.value : { wavenetStandard: { used: 0, limit: FREE_TIER.tts.wavenet, remaining: FREE_TIER.tts.wavenet }, neural2Polyglot: { used: 0, limit: FREE_TIER.tts.neural2, remaining: FREE_TIER.tts.neural2 }, chirp3: { used: 0, limit: FREE_TIER.tts.chirp3, remaining: FREE_TIER.tts.chirp3 } };
      const artifactRegistry = artifactResult.status === 'fulfilled' ? artifactResult.value : { totalBytes: 0, byRepository: [], freeTierBytes: FREE_TIER.artifactRegistry.bytes, mtdCostUsd: 0 };
      const hosting = hostingResult.status === 'fulfilled' ? hostingResult.value : { storageBytes: null, dailyDownloadBytes: null, freeTierStorageBytes: FREE_TIER.hosting.bytes, freeTierDailyDownloadBytes: FREE_TIER.hosting.dailyDownloadBytes, mtdCostUsd: 0, unavailable: true };

      // TTS cost calculation
      const ttsMtd = parseFloat((
        calcMtdCost(tts.wavenetStandard.used, FREE_TIER.tts.wavenet, COST_PER_UNIT.tts.wavenet, 1) +
        calcMtdCost(tts.neural2Polyglot.used, FREE_TIER.tts.neural2, COST_PER_UNIT.tts.neural2, 1) +
        calcMtdCost(tts.chirp3.used, FREE_TIER.tts.chirp3, COST_PER_UNIT.tts.chirp3, 1)
      ).toFixed(4));
      const ttsMtdWithCost = { ...tts, mtdCostUsd: ttsMtd, projectedCostUsd: calcProjected(ttsMtd, elapsedDays, daysInMonth) };

      // Add projected costs to each service
      const cloudRunFull = { ...cloudRun, projectedCostUsd: calcProjected(cloudRun.mtdCostUsd, elapsedDays, daysInMonth) };
      const functionsFull = { ...functions, projectedCostUsd: calcProjected(functions.mtdCostUsd, elapsedDays, daysInMonth) };
      const storageFull = { ...storage, projectedCostUsd: calcProjected(storage.mtdCostUsd, elapsedDays, daysInMonth) };
      const firestoreFull = { ...firestore, projectedCostUsd: calcProjected(firestore.mtdCostUsd, elapsedDays, daysInMonth) };
      const artifactFull = { ...artifactRegistry, projectedCostUsd: calcProjected(artifactRegistry.mtdCostUsd, elapsedDays, daysInMonth) };
      const hostingFull = { ...hosting, projectedCostUsd: calcProjected(hosting.mtdCostUsd, elapsedDays, daysInMonth) };

      const totalMtdCostUsd = parseFloat((cloudRun.mtdCostUsd + functions.mtdCostUsd + storage.mtdCostUsd + firestore.mtdCostUsd + ttsMtd + artifactRegistry.mtdCostUsd + hosting.mtdCostUsd).toFixed(4));
      const totalProjectedCostUsd = calcProjected(totalMtdCostUsd, elapsedDays, daysInMonth);

      const snapshot = {
        collectedAt: now.toISOString(),
        elapsedDays,
        daysInMonth,
        cloudRun: cloudRunFull,
        functions: functionsFull,
        storage: storageFull,
        firestore: firestoreFull,
        tts: ttsMtdWithCost,
        artifactRegistry: artifactFull,
        hosting: hostingFull,
        totalMtdCostUsd,
        totalProjectedCostUsd,
        errors,
      };

      // Save to Firestore
      const db = getFirestore();
      const colRef = db.collection(`quotaSnapshots`);
      const docRef = await colRef.add(snapshot);

      // Prune to 90 snapshots
      const allSnaps = await colRef.orderBy('collectedAt', 'asc').get();
      if (allSnaps.size > 90) {
        const toDelete = allSnaps.docs.slice(0, allSnaps.size - 90);
        const batch = db.batch();
        toDelete.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }

      return { id: docRef.id, ...snapshot };
    },

    dumpQuotaToSql: async (_: unknown, __: unknown, context: ResolverContext) => {
      const uid = requireAuth(context);
      const db = getFirestore();

      // Get most recent snapshot
      const snap = await db.collection(`quotaSnapshots`).orderBy('collectedAt', 'desc').limit(1).get();
      if (snap.empty) throw new Error('No snapshot available — collect a snapshot first');
      const snapshot = { id: snap.docs[0].id, ...snap.docs[0].data() };

      // Lazy import to avoid loading pg unless SQL is configured
      const { createSqlClient, getCachedSqlConfig } = await import('../sqlClient.js');
      const { logQuotaToSql } = await import('../sqlWriter.js');

      const config = await getCachedSqlConfig(uid);
      if (!config) throw new Error('SQL connection not configured — set up SQL Analytics first');
      const client = createSqlClient(config);
      try {
        await logQuotaToSql(client, snapshot as any);
      } finally {
        // SqlProxyClient has no explicit close; HTTP-based
      }
      return true;
    },
  };
}
