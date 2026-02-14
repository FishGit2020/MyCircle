/**
 * Seed script: adds a "Welcome to MyCircle" announcement to Firestore.
 *
 * Usage:
 *   npx tsx scripts/seed-welcome-announcement.ts
 *
 * Prerequisites:
 *   - GOOGLE_APPLICATION_CREDENTIALS env var pointing to a service-account JSON, OR
 *   - Run `firebase login` and set the project via `firebase use <project-id>`
 *   - `firebase-admin` must be installed: npm i -D firebase-admin
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

async function main() {
  const docRef = await db.collection('announcements').add({
    title: 'Welcome to MyCircle!',
    description:
      'Your personal dashboard for weather, stocks, podcasts, Bible reading, worship songs, notebooks, and AI chat. Explore all the features from the home page!',
    icon: 'announcement',
    createdAt: Timestamp.now(),
  });

  console.log(`Created announcement: ${docRef.id}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
