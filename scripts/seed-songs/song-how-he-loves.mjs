#!/usr/bin/env node
/**
 * Seed: How He Loves by John Mark McMillan
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-how-he-loves.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "How He Loves",
    artist: "John Mark McMillan",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]He is jealous for me, loves [Am]like a hurricane
[C/G]I am a tree bending beneath the weight of His [F]wind and mercy
[C]And all of a sudden I am unaware of
[Am]These afflictions eclipsed by glory
[C/G]And I realize just how beautiful You are
[F]And how great Your affections are for me

{Chorus}
[C(Am)]And oh, how He [Am]loves us oh
[C/G]Oh, how He loves us, [F]how He loves us [C]all [Am] [C/G] [F]

(Yeah) [C]He loves us
[Am]Oh how He loves us, Oh how He [C/G]loves us
[FM7]Oh how He loves

{Verse 2}
[C]And we are His portion, and He is our prize
[Am]Drawn to redemption by the grace in His eyes
[C/G]If His grace is an ocean we're all [F]sinking
[C]And Heaven meets earth like an unforseen kiss
[Am]And my heart turns violently inside of my chest
[C/G]I don't have time to maintain these regrets
[F]When I think about the way that`,
    notes: "Key of C. Intimate love song. Let dynamics breathe through the verses.",
    bpm: 69,
    tags: ["worship", "love", "grace"],
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
