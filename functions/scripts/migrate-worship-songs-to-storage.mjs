#!/usr/bin/env node
/**
 * One-time migration: export Firestore `worshipSongs` collection → Storage `worship-songs.json`
 *
 * Usage (run from repo root, gcloud must be authenticated):
 *   node functions/scripts/migrate-worship-songs-to-storage.mjs
 *
 * Or with a specific project:
 *   GOOGLE_CLOUD_PROJECT=mycircle-dash node functions/scripts/migrate-worship-songs-to-storage.mjs
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

if (getApps().length === 0) {
  initializeApp();
}

const STORAGE_PATH = 'worship-songs.json';

function serializeValue(v) {
  // Convert Firestore Timestamps to ISO strings
  if (v && typeof v === 'object' && typeof v.toMillis === 'function') {
    return new Date(v.toMillis()).toISOString();
  }
  return v;
}

async function migrate() {
  const db = getFirestore();
  const bucket = getStorage().bucket();

  console.log('Reading worship songs from Firestore...');
  const snap = await db.collection('worshipSongs').orderBy('createdAt', 'desc').get();

  const songs = snap.docs
    .filter(d => !d.data().isDeleted)
    .map(d => {
      const data = d.data();
      return Object.fromEntries(
        Object.entries({ id: d.id, ...data }).map(([k, v]) => [k, serializeValue(v)]),
      );
    });

  console.log(`Found ${songs.length} songs. Uploading to Storage as ${STORAGE_PATH}...`);

  const json = JSON.stringify({ songs, generatedAt: new Date().toISOString() }, null, 2);
  await bucket.file(STORAGE_PATH).save(Buffer.from(json, 'utf-8'), {
    metadata: {
      contentType: 'application/json',
      cacheControl: 'public, max-age=300',
    },
  });

  console.log(`✅ Done! Exported ${songs.length} worship songs to gs://${bucket.name}/${STORAGE_PATH}`);
  console.log(`   The worshipSongsApi Cloud Function will now serve songs from this file.`);
  console.log(`   Future Firestore writes will automatically update the Storage JSON via the`);
  console.log(`   syncWorshipSongsToStorage trigger.`);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
