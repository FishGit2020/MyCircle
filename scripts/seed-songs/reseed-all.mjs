#!/usr/bin/env node
/**
 * Full reseed: deletes all existing worshipSongs and re-creates from seed files.
 * Handles title changes (e.g., [INCOMPLETE] flags), removed songs, key/chord fixes.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=<path> node scripts/seed-songs/reseed-all.mjs
 *   GOOGLE_APPLICATION_CREDENTIALS=<path> node scripts/seed-songs/reseed-all.mjs --dry-run
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const __dirname = dirname(fileURLToPath(import.meta.url));
const dryRun = process.argv.includes('--dry-run');

const SKIP_FILES = new Set([
  'update-all.mjs', 'force-update-all.mjs', 'reseed-all.mjs', 'README.md',
]);

async function main() {
  const files = readdirSync(__dirname).filter(
    (f) => f.endsWith('.mjs') && !SKIP_FILES.has(f),
  );

  // 1. Parse all songs from seed files
  const allSongs = [];

  for (const f of files) {
    const filePath = join(__dirname, f);
    const fileContent = readFileSync(filePath, 'utf-8');

    const songRegex =
      /\{\s*title:\s*"([^"]*)",\s*artist:\s*"([^"]*)",\s*originalKey:\s*"([^"]*)",\s*format:\s*"([^"]*)",\s*content:\s*`([^`]*)`,?\s*notes:\s*"((?:[^"\\]|\\.)*)",?\s*bpm:\s*(\d+),?\s*tags:\s*\[([^\]]*)\]/g;
    let match;
    while ((match = songRegex.exec(fileContent)) !== null) {
      const tagsRaw = match[8];
      const tags =
        tagsRaw.match(/"([^"]*)"/g)?.map((t) => t.replace(/"/g, '')) || [];
      allSongs.push({
        title: match[1],
        artist: match[2],
        originalKey: match[3],
        format: match[4],
        content: match[5],
        notes: match[6],
        bpm: parseInt(match[7], 10),
        tags,
        sourceFile: f,
      });
    }
  }

  console.log(
    `Loaded ${allSongs.length} songs from ${files.length} seed files.\n`,
  );

  // 2. Delete all existing worshipSongs
  const col = db.collection('worshipSongs');
  const snapshot = await col.get();
  console.log(`Found ${snapshot.size} existing songs in Firestore.`);

  if (!dryRun) {
    let deleteBatch = db.batch();
    let deleteCount = 0;
    let deleteBatchCount = 0;

    for (const doc of snapshot.docs) {
      deleteBatch.delete(doc.ref);
      deleteCount++;
      deleteBatchCount++;

      if (deleteBatchCount >= 450) {
        await deleteBatch.commit();
        deleteBatch = db.batch();
        deleteBatchCount = 0;
      }
    }
    if (deleteBatchCount > 0) {
      await deleteBatch.commit();
    }
    console.log(`Deleted ${deleteCount} existing songs.\n`);
  } else {
    console.log(`DRY RUN: Would delete ${snapshot.size} existing songs.\n`);
  }

  // 3. Re-add all songs from seed files
  if (!dryRun) {
    let addBatch = db.batch();
    let addCount = 0;
    let addBatchCount = 0;

    for (const song of allSongs) {
      const ref = col.doc();
      addBatch.set(ref, {
        title: song.title,
        artist: song.artist,
        originalKey: song.originalKey,
        format: song.format,
        content: song.content,
        notes: song.notes,
        bpm: song.bpm,
        tags: song.tags,
        createdBy: 'seed-script',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      addCount++;
      addBatchCount++;

      if (addBatchCount >= 450) {
        await addBatch.commit();
        addBatch = db.batch();
        addBatchCount = 0;
        console.log(`  ... committed ${addCount} songs so far`);
      }
    }
    if (addBatchCount > 0) {
      await addBatch.commit();
    }
    console.log(`\nReseeded ${addCount} songs into Firestore.`);
  } else {
    console.log(`DRY RUN: Would add ${allSongs.length} songs.`);
    // Show a sample
    console.log('\nSample titles:');
    for (const song of allSongs.slice(0, 10)) {
      console.log(`  "${song.title}" by ${song.artist} [${song.originalKey}]`);
    }
    console.log('  ...');
  }
}

main().catch((err) => {
  console.error('Reseed failed:', err);
  process.exit(1);
});
