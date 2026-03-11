#!/usr/bin/env node
/**
 * Seed Planetshakers worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/planetshakers.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Put Your Hands Up",
    artist: "Planetshakers",
    originalKey: "E",
    format: "chordpro",
    content: `[E]We've come to lift Your name up [B]high
[C#m]With everything within us [A]we cry
[E]Put your hands up, put your [B]hands up
[C#m]Give God all the [A]glory

[E]Oh we sing hallelujah [B]hallelujah
[C#m]Put your hands up for the [A]King of kings
[E]Hallelujah [B]hallelujah
[C#m]Let His praises [A]ring`,
    notes: "High-energy opener, keep tempo driving",
    bpm: 140,
    tags: ["worship","upbeat","praise"],
  },
  {
    title: "Leave Me Astounded",
    artist: "Planetshakers",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Your love it knows no [D]boundaries
[Em]Your grace it has no [C]walls
[G]You took this heart of [D]sorrow
[Em]And made it Yours [C]through it all

[G]Leave me astounded [D]amazed and overcome
[Em]Leave me astounded [C]by what You've done
[G]Undone by Your [D]mercy
[Em]Captivated by [C]Your love`,
    notes: "Build dynamically from verse to chorus",
    bpm: 128,
    tags: ["worship","praise","upbeat"],
  },
  {
    title: "Endless Praise",
    artist: "Planetshakers",
    originalKey: "A",
    format: "chordpro",
    content: `[A]From the rising of the [E]sun
[F#m]To the place where it [D]goes down
[A]There is none like You [E]God
[F#m]You are worthy of [D]renown

[A]Endless praise, endless [E]praise
[F#m]We will give You endless [D]praise
[A]Now and forever [E]more
[F#m]We lift our voices and [D]adore`,
    notes: "Anthemic chorus, encourage congregation participation",
    bpm: 132,
    tags: ["worship","praise","anthem"],
  },
  {
    title: "Nothing Is Impossible",
    artist: "Planetshakers",
    originalKey: "B",
    format: "chordpro",
    content: `[B]Through You I can do [F#]anything
[G#m]I can do all [E]things
[B]Cause it's You who gives me [F#]strength
[G#m]Nothing is im[E]possible

[B]Nothing is impossible [F#]nothing is impossible
[G#m]Nothing is impossible [E]with You
[B]You hold my world [F#]in Your hands
[G#m]Nothing is im[E]possible`,
    notes: "Faith declaration, powerful for altar moments",
    bpm: 130,
    tags: ["worship","faith","declaration"],
  },
  {
    title: "Turn It Up",
    artist: "Planetshakers",
    originalKey: "E",
    format: "chordpro",
    content: `[E]This is our God and [B]we will not be silent
[C#m]We lift our praise to [A]heaven now
[E]Turn it up, turn it [B]up
[C#m]Let the whole earth [A]hear the sound

[E]Turn it up, we're gonna [B]turn it up
[C#m]For the glory of [A]our King
[E]Turn it up, we're gonna [B]turn it up
[C#m]Let the praises [A]ring`,
    notes: "Full band energy, strong downbeats",
    bpm: 144,
    tags: ["worship","upbeat","praise"],
  },
  {
    title: "The Anthem",
    artist: "Planetshakers",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Hallelujah, You have [D]won the victory
[Em]Hallelujah, You have [C]won it all for me
[G]Death could not hold You [D]down
[Em]You are the risen [C]King

[G]This is the anthem of [D]our hearts
[Em]We sing hallelujah [C]to the King
[G]This is the anthem of [D]our praise
[Em]We give You all the [C]glory`,
    notes: "Congregational anthem, repeat chorus for impact",
    bpm: 136,
    tags: ["worship","anthem","victory"],
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
