import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';
import { isNativePlatform } from '@mycircle/shared';

let messaging: Messaging | null = null;

function getMessagingInstance(): Messaging | null {
  if (!app) return null;
  if (!messaging) {
    messaging = getMessaging(app);
  }
  return messaging;
}

/**
 * Register the FCM service worker and request a push token.
 * Only called when the user explicitly enables notifications.
 */
export async function requestNotificationPermission(): Promise<string | null> {
  // FCM push via service worker is not available in Capacitor's WKWebView
  if (isNativePlatform()) return null;

  const msg = getMessagingInstance();
  if (!msg) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  // Register the FCM service worker with its own scope so it doesn't
  // collide with the PWA service worker (both default to scope '/').
  const registration = await navigator.serviceWorker.register(
    '/firebase-messaging-sw.js',
    { scope: '/firebase-cloud-messaging-push-scope' }
  );

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.warn('VITE_FIREBASE_VAPID_KEY not set — push notifications disabled');
    return null;
  }

  try {
    const token = await getToken(msg, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });
    return token;
  } catch (err) {
    console.error('Failed to get FCM token:', err);
    return null;
  }
}

/**
 * Listen for foreground messages (app is open and visible).
 * Returns an unsubscribe function.
 */
export function onForegroundMessage(callback: (payload: { title?: string; body?: string }) => void): () => void {
  const msg = getMessagingInstance();
  if (!msg) return () => {};

  return onMessage(msg, (payload) => {
    callback({
      title: payload.notification?.title,
      body: payload.notification?.body,
    });
  });
}

/**
 * Subscribe an FCM token to weather alerts for given cities.
 * Calls the `subscribeToAlerts` Cloud Function.
 */
export async function subscribeToWeatherAlerts(
  token: string,
  cities: Array<{ lat: number; lon: number; name: string }>
): Promise<boolean> {
  if (!app) return false;
  try {
    const functions = getFunctions(app);
    const subscribeFn = httpsCallable(functions, 'subscribeToAlerts');
    await subscribeFn({ token, cities });
    return true;
  } catch (err) {
    console.error('Failed to subscribe to weather alerts:', err);
    return false;
  }
}

/**
 * Unsubscribe from weather alerts by sending an empty cities array.
 * The Cloud Function deletes the Firestore doc for this token.
 */
export async function unsubscribeFromWeatherAlerts(token: string): Promise<boolean> {
  if (!app) return false;
  try {
    const functions = getFunctions(app);
    const subscribeFn = httpsCallable(functions, 'subscribeToAlerts');
    await subscribeFn({ token, cities: [] });
    return true;
  } catch (err) {
    console.error('Failed to unsubscribe from weather alerts:', err);
    return false;
  }
}

/**
 * Subscribe an FCM token to a topic via the `manageTopicSubscription` Cloud Function.
 */
export async function subscribeToTopic(token: string, topic: string): Promise<boolean> {
  if (!app) return false;
  try {
    const functions = getFunctions(app);
    const manageFn = httpsCallable(functions, 'manageTopicSubscription');
    await manageFn({ token, topic, subscribe: true });
    return true;
  } catch (err) {
    console.error(`Failed to subscribe to topic ${topic}:`, err);
    return false;
  }
}

/**
 * Unsubscribe an FCM token from a topic via the `manageTopicSubscription` Cloud Function.
 */
export async function unsubscribeFromTopic(token: string, topic: string): Promise<boolean> {
  if (!app) return false;
  try {
    const functions = getFunctions(app);
    const manageFn = httpsCallable(functions, 'manageTopicSubscription');
    await manageFn({ token, topic, subscribe: false });
    return true;
  } catch (err) {
    console.error(`Failed to unsubscribe from topic ${topic}:`, err);
    return false;
  }
}
