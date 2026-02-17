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

  // Chinese characters (sample set for testing)
  const chineseChars = [
    { character: '\u5988\u5988', pinyin: 'm\u0101ma', meaning: 'mom', category: 'family' },
    { character: '\u7238\u7238', pinyin: 'b\u00e0ba', meaning: 'dad', category: 'family' },
    { character: '\u4f60\u597d', pinyin: 'n\u01d0h\u01ceo', meaning: 'hello', category: 'phrases' },
    { character: '\u8c22\u8c22', pinyin: 'xi\u00e8xie', meaning: 'thank you', category: 'phrases' },
    { character: '\u6c34', pinyin: 'shu\u01d0', meaning: 'water', category: 'food' },
  ];
  for (const char of chineseChars) {
    await db.collection('chineseCharacters').add({
      ...char,
      createdBy: { uid: 'system', displayName: 'MyCircle' },
      createdAt: new Date(),
    });
  }

  console.log('Firestore seeded successfully.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
