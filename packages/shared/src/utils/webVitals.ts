import type { Metric } from 'web-vitals';

/**
 * Report Web Vitals (LCP, FID, CLS, INP, TTFB) for performance monitoring.
 * In production, reports via navigator.sendBeacon to /api/vitals (if available).
 * In development, logs to console for debugging.
 */
export function reportWebVitals() {
  // Dynamic import to keep web-vitals out of the critical path
  import('web-vitals').then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
    const handler = (metric: Metric) => {
      const route = window.location.pathname;

      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log(`[Web Vitals] ${metric.name}: ${metric.value.toFixed(1)} (${route})`);
        return;
      }

      // In production, send via beacon if available
      const body = JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
        route,
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/vitals', body);
      }
    };

    onCLS(handler);
    onINP(handler);
    onLCP(handler);
    onFCP(handler);
    onTTFB(handler);
  });
}
