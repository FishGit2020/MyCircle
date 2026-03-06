/**
 * Unified type declarations for all custom window globals used across MFEs.
 *
 * The shell (firebase.ts / AuthContext / RemoteConfigContext) sets these at
 * runtime so that federated micro-frontends can access Firebase services
 * without importing Firebase directly.
 */

export {};

declare global {
  interface Window {
    /* ── Auth & Config ─────────────────────────────────────── */
    __getFirebaseIdToken?: () => Promise<string | null>;
    __getAppCheckToken?: () => Promise<string | null>;
    __isAdmin?: boolean;
    __currentUid?: string | null;
    __REMOTE_CONFIG__?: Record<string, string>;
    __digitalLibraryApiBase?: () => string;
    __logAnalyticsEvent?: (eventName: string, params?: Record<string, any>) => void;

    /* ── Worship Songs ─────────────────────────────────────── */
    __worshipSongs?: {
      getAll: () => Promise<any[]>;
      get: (id: string) => Promise<any>;
      add: (song: Record<string, any>) => Promise<string>;
      update: (id: string, updates: Record<string, any>) => Promise<void>;
      delete: (id: string) => Promise<void>;
      subscribe?: (callback: (songs: any[]) => void) => () => void;
    };

    /* ── Notebook ──────────────────────────────────────────── */
    __notebook?: {
      getAll: () => Promise<any[]>;
      get: (id: string) => Promise<any>;
      add: (note: { title: string; content: string }) => Promise<string>;
      update: (id: string, updates: Partial<{ title: string; content: string }>) => Promise<void>;
      delete: (id: string) => Promise<void>;
    };

    /* ── Flashcards ────────────────────────────────────────── */
    __flashcards?: {
      getAll: () => Promise<any[]>;
      add: (card: Record<string, any>) => Promise<string>;
      addBatch: (cards: Array<Record<string, any>>) => Promise<void>;
      update: (id: string, updates: Record<string, any>) => Promise<void>;
      delete: (id: string) => Promise<void>;
      subscribe: (callback: (cards: any[]) => void) => () => void;
      getProgress: () => Promise<any>;
      updateProgress: (progress: Record<string, any>) => Promise<void>;
      getAllPublic: () => Promise<any[]>;
      subscribePublic: (callback: (cards: any[]) => void) => () => void;
      publish: (card: Record<string, any>) => Promise<string>;
      deletePublic: (id: string) => Promise<void>;
      migrateChineseToPublic: () => Promise<void>;
    };

    /* ── Chinese Characters ────────────────────────────────── */
    __chineseCharacters?: {
      getAll: () => Promise<Array<{ id: string; character: string; pinyin: string; meaning: string; category: string }>>;
      add: (char: Record<string, any>) => Promise<string>;
      update: (id: string, updates: Record<string, any>) => Promise<void>;
      delete: (id: string) => Promise<void>;
      subscribe: (callback: (chars: any[]) => void) => () => void;
    };

    /* ── Work Tracker ──────────────────────────────────────── */
    __workTracker?: {
      getAll: () => Promise<any[]>;
      add: (entry: { date: string; content: string }) => Promise<string>;
      update: (id: string, updates: Partial<{ content: string; date: string }>) => Promise<void>;
      delete: (id: string) => Promise<void>;
      subscribe?: (callback: (entries: any[]) => void) => () => void;
    };

    /* ── Hiking Routes ─────────────────────────────────────── */
    __hikingRoutes?: {
      getAll: () => Promise<any[]>;
      add: (route: { name: string; distance: number; duration: number; geometry: object; startLabel?: string; endLabel?: string }) => Promise<string>;
      update: (id: string, updates: { name?: string }) => Promise<void>;
      delete: (id: string) => Promise<void>;
      subscribe: (callback: (routes: any[]) => void) => () => void;
    };

    /* ── Immigration Tracker ───────────────────────────────── */
    __immigrationTracker?: {
      getAll: () => Promise<any[]>;
      add: (data: { receiptNumber: string; formType: string; nickname: string }) => Promise<string>;
      delete: (id: string) => Promise<void>;
      subscribe?: (callback: (cases: any[]) => void) => () => void;
    };

    /* ── Cloud Files ───────────────────────────────────────── */
    __cloudFiles?: {
      getAll: () => Promise<any[]>;
      subscribe: (callback: (files: any[]) => void) => () => void;
      upload: (fileName: string, fileBase64: string, contentType: string) => Promise<{ fileId: string; downloadUrl: string }>;
      share: (fileId: string) => Promise<{ ok: boolean; downloadUrl: string }>;
      delete: (fileId: string) => Promise<{ ok: boolean }>;
      getAllShared: () => Promise<any[]>;
      subscribeShared: (callback: (files: any[]) => void) => () => void;
      deleteShared: (fileId: string) => Promise<{ ok: boolean }>;
    };

    /* ── Baby Photos ───────────────────────────────────────── */
    __babyPhotos?: {
      upload: (stageId: number, file: Blob, caption?: string) => Promise<string>;
      getAll: () => Promise<Array<{ id: string; photoUrl: string; caption?: string; uploadedAt?: any }>>;
      delete: (stageId: number) => Promise<void>;
    };

    /* ── Family Games ──────────────────────────────────────── */
    __familyGames?: {
      getScores: (gameType: string) => Promise<any[]>;
      subscribe: (gameType: string, callback: (scores: any[]) => void) => () => void;
      saveScore: (data: { gameType: string; score: number; timeMs: number; difficulty: string }) => Promise<void>;
    };

    /* ── DevTools / Testing ────────────────────────────────── */
    __APOLLO_CLIENT__?: any;
    __signInForTest?: (email: string, password: string) => Promise<any>;

    /* ── Third-party (injected by external scripts) ────────── */
    Capacitor?: {
      isNativePlatform: () => boolean;
      getPlatform: () => string;
      isPluginAvailable: (name: string) => boolean;
    };
    grecaptcha?: {
      ready(callback: () => void): void;
      execute(siteKey: string, options: { action: string }): Promise<string>;
    };
  }
}
