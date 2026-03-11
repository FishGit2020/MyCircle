#!/usr/bin/env node
/**
 * Seed Stuart Townend worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/stuart-townend.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "How Deep the Father's Love",
    artist: "Stuart Townend",
    originalKey: "D",
    format: "chordpro",
    content: `[D]How deep the [A]Father's love for [Bm]us
[G]How vast be[D]yond all [A]measure
[D]That He should [A]give His [Bm]only Son
[G]To make a [A]wretch His [D]treasure

[D]How great the [A]pain of [Bm]searing loss
[G]The Father [D]turns His [A]face away
[D]As wounds which [A]mar the [Bm]Chosen One
[G]Bring many [A]sons to [D]glory`,
    notes: "Intimate and reflective. Acoustic guitar or piano only works best.",
    bpm: 66,
    tags: ["worship","hymn","cross","love"],
  },
  {
    title: "Beautiful Savior",
    artist: "Stuart Townend",
    originalKey: "G",
    format: "chordpro",
    content: `[G]All my days I will [C]sing this song of [G]gladness
[Em]Give my praise to the [C]Fountain of de[D]lights
[G]For in my helpless[C]ness You heard my [G]crying
[Em]And waves of [C]mercy [D]poured down on my [G]life

[C]Beautiful [D]Savior wonderful [Em]Counselor
[C]Clothed in [D]majesty [G]Lord of history
[C]You're the [D]Way the [Em]Truth the [C]Life
[Am]Star of the [C]Morning [D]glorious in [G]holiness
[C]You're the [D]Risen One [G]Heaven's champion`,
    notes: "Joyful and celebratory. Strong melody for congregational singing.",
    bpm: 84,
    tags: ["worship","praise","hymn","joy"],
  },
  {
    title: "Creation Sings",
    artist: "Stuart Townend",
    originalKey: "E",
    format: "chordpro",
    content: `[E]Creation sings the [A]Father's song
[E]He calls the sun to [B]wake the dawn
[C#m]And run the course of [A]day
[E]Till evening comes in [B]crimson rays

[E]His fingerprints in [A]flakes of snow
[E]His breath upon this [B]spinning globe
[C#m]He charts the eagle's [A]flight
[E]Commands the newborn [B]baby's cry

[A]Hallelujah [E]let all creation [B]stand and sing
[A]Hallelujah [E]fill the earth with [B]songs of worship
[A]Tell the wonders [E]of cre[B]ation's [C#m]King`,
    notes: "Expansive and worshipful. Use dynamics to reflect creation imagery.",
    bpm: 82,
    tags: ["worship","creation","hymn","praise"],
  },
  {
    title: "Oh How Good It Is",
    artist: "Stuart Townend",
    originalKey: "D",
    format: "chordpro",
    content: `[D]Oh how good it [G]is when the [D]family of [A]God
[D]Dwells together in [G]spirit in [A]faith and u[D]nity
[Bm]Where the bonds of [G]peace of ac[D]ceptance and [A]love
[D]Are the fruit of His [G]presence [A]here among [D]us

[G]So with one voice we'll [D]sing to the Lord
[A]And with one heart we'll [Bm]live out His word
[G]Till the whole earth [D]sees the Re[A]deemer has [D]come
[G]For He dwells in the [A]presence of His [D]people`,
    notes: "Community hymn co-written with Keith Getty. Perfect for church unity themes.",
    bpm: 84,
    tags: ["worship","unity","community","hymn"],
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
