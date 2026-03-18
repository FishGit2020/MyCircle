#!/usr/bin/env node
/**
 * Seed: Above All by Michael W. Smith
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-above-all.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Above All",
    artist: "Michael W. Smith",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[C]Above all [F]powers, [G]Above all [C]Kings
[F]Above all [G]nature, and all [C]created things
[Am]Above all [G]wisdom, and all the [F]ways of [C]man
[Dm]You were [F]here before the [G]world be[C]gan

{Verse 2}
[C]Above all [F]kingdoms, [G]Above all [C]thrones
[F]Above all [G]wonders this world has [C]ever known
[Am]Above all [G]wealth and treasures [F]of the [C]earth
[Dm]There's no [F]way to measure [E7]what You're [E]worth

{Chorus}
[C]Cruci[Dm]fied, [G]laid behind a [C]stone
[C]You lived to [Dm]die, re[G]jected and a[C]lone
[Am]Like a [G]rose, trampled [F]on the [C]ground
[Dm]You took the [Am]fall, and thought of [F]me
[C]Above all

{Coda}
[Am]Like a [G]rose, trampled [F]on the [C]ground
[Dm]You took the [Am]fall, and thought of [F]me
[C]Above all`,
    notes: "Key of Bb, commonly played with Capo 3 in C shapes. Slow, reverent. Build to chorus climax.",
    bpm: 68,
    tags: ["worship", "devotion", "cross"],
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
