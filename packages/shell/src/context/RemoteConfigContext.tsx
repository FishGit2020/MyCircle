import React, { createContext, useContext, useEffect, useState } from 'react';
import { initRemoteConfig } from '../lib/remoteConfig';

interface RemoteConfigState {
  config: Record<string, string>;
  loading: boolean;
}

const RemoteConfigContext = createContext<RemoteConfigState>({
  config: {},
  loading: true,
});

export function useRemoteConfigContext() {
  return useContext(RemoteConfigContext);
}

// Augment window type for cross-MFE access

export function RemoteConfigProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<RemoteConfigState>({ config: {}, loading: true });

  useEffect(() => {
    initRemoteConfig().then((config) => {
      // Expose on window so remote MFEs can read it without shared React context
      window.__REMOTE_CONFIG__ = config;
      setState({ config, loading: false });
    }).catch(() => {
      // Fallback: defaults already applied in initRemoteConfig, just stop loading
      setState((prev) => ({ ...prev, loading: false }));
    });
  }, []);

  return (
    <RemoteConfigContext.Provider value={state}>
      {children}
    </RemoteConfigContext.Provider>
  );
}
