#!/usr/bin/env node
/**
 * Seed technique flashcards for a specific user.
 *
 * Writes coding interview technique cards to the user's private
 * `users/{uid}/flashcards` collection via Firestore REST API.
 *
 * Prerequisites:
 *   gcloud auth application-default login
 *
 * Usage:
 *   node scripts/seed-technique-flashcards.mjs --uid <uid> [--dry-run]
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const uidIndex = args.indexOf('--uid');
const uid = uidIndex !== -1 ? args[uidIndex + 1] : null;
const dryRun = args.includes('--dry-run');
const PROJECT = 'mycircle-dash';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

if (!uid) {
  console.error('Error: --uid <uid> is required');
  process.exit(1);
}

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

function loadTechniques() {
  const src = readFileSync(resolve(__dirname, '../packages/flashcards/src/data/techniques.ts'), 'utf-8');
  const results = [];
  const blockRegex = /\{\s*id:\s*'([^']+)',\s*front:\s*'((?:[^'\\]|\\.)*)'\s*,\s*back:\s*'((?:[^'\\]|\\.)*)'\s*,\s*category:\s*'([^']+)'\s*,\s*difficulty:\s*(\d)\s*\}/g;
  let m;
  while ((m = blockRegex.exec(src)) !== null) {
    results.push({
      id: m[1],
      front: m[2].replace(/\\'/g, "'").replace(/\\n/g, '\n'),
      back: m[3].replace(/\\'/g, "'").replace(/\\n/g, '\n'),
      category: m[4],
      difficulty: Number(m[5]),
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
  const techniques = loadTechniques();
  console.log(`Found ${techniques.length} technique cards`);

  if (techniques.length === 0) {
    console.error('No technique cards found — check the regex parser');
    process.exit(1);
  }

  const cards = techniques.map(t => ({
    id: `tech-${t.id}`,
    type: 'technique',
    category: t.category,
    front: t.front,
    back: t.back,
    isPublic: false,
    meta: { difficulty: String(t.difficulty) },
    createdBy: { uid, displayName: 'Seed Script' },
  }));

  if (dryRun) {
    console.log(`\n[DRY RUN] Would write ${cards.length} technique flashcards for uid=${uid}:`);
    for (const cat of [...new Set(cards.map(c => c.category))]) {
      const catCards = cards.filter(c => c.category === cat);
      console.log(`  ${cat}: ${catCards.length} cards`);
    }
    return;
  }

  const token = getToken();
  const collection = `users/${uid}/flashcards`;
  let count = 0;

  for (const card of cards) {
    await writeDoc(token, collection, card.id, card);
    count++;
    if (count % 20 === 0) console.log(`  Written ${count}/${cards.length}...`);
  }

  const categories = [...new Set(cards.map(c => c.category))];
  console.log(`\nDone! Seeded ${count} technique flashcards for uid=${uid}`);
  console.log(`Categories: ${categories.join(', ')}`);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
