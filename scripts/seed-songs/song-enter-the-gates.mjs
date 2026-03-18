#!/usr/bin/env node
/**
 * Seed: Enter The Gates by Bryan & Katie Torwalt
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-enter-the-gates.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Enter The Gates",
    artist: "Bryan & Katie Torwalt",
    originalKey: "C",
    format: "chordpro",
    content: `{Intro}
[C] [Dm] [Am] [F]

{Verse 1}
[C]My eyes on Your faithfulness
[Am]O God let me not forget
[F]To sing in the valley
[C]To look toward Your goodness
[C]My heart set on who You are
[Am]You're the light that
[Am]Consumes the dark
[F]The joy and the strength
[C]To lift up my hands and sing

{Chorus}
[C]I enter the [Dm7]gates with nothing but thanks
[Am7]I want to magnify Your worth
[F]I want to bring You more than words
[C]I enter the [Dm7]gates, come reckless with praise
[Am7]I'll bring a heart that wants You first
[F]All for Your glory

{Verse 2}
[C]My feet on the battle ground
[Am]My weapon will be my sound
[F]I will not be silent
[C]My song is my triumph

{Bridge} * 4
[Am7]Sing, my soul [F]will sing
[C/E]My soul will make
[C/E]This place an alter
[G]Make this place an alter`,
    notes: "Key of C. Energetic praise opener. Let the bridge repeat build intensity.",
    bpm: 110,
    tags: ["worship", "praise", "gates"],
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
