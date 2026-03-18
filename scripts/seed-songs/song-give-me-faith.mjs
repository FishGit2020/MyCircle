#!/usr/bin/env node
/**
 * Seed: Give Me Faith by Elevation Worship
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-give-me-faith.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Give Me Faith",
    artist: "Elevation Worship",
    originalKey: "C",
    format: "chordpro",
    content: `{Intro}
[C] [G] [D] [Em]

{Verse}
[G]I need You to [D]soften my [Em]heart
[C]And break me apart
[G]I need You to [D]open my eyes
[Em]To see that You're [C]shaping my life

{Pre-Chorus}
[Em]All I [C] [D]am,
[Em]I [C] [D]surrender

{Chorus}
[C]Give me faith to [G]trust what You [D]say [Em]
[C]That You're [G]good and Your [Em]love is [D]great
[Am]
[C]I'm broken in[G]side, I [D]give You my [C]life [D]

{Instrumental}
[C] [G] [Em] [D] x4

{Bridge}
[C]I may be [G]weak
[D]But Your spirit [Em]strong in me
[C]My flesh may [G]fail
[Em]My God You [D]never will (repeat)`,
    notes: "Key of C with Capo 2. Intimate surrender song. Let bridge build with confidence.",
    bpm: 72,
    tags: ["worship", "faith", "surrender"],
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
