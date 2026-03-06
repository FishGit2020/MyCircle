import NodeCache from 'node-cache';
import { fetchUscisStatus } from '../uscisApi.js';

// USCIS case status cache (4 hour TTL, same as the old REST endpoint)
const uscisCache = new NodeCache({ stdTTL: 14400 });

// ─── Immigration Query Resolvers ──────────────────────────────

export function createImmigrationQueryResolvers() {
  return {
    checkCaseStatus: async (_: any, { receiptNumber }: { receiptNumber: string }) => {
      const rn = (receiptNumber || '').trim().toUpperCase();
      if (!/^[A-Z]{3}\d{10}$/.test(rn)) throw new Error('Invalid receipt number format');
      const cached = uscisCache.get<any>(rn);
      if (cached) return cached;
      const result = await fetchUscisStatus(rn);
      uscisCache.set(rn, result);
      return result;
    },
  };
}
