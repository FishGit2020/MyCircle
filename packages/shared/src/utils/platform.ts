/**
 * Platform detection utilities for Capacitor native apps.
 *
 * Uses the `window.Capacitor` global injected by the native shell at runtime
 * rather than importing `@capacitor/core` — keeps the shared bundle lightweight
 * for web users where Capacitor is absent.
 */

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform: () => boolean;
      getPlatform: () => string;
      isPluginAvailable: (name: string) => boolean;
    };
  }
}

/** Returns `true` when running inside a Capacitor native shell (iOS/Android). */
export function isNativePlatform(): boolean {
  return typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform();
}

/** Returns the current platform: `'ios'`, `'android'`, or `'web'`. */
export function getPlatform(): 'ios' | 'android' | 'web' {
  if (typeof window === 'undefined' || !window.Capacitor) return 'web';
  const p = window.Capacitor.getPlatform();
  if (p === 'ios' || p === 'android') return p;
  return 'web';
}

/** Checks whether a Capacitor plugin is available in the current runtime. */
export function isPluginAvailable(name: string): boolean {
  return typeof window !== 'undefined' && !!window.Capacitor?.isPluginAvailable(name);
}
