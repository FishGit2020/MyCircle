import { createLogger } from '@mycircle/shared';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, connectAuthEmulator, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, updateProfile, User, Auth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, connectFirestoreEmulator, doc, getDoc, setDoc, updateDoc, deleteField, serverTimestamp, Firestore, collection, addDoc, getDocs, deleteDoc, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { getPerformance, FirebasePerformance } from 'firebase/performance';
import { getAnalytics, setUserId, setUserProperties, logEvent as firebaseLogEvent, Analytics } from 'firebase/analytics';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, getToken, AppCheck } from 'firebase/app-check';

const log = createLogger('firebase');

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Firebase is optional — the app works without it (auth features disabled)
const firebaseEnabled = !!firebaseConfig.apiKey;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let perf: FirebasePerformance | null = null;
let analytics: Analytics | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let appCheck: AppCheck | null = null;

if (firebaseEnabled) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
  perf = getPerformance(app);
  analytics = getAnalytics(app);
  googleProvider = new GoogleAuthProvider();

  // App Check: verify requests come from our app, not bots/curl
  try {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN =
        import.meta.env.VITE_APPCHECK_DEBUG_TOKEN || true;
    }
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider('6Lcvm2ksAAAAAPQ63bPl94XAfS2gTn2Fu4zMmT4f'),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (err) {
    log.warn('App Check initialization failed:', err);
  }

  // Expose ID token getter for MFEs that can't import from shell directly
  window.__getFirebaseIdToken = async () => {
    if (!auth?.currentUser) return null;
    return auth.currentUser.getIdToken();
  };

  // Expose App Check token getter for MFEs to attach to custom HTTP requests
  window.__getAppCheckToken = async () => {
    if (!appCheck) return null;
    try {
      const result = await getToken(appCheck, false);
      return result.token;
    } catch {
      return null;
    }
  };

  // Connect to Firebase emulators when served by the Hosting emulator (port 5000)
  if (typeof window !== 'undefined') {
    const isEmulator = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      && window.location.port === '5000';
    if (isEmulator) {
      try {
        if (db) connectFirestoreEmulator(db, 'localhost', 8080);
      } catch (e) {
        log.warn('Firestore emulator already connected:', e);
      }
      try {
        if (auth) connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      } catch (e) {
        log.warn('Auth emulator already connected:', e);
      }
      // Expose test helper for emulator e2e auth tests
      (window as any).__signInForTest = (email: string, password: string) =>
        signInWithEmailAndPassword(auth!, email, password);
    }
  }
}

// User profile type
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  darkMode: boolean;
  locale?: string;
  tempUnit?: 'C' | 'F';
  speedUnit?: 'ms' | 'mph' | 'kmh';
  recentCities: RecentCity[];
  favoriteCities: FavoriteCity[];
  stockWatchlist?: WatchlistItem[];
  podcastSubscriptions?: string[];
  lastSeenAnnouncementId?: string;
  babyDueDate?: string;
  bottomNavOrder?: string[];
  weatherAlertsEnabled?: boolean;
  announcementAlertsEnabled?: boolean;
  bibleBookmarks?: Array<{ book: string; chapter: number; label: string; timestamp: number }>;
  chineseLearningProgress?: { masteredIds: string[]; lastDate: string };
  englishLearningProgress?: { completedIds: string[]; quizScores: Array<{ date: string; correct: number; total: number }>; lastDate: string };
  childName?: string;
  childBirthDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WatchlistItem {
  symbol: string;
  companyName: string;
}

export interface FavoriteCity {
  id: string;
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
}

export interface RecentCity {
  id: string;
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
  searchedAt: Date;
}

// Auth functions

// Handle redirect result on page load (fires after signInWithRedirect returns)
if (auth) {
  getRedirectResult(auth)
    .then(async (result) => {
      if (result?.user) {
        await ensureUserProfile(result.user);
      }
    })
    .catch((err) => {
      log.warn('Redirect sign-in result error:', err);
    });
}

export async function signInWithGoogle() {
  if (!auth || !googleProvider) return null;
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await ensureUserProfile(result.user);
    return result.user;
  } catch (error: any) {
    // Popup blocked, App Check throttled, or Firefox cookie partitioning — fall back to redirect
    const code = error?.code || '';
    if (
      code === 'auth/internal-error' ||
      code === 'auth/popup-blocked' ||
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request'
    ) {
      log.warn('Popup sign-in failed, falling back to redirect:', code);
      await signInWithRedirect(auth!, googleProvider!);
      return null; // page will redirect
    }
    log.error('Error signing in with Google:', error);
    throw error;
  }
}

export async function signUpWithEmail(email: string, password: string, displayName?: string) {
  if (!auth) throw new Error('Firebase not initialized');
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(result.user, { displayName });
  }
  await ensureUserProfile(result.user);
  return result.user;
}

export async function signInWithEmail(email: string, password: string) {
  if (!auth) throw new Error('Firebase not initialized');
  const result = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(result.user);
  return result.user;
}

export async function resetPassword(email: string) {
  if (!auth) throw new Error('Firebase not initialized');
  await sendPasswordResetEmail(auth, email);
}

export async function logOut() {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    log.error('Error signing out:', error);
    throw error;
  }
}

export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  if (!auth) {
    // No Firebase — immediately report no user and return a no-op unsubscribe
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

// Firestore functions
async function ensureUserProfile(user: User) {
  if (!db) return;
  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    const newProfile: Omit<UserProfile, 'createdAt' | 'updatedAt'> & { createdAt: any; updatedAt: any } = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      darkMode: false,
      recentCities: [],
      favoriteCities: [],
      stockWatchlist: [],
      podcastSubscriptions: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(userRef, newProfile);
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!db) return null;
  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    return userDoc.data() as UserProfile;
  }
  return null;
}

export async function updateUserDarkMode(uid: string, darkMode: boolean) {
  if (!db) return;
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    darkMode,
    updatedAt: serverTimestamp(),
  });
}

export async function updateUserLocale(uid: string, locale: string) {
  if (!db) return;
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    locale,
    updatedAt: serverTimestamp(),
  });
}

export async function updateUserTempUnit(uid: string, tempUnit: 'C' | 'F') {
  if (!db) return;
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    tempUnit,
    updatedAt: serverTimestamp(),
  });
}

export async function updateUserSpeedUnit(uid: string, speedUnit: 'ms' | 'mph' | 'kmh') {
  if (!db) return;
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    speedUnit,
    updatedAt: serverTimestamp(),
  });
}

export async function addRecentCity(uid: string, city: Omit<RecentCity, 'searchedAt'>) {
  if (!db) return;
  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    const profile = userDoc.data() as UserProfile;
    const recentCities = profile.recentCities || [];

    // Remove duplicate if exists
    const filteredCities = recentCities.filter(c => c.id !== city.id);

    // Add new city at the beginning
    const newCity: RecentCity = {
      ...city,
      searchedAt: new Date(),
    };

    // Keep only last 10 cities
    const updatedCities = [newCity, ...filteredCities].slice(0, 10);

    await updateDoc(userRef, {
      recentCities: updatedCities,
      updatedAt: serverTimestamp(),
    });
  }
}

export async function removeRecentCity(uid: string, cityId: string) {
  if (!db) return;
  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    const profile = userDoc.data() as UserProfile;
    const updatedCities = (profile.recentCities || []).filter(c => c.id !== cityId);

    await updateDoc(userRef, {
      recentCities: updatedCities,
      updatedAt: serverTimestamp(),
    });
  }
}

export async function clearRecentCities(uid: string) {
  if (!db) return;
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    recentCities: [],
    updatedAt: serverTimestamp(),
  });
}

export async function toggleFavoriteCity(uid: string, city: FavoriteCity): Promise<boolean> {
  if (!db) return false;
  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    const profile = userDoc.data() as UserProfile;
    const favorites = profile.favoriteCities || [];
    const exists = favorites.some(c => c.id === city.id);

    const updatedFavorites = exists
      ? favorites.filter(c => c.id !== city.id)
      : [...favorites, city];

    await updateDoc(userRef, {
      favoriteCities: updatedFavorites,
      updatedAt: serverTimestamp(),
    });

    return !exists; // returns true if added, false if removed
  }
  return false;
}

export async function updateStockWatchlist(uid: string, watchlist: WatchlistItem[]) {
  if (!db) return;
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    stockWatchlist: watchlist,
    updatedAt: serverTimestamp(),
  });
}

export async function updatePodcastSubscriptions(uid: string, subscriptionIds: string[]) {
  if (!db) return;
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    podcastSubscriptions: subscriptionIds,
    updatedAt: serverTimestamp(),
  });
}

export async function updateUserBabyDueDate(uid: string, babyDueDate: string | null) {
  if (!db) return;
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    babyDueDate: babyDueDate || null,
    updatedAt: serverTimestamp(),
  });
}

export async function updateUserBottomNavOrder(uid: string, order: string[] | null) {
  if (!db) return;
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    bottomNavOrder: order || null,
    updatedAt: serverTimestamp(),
  });
}

export async function updateChineseLearningProgress(uid: string, progress: { masteredIds: string[]; lastDate: string }) {
  if (!db) return;
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    chineseLearningProgress: progress,
    updatedAt: serverTimestamp(),
  });
}

export async function updateEnglishLearningProgress(uid: string, progress: { completedIds: string[]; quizScores: Array<{ date: string; correct: number; total: number }>; lastDate: string }) {
  if (!db) return;
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    englishLearningProgress: progress,
    updatedAt: serverTimestamp(),
  });
}

export async function updateChildData(uid: string, data: { childName: string | null; childBirthDate: string | null }) {
  if (!db) return;
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    childName: data.childName || null,
    childBirthDate: data.childBirthDate || null,
    updatedAt: serverTimestamp(),
  });
}

export async function updateBibleBookmarks(uid: string, bookmarks: Array<{ book: string; chapter: number; label: string; timestamp: number }>) {
  if (!db) return;
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    bibleBookmarks: bookmarks,
    updatedAt: serverTimestamp(),
  });
}

export async function updateUserNotificationAlerts(uid: string, alerts: {
  weatherAlertsEnabled: boolean;
  announcementAlertsEnabled: boolean;
}) {
  if (!db) return;
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { ...alerts, updatedAt: serverTimestamp() });
}

export async function getRecentCities(uid: string): Promise<RecentCity[]> {
  const profile = await getUserProfile(uid);
  return profile?.recentCities || [];
}

// Feedback functions
export interface FeedbackData {
  category: 'bug' | 'feature' | 'general' | 'other';
  rating: number;
  message: string;
}

export async function submitFeedback(feedback: FeedbackData, user: { uid: string; email: string | null; displayName: string | null } | null) {
  if (!db) throw new Error('Firestore is not initialized');
  await addDoc(collection(db, 'feedback'), {
    ...feedback,
    uid: user?.uid ?? null,
    email: user?.email ?? null,
    displayName: user?.displayName ?? null,
    page: window.location.pathname,
    userAgent: navigator.userAgent,
    createdAt: serverTimestamp(),
  });
}

// Announcements — public read collection for "What's New" feature
export interface Announcement {
  id: string;
  title: string;
  description: string;
  icon?: string;
  createdAt: Date;
}

export async function getAnnouncements(): Promise<Announcement[]> {
  if (!db) return [];
  const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(20));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      title: data.title,
      description: data.description,
      icon: data.icon,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
    };
  });
}

export async function updateLastSeenAnnouncement(uid: string, announcementId: string) {
  if (!db) return;
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    lastSeenAnnouncementId: announcementId,
    updatedAt: serverTimestamp(),
  });
}

// Analytics functions

/** Link analytics sessions to an authenticated user for accurate retention tracking */
export function identifyUser(uid: string, properties?: Record<string, string>) {
  if (!analytics) return;
  setUserId(analytics, uid);
  if (properties) {
    setUserProperties(analytics, properties);
  }
}

/** Clear user identity on sign-out */
export function clearUserIdentity() {
  if (!analytics) return;
  setUserId(analytics, null as any);
}

/** Log a custom analytics event */
export function logEvent(eventName: string, params?: Record<string, any>) {
  if (!analytics) return;
  firebaseLogEvent(analytics, eventName, params);
}

/** Get the current user's Firebase ID token for authenticating API requests */
export async function getFirebaseIdToken(): Promise<string | null> {
  if (!auth?.currentUser) return null;
  return auth.currentUser.getIdToken();
}

// Worship Songs — public read, auth-required write
export async function getWorshipSongs() {
  if (!db) return [];
  const q = query(collection(db, 'worshipSongs'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getWorshipSong(id: string) {
  if (!db) return null;
  const docRef = doc(db, 'worshipSongs', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() };
}

/** Strip undefined values — Firestore rejects them */
function stripUndefined(obj: Record<string, any>): Record<string, any> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

export async function addWorshipSong(song: Record<string, any>) {
  if (!db) throw new Error('Firebase not initialized');
  const docRef = await addDoc(collection(db, 'worshipSongs'), {
    ...stripUndefined(song),
    createdBy: auth?.currentUser?.uid ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/** Optional fields that should be removed from Firestore when cleared */
const OPTIONAL_SONG_FIELDS = ['youtubeUrl', 'bpm', 'tags'];

export async function updateWorshipSong(id: string, updates: Record<string, any>) {
  if (!db) throw new Error('Firebase not initialized');
  const docRef = doc(db, 'worshipSongs', id);
  // For optional fields, explicitly delete them from Firestore when undefined
  const deletions: Record<string, any> = {};
  for (const field of OPTIONAL_SONG_FIELDS) {
    if (field in updates && updates[field] === undefined) {
      deletions[field] = deleteField();
    }
  }
  await updateDoc(docRef, {
    ...stripUndefined(updates),
    ...deletions,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteWorshipSong(id: string) {
  if (!db) throw new Error('Firebase not initialized');
  await deleteDoc(doc(db, 'worshipSongs', id));
}

/** Subscribe to real-time worship songs updates via Firestore onSnapshot */
export function subscribeToWorshipSongs(callback: (songs: Array<Record<string, any>>) => void): () => void {
  if (!db) return () => {};
  const q = query(collection(db, 'worshipSongs'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const songs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(songs);
  }, (error) => {
    log.warn('Worship songs snapshot error:', error);
  });
}

// Notebook — personal notes (user-scoped subcollection)
export async function getUserNotes(uid: string) {
  if (!db) return [];
  const q = query(collection(db, 'users', uid, 'notes'), orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getUserNote(uid: string, noteId: string) {
  if (!db) return null;
  const docRef = doc(db, 'users', uid, 'notes', noteId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() };
}

export async function addUserNote(uid: string, note: { title: string; content: string }) {
  if (!db) throw new Error('Firebase not initialized');
  const docRef = await addDoc(collection(db, 'users', uid, 'notes'), {
    ...note,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateUserNote(uid: string, noteId: string, updates: Partial<{ title: string; content: string }>) {
  if (!db) throw new Error('Firebase not initialized');
  const docRef = doc(db, 'users', uid, 'notes', noteId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteUserNote(uid: string, noteId: string) {
  if (!db) throw new Error('Firebase not initialized');
  await deleteDoc(doc(db, 'users', uid, 'notes', noteId));
}

/** Subscribe to real-time private notes updates via Firestore onSnapshot */
export function subscribeToUserNotes(uid: string, callback: (notes: Array<Record<string, any>>) => void): () => void {
  if (!db) return () => {};
  const q = query(collection(db, 'users', uid, 'notes'), orderBy('updatedAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const notes = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(notes);
  }, (error) => {
    log.warn('User notes snapshot error:', error);
  });
}

// Public Notes — shared notes visible to all authenticated users
export async function getPublicNotes() {
  if (!db) return [];
  const q = query(collection(db, 'publicNotes'), orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addPublicNote(uid: string, displayName: string, note: { title: string; content: string }) {
  if (!db) throw new Error('Firebase not initialized');
  const docRef = await addDoc(collection(db, 'publicNotes'), {
    ...note,
    isPublic: true,
    createdBy: { uid, displayName },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updatePublicNote(noteId: string, updates: Partial<{ title: string; content: string }>) {
  if (!db) throw new Error('Firebase not initialized');
  const docRef = doc(db, 'publicNotes', noteId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePublicNote(noteId: string) {
  if (!db) throw new Error('Firebase not initialized');
  await deleteDoc(doc(db, 'publicNotes', noteId));
}

/** Subscribe to real-time public notes updates via Firestore onSnapshot */
export function subscribeToPublicNotes(callback: (notes: Array<Record<string, any>>) => void): () => void {
  if (!db) return () => {};
  const q = query(collection(db, 'publicNotes'), orderBy('updatedAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const notes = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(notes);
  }, (error) => {
    log.warn('Public notes snapshot error:', error);
  });
}

// Chinese Characters — public read, auth-required write
export async function getChineseCharacters() {
  if (!db) return [];
  const q = query(collection(db, 'chineseCharacters'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addChineseCharacter(char: Record<string, any>) {
  if (!db) throw new Error('Firebase not initialized');
  const user = auth?.currentUser;
  const docRef = await addDoc(collection(db, 'chineseCharacters'), {
    ...char,
    createdBy: { uid: user?.uid ?? 'anonymous', displayName: user?.displayName || user?.email || 'Anonymous' },
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateChineseCharacter(id: string, updates: Record<string, any>) {
  if (!db) throw new Error('Firebase not initialized');
  const user = auth?.currentUser;
  const docRef = doc(db, 'chineseCharacters', id);
  await updateDoc(docRef, {
    ...updates,
    editedBy: { uid: user?.uid ?? 'anonymous', displayName: user?.displayName || user?.email || 'Anonymous' },
    editedAt: serverTimestamp(),
  });
}

export async function deleteChineseCharacter(id: string) {
  if (!db) throw new Error('Firebase not initialized');
  await deleteDoc(doc(db, 'chineseCharacters', id));
}

export function subscribeToChineseCharacters(callback: (chars: Array<Record<string, any>>) => void): () => void {
  if (!db) return () => {};
  const q = query(collection(db, 'chineseCharacters'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const chars = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(chars);
  }, (error) => {
    log.warn('Chinese characters snapshot error:', error);
  });
}

// Expose worship songs API for MFEs
if (firebaseEnabled) {
  window.__worshipSongs = {
    getAll: getWorshipSongs as any,
    get: getWorshipSong as any,
    add: addWorshipSong,
    update: updateWorshipSong,
    delete: deleteWorshipSong,
    subscribe: subscribeToWorshipSongs,
  };
}

// Expose notebook API for MFEs
if (firebaseEnabled) {
  window.__notebook = {
    getAll: () => auth?.currentUser ? getUserNotes(auth.currentUser.uid) : Promise.resolve([]),
    get: (id: string) => auth?.currentUser ? getUserNote(auth.currentUser.uid, id) : Promise.resolve(null),
    add: (note: { title: string; content: string }) => {
      if (!auth?.currentUser) throw new Error('Not authenticated');
      return addUserNote(auth.currentUser.uid, note);
    },
    update: (id: string, updates: Partial<{ title: string; content: string }>) => {
      if (!auth?.currentUser) throw new Error('Not authenticated');
      return updateUserNote(auth.currentUser.uid, id, updates);
    },
    delete: (id: string) => {
      if (!auth?.currentUser) throw new Error('Not authenticated');
      return deleteUserNote(auth.currentUser.uid, id);
    },
    subscribe: (callback: (notes: Array<Record<string, any>>) => void) => {
      if (!auth?.currentUser) return () => {};
      return subscribeToUserNotes(auth.currentUser.uid, callback);
    },
    // Public notes
    getAllPublic: () => getPublicNotes(),
    subscribePublic: subscribeToPublicNotes,
    publish: (note: { title: string; content: string }) => {
      if (!auth?.currentUser) throw new Error('Not authenticated');
      const displayName = auth.currentUser.displayName || auth.currentUser.email || 'Anonymous';
      return addPublicNote(auth.currentUser.uid, displayName, note);
    },
    updatePublic: (id: string, updates: Partial<{ title: string; content: string }>) => {
      if (!auth?.currentUser) throw new Error('Not authenticated');
      return updatePublicNote(id, updates);
    },
    deletePublic: (id: string) => {
      if (!auth?.currentUser) throw new Error('Not authenticated');
      return deletePublicNote(id);
    },
  };
}

// Expose Chinese characters API for MFEs
if (firebaseEnabled) {
  window.__chineseCharacters = {
    getAll: getChineseCharacters as any,
    add: addChineseCharacter,
    update: updateChineseCharacter,
    delete: deleteChineseCharacter,
    subscribe: subscribeToChineseCharacters,
  };
}

// Work Tracker — user-scoped subcollection
export async function getWorkEntries(uid: string) {
  if (!db) return [];
  const q = query(collection(db, 'users', uid, 'worklog'), orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addWorkEntry(uid: string, entry: { date: string; content: string }) {
  if (!db) throw new Error('Firebase not initialized');
  const docRef = await addDoc(collection(db, 'users', uid, 'worklog'), {
    ...entry,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateWorkEntry(uid: string, entryId: string, updates: Partial<{ content: string }>) {
  if (!db) throw new Error('Firebase not initialized');
  const docRef = doc(db, 'users', uid, 'worklog', entryId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteWorkEntry(uid: string, entryId: string) {
  if (!db) throw new Error('Firebase not initialized');
  await deleteDoc(doc(db, 'users', uid, 'worklog', entryId));
}

export function subscribeToWorkEntries(uid: string, callback: (entries: Array<Record<string, any>>) => void): () => void {
  if (!db) return () => {};
  const q = query(collection(db, 'users', uid, 'worklog'), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const entries = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(entries);
  }, (error) => {
    log.warn('Work entries snapshot error:', error);
  });
}

// Expose work tracker API for MFEs
if (firebaseEnabled) {
  window.__workTracker = {
    getAll: () => auth?.currentUser ? getWorkEntries(auth.currentUser.uid) : Promise.resolve([]),
    add: (entry: { date: string; content: string }) => {
      if (!auth?.currentUser) throw new Error('Not authenticated');
      return addWorkEntry(auth.currentUser.uid, entry);
    },
    update: (id: string, updates: Partial<{ content: string }>) => {
      if (!auth?.currentUser) throw new Error('Not authenticated');
      return updateWorkEntry(auth.currentUser.uid, id, updates);
    },
    delete: (id: string) => {
      if (!auth?.currentUser) throw new Error('Not authenticated');
      return deleteWorkEntry(auth.currentUser.uid, id);
    },
    subscribe: (callback: (entries: Array<Record<string, any>>) => void) => {
      if (!auth?.currentUser) return () => {};
      return subscribeToWorkEntries(auth.currentUser.uid, callback);
    },
  };
}

// Expose analytics for MFEs
window.__logAnalyticsEvent = (eventName: string, params?: Record<string, any>) => {
  logEvent(eventName, params);
};

export { app, auth, db, perf, analytics, firebaseEnabled };
