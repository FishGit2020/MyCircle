import React, { useState, useCallback } from 'react';
import { eventBus, MFEvents, WindowEvents, StorageKeys } from '@weather/shared';
import { useAuth } from '../context/AuthContext';

export default function UnitToggle() {
  const { user, updateTempUnit } = useAuth();
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>(() => {
    try { return (localStorage.getItem(StorageKeys.TEMP_UNIT) as 'C' | 'F') || 'C'; } catch { return 'C'; }
  });

  const toggle = useCallback(() => {
    const newUnit = tempUnit === 'C' ? 'F' : 'C';
    setTempUnit(newUnit);
    localStorage.setItem(StorageKeys.TEMP_UNIT, newUnit);
    // Notify MFEs about the unit change
    eventBus.publish(MFEvents.THEME_CHANGED, { tempUnit: newUnit });
    // Force re-render across the app
    window.dispatchEvent(new Event(WindowEvents.UNITS_CHANGED));
    // Persist to Firestore if signed in
    if (user) {
      updateTempUnit(newUnit);
    }
  }, [tempUnit, user, updateTempUnit]);

  return (
    <button
      onClick={toggle}
      className="px-2 py-1 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
      title={`Switch to °${tempUnit === 'C' ? 'F' : 'C'}`}
    >
      °{tempUnit}
    </button>
  );
}
