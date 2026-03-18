#!/usr/bin/env node
/**
 * Seed: When You Walk Into The Room by Bryan & Katie Torwalt
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-when-you-walk-into-the-room.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "When You Walk Into The Room",
    artist: "Bryan & Katie Torwalt",
    originalKey: "C",
    format: "chordpro",
    content: `{Intro}
[C] [F] [Am] [F]

{Verse 1}
[C]When You walk into the [F]room, everything changes
[Am]Darkness starts to [F]tremble at the light that You bring
[C]When You walk into the [F]room, every heart starts burning
[Am]And nothing matters more than [F]just to sit here at Your feet and worship You

{Chorus}
[C]We Love You, [F]and we'll never stop
[Am]We can't live with[F]out You, Jesus

[C]We Love You, [F]We can't get enough
[Am]All this is for [F]You, Jesus

{Verse 2}
[C]When You walk into the [F]room, sickness starts to vanish
[Am]Every hopeless [F]situation, ceases to exist
[C]When You walk into the [F]room, The dead begin to rise
[Am]Cause there is resurrection [G]life in all You do

{Bridge} (Quietly) (x2) (Loudly) (x2)
[F]Come and consume God, all we are
[Am]We give You permission, our hearts are Yours
[C]We want You, [G]We want You`,
    notes: "Key of C. Presence/power song. Bridge builds from quiet to explosive.",
    bpm: 72,
    tags: ["worship", "presence", "power"],
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
