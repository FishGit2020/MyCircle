import { useState, useEffect, useCallback } from 'react';
import { StorageKeys, WindowEvents } from '@mycircle/shared';
import type { TravelPin } from '../types';

function loadFromStorage(): TravelPin[] {
  try {
    const raw = localStorage.getItem(StorageKeys.TRAVEL_PINS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* ignore */ }
  return [];
}

export function useTravelPins() {
  const [pins, setPins] = useState<TravelPin[]>(loadFromStorage);

  // Subscribe to Firestore bridge if available
  useEffect(() => {
    const bridge = window.__travelPins;
    if (bridge) {
      const unsub = bridge.subscribe((data: TravelPin[]) => {
        setPins(data);
        try {
          localStorage.setItem(StorageKeys.TRAVEL_PINS, JSON.stringify(data));
        } catch { /* ignore */ }
      });
      return unsub;
    }

    // Fallback: listen for window events (localStorage-only mode)
    function handleChange() {
      setPins(loadFromStorage());
    }
    window.addEventListener(WindowEvents.TRAVEL_PINS_CHANGED, handleChange);
    return () => window.removeEventListener(WindowEvents.TRAVEL_PINS_CHANGED, handleChange);
  }, []);

  const addPin = useCallback(async (pin: Omit<TravelPin, 'id' | 'createdAt'>) => {
    const bridge = window.__travelPins;
    if (bridge) {
      await bridge.add(pin);
    } else {
      // localStorage fallback
      const current = loadFromStorage();
      const newPin: TravelPin = {
        ...pin,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
      };
      const next = [...current, newPin];
      localStorage.setItem(StorageKeys.TRAVEL_PINS, JSON.stringify(next));
      window.dispatchEvent(new Event(WindowEvents.TRAVEL_PINS_CHANGED));
      setPins(next);
    }
  }, []);

  const updatePin = useCallback(async (id: string, updates: Partial<Omit<TravelPin, 'id'>>) => {
    const bridge = window.__travelPins;
    if (bridge) {
      await bridge.update(id, updates);
    } else {
      const current = loadFromStorage();
      const next = current.map((p) => (p.id === id ? { ...p, ...updates } : p));
      localStorage.setItem(StorageKeys.TRAVEL_PINS, JSON.stringify(next));
      window.dispatchEvent(new Event(WindowEvents.TRAVEL_PINS_CHANGED));
      setPins(next);
    }
  }, []);

  const deletePin = useCallback(async (id: string) => {
    const bridge = window.__travelPins;
    if (bridge) {
      await bridge.delete(id);
    } else {
      const current = loadFromStorage();
      const next = current.filter((p) => p.id !== id);
      localStorage.setItem(StorageKeys.TRAVEL_PINS, JSON.stringify(next));
      window.dispatchEvent(new Event(WindowEvents.TRAVEL_PINS_CHANGED));
      setPins(next);
    }
  }, []);

  return { pins, addPin, updatePin, deletePin };
}
