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
      // Personal routes
      getAll: () => Promise<any[]>;
      add: (route: { name: string; distance: number; duration: number; geometry: object; startLabel?: string; endLabel?: string }) => Promise<string>;
      update: (id: string, updates: Record<string, any>) => Promise<void>;
      delete: (id: string) => Promise<void>;
      subscribe: (callback: (routes: any[]) => void) => () => void;
      // Sharing
      share: (routeId: string, route: { name: string; distance: number; duration: number; geometry: object; startLabel?: string; endLabel?: string }) => Promise<void>;
      unshare: (routeId: string) => Promise<void>;
      // Public/community routes
      getAllPublic: () => Promise<any[]>;
      subscribePublic: (callback: (routes: any[]) => void) => () => void;
    };

    /* ── Immigration Tracker ───────────────────────────────── */
    __immigrationTracker?: {
      getAll: () => Promise<any[]>;
      add: (data: { receiptNumber: string; formType: string; nickname: string }) => Promise<string>;
      delete: (id: string) => Promise<void>;
      subscribe?: (callback: (cases: any[]) => void) => () => void;
    };

    /* ── Cloud Files ───────────────────────────────────────── */
    /* NOTE: list/share/delete are now served via GraphQL. Only upload remains as REST. */
    __cloudFiles?: {
      upload: (fileName: string, fileBase64: string, contentType: string) => Promise<{ fileId: string; downloadUrl: string }>;
    };

    /* ── Baby Photos ───────────────────────────────────────── */
    /* NOTE: list/delete are now served via GraphQL. Only upload remains as REST. */
    __babyPhotos?: {
      upload: (stageId: number, file: Blob, caption?: string) => Promise<string>;
    };

    /* ── Children (multi-child) ────────────────────────────── */
    __children?: {
      getAll: () => Promise<Array<import('./child').Child>>;
      add: (child: Omit<import('./child').Child, 'id'>) => Promise<string>;
      update: (id: string, updates: Partial<Omit<import('./child').Child, 'id'>>) => Promise<void>;
      delete: (id: string) => Promise<void>;
      subscribe: (callback: (children: Array<import('./child').Child>) => void) => () => void;
    };

    /* ── Family Games ──────────────────────────────────────── */
    __familyGames?: {
      getScores: (gameType: string) => Promise<any[]>;
      subscribe: (gameType: string, callback: (scores: any[]) => void) => () => void;
      saveScore: (data: { gameType: string; score: number; timeMs: number; difficulty: string }) => Promise<void>;
    };

    /* ── Trip Planner ──────────────────────────────────────── */
    __tripPlanner?: {
      getAll: () => Promise<any[]>;
      add: (trip: Record<string, unknown>) => Promise<string>;
      update: (id: string, updates: Record<string, unknown>) => Promise<void>;
      delete: (id: string) => Promise<void>;
      subscribe: (callback: (trips: any[]) => void) => () => void;
    };

    /* ── Poll System ──────────────────────────────────────── */
    __pollSystem?: {
      getAll: () => Promise<any[]>;
      add: (poll: Record<string, unknown>) => Promise<string>;
      delete: (id: string) => Promise<void>;
      vote: (pollId: string, optionId: string) => Promise<void>;
      subscribe: (callback: (polls: any[]) => void) => () => void;
    };

    /* ── Interview Sessions ──────────────────────────────────── */
    __interviewApi?: {
      save: (session: {
        sessionId: string;
        question: string;
        document: string;
        messages: Array<{ id: string; role: string; content: string; timestamp: number }>;
      }) => Promise<{ ok: boolean; sessionId: string }>;
      list: () => Promise<{
        sessions: Array<{
          id: string;
          questionPreview: string;
          messageCount: number;
          updatedAt: number | null;
          createdAt: number | null;
        }>;
      }>;
      load: (sessionId: string) => Promise<{
        session: {
          id: string;
          question: string;
          document: string;
          messages: Array<{ id: string; role: string; content: string; timestamp: number }>;
        };
      }>;
      delete: (sessionId: string) => Promise<{ ok: boolean }>;
    };

    /* ── Trash / Recycle Bin ───────────────────────────────── */
    __trash?: {
      getAll: () => Promise<Record<string, Array<{ id: string; type: string; name: string; deletedAt: number | null; collectionPath: string }>>>;
      restore: (type: string, id: string) => Promise<void>;
      permanentlyDelete: (type: string, id: string) => Promise<void>;
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
