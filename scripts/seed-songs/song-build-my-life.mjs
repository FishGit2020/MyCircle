#!/usr/bin/env node
/**
 * Seed: Build My Life by Brett Younker/Karl Martin/Kirby Elizabeth Kaple/Matt Redman/Pat Barrett
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-build-my-life.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Build My Life",
    artist: "Brett Younker/Karl Martin/Kirby Elizabeth Kaple/Matt Redman/Pat Barrett",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro}
[G] [C] [G/B] [C]

{Verse 1}
[G]Worthy of ev'ry [C]song we could ever sing
[G/B]Worthy of all the [C]praise we could ever bring
[G]Worthy of ev'ry [C]breath we could ever breathe
[G/B]We [C]live for You

{Verse 2}
[G]Jesus the name a[C]bove ev'ry other name
[G/B]Jesus the only [C]One who could ever save
[G]Worthy of ev'ry [C]breath we could ever breathe
[G/B]We [C]live for You, we live for You

{Chorus}
[C]Holy, there is no [Am]one like You, there is [G/B]none beside You
[Em]Open up my eyes in wonder
[C]And show me who You [Am]are and fill me with Your heart
[G/B]And lead me in Your [Em]love to those around me

{Bridge}
[A]I will [B]build my [Em]life upon Your love
[G/B]It is a firm foundation
[A]I will [B]put my [Em]trust in You alone
[G/B]And I will not be shaken`,
    notes: "Key of G originally, also played in C with capo. Builds beautifully from intimate to powerful.",
    bpm: 68,
    tags: ["worship", "devotion", "foundation"],
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
