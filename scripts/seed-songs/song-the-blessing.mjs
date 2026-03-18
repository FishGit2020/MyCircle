#!/usr/bin/env node
/**
 * Seed: The Blessing by Elevation Worship/Kari Jobe/Cody Carnes
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-the-blessing.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "The Blessing",
    artist: "Elevation Worship/Kari Jobe/Cody Carnes",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse}
[C]The Lord bless you [F]and keep [C]you
[G]Make His face shine upon you
[Am]Be gracious to you
[F]The Lord turn His [C]face toward you
[G]And give you [C]peace

{Chorus} * 4
[Am]A[F]men, [C]Amen, [G]Amen

{Bridge}
[Am]May His favor be upon you
[F]And a thousand generations
[C]And your family and your children
[G]And their children, and their children

[Am]May His presence go before you
[F]And behind you, and beside you
[C]All around you, and within you
[G]He is with you, He is with you`,
    notes: "Key of A, also G with capo 2. Priestly blessing.",
    bpm: 140,
    tags: ["worship", "blessing", "prayer"],
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
