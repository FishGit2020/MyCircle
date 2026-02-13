/**
 * Seed Firestore emulator with test data.
 * Expects FIRESTORE_EMULATOR_HOST to be set (e.g., localhost:8080).
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';

if (getApps().length === 0) {
  initializeApp({ projectId: 'mycircle-dash' });
}
const db = getFirestore();

async function seed() {
  console.log('Seeding Firestore emulator...');

  // User profile
  await db.doc('users/test-user').set({
    displayName: 'Test User',
    email: 'test@example.com',
    tempUnit: 'C',
    locale: 'en',
    createdAt: new Date(),
  });

  // Favorite city
  await db.doc('users/test-user/favoriteCities/london').set({
    name: 'London',
    country: 'GB',
    state: 'England',
    lat: 51.5074,
    lon: -0.1278,
    addedAt: new Date(),
  });

  // Stock watchlist
  await db.doc('users/test-user/stockWatchlist/aapl').set({
    symbol: 'AAPL',
    name: 'Apple Inc',
    addedAt: new Date(),
  });

  // Podcast subscription
  await db.doc('users/test-user/podcastSubscriptions/101').set({
    feedId: 101,
    title: 'Tech Talk Daily',
    author: 'John Smith',
    artwork: 'https://example.com/tech-talk.jpg',
    subscribedAt: new Date(),
  });

  // Feedback entry
  await db.doc('feedback/sample-1').set({
    userId: 'test-user',
    message: 'Great app!',
    rating: 5,
    createdAt: new Date(),
  });

  // Alert subscription
  await db.doc('alertSubscriptions/test-sub').set({
    token: 'fake-fcm-token-for-testing',
    cities: [{ lat: 51.5074, lon: -0.1278, name: 'London' }],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('Firestore seeded successfully.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
