import { lazy, type ComponentType } from 'react';
import type { FirebasePerformance } from 'firebase/performance';
import { trace } from 'firebase/performance';

/**
 * Wraps React.lazy() with a Firebase Performance trace that measures
 * how long each micro-frontend chunk takes to download + evaluate.
 *
 * @param name   Trace name shown in Firebase Console (e.g. "mfe_weather_load")
 * @param importFn  The dynamic import function, e.g. () => import('weatherDisplay/WeatherDisplay')
 * @param getPerf   A getter that returns the current FirebasePerformance instance (or null).
 *                   Using a getter avoids capturing a stale `null` before Firebase initializes.
 */
export function tracedLazy<T extends ComponentType<any>>(
  name: string,
  importFn: () => Promise<{ default: T }>,
  getPerf: () => FirebasePerformance | null,
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    const perf = getPerf();
    if (!perf) return importFn();

    const t = trace(perf, name);
    t.start();
    try {
      const mod = await importFn();
      t.stop();
      return mod;
    } catch (err) {
      t.stop();
      throw err;
    }
  });
}
