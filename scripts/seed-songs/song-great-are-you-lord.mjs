#!/usr/bin/env node
/**
 * Seed: Great Are You Lord by Jason Ingram/Leslie Jordan/David Leonard
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-great-are-you-lord.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Great Are You Lord",
    artist: "Jason Ingram/Leslie Jordan/David Leonard",
    originalKey: "C",
    format: "chordpro",
    content: `{Intro}
[C] | [Em7] | [Dadd4] | [D] | [D]

{Verse}
[C]You give life, You [Em7]are love, You bring [D5(D)]light to the darkness
[C]You give hope, You re[Em7]store every [D5(D)]heart that is broken
[C]And [Em7]great are [D]You Lord

{Chorus}
[C]It's Your [Em7]breath in our lungs
[Dadd4]So we pour out our praise, we pour out our praise
[C]It's Your [Em7]breath in our lungs
[Dadd4]So we pour out our praise to You only
[2nd & 4th time] [repeat]

{Interlude 1}
[C] | [Em7] | [Dadd4] | [D]

{Bridge}
[G]All the earth will shout Your praise
[Gsus(C/E)]Our hearts will cry, these bones will sing
[C]Great are You [G]Lord
[x3]

{Ending}
[C] | [Em7] | [Dadd4] | [D] | [C] | [Em7] | [D]`,
    notes: "Key of C. Powerful declaration. Bridge is the worship climax.",
    bpm: 72,
    tags: ["worship", "praise", "breath"],
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
