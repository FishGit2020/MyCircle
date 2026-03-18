#!/usr/bin/env node
/**
 * Seed: You Are Good by Brian Johnson
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-you-are-good.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "You Are Good",
    artist: "Brian Johnson",
    originalKey: "C",
    format: "chordpro",
    content: `{Intro}
[C] | [G] | [F] | | [x4]

{Verse 1}
[C]I want to scream it out from every mountain top
[F]Your goodness knows no bounds, Your goodness never stops
[Am]Your mercy follows me, Your kindness fills my life
[C]Your love [G]amazes me [repeat]

{Chorus 1}
[C](And I/I'll) sing because You are [C]good
[C]And I'll dance because You are [C]good
[F]And I'll shout because You are good, You are good to me

{Interlude 1}
[C] | [G] | [F] | | [x2]

{Verse 2}
[C]Nothing and no one comes anywhere close to You
[F]The earth and oceans deep only reflect this truth
[Am]And in my darkest night You shine as bright as day
[C]Your love [G]amazes me [repeat]

{Bridge}
[Dm]With a cry of praise my [F]heart will proclaim
[C]You are good, [G]You are good
[Dm]In the Sun or rain my [F]life celebrates
[C]You are good, [G]You are good [repeat]`,
    notes: "Key of C. Joyful praise. Bridge builds with declarations.",
    bpm: 72,
    tags: ["worship", "goodness", "joy"],
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
