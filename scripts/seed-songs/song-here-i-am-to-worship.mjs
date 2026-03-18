#!/usr/bin/env node
/**
 * Seed: Here I Am To Worship by Tim Hughes
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-here-i-am-to-worship.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Here I Am To Worship",
    artist: "Tim Hughes",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]Light of the [Gsus]world You stepped [Dm]down into darkness
[C]Opened my [Gsus]eyes let me [F2(no3)]see
[C]Beauty that [Gsus]made this [Dm]heart adore You
[C]Hope of a [Gsus]life spent [F2(no3)]with You

{Chorus}
[G7sus]So here I am to [C]worship
[G/B]Here I am to bow down
[C/E]Here I am to [F]say that You're my God
[C]And You're altogether lovely
[G/B]Altogether worthy
[C/E]Altogether [F]wonderful to [F2(no3)]me (To Verse)
[F] (To Bridge)

{Verse 2}
[C]King of all [Gsus]days oh so [Dm]highly exalted
[C]Glorious in [Gsus]heaven [F2(no3)]above
[C]Humbly You [Gsus]came to the [Dm]earth You created
[C]All for love's [Gsus]sake be[F2(no3)]came poor

{Bridge}
[G/B]And I'll [C/E]never know how [F]much it cost
[G/B]To see my [C/E]sin upon that [F]cross`,
    notes: "Key of C, Tempo 65. Classic worship song. Also played in D. Simple and reverent.",
    bpm: 65,
    tags: ["worship", "adoration", "classic"],
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
