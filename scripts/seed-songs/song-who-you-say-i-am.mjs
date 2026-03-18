#!/usr/bin/env node
/**
 * Seed: Who You Say I Am by Ben Fielding/Reuben Morgan
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-who-you-say-i-am.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Who You Say I Am",
    artist: "Ben Fielding/Reuben Morgan",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Who am I that the highest [Em]King would [D]welcome [G]me
[Em]I was lost but He [D]brought me [C]in
[Em]Oh His [D]love for [C]me

{Chorus}
[G]Who the Son sets free, [D]oh is free indeed
[Em]I'm a child of [D]God, [C]Yes I [G]am
[G]In my Father's house, [D]there's a place for me
[Em]I'm a child of [D]God, [C]Yes I [G]am

{Bridge} (x2)
[Em]I am chosen, [D/F#]not for[G]saken
[A]I am who You [D]say I am
[Em]You are for me, [D/F#]not a[G]gainst me
[A]I am who You [D]say I am

{Tag}
[Em]I am [D/F#]who You [C]say I am`,
    notes: "Key of G. Identity anthem.",
    bpm: 72,
    tags: ["worship", "identity", "freedom"],
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
