import React, { useState, useCallback } from 'react';
import { eventBus, MFEvents, WindowEvents, StorageKeys, SpeedUnit } from '@weather/shared';

const SPEED_CYCLE: SpeedUnit[] = ['ms', 'kmh', 'mph'];
const SPEED_LABELS: Record<SpeedUnit, string> = { ms: 'm/s', kmh: 'km/h', mph: 'mph' };

export default function SpeedToggle() {
  const [speedUnit, setSpeedUnit] = useState<SpeedUnit>(() => {
    try { return (localStorage.getItem(StorageKeys.SPEED_UNIT) as SpeedUnit) || 'ms'; } catch { return 'ms'; }
  });

  const toggle = useCallback(() => {
    const idx = SPEED_CYCLE.indexOf(speedUnit);
    const newUnit = SPEED_CYCLE[(idx + 1) % SPEED_CYCLE.length];
    setSpeedUnit(newUnit);
    localStorage.setItem(StorageKeys.SPEED_UNIT, newUnit);
    eventBus.publish(MFEvents.THEME_CHANGED, { speedUnit: newUnit });
    window.dispatchEvent(new Event(WindowEvents.UNITS_CHANGED));
  }, [speedUnit]);

  return (
    <button
      onClick={toggle}
      className="px-2 py-1 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
      title={`Speed: ${SPEED_LABELS[speedUnit]}`}
      aria-label={`Speed unit: ${SPEED_LABELS[speedUnit]}`}
    >
      {SPEED_LABELS[speedUnit]}
    </button>
  );
}
