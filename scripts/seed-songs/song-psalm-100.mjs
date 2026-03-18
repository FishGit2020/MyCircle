#!/usr/bin/env node
/**
 * Seed: Psalm 100 by Chris Tomlin
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-psalm-100.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Psalm 100",
    artist: "Chris Tomlin",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[G]Enter in through the [D]gates
[G]Enter in here and [D]praise
[G]Come before him, come bring your [Bm]song
[G]We are His [A]people, He is our God

{Chorus}
[G]For the Lord is [Bm]good and His love [D]endures
[A]His love endures
[G]For the Lord is [Bm]good and His love [D]endures
[A]His love endures [G] [Bm]forevermore
[D]His faithfulness, [A]it has no end
[G]For the Lord is [Bm]good and His love [D]endures
[A]His love endures

{Verse 2}
[G]Enter into His [D]courts
[G]Enter in with grateful [D]hearts
[G]Come before him, come bring your [Bm]song
[G]We are His [A]people, He is our God

{Bridge}
[D]Raise Your [G]voice
[D]Shout for joy [A]all the earth
[Bm]We sing a [G]new song now
[D]We sing a [A]new song now [x2]`,
    notes: "Key of D. Joyful praise psalm. Bridge is high-energy celebration.",
    bpm: 100,
    tags: ["worship", "praise", "psalm"],
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
