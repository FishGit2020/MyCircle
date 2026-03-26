#!/usr/bin/env node
/**
 * Seed public flashcards (English phrases).
 *
 * Writes cards to the `publicFlashcards` Firestore collection via REST API
 * so they are visible to all users without being hardcoded in the JS bundle.
 *
 * Prerequisites:
 *   gcloud auth application-default login
 *
 * Usage:
 *   node scripts/seed-public-flashcards.mjs [--dry-run]
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dryRun = process.argv.includes('--dry-run');
const PROJECT = 'mycircle-dash';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

function getToken() {
  return execSync('gcloud auth application-default print-access-token', { encoding: 'utf-8' }).trim();
}

function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestoreValue) } };
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) fields[k] = toFirestoreValue(v);
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function loadPhrases() {
  const src = readFileSync(resolve(__dirname, '../packages/flashcards/src/data/phrases.ts'), 'utf-8');
  const q = `(?:'([^']*)'|"([^"]*)")`;
  const regex = new RegExp(
    `\\{\\s*id:\\s*${q},\\s*english:\\s*${q},\\s*chinese:\\s*${q},\\s*phonetic:\\s*${q},\\s*category:\\s*${q},\\s*difficulty:\\s*(\\d)`,
    'g'
  );
  const results = [];
  let m;
  while ((m = regex.exec(src)) !== null) {
    results.push({
      id: m[1] || m[2],
      english: m[3] || m[4],
      chinese: m[5] || m[6],
      phonetic: m[7] || m[8],
      category: m[9] || m[10],
      difficulty: Number(m[11]),
    });
  }
  return results;
}

async function writeDoc(token, collection, docId, data) {
  const fields = {};
  for (const [k, v] of Object.entries(data)) fields[k] = toFirestoreValue(v);

  const url = `${BASE}/${collection}/${docId}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to write ${collection}/${docId}: ${res.status} ${text}`);
  }
}

async function seed() {
  const phrases = loadPhrases();
  console.log(`Found ${phrases.length} English phrases`);

  if (phrases.length === 0) {
    console.error('No phrases found — check the regex parser');
    process.exit(1);
  }

  const cards = phrases.map(p => ({
    id: `en-${p.id}`,
    type: 'english',
    category: p.category,
    front: p.english,
    back: p.chinese,
    isPublic: true,
    meta: { phonetic: p.phonetic },
  }));

  if (dryRun) {
    console.log(`\n[DRY RUN] Would write ${cards.length} public flashcards:`);
    cards.slice(0, 5).forEach(c => console.log(`  ${c.id}: ${c.front} → ${c.back}`));
    if (cards.length > 5) console.log(`  ... and ${cards.length - 5} more`);
    return;
  }

  const token = getToken();
  let count = 0;

  for (const card of cards) {
    await writeDoc(token, 'publicFlashcards', card.id, card);
    count++;
    if (count % 20 === 0) console.log(`  Written ${count}/${cards.length}...`);
  }

  console.log(`\nDone! Seeded ${count} public flashcards to publicFlashcards collection.`);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
