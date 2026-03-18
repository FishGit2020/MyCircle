#!/usr/bin/env node
/**
 * Seed: Champion by Bethel Music
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-champion.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Champion",
    artist: "Bethel Music",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Intro}
[G] [Em] [G/D] [D] x2

{Verse 1}
[G]I've tried so [Em]hard to see it
[Em]Took me so long to believe it
[G/D]That You'd choose someone like me
[C]To carry Your victory

{Verse 2}
[G]Perfection could never earn it
[Em]You give what we don't deserve and
[G/D]You take the broken things
[C]And raise them to glory

{Chorus 1}
[G]You are my [D]champion
[Em]Giants fall when You [G/B]stand
[C]Undefeated [Em]every [D]battle You've won
[G]I am who You [D]say I am
[Em]You crown me with [G/B]confidence
[C]I am seated in [Em]the heavenly [D]place
[C]Undefeated with the [Em]One who has [D]conquered it all

{Verse 3}
[G]Now I can finally see it
[Em]You're teaching me how to receive it
[G/D]So let all the striving cease
[C]This is my victory

{Link}
[C] [D] [Em] [D/F#] [G] [D] [G/B]

{Bridge} * 2
[C]When I [D]lift my voice and [Em]shout
[D/F#]Every wall comes [G]crashing down
I have the authority
[D]Jesus has [G/B]given me
[C]When I [D]open up my [Em]mouth
[D/F#]Miracles start [G]breaking out
I have the authority
[D]Jesus has [G/B]given me

{Chorus 2}
[G]You are my [D]champion
[Em]Giants fall when You [G/B]stand
[C]Undefeated [Em]every [D]battle You've won
[G]I am who You [D]say I am
[Em]You crown me with [G/B]confidence
[C]I am seated in [Em]the heavenly [D]place
[C]Undefeated by the [Em]power of Your [D]name
[C]I am seated in [Em]the heavenly [D]place
[C]Undefeated with the [Em]One who has [D]conquered it all`,
    notes: "Original key Bb, Capo 3. Powerful identity/victory anthem. Build through bridge dynamically.",
    bpm: 76,
    tags: ["worship", "victory", "identity"],
  },
];

const skipExisting = process.argv.includes("--skip-existing");

async function main() {
  const col = db.collection("worshipSongs");
  let existingTitles = new Set();

  if (skipExisting) {
    const snapshot = await col.select("title").get();
    snapshot.forEach((doc) => existingTitles.add(doc.data().title));
  }

  let batch = db.batch();
  let count = 0;

  for (const song of SONGS) {
    if (skipExisting && existingTitles.has(song.title)) {
      console.log("SKIP (exists): " + song.title);
      continue;
    }
    const ref = col.doc();
    batch.set(ref, {
      title: song.title,
      artist: song.artist,
      originalKey: song.originalKey,
      format: song.format,
      content: song.content,
      notes: song.notes,
      bpm: song.bpm,
      tags: song.tags,
      createdBy: "seed-script",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    count++;
    console.log("ADD: " + song.title);
  }

  if (count > 0) {
    await batch.commit();
    console.log("Seeded " + count + " song(s).");
  } else {
    console.log("No new songs to seed.");
  }
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
