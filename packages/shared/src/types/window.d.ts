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
    __logAnalyticsEvent?: (eventName: string, params?: Record<string, any>) => void; // eslint-disable-line @typescript-eslint/no-explicit-any

    /* ── Notebook ──────────────────────────────────────────── */
    __notebook?: {
      getAll: () => Promise<any[]>; // eslint-disable-line @typescript-eslint/no-explicit-any
      get: (id: string) => Promise<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
      add: (note: { title: string; content: string }) => Promise<string>;
      update: (id: string, updates: Partial<{ title: string; content: string }>) => Promise<void>;
      delete: (id: string) => Promise<void>;
    };

    /* ── Flashcard Decks (Spaced Repetition) ──────────────── */
    __flashcardDecks?: {
      // Decks
      getAll: () => Promise<Array<{ id: string; name: string; languagePair?: string; createdAt: number; updatedAt: number }>>;
      subscribe: (callback: (decks: Array<{ id: string; name: string; languagePair?: string; createdAt: number; updatedAt: number }>) => void) => () => void;
      create: (deck: { name: string; languagePair?: string }) => Promise<string>;
      update: (id: string, updates: { name?: string; languagePair?: string }) => Promise<void>;
      delete: (id: string) => Promise<void>;
      // Deck cards (SR state)
      getDeckCards: (deckId: string) => Promise<Array<{ cardId: string; interval: number; easeFactor: number; repetitions: number; dueDate: number; maturity: 'new' | 'learning' | 'mature'; addedAt: number; lastReviewedAt?: number }>>;
      subscribeDeckCards: (deckId: string, callback: (cards: Array<{ cardId: string; interval: number; easeFactor: number; repetitions: number; dueDate: number; maturity: 'new' | 'learning' | 'mature'; addedAt: number; lastReviewedAt?: number }>) => void) => () => void;
      addCard: (deckId: string, cardId: string) => Promise<void>;
      removeCard: (deckId: string, cardId: string) => Promise<void>;
      updateCardSR: (deckId: string, cardId: string, update: { interval: number; easeFactor: number; repetitions: number; dueDate: number; maturity: 'new' | 'learning' | 'mature'; lastReviewedAt: number }) => Promise<void>;
      // Sessions
      saveSession: (session: { deckId: string; startTime: number; completedTime: number; cardsReviewed: number; ratings: { again: number; hard: number; good: number; easy: number } }) => Promise<void>;
      // Streak
      getStreak: () => Promise<{ currentStreak: number; longestStreak: number; lastReviewDate: string } | null>;
      updateStreak: (localDate: string) => Promise<{ currentStreak: number; longestStreak: number; lastReviewDate: string }>;
    };

    /* ── Flashcards ────────────────────────────────────────── */
    __flashcards?: {
      getAll: () => Promise<any[]>; // eslint-disable-line @typescript-eslint/no-explicit-any
      add: (card: Record<string, any>) => Promise<string>; // eslint-disable-line @typescript-eslint/no-explicit-any
      addBatch: (cards: Array<Record<string, any>>) => Promise<void>; // eslint-disable-line @typescript-eslint/no-explicit-any
      update: (id: string, updates: Record<string, any>) => Promise<void>; // eslint-disable-line @typescript-eslint/no-explicit-any
      delete: (id: string) => Promise<void>;
      subscribe: (callback: (cards: any[]) => void) => () => void; // eslint-disable-line @typescript-eslint/no-explicit-any
      getProgress: () => Promise<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
      updateProgress: (progress: Record<string, any>) => Promise<void>; // eslint-disable-line @typescript-eslint/no-explicit-any
      getAllPublic: () => Promise<any[]>; // eslint-disable-line @typescript-eslint/no-explicit-any
      subscribePublic: (callback: (cards: any[]) => void) => () => void; // eslint-disable-line @typescript-eslint/no-explicit-any
      publish: (card: Record<string, any>) => Promise<string>; // eslint-disable-line @typescript-eslint/no-explicit-any
      deletePublic: (id: string) => Promise<void>;
    };

    /* ── Chinese Characters ────────────────────────────────── */
    __chineseCharacters?: {
      getAll: () => Promise<Array<{ id: string; character: string; pinyin: string; meaning: string; category: string }>>;
      add: (char: Record<string, any>) => Promise<string>; // eslint-disable-line @typescript-eslint/no-explicit-any
      update: (id: string, updates: Record<string, any>) => Promise<void>; // eslint-disable-line @typescript-eslint/no-explicit-any
      delete: (id: string) => Promise<void>;
      subscribe: (callback: (chars: any[]) => void) => () => void; // eslint-disable-line @typescript-eslint/no-explicit-any
    };

    /* ── Work Tracker ──────────────────────────────────────── */
    __workTracker?: {
      getAll: () => Promise<any[]>; // eslint-disable-line @typescript-eslint/no-explicit-any
      add: (entry: { date: string; content: string; mood?: string; tags?: string[] }) => Promise<string>;
      update: (id: string, updates: Partial<{ content: string; date: string; mood: string; tags: string[] }>) => Promise<void>;
      delete: (id: string) => Promise<void>;
      subscribe?: (callback: (entries: any[]) => void) => () => void; // eslint-disable-line @typescript-eslint/no-explicit-any
    };

    /* ── Hiking Routes ─────────────────────────────────────── */
    __hikingRoutes?: {
      // Personal routes
      getAll: () => Promise<any[]>; // eslint-disable-line @typescript-eslint/no-explicit-any
      add: (route: { name: string; distance: number; duration: number; geometry: object; startLabel?: string; endLabel?: string }) => Promise<string>;
      update: (id: string, updates: Record<string, any>) => Promise<void>; // eslint-disable-line @typescript-eslint/no-explicit-any
      delete: (id: string) => Promise<void>;
      subscribe: (callback: (routes: any[]) => void) => () => void; // eslint-disable-line @typescript-eslint/no-explicit-any
      // Sharing
      share: (routeId: string, route: { name: string; distance: number; duration: number; geometry: object; startLabel?: string; endLabel?: string }) => Promise<void>;
      unshare: (routeId: string) => Promise<void>;
      // Public/community routes
      getAllPublic: () => Promise<any[]>; // eslint-disable-line @typescript-eslint/no-explicit-any
      subscribePublic: (callback: (routes: any[]) => void) => () => void; // eslint-disable-line @typescript-eslint/no-explicit-any
    };

    /* ── Immigration Tracker ───────────────────────────────── */
    __immigrationTracker?: {
      getAll: () => Promise<any[]>; // eslint-disable-line @typescript-eslint/no-explicit-any
      add: (data: { receiptNumber: string; formType: string; nickname: string }) => Promise<string>;
      delete: (id: string) => Promise<void>;
      subscribe?: (callback: (cases: any[]) => void) => () => void; // eslint-disable-line @typescript-eslint/no-explicit-any
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
      getScores: (gameType: string) => Promise<any[]>; // eslint-disable-line @typescript-eslint/no-explicit-any
      subscribe: (gameType: string, callback: (scores: any[]) => void) => () => void; // eslint-disable-line @typescript-eslint/no-explicit-any
      saveScore: (data: { gameType: string; score: number; timeMs: number; difficulty: string }) => Promise<void>;
      getLeaderboard: (uids: string[]) => Promise<Array<{ uid: string; displayName: string; gameType: string; score: number; timeMs: number; difficulty: string; playedAt: string }>>;
    };

    /* ── Trip Planner ──────────────────────────────────────── */
    __tripPlanner?: {
      getAll: () => Promise<any[]>; // eslint-disable-line @typescript-eslint/no-explicit-any
      add: (trip: Record<string, unknown>) => Promise<string>;
      update: (id: string, updates: Record<string, unknown>) => Promise<void>;
      delete: (id: string) => Promise<void>;
      subscribe: (callback: (trips: any[]) => void) => () => void; // eslint-disable-line @typescript-eslint/no-explicit-any
    };

    /* ── Poll System ──────────────────────────────────────── */
    __pollSystem?: {
      getAll: () => Promise<any[]>; // eslint-disable-line @typescript-eslint/no-explicit-any
      add: (poll: Record<string, unknown>) => Promise<string>;
      delete: (id: string) => Promise<void>;
      castVote: (pollId: string, optionId: string) => Promise<void>;
      changeVote: (pollId: string, oldOptionId: string, newOptionId: string) => Promise<void>;
      getUserVote: (pollId: string) => Promise<string | null>;
      subscribeToUserVotes: (callback: (votes: Record<string, string>) => void) => () => void;
      subscribe: (callback: (polls: any[]) => void) => () => void; // eslint-disable-line @typescript-eslint/no-explicit-any
    };

    /* ── Travel Pins ────────────────────────────────────────── */
    __travelPins?: {
      getAll: () => Promise<Array<{ id: string; type: string; name: string; notes?: string; dateRange?: { start: string; end: string }; lat: number; lon: number; createdAt: number }>>;
      add: (pin: { type: string; name: string; notes?: string; dateRange?: { start: string; end: string }; lat: number; lon: number }) => Promise<string>;
      update: (id: string, updates: Record<string, any>) => Promise<void>; // eslint-disable-line @typescript-eslint/no-explicit-any
      delete: (id: string) => Promise<void>;
      subscribe: (callback: (pins: Array<{ id: string; type: string; name: string; notes?: string; dateRange?: { start: string; end: string }; lat: number; lon: number; createdAt: number }>) => void) => () => void;
    };

    /* ── Transit Favorites ────────────────────────────────── */
    __transitFavorites?: {
      getAll: () => Promise<Array<{ stopId: string; stopName: string; direction: string; routes: string[]; addedAt: number }>>;
      add: (stop: { stopId: string; stopName: string; direction: string; routes: string[] }) => Promise<void>;
      remove: (stopId: string) => Promise<void>;
      subscribe: (callback: (favorites: Array<{ stopId: string; stopName: string; direction: string; routes: string[]; addedAt: number }>) => void) => () => void;
    };

    /* ── Trash / Recycle Bin ───────────────────────────────── */
    __trash?: {
      getAll: () => Promise<Record<string, Array<{ id: string; type: string; name: string; deletedAt: number | null; collectionPath: string }>>>;
      restore: (type: string, id: string) => Promise<void>;
      permanentlyDelete: (type: string, id: string) => Promise<void>;
    };

    /* ── Resume Tailor ─────────────────────────────────────── */
    __resumeTailor?: {
      uploadAndParse: (fileName: string, fileBase64: string, contentType: string, model: string, endpointId?: string | null) => Promise<Record<string, unknown>>;
    };

    /* ── DevTools / Testing ────────────────────────────────── */
    __APOLLO_CLIENT__?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    __signInForTest?: (email: string, password: string) => Promise<any>; // eslint-disable-line @typescript-eslint/no-explicit-any

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
