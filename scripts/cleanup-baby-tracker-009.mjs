#!/usr/bin/env node
/**
 * Cleanup script for baby-tracker 009 migrated data.
 *
 * This script deletes the Firestore subcollections that were created by the
 * 009-pregnancy-baby-tracker feature (PRs #829 and #830), which was reverted in PR #833:
 *   - users/{uid}/journalPhotos
 *   - users/{uid}/milestoneEvents
 *   - users/{uid}/milestoneAchievements
 *
 * These collections no longer exist in the codebase and can be safely removed.
 *
 * Prerequisites:
 *   gcloud auth application-default login
 *
 * Usage:
 *   node scripts/cleanup-baby-tracker-009.mjs [--dry-run] [--uid <uid>]
 *
 * Options:
 *   --dry-run   Print what would be deleted without actually deleting
 *   --uid <uid> Only clean up for a specific user UID
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const uidIndex = args.indexOf('--uid');
const targetUid = uidIndex !== -1 ? args[uidIndex + 1] : null;

initializeApp({
  credential: applicationDefault(),
  projectId: 'mycircle-dash',
});

const db = getFirestore();
const COLLECTIONS_TO_DELETE = ['journalPhotos', 'milestoneEvents', 'milestoneAchievements'];

async function deleteCollection(colRef, batchSize = 100) {
  const snap = await colRef.limit(batchSize).get();
  if (snap.empty) return 0;

  let totalDeleted = 0;
  const batch = db.batch();
  snap.docs.forEach(doc => batch.delete(doc.ref));
  if (!isDryRun) await batch.commit();
  totalDeleted += snap.docs.length;

  if (snap.docs.length === batchSize) {
    totalDeleted += await deleteCollection(colRef, batchSize);
  }
  return totalDeleted;
}

async function cleanupUser(uid) {
  let totalDeleted = 0;
  for (const colName of COLLECTIONS_TO_DELETE) {
    const colRef = db.collection(`users/${uid}/${colName}`);
    const count = await deleteCollection(colRef);
    if (count > 0) {
      console.log(`  ${isDryRun ? '[DRY RUN] Would delete' : 'Deleted'} ${count} docs from users/${uid}/${colName}`);
      totalDeleted += count;
    }
  }
  return totalDeleted;
}

async function main() {
  console.log(`🧹 Baby Tracker 009 Cleanup${isDryRun ? ' (DRY RUN)' : ''}`);
  console.log('Collections targeted:', COLLECTIONS_TO_DELETE.join(', '));
  if (targetUid) console.log('Targeting UID:', targetUid);
  console.log('');

  let totalDeleted = 0;

  if (targetUid) {
    totalDeleted = await cleanupUser(targetUid);
  } else {
    // Find all users who have any of the target collections
    console.log('Scanning all users for data to clean up...');
    const usersSnap = await db.collection('users').get();
    console.log(`Found ${usersSnap.docs.length} user documents to check\n`);

    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id;
      // Quick check: does this user have any of the target collections?
      let hasData = false;
      for (const colName of COLLECTIONS_TO_DELETE) {
        const sample = await db.collection(`users/${uid}/${colName}`).limit(1).get();
        if (!sample.empty) { hasData = true; break; }
      }
      if (hasData) {
        console.log(`User ${uid}:`);
        totalDeleted += await cleanupUser(uid);
      }
    }
  }

  console.log('');
  if (totalDeleted === 0) {
    console.log('✅ No data found to clean up.');
  } else {
    console.log(`✅ ${isDryRun ? 'Would delete' : 'Deleted'} ${totalDeleted} total documents.`);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
