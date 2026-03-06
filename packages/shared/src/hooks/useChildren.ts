import { useState, useEffect, useCallback } from 'react';
import type { Child } from '../types/child';
import { StorageKeys, WindowEvents } from '../utils/eventBus';

/**
 * Hook for multi-child support.
 * Reads children from the window.__children bridge (Firestore-backed)
 * and falls back to localStorage cache for offline/unauthenticated use.
 *
 * @param ageFilter Optional [minMonths, maxMonths] range to filter children by age.
 */
export function useChildren(ageFilter?: [number, number]) {
  const [children, setChildren] = useState<Child[]>(() => {
    try {
      const cached = localStorage.getItem(StorageKeys.CHILDREN_CACHE);
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [selectedId, setSelectedIdState] = useState<string | null>(
    () => localStorage.getItem(StorageKeys.SELECTED_CHILD_ID),
  );
  const [loading, setLoading] = useState(true);

  // Subscribe to live changes via the bridge
  useEffect(() => {
    let unsubBridge: (() => void) | undefined;

    function handleChanged() {
      try {
        const cached = localStorage.getItem(StorageKeys.CHILDREN_CACHE);
        if (cached) setChildren(JSON.parse(cached));
        else setChildren([]);
      } catch { setChildren([]); }
      setLoading(false);
    }

    if (window.__children?.subscribe) {
      unsubBridge = window.__children.subscribe((list) => {
        setChildren(list);
        localStorage.setItem(StorageKeys.CHILDREN_CACHE, JSON.stringify(list));
        setLoading(false);
      });
    } else {
      // No bridge available — use the event-based fallback
      handleChanged();
    }

    window.addEventListener(WindowEvents.CHILDREN_CHANGED, handleChanged);
    return () => {
      unsubBridge?.();
      window.removeEventListener(WindowEvents.CHILDREN_CHANGED, handleChanged);
    };
  }, []);

  // Filter by age range
  const filtered = ageFilter
    ? children.filter((child) => {
        const months = getAgeInMonths(child.birthDate);
        return months >= ageFilter[0] && months <= ageFilter[1];
      })
    : children;

  const selectedChild = filtered.find((c) => c.id === selectedId) ?? filtered[0] ?? null;

  const setSelectedId = useCallback((id: string | null) => {
    setSelectedIdState(id);
    if (id) localStorage.setItem(StorageKeys.SELECTED_CHILD_ID, id);
    else localStorage.removeItem(StorageKeys.SELECTED_CHILD_ID);
  }, []);

  const addChild = useCallback(async (child: Omit<Child, 'id'>) => {
    if (!window.__children) return;
    const id = await window.__children.add(child);
    setSelectedId(id);
    return id;
  }, [setSelectedId]);

  const updateChild = useCallback(async (id: string, updates: Partial<Omit<Child, 'id'>>) => {
    if (!window.__children) return;
    await window.__children.update(id, updates);
  }, []);

  const deleteChild = useCallback(async (id: string) => {
    if (!window.__children) return;
    await window.__children.delete(id);
    if (selectedId === id) setSelectedId(null);
  }, [selectedId, setSelectedId]);

  return {
    children: filtered,
    allChildren: children,
    selectedChild,
    selectedId,
    setSelectedId,
    addChild,
    updateChild,
    deleteChild,
    loading,
  };
}

/** Calculate age in whole months from a YYYY-MM-DD birth date string. */
export function getAgeInMonths(birthDate: string): number {
  const birth = new Date(birthDate + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
  return Math.max(0, months);
}

/** Calculate remaining days within the current month-age. */
export function getAgeRemainingDays(birthDate: string): number {
  const months = getAgeInMonths(birthDate);
  const birth = new Date(birthDate + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = new Date(birth);
  monthStart.setMonth(monthStart.getMonth() + months);
  const diffMs = today.getTime() - monthStart.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}
