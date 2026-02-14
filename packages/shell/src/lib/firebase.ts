import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, User, Auth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp, Firestore, collection, addDoc, getDocs, deleteDoc, query, orderBy, limit } from 'firebase/firestore';
import { getPerformance, FirebasePerformance } from 'firebase/performance';
import { getAnalytics, setUserId, setUserProperties, logEvent as firebaseLogEvent, Analytics } from 'firebase/analytics';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, getToken, AppCheck } from 'firebase/app-check';

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
  db = getFirestore(app);
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
    console.warn('App Check initialization failed:', err);
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
      console.warn('Redirect sign-in result error:', err);
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
      console.warn('Popup sign-in failed, falling back to redirect:', code);
      await signInWithRedirect(auth!, googleProvider!);
      return null; // page will redirect
    }
    console.error('Error signing in with Google:', error);
    throw error;
  }
}

export async function logOut() {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
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
  if (!db) return;
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

export async function addWorshipSong(song: Record<string, any>) {
  if (!db) throw new Error('Firebase not initialized');
  const docRef = await addDoc(collection(db, 'worshipSongs'), {
    ...song,
    createdBy: auth?.currentUser?.uid ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateWorshipSong(id: string, updates: Record<string, any>) {
  if (!db) throw new Error('Firebase not initialized');
  const docRef = doc(db, 'worshipSongs', id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteWorshipSong(id: string) {
  if (!db) throw new Error('Firebase not initialized');
  await deleteDoc(doc(db, 'worshipSongs', id));
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

// Expose worship songs API for MFEs
if (firebaseEnabled) {
  window.__worshipSongs = {
    getAll: getWorshipSongs as any,
    get: getWorshipSong as any,
    add: addWorshipSong,
    update: updateWorshipSong,
    delete: deleteWorshipSong,
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
  };
}

export { app, auth, db, perf, analytics, firebaseEnabled };
