#!/usr/bin/env node
/**
 * Seed: Days Of Elijah by Robin Mark
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-days-of-elijah.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Days Of Elijah",
    artist: "Robin Mark",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro}
[G] [C] [G] [C] [D]
[G] [C] [G] [C] [D]

{Verse}
[G]These are the days of [C]Elijah,
[G]Declaring the [D]word of the [G]Lord.
[G]And these are the days of Your [C]servant, Moses,
[G]Righteousness [D]being re[G]stored.
[Bm]And though these are [Em]days of great trials,
[C]Of famine and [D]darkness and sword,
[G]Still, we are the [C]voice in the desert crying,
[Em]"Prepare ye the [D]way of the [G]Lord!"

{Chorus}
[D]Behold he [G]comes, riding on the [C]clouds,
[G]Shining like the [D]sun at the trumpet call.
[D]So lift your [G]voice, it's the year of jubilee,
[G]And out of [D]Zion's hill, sal[G]vation comes.

{Verse 2}
[G]And these are the days of [C]Ezekiel,
[G]The dry bones [D]becoming as [G]flesh.
[G]And these are the days of Your [C]servant, David,
[G]Rebuilding the [D]temple of [G]praise.
[Bm]And these are the [Em]days of the harvest,
[C]The fields are as [D]white in the world.
[G]And we are the [C]laborers in Your vineyard,
[Em]Declaring the [D]word of the [G]Lord!

{Final Chorus}
[G]There is no God like Je[C]hovah,
[G]There is no God like Je[D]hovah.
[G]There is no God like Je[C]hovah,
[G]There is no God like Je[D]hovah.

(repeat 3x, change to A and repeat chorus 2x or more)`,
    notes: "Key of G, Capo 2 for original Bb. High energy praise. Great opener. Build to final 'no God like Jehovah' section.",
    bpm: 130,
    tags: ["worship", "praise", "declaration"],
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
