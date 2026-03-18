#!/usr/bin/env node
/**
 * Seed: O Come To The Altar by Elevation Worship
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-o-come-to-the-altar.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "O Come To The Altar",
    artist: "Elevation Worship",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse}
[G]Are you hurting and [C]broken within?
[C]Overwhelmed by the [Em]weight of your sin?
[C]Jesus is calling.
[G]Have you [C]come to the end of yourself?
[C]Do you thirst for a [Em]drink from the well?
[C]Jesus is calling.

{Chorus}
[G]O come [Am]to the altar,
[Em]the Father's arms are open [C]wide.
[G]For[Am]giveness
[Em]was bought with the precious blood of [C]Jesus Christ.

{Bridge}
[G]Oh what a Saviour,
[Em]isn't He wonderful,
[C]sing hallelujah Christ is risen,
[G]bow down before Him,
[Em]for He is Lord of all,
[C]sing hallelujah Christ is risen.`,
    notes: "Key of G, Capo 4 for original B.",
    bpm: 72,
    tags: ["worship", "invitation", "grace"],
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
