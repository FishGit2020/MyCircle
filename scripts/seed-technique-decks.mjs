#!/usr/bin/env node
/**
 * Seed technique flashcard decks — one deck per category.
 *
 * Creates decks in `users/{uid}/flashcardDecks` and links technique cards
 * from `users/{uid}/flashcards` as deckCards with initial SM-2 state.
 *
 * Prerequisites:
 *   gcloud auth application-default login
 *   Run seed-technique-flashcards.mjs first to populate user's flashcards
 *
 * Usage:
 *   node scripts/seed-technique-decks.mjs --uid <uid> [--dry-run]
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

async function writeDoc(token, path, data) {
  const fields = {};
  for (const [k, v] of Object.entries(data)) fields[k] = toFirestoreValue(v);
  const url = `${BASE}/${path}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to write ${path}: ${res.status} ${text}`);
  }
}

function loadTechniques() {
  const src = readFileSync(resolve(__dirname, '../packages/flashcards/src/data/techniques.ts'), 'utf-8');
  const results = [];
  const blockRegex = /\{\s*id:\s*'([^']+)',\s*front:\s*'((?:[^'\\]|\\.)*)'\s*,\s*back:\s*'((?:[^'\\]|\\.)*)'\s*,\s*category:\s*'([^']+)'\s*,\s*difficulty:\s*(\d)\s*\}/g;
  let m;
  while ((m = blockRegex.exec(src)) !== null) {
    results.push({ id: m[1], category: m[4] });
  }
  return results;
}

const CATEGORY_NAMES = {
  'algorithms': 'Interview Frameworks & Algorithms',
  'two-pointers': 'Two Pointers',
  'python-syntax': 'Python Syntax',
  'bugs': 'Common Bugs',
  'data-structures': 'Data Structures',
  'trees-graphs': 'Trees & Graphs',
  'dynamic-programming': 'Dynamic Programming & Backtracking',
  'sorting-searching': 'Sorting & Searching',
};

async function seed() {
  const techniques = loadTechniques();
  const categories = [...new Set(techniques.map(t => t.category))];
  console.log(`Found ${techniques.length} technique cards across ${categories.length} categories`);

  if (dryRun) {
    console.log(`\n[DRY RUN] Would create ${categories.length} decks for uid=${uid}:`);
    for (const cat of categories) {
      const cards = techniques.filter(t => t.category === cat);
      console.log(`  ${CATEGORY_NAMES[cat] || cat}: ${cards.length} cards`);
    }
    return;
  }

  const token = getToken();
  const now = new Date().toISOString();
  const dueDateMs = Date.now() - 1000; // Due now

  for (const cat of categories) {
    const deckId = `tech-deck-${cat}`;
    const deckName = CATEGORY_NAMES[cat] || cat;
    const catCards = techniques.filter(t => t.category === cat);

    // Create deck
    await writeDoc(token, `users/${uid}/flashcardDecks/${deckId}`, {
      name: deckName,
      languagePair: 'Technical → Answer',
      createdAt: now,
      updatedAt: now,
    });
    console.log(`Created deck: ${deckName} (${catCards.length} cards)`);

    // Add deck cards
    for (const card of catCards) {
      const cardId = `tech-${card.id}`;
      await writeDoc(token, `users/${uid}/flashcardDecks/${deckId}/deckCards/${cardId}`, {
        cardId,
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        dueDate: new Date(dueDateMs).toISOString(),
        maturity: 'new',
        addedAt: now,
      });
    }
  }

  console.log(`\nDone! Created ${categories.length} technique decks for uid=${uid}`);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
