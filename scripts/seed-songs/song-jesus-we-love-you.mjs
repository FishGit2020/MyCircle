#!/usr/bin/env node
/**
 * Seed: Jesus We Love You by Bethel Music
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-jesus-we-love-you.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Jesus We Love You",
    artist: "Bethel Music",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[C]Old things have passed away
[G]Your love has stayed the same
[C]Your constant grace remains the [G]cornerstone
[C]Things that we thought were dead
[G]Are breathing in life again
[C]You cause Your Son to shine on
[G]Darkest nights

{Pre-Chorus}
[D]For all that You've done we will
[Em]Pour out our love
[C]This will be our [D]anthem song

{Chorus}
[C]Jesus we love You
[G]Oh how we love You
[C]You are the one our [G]hearts adore

{Interlude}
[Em] [D/F#] [C] |[G]|
Our hearts adore

{Bridge}
[C]Our affection, our devotion
[G]Poured out on the feet of Jesus
[C]Our affection, our devotion
[G]Poured out on the feet of Jesus
[Am]Our affection, our devotion
[G/B]Poured out on the feet of Jesus
[C]Our affection, our devotion
[D]Poured out on the feet of Jesus`,
    notes: "Key of A, BPM 116, Capo 2. Adoration song. Bridge builds with mounting devotion.",
    bpm: 116,
    tags: ["worship", "love", "adoration"],
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
