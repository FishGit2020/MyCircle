#!/usr/bin/env node
/**
 * Force-update ALL songs in Firestore with content, originalKey, and tags from seed scripts.
 * Unlike update-all.mjs, this does NOT skip songs that already have section labels.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=<path> node scripts/seed-songs/force-update-all.mjs
 *   GOOGLE_APPLICATION_CREDENTIALS=<path> node scripts/seed-songs/force-update-all.mjs --dry-run
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

const SKIP_FILES = new Set(['update-all.mjs', 'force-update-all.mjs', 'README.md']);

async function main() {
  const files = readdirSync(__dirname).filter(f => f.endsWith('.mjs') && !SKIP_FILES.has(f));

  // Parse songs from seed files
  const songMap = new Map(); // key: "title|||artist" -> { content, originalKey, tags }

  for (const f of files) {
    const filePath = join(__dirname, f);
    const fileContent = readFileSync(filePath, 'utf-8');

    // Extract songs with content, originalKey, and tags
    const songRegex = /\{\s*title:\s*"([^"]*)",\s*artist:\s*"([^"]*)",\s*originalKey:\s*"([^"]*)",[\s\S]*?content:\s*`([^`]*)`[\s\S]*?tags:\s*\[([^\]]*)\]/g;
    let match;
    while ((match = songRegex.exec(fileContent)) !== null) {
      const title = match[1];
      const artist = match[2];
      const originalKey = match[3];
      const content = match[4];
      const tagsRaw = match[5];
      const tags = tagsRaw.match(/"([^"]*)"/g)?.map(t => t.replace(/"/g, '')) || [];
      const key = `${title}|||${artist}`;
      songMap.set(key, { content, originalKey, tags });
    }
  }

  console.log(`Loaded ${songMap.size} songs from ${files.length} seed files.`);

  // Fetch all existing songs
  const col = db.collection('worshipSongs');
  const snapshot = await col.get();
  console.log(`Found ${snapshot.size} songs in Firestore.\n`);

  let updated = 0;
  let skipped = 0;
  let batch = db.batch();
  let batchCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const key = `${data.title}|||${data.artist}`;
    const seed = songMap.get(key);

    if (!seed) continue;

    // Check if anything actually changed
    const contentChanged = seed.content !== data.content;
    const keyChanged = seed.originalKey !== data.originalKey;
    const tagsChanged = JSON.stringify(seed.tags.sort()) !== JSON.stringify((data.tags || []).sort());

    if (!contentChanged && !keyChanged && !tagsChanged) {
      skipped++;
      continue;
    }

    if (dryRun) {
      const changes = [];
      if (keyChanged) changes.push(`key: ${data.originalKey} -> ${seed.originalKey}`);
      if (contentChanged) changes.push('content');
      if (tagsChanged) changes.push('tags');
      console.log(`  WOULD UPDATE: ${data.title} - ${data.artist} [${changes.join(', ')}]`);
      updated++;
      continue;
    }

    const updateData = { updatedAt: FieldValue.serverTimestamp() };
    if (contentChanged) updateData.content = seed.content;
    if (keyChanged) updateData.originalKey = seed.originalKey;
    if (tagsChanged) updateData.tags = seed.tags;

    batch.update(doc.ref, updateData);
    updated++;
    batchCount++;

    const changes = [];
    if (keyChanged) changes.push(`key: ${data.originalKey} -> ${seed.originalKey}`);
    if (contentChanged) changes.push('content');
    if (tagsChanged) changes.push('tags');
    console.log(`  UPDATED: ${data.title} - ${data.artist} [${changes.join(', ')}]`);

    if (batchCount >= 450) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`\n${dryRun ? 'DRY RUN - ' : ''}Updated: ${updated}, Unchanged: ${skipped}`);
}

main().catch(err => { console.error('Update failed:', err); process.exit(1); });
