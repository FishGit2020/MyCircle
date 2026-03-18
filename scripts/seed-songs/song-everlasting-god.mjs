#!/usr/bin/env node
/**
 * Seed: Everlasting God by Brenton Brown/Ken Riley
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-everlasting-god.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Everlasting God",
    artist: "Brenton Brown/Ken Riley",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse}
[G]Strength will rise as we [Gsus]wait upon the [G]Lord
[Gsus]We will wait upon the [G]Lord
[Gsus]We will wait upon the [G]Lord
[Gsus]Strength will rise as we [G]wait upon the Lord
[Gsus]We will wait upon the [G]Lord
[Gsus]We will wait upon the [G]Lord

{Pre-Chorus}
[G/B]Our [C]God You [G/B]reign for[C]ever [D] [Em] [D]
[G/B]Our [C]Hope our [G/B]strong De[C]liver[D] [Em] [D]er

{Chorus}
[G]You are the everlast[G/B]ing [C]God
[Em]The everlasting God
[C]You do not faint You won't grow weary
[G]You're the defender [G/B]of the [C]weak
[Em]You comfort those in need
[C]You lift us up on wings like eagles (last time: [G])

{Instrumental}
| [G] | | | [G/B] [C] | |`,
    notes: "Key of G. Upbeat praise anthem. Strong rhythm section. Build through pre-chorus to powerful chorus.",
    bpm: 120,
    tags: ["worship", "strength", "praise"],
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
