#!/usr/bin/env node
/**
 * Seed Hillsong Young & Free worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/hillsong-young-and-free.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Christ Is Enough [INCOMPLETE - needs V2+Bridge]",
    artist: "Hillsong Young & Free",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]Christ is my re[A]ward
[Bm]And all of my de[G]votion
[D]Now there's nothing in this [A]world
[Bm]That could ever satis[G]fy

{Chorus}
[D]Christ is e[A]nough for me
[Bm]Christ is e[G]nough for me
[D]Everything I [A]need is in You
[Bm]Everything I [G]need`,
    notes: "Simple and devotional, acoustic-driven, great for small groups",
    bpm: 68,
    tags: ["worship","devotion","contentment"],
  },
  {
    title: "Sinking Deep [INCOMPLETE - needs V2+Bridge]",
    artist: "Hillsong Young & Free",
    originalKey: "B",
    format: "chordpro",
    content: `{Verse 1}
[B]Standing on the [E]edge of everything
[G#m]I've never been be[F#]fore
[B]And I've been standing in the [E]storm
[G#m]But I'm learning how to [F#]trust You more

{Chorus}
[B]I'm sinking deep in [E]oceans of Your love
[G#m]Crashing over [F#]me
[B]I'm sinking deep in [E]rivers of Your grace
[G#m]Falling on my [F#]knees`,
    notes: "Reflective and deep, electronic elements, popular with youth",
    bpm: 66,
    tags: ["worship","trust","intimacy"],
  },
  {
    title: "Alive (Y&F) [INCOMPLETE - needs V2+Bridge]",
    artist: "Hillsong Young & Free",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Darkness surrounded [D]me
[Em]My feet were bound and [C]chained
[G]A light burst through the [D]night
[Em]And freedom called my [C]name

{Chorus}
[G]You brought me back to [D]life
[Em]I feel alive, I'm [C]alive
[G]You called me from the [D]grave
[Em]I'm alive, I'm a[C]live`,
    notes: "High-energy youth anthem, EDM-influenced drops, clap-along",
    bpm: 150,
    tags: ["worship","resurrection","freedom","youth"],
  },
  {
    title: "Wake [INCOMPLETE - needs V2+Bridge]",
    artist: "Hillsong Young & Free",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]We are the free, [E]the free ones
[F#m]Called to live as [D]children of the light
[A]We are the saved, [E]the forgiven
[F#m]Rise up, it's time [D]to come alive

{Chorus}
[A]Wake, the [E]sun is rising
[F#m]Wake, His [D]grace is shining
[A]Wake, and let the [E]whole world know
[F#m]Our God is [D]alive`,
    notes: "Upbeat opener, synth-driven, festival energy",
    bpm: 146,
    tags: ["worship","youth","awakening"],
  },
  {
    title: "Real Love [INCOMPLETE - needs V2+Bridge]",
    artist: "Hillsong Young & Free",
    originalKey: "Eb",
    format: "chordpro",
    content: `{Verse 1}
[Eb]I've tasted and I've [Bb]seen
[Cm]The sweetness of Your [Ab]love
[Eb]Nothing in this [Bb]world
[Cm]Could take the place [Ab]of what You've done

{Chorus}
[Eb]This is real love, [Bb]real love
[Cm]Not the kind that [Ab]fades away
[Eb]This is real love, [Bb]real love
[Cm]I've found it in [Ab]Your name`,
    notes: "Pop-worship crossover, catchy hook, synths and pads",
    bpm: 120,
    tags: ["worship","love","youth"],
  },
  {
    title: "This Is Living [INCOMPLETE - needs V2+Bridge]",
    artist: "Hillsong Young & Free",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]I used to be [D]afraid to let love in
[Em]Then You came [C]along and took me in
[G]The walls came down [D]this heart that was chained
[Em]Found its way to [C]freedom again

{Chorus}
[G]This is living, [D]this is living now
[Em]My whole world has [C]turned around
[G]Breathe the air, I'm [D]breathing out
[Em]This is [C]living now`,
    notes: "Fun and energetic, strong pop feel, great youth service opener",
    bpm: 128,
    tags: ["worship","joy","freedom","youth"],
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
