#!/usr/bin/env node
/**
 * Seed Naomi Raine worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/naomi-raine.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Journey",
    artist: "Naomi Raine",
    originalKey: "Eb",
    format: "chordpro",
    content: `[Eb]It's all part of the [Bb]journey
[Cm]Every twist and [Ab]turn
[Eb]Every lesson that I [Bb]needed
[Cm]I was born to [Ab]learn

[Eb]And I wouldn't trade the [Bb]process
[Cm]Or the pain that [Ab]came
[Eb]Cause it brought me to the [Bb]place where
[Cm]I could know Your [Ab]name

[Eb]It's all part of the [Bb]journey
[Cm]And You've been with me [Ab]all along
[Eb]I can see Your hand in [Bb]everything
[Cm]Every step, every [Ab]song`,
    notes: "Reflective and soulful, piano-driven",
    bpm: 74,
    tags: ["worship","testimony","soulful"],
  },
  {
    title: "Going Deeper",
    artist: "Naomi Raine",
    originalKey: "F",
    format: "chordpro",
    content: `[F]Take me deeper [C]Lord
[Dm]Past the shallow [Bb]end
[F]Where Your Spirit [C]moves
[Dm]Where the river [Bb]bends

[F]I'm going deeper [C]deeper
[Dm]Into Your love [Bb]for me
[F]I'm going deeper [C]deeper
[Dm]Where I was meant [Bb]to be

[F]Over my head in the [C]ocean of Your grace
[Dm]I wanna drown in the [Bb]beauty of Your face
[F]Going deeper, [C]going deeper
[Dm]Going [Bb]deeper`,
    notes: "Prophetic worship feel, let it flow freely",
    bpm: 70,
    tags: ["worship","prophetic","depth"],
  },
  {
    title: "Into the Deep",
    artist: "Naomi Raine",
    originalKey: "Ab",
    format: "chordpro",
    content: `[Ab]Cast out into the [Eb]deep
[Fm]Where Your waters [Db]flow
[Ab]Far beyond what I can [Eb]see
[Fm]Where my faith will [Db]grow

[Ab]Into the deep, [Eb]into the deep
[Fm]I'll trust You Lord with [Db]everything
[Ab]Into the deep, [Eb]into the deep
[Fm]My soul will sing of [Db]who You are

[Ab]There's no fear in the [Eb]deep
[Fm]When Your arms carry [Db]me
[Ab]Into the [Eb]deep
[Fm]Into the [Db]deep`,
    notes: "Atmospheric and free-flowing, worship team follow the leader",
    bpm: 68,
    tags: ["worship","faith","atmospheric"],
  },
  {
    title: "Never Lost",
    artist: "Naomi Raine",
    originalKey: "G",
    format: "chordpro",
    content: `[G]You've never lost a [D]battle
[Em]And I know, I [C]know
[G]You never will [D]
[Em]You never [C]will

[G]Every war, every [D]fight
[Em]Every dark, every [C]night
[G]You've never lost [D]and You won't start now
[Em]Won't start [C]now

[G]And I know that You have [D]won it all
[Em]The victory is [C]Yours
[G]You never lost [D]no never lost
[Em]You never [C]will`,
    notes: "Bold declaration, Elevation Worship collaboration feel",
    bpm: 82,
    tags: ["worship","victory","declaration"],
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
