#!/usr/bin/env node
/**
 * Seed Pat Barrett worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/pat-barrett.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Sails",
    artist: "Pat Barrett",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]I cast my anchors [C]in
[Em]Deep in the ocean [D]floor
[G]But Your wind is [C]calling me
[Em]Out into the [D]unknown

{Chorus}
[G]So set my [C]sails oh set my [Em]sails
[D]Into the [G]mystery
[G]Set my [C]sails oh set my [Em]sails
[D]I'm trusting [G]You

{Verse 2}
[C]Take me further [G]than I've been
[D]Deeper than my [Em]feet could ever wander
[C]Past the point of [G]no return
[D]Where You are is where I want to [G]be`,
    notes: "Adventurous and hopeful. Acoustic-driven with building dynamics.",
    bpm: 80,
    tags: ["worship","faith","trust","adventure"],
  },
  {
    title: "Canvas and Clay",
    artist: "Pat Barrett",
    originalKey: "B",
    format: "chordpro",
    content: `{Verse 1}
[B]You didn't look at me and [E]see a hopeless case
[G#m]You saw a master[F#]piece in a mess of grace
[B]An empty canvas [E]waiting to be changed
[G#m]Into something [F#]beautiful

{Chorus}
[B]Oh You're the potter I'm the [E]clay
[G#m]And You will finish what You've [F#]started
[B]You who began a good [E]work in me
[G#m]You'll be faithful to com[F#]plete it

{Verse 2}
[E]Canvas and [B]clay before You
[F#]Canvas and [G#m]clay I worship [E]You`,
    notes: "Features Ben Smith. Warm and reassuring. Great for identity themes.",
    bpm: 76,
    tags: ["worship","identity","creation","grace"],
  },
  {
    title: "God Is So Good",
    artist: "Pat Barrett",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]You're never gonna [G]let me down
[Am]Never gonna [F]leave this heart alone
[C]You're never gonna [G]let me down
[Am]Your love has always [F]been enough

{Chorus}
[C]God is so [G]good
[Am]God is so [F]good
[C]God is so good He's so [G]good to me
[Am]God is so [F]good

{Verse 2}
[C]Every morning [G]mercy new
[Am]Faithfulness in [F]all You do
[C]I will testify Your [G]love is real
[Am]And I've seen Your [F]goodness`,
    notes: "Joyful and simple. Great for all-ages worship moments.",
    bpm: 110,
    tags: ["worship","goodness","joy","praise"],
  },
  {
    title: "Better",
    artist: "Pat Barrett",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]There's no one [A]better
[Bm]There's no one [G]better than You
[D]There's no one [A]better
[Bm]There's no one [G]better than You

{Chorus}
[D]You are the [A]healer You are the [Bm]friend
[G]Faithful forever [D]until the end
[D]Alpha O[A]mega the first and [Bm]last
[G]I'm going to praise You for[D]ever

{Verse 2}
[G]There's no one [D]better [A]no one better
[Bm]In all the [G]earth in all the [D]heavens
[A]No one [Bm]better [G]Lord than You`,
    notes: "Simple and singable. Repeat chorus with building energy.",
    bpm: 84,
    tags: ["worship","praise","declaration","joy"],
  },
  {
    title: "The Way (New Horizon)",
    artist: "Pat Barrett",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]Through every [B]battle through every [C#m]heartbreak
[A]Through every circumstance I be[E]lieve
[E]That You are my [B]fortress oh You are my [C#m]portion
[A]You are my hiding [E]place

{Chorus}
[E]I believe You're the [B]way I believe
[C#m]I believe You're the [A]truth I believe
[E]You are the way the [B]truth and the [C#m]life
[A]I believe through every [E]promise

{Verse 2}
[A]Oh I believe [E]You are the way
[B]I believe [C#m]through every trial
[A]I believe You make all things [E]new`,
    notes: "Worship Nights collaboration. Faith declaration with building dynamics.",
    bpm: 78,
    tags: ["worship","faith","truth","declaration"],
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
