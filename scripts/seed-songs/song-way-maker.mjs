#!/usr/bin/env node
/**
 * Seed: Way Maker by Osinachi Kalu Okoro
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-way-maker.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Way Maker",
    artist: "Osinachi Kalu Okoro",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]You are here, moving in our [G]midst
[D]I worship [Em]You, I worship You
[C]You are here, working in this [G]place
[D]I worship [Em]You, I worship You

{Chorus}
[C2]Way maker, Miracle [G]worker, Promise Keeper
[D(add4)]Light in the darkness, My [Em]God, that is who You are

{Tag}
[C]That is who You are, that is [C/E]who You are
[G]That is who You [Am]are, that is who You are

{Bridge}
[F2]Even when I don't see it, You're working
[C]Even when I don't feel it, You're working
[Gsus]You never stop, You never stop working
[Am7]You never stop, You never stop working [x4]`,
    notes: "Key of C, Capo 3. Declaration of God's nature.",
    bpm: 68,
    tags: ["worship", "miracles", "praise"],
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
