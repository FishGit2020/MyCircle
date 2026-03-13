#!/usr/bin/env node
/**
 * Updates existing Firestore worship songs with section labels.
 * Reads all seed files, finds matching songs in Firestore by title+artist,
 * and updates the content field with the labeled version.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=<path-to-adc.json> node scripts/seed-songs/update-all.mjs
 *   GOOGLE_APPLICATION_CREDENTIALS=<path-to-adc.json> node scripts/seed-songs/update-all.mjs --dry-run
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dryRun = process.argv.includes('--dry-run');

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SKIP_FILES = new Set(['update-all.mjs', 'README.md']);

async function main() {
  // 1. Collect all songs from seed files
  const songMap = new Map(); // key: "title|||artist" -> content
  const files = readdirSync(__dirname).filter(f => f.endsWith('.mjs') && !SKIP_FILES.has(f));

  for (const f of files) {
    const filePath = join(__dirname, f);
    try {
      const mod = await import(pathToFileURL(filePath).href);
      // The seed files don't export SONGS, they execute directly.
      // We need to parse them differently.
    } catch {
      // Expected - seed files auto-execute
    }
  }

  // Since seed files auto-execute (they call initializeApp), we need to
  // parse the SONGS arrays directly from the file content.
  const { readFileSync } = await import('fs');

  for (const f of files) {
    const filePath = join(__dirname, f);
    const content = readFileSync(filePath, 'utf-8');

    // Extract songs using regex
    const songRegex = /\{\s*title:\s*"([^"]*)",\s*artist:\s*"([^"]*)",[\s\S]*?content:\s*`([^`]*)`/g;
    let match;
    while ((match = songRegex.exec(content)) !== null) {
      const title = match[1];
      const artist = match[2];
      const songContent = match[3];
      const key = `${title}|||${artist}`;
      songMap.set(key, songContent);
    }
  }

  console.log(`Loaded ${songMap.size} songs from ${files.length} seed files.`);

  // 2. Fetch all existing songs from Firestore
  const col = db.collection('worshipSongs');
  const snapshot = await col.get();
  console.log(`Found ${snapshot.size} songs in Firestore.\n`);

  // 3. Match and update
  let updated = 0;
  let skipped = 0;
  let notFound = 0;
  let batch = db.batch();
  let batchCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const key = `${data.title}|||${data.artist}`;
    const newContent = songMap.get(key);

    if (!newContent) {
      // Song exists in Firestore but not in seed files
      continue;
    }

    // Check if content already has section labels
    if (data.content && data.content.match(/^\{(Verse|Chorus|Bridge|Pre-Chorus|Interlude|Outro|Tag|Part)/m)) {
      skipped++;
      continue;
    }

    // Check if the new content has section labels
    if (!newContent.match(/^\{(Verse|Chorus|Bridge|Pre-Chorus|Interlude|Outro|Tag|Part)/m)) {
      skipped++;
      continue;
    }

    if (dryRun) {
      console.log(`  WOULD UPDATE: ${data.title} - ${data.artist}`);
      updated++;
      continue;
    }

    batch.update(doc.ref, {
      content: newContent,
      updatedAt: FieldValue.serverTimestamp(),
    });
    updated++;
    batchCount++;
    console.log(`  UPDATED: ${data.title} - ${data.artist}`);

    if (batchCount >= 450) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (!dryRun && batchCount > 0) {
    await batch.commit();
  }

  console.log(`\n${dryRun ? 'DRY RUN - ' : ''}Updated: ${updated}, Skipped (already labeled): ${skipped}`);
}

main().catch((err) => { console.error('Update failed:', err); process.exit(1); });
