#!/usr/bin/env node
/**
 * Seed script for flashcard decks (010-language-flashcards).
 *
 * Creates a test deck with deckCard documents for a given user UID.
 * Cards are seeded with dueDate in the past so they are immediately reviewable.
 *
 * Prerequisites:
 *   gcloud auth application-default login
 *
 * Usage:
 *   node scripts/seed-flashcard-decks.mjs --uid <uid> [--overdue]
 *
 * Options:
 *   --uid <uid>  Target user UID (required)
 *   --overdue    Set all dueDates to 1 day in the past (default: due now)
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const args = process.argv.slice(2);
const uidIndex = args.indexOf('--uid');
const uid = uidIndex !== -1 ? args[uidIndex + 1] : null;
const overdue = args.includes('--overdue');

if (!uid) {
  console.error('Error: --uid <uid> is required');
  process.exit(1);
}

initializeApp({
  credential: applicationDefault(),
  projectId: 'mycircle-dash',
});

const db = getFirestore();

// Sample card IDs — these reference existing flashcard cards in the library
// Use real IDs from the flashcards English bundle or adjust as needed
const SAMPLE_CARD_IDS = [
  'en-greetings-hi',
  'en-greetings-goodbye',
  'en-feelings-happy',
  'en-food-apple',
  'en-food-water',
];

const now = Date.now();
const dueDateMs = overdue ? now - 86400000 : now - 1000; // 1 day ago or 1s ago

async function seed() {
  console.log(`Seeding flashcard deck for uid=${uid}, overdue=${overdue}`);

  const deckRef = db.collection(`users/${uid}/flashcardDecks`).doc();
  const deckId = deckRef.id;

  await deckRef.set({
    name: 'Test Deck (Seeded)',
    languagePair: 'English → Spanish',
    createdAt: Timestamp.fromMillis(now),
    updatedAt: Timestamp.fromMillis(now),
  });

  console.log(`Created deck: ${deckId}`);

  for (const cardId of SAMPLE_CARD_IDS) {
    const cardRef = deckRef.collection('deckCards').doc(cardId);
    await cardRef.set({
      cardId,
      interval: 1,
      easeFactor: 2.5,
      repetitions: 1,
      dueDate: Timestamp.fromMillis(dueDateMs),
      maturity: 'learning',
      addedAt: Timestamp.fromMillis(now - 86400000),
    });
    console.log(`  Added card: ${cardId}`);
  }

  console.log(`\nDone! Deck ${deckId} seeded with ${SAMPLE_CARD_IDS.length} due cards.`);
  console.log(`Open the app and navigate to Flashcards → Decks to see the seeded deck.`);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
