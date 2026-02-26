/**
 * Seed script: adds a "Cloud Files" announcement to Firestore.
 *
 * Usage:
 *   npx tsx scripts/seed-cloud-files-announcement.ts
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
    title: 'New: Cloud Files',
    description:
      'Upload and share files with your circle! Supports images, PDFs, documents, and spreadsheets (up to 5MB). Find it under Cloud Files in the navigation or press g u.',
    icon: 'cloud-upload',
    createdAt: Timestamp.now(),
  });

  console.log(`Created announcement: ${docRef.id}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
