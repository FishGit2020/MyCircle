import { useState, useEffect } from 'react';

declare global {
  interface Window {
    __REMOTE_CONFIG__?: Record<string, string>;
  }
}

/**
 * Reads Firebase Remote Config values from window.__REMOTE_CONFIG__.
 * Works across micro frontend boundaries (no shared React context needed).
 */
export function useRemoteConfig(): Record<string, string> {
  const [config, setConfig] = useState<Record<string, string>>(
    () => (typeof window !== 'undefined' && window.__REMOTE_CONFIG__) || {}
  );

  useEffect(() => {
    // Poll briefly in case the shell hasn't set values yet
    if (Object.keys(config).length > 0) return;

    const interval = setInterval(() => {
      if (window.__REMOTE_CONFIG__) {
        setConfig({ ...window.__REMOTE_CONFIG__ });
        clearInterval(interval);
      }
    }, 100);

    // Stop polling after 5 seconds
    const timeout = setTimeout(() => clearInterval(interval), 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [config]);

  return config;
}
