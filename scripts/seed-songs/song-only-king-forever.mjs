#!/usr/bin/env node
/**
 * Seed: Only King Forever by Elevation Worship
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-only-king-forever.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Only King Forever",
    artist: "Elevation Worship",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]Our God, a firm foundation
[C]Our rock, the only [Am7]solid ground
[F]As nations [C]rise and fall
[C]Kingdoms once strong now [Am7]shaken
[F]But we trust forever in [C]Your name
[Am7]The name of [F]Jesus

{Chorus}
[C]You are the only [C/E]King forever
[F]Almighty God we lift You higher
[C/G]You are the only [F]King forever
[F]Forevermore, You are victorious

{Bridge} * 2
[Dm]We lift our [C]banner high
[G]We lift the name of Jesus
[Dm]From age to [C]age You reign
[G]Your kingdom has no end`,
    notes: "Key of C. Declaration anthem.",
    bpm: 85,
    tags: ["worship", "praise", "declaration"],
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
