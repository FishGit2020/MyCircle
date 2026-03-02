import { useState, useEffect, useCallback } from 'react';
import { WindowEvents } from '@mycircle/shared';
import type { ImmigrationCase } from '../types';

declare global {
  interface Window {
    __immigrationTracker?: {
      getAll: () => Promise<ImmigrationCase[]>;
      add: (data: { receiptNumber: string; formType: string; nickname: string }) => Promise<string>;
      delete: (id: string) => Promise<void>;
      subscribe?: (callback: (cases: ImmigrationCase[]) => void) => () => void;
    };
    __getFirebaseIdToken?: () => Promise<string | null>;
  }
}

export function useCases() {
  const [cases, setCases] = useState<ImmigrationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      try {
        const token = await window.__getFirebaseIdToken?.();
        if (mounted) setIsAuthenticated(!!token);
      } catch {
        if (mounted) setIsAuthenticated(false);
      }
      if (mounted) setAuthChecked(true);
    };
    checkAuth();
    const handler = () => { checkAuth(); };
    window.addEventListener(WindowEvents.AUTH_STATE_CHANGED, handler);
    return () => { mounted = false; window.removeEventListener(WindowEvents.AUTH_STATE_CHANGED, handler); };
  }, []);

  const loadCases = useCallback(async () => {
    setLoading(true);
    try {
      if (window.__immigrationTracker) {
        const data = await window.__immigrationTracker.getAll();
        setCases(data);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    if (window.__immigrationTracker?.subscribe) {
      let received = false;
      const unsubscribe = window.__immigrationTracker.subscribe((data) => {
        received = true;
        setCases(data);
        setLoading(false);
      });
      const timeout = setTimeout(() => {
        if (!received) setLoading(false);
      }, 3000);
      return () => { unsubscribe(); clearTimeout(timeout); };
    }

    loadCases();
  }, [loadCases, isAuthenticated]);

  const addCase = useCallback(async (data: { receiptNumber: string; formType: string; nickname: string }) => {
    if (!window.__immigrationTracker) throw new Error('Immigration tracker API not available');
    return await window.__immigrationTracker.add(data);
  }, []);

  const deleteCase = useCallback(async (id: string) => {
    if (!window.__immigrationTracker) throw new Error('Immigration tracker API not available');
    await window.__immigrationTracker.delete(id);
  }, []);

  return {
    cases,
    loading,
    isAuthenticated,
    authChecked,
    addCase,
    deleteCase,
    refresh: loadCases,
  };
}
