#!/usr/bin/env node
/**
 * Seed Dante Bowe worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/dante-bowe.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Joyful",
    artist: "Dante Bowe",
    originalKey: "Ab",
    format: "chordpro",
    content: `[Ab]I've got a reason to [Eb]be joyful
[Fm]I've got a reason to [Db]celebrate
[Ab]I've got a reason to [Eb]lift my voice
[Fm]And give Him [Db]praise

[Ab]Joyful [Eb]joyful
[Fm]I am joyful be[Db]cause of You
[Ab]Joyful [Eb]joyful
[Fm]I am joyful be[Db]cause of You

[Ab]In the morning when I [Eb]rise
[Fm]I will worship You with [Db]everything
[Ab]Because of what You've [Eb]done for me
[Fm]I can't help but [Db]sing`,
    notes: "High energy celebration. R&B/gospel groove. Get people moving.",
    bpm: 116,
    tags: ["worship","joy","celebration","gospel"],
  },
  {
    title: "So Good",
    artist: "Dante Bowe",
    originalKey: "G",
    format: "chordpro",
    content: `[G]You've been so [D]good
[Em]You've been so [C]good to me
[G]You've been so [D]good
[Em]You've been so [C]faithful

[G]Even when I [D]couldn't see
[Em]You were right there [C]with me
[G]Even in the [D]darkest valley
[Em]You never left my [C]side

[G]You've been so [D]good so good
[Em]Been so good so [C]good to me
[G]Look what You've [D]done look what You've [Em]done
[C]You've been so good to [G]me`,
    notes: "Soulful gratitude anthem. Smooth groove with gospel chords.",
    bpm: 82,
    tags: ["worship","goodness","gratitude","gospel"],
  },
  {
    title: "Wind of God",
    artist: "Dante Bowe",
    originalKey: "F",
    format: "chordpro",
    content: `[F]Like a rushing [Bb]wind
[Dm]Come and breathe a[C]gain
[F]Spirit of the [Bb]living God
[Dm]Fill this [C]place again

[F]Wind of God [Bb]wind of God
[Dm]Come and [C]blow
[F]Wind of God [Bb]wind of God
[Dm]Let Your Spirit [C]flow

[Bb]Breathe on [F]me breathe on [C]me
[Dm]Spirit of the [Bb]Lord breathe on [F]me
[C]Revive this [Dm]heart of mine
[Bb]Let Your fire [C]fall on [F]me`,
    notes: "Atmospheric and prophetic. Room for spontaneous worship.",
    bpm: 70,
    tags: ["worship","Holy Spirit","revival","spontaneous"],
  },
  {
    title: "Voice of God",
    artist: "Dante Bowe",
    originalKey: "Eb",
    format: "chordpro",
    content: `[Eb]I want to hear the [Bb]voice of God
[Cm]Speaking to my [Ab]heart
[Eb]Clear and loud a[Bb]bove the noise
[Cm]Silencing the [Ab]dark

[Eb]Speak Lord Your [Bb]servant's listening
[Cm]Speak Lord I'm [Ab]listening
[Eb]Speak Lord Your [Bb]servant's listening
[Cm]Speak Lord I [Ab]need to hear Your voice

[Ab]In the still[Eb]ness
[Bb]In the quiet [Cm]moments
[Ab]I hear Your [Eb]voice
[Bb]And it changes [Cm]everything`,
    notes: "Contemplative and reverent. Minimal arrangement. Let the lyrics breathe.",
    bpm: 66,
    tags: ["worship","listening","prayer","devotion"],
  },
  {
    title: "Be Alright",
    artist: "Dante Bowe",
    originalKey: "C",
    format: "chordpro",
    content: `[C]It's gonna be al[G]right
[Am]It's gonna be al[F]right
[C]I know it's gonna be al[G]right
[Am]Because of [F]You

[C]When the weight of the [G]world comes crashing down
[Am]When I can't find a [F]way and I need You now
[C]Even in the [G]valley when the shadows [Am]fall
[F]You will never leave me standing a[C]lone

[Am]I believe [G]I believe
[F]Everything is gonna be al[C]right
[Am]In Your hands [G]in Your plan
[F]I know it's gonna be al[C]right`,
    notes: "Encouraging and soulful. Contemporary gospel feel. Reassuring worship.",
    bpm: 88,
    tags: ["worship","encouragement","trust","gospel"],
  },
];

const skipExisting = process.argv.includes('--skip-existing');

async function main() {
  const col = db.collection('worshipSongs');
  let existingKeys = new Set();
  if (skipExisting) {
    const snapshot = await col.get();
    for (const doc of snapshot.docs) {
      const d = doc.data();
      existingKeys.add(`${d.title}|||${d.artist}`);
    }
    console.log(`Found ${existingKeys.size} existing songs in Firestore.`);
  }
  let batch = db.batch();
  let count = 0;
  let batchCount = 0;
  for (const song of SONGS) {
    const key = `${song.title}|||${song.artist}`;
    if (skipExisting && existingKeys.has(key)) {
      console.log(`  SKIP: ${song.title} - ${song.artist}`);
      continue;
    }
    const ref = col.doc();
    batch.set(ref, {
      ...song,
      createdBy: 'seed-script',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    count++;
    batchCount++;
    console.log(`  ADD:  ${song.title} - ${song.artist}`);
    if (batchCount >= 450) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }
  if (batchCount > 0) await batch.commit();
  console.log(`\nSeeded ${count} songs (total in script: ${SONGS.length}).`);
}

main().catch((err) => { console.error('Seed failed:', err); process.exit(1); });
