import { useState, useEffect, useCallback } from 'react';
import { TemperatureUnit, SpeedUnit, getStoredUnits } from '../utils/weatherHelpers';

export function useUnits() {
  const [units, setUnits] = useState(getStoredUnits);

  useEffect(() => {
    const handler = () => setUnits(getStoredUnits());
    window.addEventListener('units-changed', handler);
    return () => window.removeEventListener('units-changed', handler);
  }, []);

  const setTempUnit = useCallback((unit: TemperatureUnit) => {
    localStorage.setItem('tempUnit', unit);
    setUnits(prev => ({ ...prev, tempUnit: unit }));
    window.dispatchEvent(new Event('units-changed'));
  }, []);

  const setSpeedUnit = useCallback((unit: SpeedUnit) => {
    localStorage.setItem('speedUnit', unit);
    setUnits(prev => ({ ...prev, speedUnit: unit }));
    window.dispatchEvent(new Event('units-changed'));
  }, []);

  return { ...units, setTempUnit, setSpeedUnit };
}
