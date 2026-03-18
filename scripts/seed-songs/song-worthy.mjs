#!/usr/bin/env node
/**
 * Seed: Worthy by Elevation Worship
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-worthy.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Worthy",
    artist: "Elevation Worship",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]It was my cross You [G]bore
[C]So I could live in the [F]freedom You [C]died [G]for
[C]And now my life is [G]Yours
[C]And I will [F]sing of [C]Your goodness forevermore

{Chorus}
[F]Worthy is Your [G]name, Jesus
[C]You deserve the praise
[Am]Worthy is Your name

{Bridge} * 2
[F]Be exalted now in the heavens
[Dm]As Your glory fills this place
[Am]You alone deserve our praise
[G]You're the [C]name above all names`,
    notes: "Key of C. Cross-centered praise.",
    bpm: 72,
    tags: ["worship", "cross", "praise"],
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
