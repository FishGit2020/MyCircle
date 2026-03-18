#!/usr/bin/env node
/**
 * Seed: Clean Heart by Bryan & Katie Torwalt
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-clean-heart.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Clean Heart",
    artist: "Bryan & Katie Torwalt",
    originalKey: "C",
    format: "chordpro",
    content: `{Intro}
[C] [F] [Am7] [G]

{Verse 1}
[C]For the times that I've misused Your name
[C]And leveraged it for my own fame
[Am7]For the kingdoms I've been [Gsus]building on my [G]own
[C]For the times I chose to play it safe
[C]When You said give it all away
[Am7]For the idols that I've [G(add4)]let into my home
Well, I'm looking now

{Chorus}
[F]Create in [C]me a clean [G(add4)]heart, God
[Am7]And renew a [F]right spirit
[C]Create in [Am7]me a [G(add4)]clean heart, God
[Am7]Renew a right spirit within me

{Verse 2}
[C]For the times I chose the [Csus]counterfeit [C]
[C]Dismissed Your voice like [Csus]Jonah [C]did
[Am7]When I leaned into fear [Gsus]instead of [G]faith
[C]For the narrow path I [Csus]didn't [C]take
[C]When I fell short in my [Csus]own strength [C]
[Am7]You said look and I [G(add4)]just looked away

{Turnaround}
[C] [C]

{Bridge}
[C/E]The kindness of [F]God, it
[G]leads to re[Am7]pentance
[C/E]The arms of the [F]Father
[G]Are full of for[Am7]giveness
[C/E]You gave me a [F]clean heart
[G]A place where Your [Am7]glory can rest
[C/E]You made me a [F]temple
[G]A place where Your [Am7]presence can live`,
    notes: "Key of C. Repentance/renewal song. Bridge builds with gratitude.",
    bpm: 72,
    tags: ["worship", "repentance", "renewal"],
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
