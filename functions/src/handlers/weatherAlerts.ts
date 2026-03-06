import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import axios from 'axios';
import { expandApiKeys, OPENWEATHER_BASE } from './shared.js';

/**
 * Callable function: subscribe an FCM token to weather alerts for given cities.
 */
export const subscribeToAlerts = onCall(
  { maxInstances: 5, enforceAppCheck: true },
  async (request) => {
    const { token, cities } = request.data as {
      token: string;
      cities: Array<{ lat: number; lon: number; name: string }>;
    };

    if (!token || typeof token !== 'string') {
      throw new HttpsError('invalid-argument', 'FCM token is required');
    }
    if (!Array.isArray(cities)) {
      throw new HttpsError('invalid-argument', 'cities must be an array');
    }

    const uid = request.auth?.uid;
    const db = getFirestore();
    const subsRef = db.collection('alertSubscriptions');
    const existing = await subsRef.where('token', '==', token).limit(1).get();

    // Empty cities array = unsubscribe for ALL devices owned by this user
    if (cities.length === 0) {
      if (uid) {
        // Delete all subscription docs for this user (cross-device unsubscribe)
        const userDocs = await subsRef.where('uid', '==', uid).get();
        if (!userDocs.empty) {
          const batch = db.batch();
          userDocs.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
        }
      }
      // Also delete the current token's doc if it exists but has no uid (legacy doc)
      if (!existing.empty && !existing.docs[0].data().uid) {
        await existing.docs[0].ref.delete();
      }
      return { success: true, subscribed: false };
    }

    // Upsert: update existing or create new subscription
    if (!existing.empty) {
      // Lazy migration: add uid if missing (backward compat for pre-uid docs)
      const updateData: Record<string, unknown> = {
        cities,
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (uid && !existing.docs[0].data().uid) {
        updateData.uid = uid;
      }
      await existing.docs[0].ref.update(updateData);
    } else {
      await subsRef.add({
        token,
        cities,
        ...(uid ? { uid } : {}),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return { success: true, subscribed: true };
  }
);

// Severe weather condition IDs from OpenWeather API
// See: https://openweathermap.org/weather-conditions
const SEVERE_WEATHER_IDS = new Set([
  200, 201, 202, 210, 211, 212, 221, 230, 231, 232, // Thunderstorm
  502, 503, 504, 511,                                  // Heavy rain / freezing rain
  602, 611, 612, 613, 615, 616, 620, 621, 622,        // Heavy snow / sleet
  711, 731, 751, 761, 762,                             // Smoke, dust, volcanic ash
  771, 781,                                            // Squall, tornado
]);

/**
 * Scheduled function: runs every 30 minutes to check weather for subscribed cities.
 * Sends FCM push notification for severe weather alerts.
 */
export const checkWeatherAlerts = onSchedule(
  {
    schedule: 'every 30 minutes',
    memory: '256MiB',
    timeoutSeconds: 120,
    secrets: ['API_KEYS'],
  },
  async () => {
    expandApiKeys();
    const db = getFirestore();
    const messaging = getMessaging();
    const apiKey = process.env.OPENWEATHER_API_KEY || '';

    if (!apiKey) {
      logger.warn('OPENWEATHER_API_KEY not set — skipping weather alerts');
      return;
    }

    // Fetch all subscriptions
    const snapshot = await db.collection('alertSubscriptions').get();
    if (snapshot.empty) {
      logger.info('No alert subscriptions found');
      return;
    }

    // Deduplicate cities across all subscriptions
    const cityMap = new Map<string, { lat: number; lon: number; name: string; tokens: string[] }>();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const token = data.token as string;
      const cities = data.cities as Array<{ lat: number; lon: number; name: string }>;

      for (const city of cities) {
        const key = `${city.lat.toFixed(2)},${city.lon.toFixed(2)}`;
        const existing = cityMap.get(key);
        if (existing) {
          existing.tokens.push(token);
        } else {
          cityMap.set(key, { ...city, tokens: [token] });
        }
      }
    }

    logger.info('Checking weather for subscribed cities', { cityCount: cityMap.size });

    // Check weather for each city
    const staleTokens: string[] = [];

    for (const [, city] of cityMap) {
      try {
        const response = await axios.get(
          `${OPENWEATHER_BASE}/data/2.5/weather`,
          { params: { lat: city.lat, lon: city.lon, appid: apiKey, units: 'metric' }, timeout: 5000 }
        );

        const weather = response.data.weather as Array<{ id: number; main: string; description: string }>;
        const hasSevere = weather.some(w => SEVERE_WEATHER_IDS.has(w.id));

        if (hasSevere) {
          const severity = weather.find(w => SEVERE_WEATHER_IDS.has(w.id))!;
          const temp = Math.round(response.data.main.temp);

          logger.info('Severe weather detected', { city: city.name, condition: severity.description });

          // Send FCM to all subscribed tokens for this city
          for (const token of city.tokens) {
            try {
              await messaging.send({
                token,
                notification: {
                  title: `⚠️ Weather Alert: ${city.name}`,
                  body: `${severity.main} — ${severity.description} (${temp}°C)`,
                },
                data: {
                  lat: String(city.lat),
                  lon: String(city.lon),
                  cityName: city.name,
                },
                webpush: {
                  fcmOptions: {
                    link: `/weather/${city.lat},${city.lon}?name=${encodeURIComponent(city.name)}`,
                  },
                },
              });
            } catch (err: any) {
              // Token is invalid/expired — mark for cleanup
              if (err.code === 'messaging/registration-token-not-registered' ||
                  err.code === 'messaging/invalid-registration-token') {
                staleTokens.push(token);
              }
              logger.error('Failed to send FCM notification', { tokenPrefix: token.slice(0, 10), error: err.message });
            }
          }
        }
      } catch (err: any) {
        logger.error('Failed to fetch weather for alert check', { city: city.name, error: err.message });
      }
    }

    // Clean up stale tokens
    if (staleTokens.length > 0) {
      logger.info('Cleaning up stale FCM tokens', { count: staleTokens.length });
      const batch = db.batch();
      for (const token of staleTokens) {
        const docs = await db.collection('alertSubscriptions').where('token', '==', token).get();
        docs.forEach(doc => batch.delete(doc.ref));
      }
      await batch.commit();
    }
  }
);
