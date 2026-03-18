#!/usr/bin/env node
/**
 * Seed: Be Still by Hillsong Worship
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-be-still.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Be Still",
    artist: "Hillsong Worship",
    originalKey: "E",
    format: "chordpro",
    content: `{Intro}
[C] [Dm] [Am] [F]
[C] [Dm] [Am] [F]

{Verse 1}
[C]Be still and [Dm]know
[Am]That the Lord is in [F]control
[C]Be still my [Dm]soul
[Am]Stand and watch as [F]giants fall

{Chorus}
[C]I won't be afraid
[Dm]For You are here
[Am]You silence all my [F]fear
[C]I won't be afraid
[Dm]You don't let go
[Am]Be still my heart and [F]know
[C]I won't be [Dm]a[Am]fraid [F]

{Verse 2}
[C]Be still and [Dm]trust
[Am]What the Lord has [F]said is done
[C]Find rest don't [Dm]strive
[Am]Watch as faith and [F]grace align

{Bridge 1} *4
[C]Surely love and [Dm]mercy
Your peace and [Am]kindness
Will follow [F]me

{Interlude}
[C] [Dm] [Am] [F]

{Bridge 2}
[C]Your love [Dm]sur[Am]rounds me
[F]Your love sur[C]rounds me [Dm]here
[Am]Your love surrounds me
[F]Your love sur[C]rounds me [Dm]here [Am]
[F]Your love surrounds me here

{Breakdown}
[C] [Dm] [Am] [F]

{Outro}
[C] [Dm] [Am] [F]
[C] [Dm] [Am] [F]
[C]`,
    notes: "Key of E originally, commonly played with capo in C shapes. Intimate, building worship moment.",
    bpm: 72,
    tags: ["worship", "trust", "peace"],
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
