import { getRemoteConfig, fetchAndActivate, getValue, RemoteConfig } from 'firebase/remote-config';
import { app } from './firebase';

let remoteConfig: RemoteConfig | null = null;

// Default values for all remote config parameters
const defaults: Record<string, string | number | boolean> = {
  new_exp: 'control', // 'control' | 'variant_a' — A/B test for weather card layout
};

export async function initRemoteConfig(): Promise<Record<string, string>> {
  if (!app) {
    // Firebase not configured — return defaults as strings
    return Object.fromEntries(
      Object.entries(defaults).map(([k, v]) => [k, String(v)])
    );
  }

  remoteConfig = getRemoteConfig(app);
  remoteConfig.settings.minimumFetchIntervalMillis = 3600000; // 1 hour

  // Set defaults so the app works even if fetch fails
  remoteConfig.defaultConfig = defaults as Record<string, string>;

  try {
    await fetchAndActivate(remoteConfig);
  } catch (err) {
    console.warn('Remote Config fetch failed, using defaults:', err);
  }

  // Return all config values as a flat string map
  const result: Record<string, string> = {};
  for (const key of Object.keys(defaults)) {
    result[key] = getValue(remoteConfig, key).asString();
  }
  return result;
}
