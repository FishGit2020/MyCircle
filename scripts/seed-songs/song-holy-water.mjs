#!/usr/bin/env node
/**
 * Seed: Holy Water by We The Kingdom
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-holy-water.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Holy Water",
    artist: "We The Kingdom",
    originalKey: "D",
    format: "chordpro",
    content: `{Intro}
[D] [C] [G]

{Verse 1}
[D]God, I'm on my knees again
[C]God, I'm begging please again
[G]I need You, oh, I need You
[D]Walking down these desert roads
[C]Water for my thirsty soul
[G]I need You, oh, I need You

{Chorus 1}
N.C.
Your forgiveness
N.C.
Is like sweet, sweet honey on my lips
N.C.
Like the sound of a symphony to my ears
N.C.
Like holy water on my skin

{Interlude}
[D] [C] [G]

{Verse 2}
[D]Dead man walking, slave to sin
[C]I wanna know about being born again
[G]I need You, oh, God, I need You
[D]So, take me to the riverside
[C]Take me under, baptize
[G]I need You, oh, God, I need You

{Chorus 2}
[D]Your forgiveness
[C]Is like sweet, sweet [G]honey on my [D]lips
[C]Like the sound of a [G]sym[D]phony to my ears
[C]Like holy [G]water on my [D]skin
[D](on my [G]skin)

{Bridge} * 4
[D]I don't wanna abuse Your grace
[G]God, I need it every day
[D]It's the only thing that ever really
[G]Makes me wanna change`,
    notes: "Key of D. Baptism/grace anthem. Bridge builds with conviction.",
    bpm: 80,
    tags: ["worship", "grace", "forgiveness"],
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
