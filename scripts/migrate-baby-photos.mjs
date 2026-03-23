#!/usr/bin/env node
/**
 * One-time migration: Copy existing per-stage baby milestone photos
 * from `users/{uid}/babyMilestones/{stageId}` into the unified
 * `users/{uid}/journalPhotos/{uuid}` collection.
 *
 * Usage:
 *   node scripts/migrate-baby-photos.mjs --uid=<firebase-uid>
 *   node scripts/migrate-baby-photos.mjs --all
 *
 * The script is idempotent — it skips docs that have already been migrated
 * (detected by matching storagePath).
 *
 * Requirements:
 *   GOOGLE_APPLICATION_CREDENTIALS env var pointing to a service account key
 *   with Firestore read/write access.
 */

import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';

// ── Stage name lookup (matches babyGrowthData.ts developmentStages) ─────────
const STAGE_LABELS = {
  1: 'Weeks 1–3',
  2: 'Week 4',
  3: 'Weeks 5–6',
  4: 'Weeks 7–8',
  5: 'Weeks 9–12',
  6: 'Weeks 13–16',
  7: 'Weeks 17–20',
  8: 'Weeks 21–24',
  9: 'Weeks 25–32',
  10: 'Weeks 33–40',
};

initializeApp({
  credential: process.env.GOOGLE_APPLICATION_CREDENTIALS
    ? cert(process.env.GOOGLE_APPLICATION_CREDENTIALS)
    : applicationDefault(),
  projectId: 'mycircle-dash',
});

const db = getFirestore();

function parseArgs() {
  const args = process.argv.slice(2);
  let uid = null;
  let all = false;
  for (const arg of args) {
    if (arg.startsWith('--uid=')) uid = arg.split('=')[1];
    if (arg === '--all') all = true;
  }
  return { uid, all };
}

async function migrateUser(uid) {
  const sourceColl = db.collection(`users/${uid}/babyMilestones`);
  const targetColl = db.collection(`users/${uid}/journalPhotos`);

  const [sourceSnap, targetSnap] = await Promise.all([
    sourceColl.get(),
    targetColl.get(),
  ]);

  // Build set of already-migrated storage paths
  const migratedPaths = new Set(
    targetSnap.docs.map((d) => d.data().storagePath).filter(Boolean),
  );

  let migrated = 0;
  let skipped = 0;

  for (const doc of sourceSnap.docs) {
    const stageId = Number(doc.id);
    const data = doc.data();
    if (!data.photoUrl) { skipped++; continue; }

    const storagePath = `users/${uid}/baby-photos/${stageId}.jpg`;
    if (migratedPaths.has(storagePath)) { skipped++; continue; }

    // Resolve photoDate
    let photoDate;
    if (data.uploadedAt && typeof data.uploadedAt.toMillis === 'function') {
      photoDate = new Date(data.uploadedAt.toMillis()).toISOString().substring(0, 10);
    } else {
      photoDate = new Date().toISOString().substring(0, 10);
    }

    const newId = randomUUID();
    await targetColl.doc(newId).set({
      childId: null,
      photoUrl: data.photoUrl,
      storagePath,
      caption: data.caption ?? null,
      stageLabel: STAGE_LABELS[stageId] ?? null,
      photoDate,
      createdAt: FieldValue.serverTimestamp(),
    });

    migrated++;
    console.log(`  [${uid}] Migrated stage ${stageId} → ${newId}`);
  }

  console.log(`  [${uid}] Done — migrated: ${migrated}, skipped: ${skipped}`);
  return { migrated, skipped };
}

async function main() {
  const { uid, all } = parseArgs();

  if (!uid && !all) {
    console.error('Usage: node migrate-baby-photos.mjs --uid=<uid> | --all');
    process.exit(1);
  }

  if (uid) {
    await migrateUser(uid);
  } else {
    // Iterate all users that have babyMilestones docs
    const usersSnap = await db.collection('users').get();
    let totalMigrated = 0;
    let totalSkipped = 0;
    for (const userDoc of usersSnap.docs) {
      const result = await migrateUser(userDoc.id);
      totalMigrated += result.migrated;
      totalSkipped += result.skipped;
    }
    console.log(`\nTotal — migrated: ${totalMigrated}, skipped: ${totalSkipped}`);
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
