#!/usr/bin/env node
/**
 * Seed: What A Beautiful Name by Hillsong Worship
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-what-a-beautiful-name.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "What A Beautiful Name",
    artist: "Hillsong Worship",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[G]You were the Word at the beginning
[C]One With [Em]God the Lord Most [D]High
[Em]Your hidden [D]glory in cre[G]ation
[C]Now re[Em]vealed in [D]You Our Christ

{Chorus 1}
[G]What a beautiful Name it [D]is, What a beautiful Name it is
[Em]The Name of [D]Jesus Christ my [C]King
[G]What a beautiful Name it [D]is, Nothing compares to this
[Em]What a [D]beautiful Name it [C]is, The Name of Jesus

{Bridge}
[C]Death could not hold [D]You, The veil tore before You
[Em]You silenced the [Bm]boast of sin and grave
[C]The heavens are [D]roaring, the praise of Your glory
[Em]For you are [D]raised to life again
[C]You have no [D]rival, You have no equal
[Em]Now and forever God [Bm]You reign
[C]Yours is the [D]Kingdom, Yours is the glory
[Em]Yours is the [D]Name above all names`,
    notes: "Key of A, commonly G. The quintessential modern worship anthem.",
    bpm: 68,
    tags: ["worship", "name of jesus", "praise"],
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
