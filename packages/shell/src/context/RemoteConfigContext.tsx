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
declare global {
  interface Window {
    __REMOTE_CONFIG__?: Record<string, string>;
    __getFirebaseIdToken?: () => Promise<string | null>;
    __getAppCheckToken?: () => Promise<string | null>;
    __worshipSongs?: {
      getAll: () => Promise<any[]>;
      get: (id: string) => Promise<any>;
      add: (song: Record<string, any>) => Promise<string>;
      update: (id: string, updates: Record<string, any>) => Promise<void>;
      delete: (id: string) => Promise<void>;
    };
  }
}

export function RemoteConfigProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<RemoteConfigState>({ config: {}, loading: true });

  useEffect(() => {
    initRemoteConfig().then((config) => {
      // Expose on window so remote MFEs can read it without shared React context
      window.__REMOTE_CONFIG__ = config;
      setState({ config, loading: false });
    });
  }, []);

  return (
    <RemoteConfigContext.Provider value={state}>
      {children}
    </RemoteConfigContext.Provider>
  );
}
