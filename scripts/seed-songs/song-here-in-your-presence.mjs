#!/usr/bin/env node
/**
 * Seed: Here In Your Presence by New Life Worship
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-here-in-your-presence.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Here In Your Presence",
    artist: "New Life Worship",
    originalKey: "C",
    format: "chordpro",
    content: `{Intro}
[C] | [Dm] | [F] | [C] || x2

{Verse}
[C]Found in Your hands, fullness of joy
[Dm]Every fear suddenly [F]wiped away here in Your [C]presence
[C]All of my gains now fade away
[Dm]Every crown no longer on [F]display, here in Your [C]presence

{Pre-Chorus}
[Am]Heaven is [G]trembling in awe of Your [F]wonders
[Am]The kings and their [G]kingdoms are standing a[F]mazed

{Chorus}
[C]Here in Your presence, [G]we are undone
[Am]Here in Your presence, [G]Heaven and Earth become [F]one
[C]Here in Your presence, [G]all things are new
[Am]Here in Your presence, [G]everything bows before [F]You

{Bridge}
[Am]Wonderful, [G]beautiful, [F]glorious, [C]matchless in every way
[Am]Wonderful, [G]beautiful, [F]glorious, [C]matchless in every way
x3
[F]Way [G]...`,
    notes: "Key of C, Capo 2. Presence anthem. Bridge builds with repeating declarations.",
    bpm: 80,
    tags: ["worship", "presence", "awe"],
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
