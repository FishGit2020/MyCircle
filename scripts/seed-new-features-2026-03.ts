/**
 * Seed script: adds a "New Features" announcement to Firestore.
 *
 * Usage:
 *   npx tsx scripts/seed-new-features-2026-03.ts
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

async function main() {
  const docRef = await db.collection('announcements').add({
    title: 'Hiking Map, Youth Tracker & More',
    description:
      'New: Hiking Map with trail planning & route directions, Youth Tracker for milestone tracking, Doc Scanner to digitize documents, Bible now open to everyone (no login needed), and Quick Access tiles with widget pinning — star any tile to pin it to your dashboard!',
    icon: 'feature',
    createdAt: Timestamp.now(),
  });

  console.log(`Created announcement: ${docRef.id}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
