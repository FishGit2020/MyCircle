#!/usr/bin/env node
/**
 * Seed: Mighty To Save by Hillsong Worship
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-mighty-to-save.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Mighty To Save",
    artist: "Hillsong Worship",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C2]Everyone needs com[G]passion
[Em]A love that's never [D]failing
Let mercy [C2]fall on [G]me
[C2]Everyone needs for[G]giveness
[Em]The kindness of a [D]Savior
The hope of [C2]nations [G]

{Chorus}
[G]Savior, He can [D]move the mountains
[C2]My God is [G]mighty to save
[Em]He is [D]mighty to save
[G]Forever, author of sal[D]vation
[C2]He rose and [G]conquered the grave
[Em]Jesus [D]conquered the grave

{Bridge} x2
[C2]Shine Your [D]light and let the whole world see
[C2]For the glory [G]of the risen [D]King, Jesus`,
    notes: "Key of C, Capo 2. Classic Hillsong anthem.",
    bpm: 72,
    tags: ["worship", "salvation", "praise"],
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
