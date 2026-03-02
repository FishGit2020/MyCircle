import { useState, useCallback } from 'react';
import type { CaseStatus } from '../types';

export function useCaseStatus() {
  const [statuses, setStatuses] = useState<Map<string, CaseStatus>>(new Map());
  const [loadingReceipt, setLoadingReceipt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async (receiptNumber: string) => {
    setLoadingReceipt(receiptNumber);
    setError(null);
    try {
      const token = await window.__getFirebaseIdToken?.();
      if (!token) throw new Error('Not authenticated');

      const baseUrl = window.location.hostname === 'localhost'
        ? 'http://localhost:5001/mycircle-app/us-central1'
        : '';
      const res = await fetch(`${baseUrl}/api/uscis/status?receiptNumber=${encodeURIComponent(receiptNumber)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `HTTP ${res.status}`);
      }

      const data: CaseStatus = await res.json();
      setStatuses(prev => {
        const next = new Map(prev);
        next.set(receiptNumber, data);
        return next;
      });
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch status');
      return null;
    } finally {
      setLoadingReceipt(null);
    }
  }, []);

  return {
    statuses,
    loadingReceipt,
    error,
    fetchStatus,
  };
}
