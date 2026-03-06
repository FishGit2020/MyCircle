import { useState, useEffect, useCallback } from 'react';
import { TemperatureUnit, SpeedUnit, DistanceUnit, getStoredUnits } from '../utils/weatherHelpers';
import { WindowEvents, StorageKeys } from '../utils/eventBus';

export function useUnits() {
  const [units, setUnits] = useState(getStoredUnits);

  useEffect(() => {
    const handler = () => setUnits(getStoredUnits());
    window.addEventListener(WindowEvents.UNITS_CHANGED, handler);
    return () => window.removeEventListener(WindowEvents.UNITS_CHANGED, handler);
  }, []);

  const setTempUnit = useCallback((unit: TemperatureUnit) => {
    localStorage.setItem(StorageKeys.TEMP_UNIT, unit);
    setUnits(prev => ({ ...prev, tempUnit: unit }));
    window.dispatchEvent(new Event(WindowEvents.UNITS_CHANGED));
  }, []);

  const setSpeedUnit = useCallback((unit: SpeedUnit) => {
    localStorage.setItem(StorageKeys.SPEED_UNIT, unit);
    setUnits(prev => ({ ...prev, speedUnit: unit }));
    window.dispatchEvent(new Event(WindowEvents.UNITS_CHANGED));
  }, []);

  const setDistanceUnit = useCallback((unit: DistanceUnit) => {
    localStorage.setItem(StorageKeys.DISTANCE_UNIT, unit);
    setUnits(prev => ({ ...prev, distanceUnit: unit }));
    window.dispatchEvent(new Event(WindowEvents.UNITS_CHANGED));
  }, []);

  return { ...units, setTempUnit, setSpeedUnit, setDistanceUnit };
}
