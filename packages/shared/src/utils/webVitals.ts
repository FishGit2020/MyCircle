import type { Metric } from 'web-vitals';

type AnalyticsLogger = (eventName: string, params?: Record<string, any>) => void;

/**
 * Report Web Vitals (LCP, CLS, INP, FCP, TTFB) for performance monitoring.
 * Accepts an optional analytics logger (e.g. Firebase logEvent) to send metrics
 * to Google Analytics in production. Falls back to console.log in development.
 */
export function reportWebVitals(analyticsLogger?: AnalyticsLogger) {
  // Dynamic import to keep web-vitals out of the critical path
  import('web-vitals').then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
    const handler = (metric: Metric) => {
      const route = window.location.pathname;

      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log(`[Web Vitals] ${metric.name}: ${metric.value.toFixed(1)} (${route})`);
        return;
      }

      // Send to Google Analytics via the provided logger
      if (analyticsLogger) {
        analyticsLogger('web_vitals', {
          metric_name: metric.name,
          metric_value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          metric_rating: metric.rating,
          metric_delta: Math.round(metric.delta),
          metric_id: metric.id,
          route,
        });
      }
    };

    onCLS(handler);
    onINP(handler);
    onLCP(handler);
    onFCP(handler);
    onTTFB(handler);
  });
}
