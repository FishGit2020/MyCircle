#!/usr/bin/env node
/**
 * Reseed worship songs from PDF songbook only.
 * 1. Deletes ALL existing worshipSongs from Firestore
 * 2. Deletes ALL worship-songs/ files from Firebase Storage
 * 3. Re-creates songs from song-*.mjs individual seed files (or pdf-songbook-part*.mjs)
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=<path> node scripts/seed-songs/reseed-pdf-only.mjs
 *   GOOGLE_APPLICATION_CREDENTIALS=<path> node scripts/seed-songs/reseed-pdf-only.mjs --dry-run
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const bucket = getStorage().bucket('mycircle-dash.firebasestorage.app');

const __dirname = dirname(fileURLToPath(import.meta.url));
const dryRun = process.argv.includes('--dry-run');

async function deleteStorageFiles() {
  console.log('Cleaning up Firebase Storage worship-songs/ files...');
  try {
    const [files] = await bucket.getFiles({ prefix: 'worship-songs/' });
    if (files.length === 0) {
      console.log('  No Storage files found to delete.');
      return;
    }
    if (!dryRun) {
      let count = 0;
      for (const file of files) {
        await file.delete();
        count++;
        if (count % 50 === 0) {
          console.log(`  ... deleted ${count}/${files.length} storage files`);
        }
      }
      console.log(`  Deleted ${count} storage files.\n`);
    } else {
      console.log(`  DRY RUN: Would delete ${files.length} storage files.\n`);
    }
  } catch (err) {
    // Storage bucket may not exist or be empty - that's fine
    if (err.code === 404 || err.message?.includes('Not Found')) {
      console.log('  No Storage bucket or files found (OK).\n');
    } else {
      console.warn('  Warning: Could not clean Storage:', err.message);
    }
  }
}

async function main() {
  // 1. Find song-*.mjs files (individual), fallback to pdf-songbook-*.mjs (batched)
  let files = readdirSync(__dirname).filter(
    (f) => f.startsWith('song-') && f.endsWith('.mjs'),
  );
  if (files.length === 0) {
    // Fallback to batched part files
    files = readdirSync(__dirname).filter(
      (f) => f.startsWith('pdf-songbook-') && f.endsWith('.mjs'),
    );
  }

  if (files.length === 0) {
    console.error('No song-*.mjs or pdf-songbook-*.mjs files found in', __dirname);
    process.exit(1);
  }

  // 2. Parse all songs from PDF seed files
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
    `Loaded ${allSongs.length} songs from ${files.length} PDF seed files.\n`,
  );

  if (allSongs.length === 0) {
    console.error('No songs parsed from seed files. Check file format.');
    process.exit(1);
  }

  // 3. Delete all existing worshipSongs from Firestore
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
    console.log(`Deleted ${deleteCount} existing songs from Firestore.\n`);
  } else {
    console.log(`DRY RUN: Would delete ${snapshot.size} existing songs.\n`);
  }

  // 4. Delete all Storage files
  await deleteStorageFiles();

  // 5. Re-add all songs from PDF seed files
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
        createdBy: 'pdf-seed-script',
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
    console.log(`\nReseeded ${addCount} PDF songs into Firestore.`);
    console.log('Done! All worship songs are now from the PDF songbook.');
  } else {
    console.log(`DRY RUN: Would add ${allSongs.length} songs.`);
    console.log('\nSong list:');
    for (const song of allSongs) {
      console.log(
        `  "${song.title}" by ${song.artist} [${song.originalKey}] (${song.sourceFile})`,
      );
    }
  }
}

main().catch((err) => {
  console.error('Reseed failed:', err);
  process.exit(1);
});
