import { getRemoteConfig, fetchAndActivate, getValue, RemoteConfig } from 'firebase/remote-config';
import { createLogger } from '@mycircle/shared';
import { app } from './firebase';

const logger = createLogger('remoteConfig');

let remoteConfig: RemoteConfig | null = null;

// Default values for all remote config parameters
const defaults: Record<string, string | number | boolean> = {
  new_exp: 'control', // 'control' | 'variant_a' — A/B test for weather card layout
};

const defaultStrings: Record<string, string> = Object.fromEntries(
  Object.entries(defaults).map(([k, v]) => [k, String(v)])
);

export async function initRemoteConfig(): Promise<Record<string, string>> {
  if (!app) {
    return { ...defaultStrings };
  }

  try {
    remoteConfig = getRemoteConfig(app);
    remoteConfig.settings.minimumFetchIntervalMillis = 3600000; // 1 hour
    remoteConfig.defaultConfig = defaults as Record<string, string>;
  } catch (err) {
    // getRemoteConfig can fail if IndexedDB is corrupted or locked
    logger.warn('Remote Config init failed (IndexedDB?), using defaults:', err);
    window.dispatchEvent(new Event('indexeddb-error'));
    return { ...defaultStrings };
  }

  try {
    await fetchAndActivate(remoteConfig);
  } catch (err) {
    logger.warn('Remote Config fetch failed, using defaults:', err);
    if (String(err).includes('storage-open') || String(err).includes('indexedDB')) {
      window.dispatchEvent(new Event('indexeddb-error'));
    }
  }

  // Return all config values as a flat string map
  const result: Record<string, string> = {};
  for (const key of Object.keys(defaults)) {
    result[key] = getValue(remoteConfig, key).asString();
  }
  return result;
}
