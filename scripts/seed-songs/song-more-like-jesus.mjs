#!/usr/bin/env node
/**
 * Seed: More Like Jesus by Brooke Ligertwood/Scott Ligertwood/Kristian Stanfill/Brett Younker
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-more-like-jesus.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "More Like Jesus",
    artist: "Brooke Ligertwood/Scott Ligertwood/Kristian Stanfill/Brett Younker",
    originalKey: "A",
    format: "chordpro",
    content: `{Intro}
||: [A] | [A] | [D] | [D] :||

{Verse 1}
[A]You came to the world You created
[Dmaj7]Trading Your crown for a cross
[F#m]You willingly [E(4)]died, Your [D]innocent life paid the cost

{Verse 2}
[A]Counting Your status as nothing
[Dmaj7]The King of all kings came to serve
[F#m]Washing my [E(4)]feet, covering [D]me with Your love

{Chorus 1A}
[A]If more of You means [A/C#]less of me
[D2]Take everything
[A]Yes, all of You is [A/C#]all I need
[D2]Take every[A]thing

{Verse 3}
[A]You are my life and my treasure
[Dmaj7]The One that I can't live without
[F#m]Here at Your [E(4)]feet, my desires and [D]dreams I lay down

{Bridge}
[D]Oh Lord, change me like only You can
[Dmaj7]Here with my [Esus]heart in Your [F#m7]hands
[F#m7]Father, I pray, make me more like [D]Jesus
[Dmaj7]You've shown us the [Esus]way to Your [F#m7]heart
[D]This world is dying to know who You [Dmaj7]are
[Esus]So Father, I pray, make me more like [D]Jesus

[D]More like [D2(#4)]Je[Esus]sus [E]
More like [D]Jesus, Lord`,
    notes: "Key of A, Tempo 48, 6/8 time. Prayerful transformation song. Bridge is the heart cry.",
    bpm: 48,
    tags: ["worship", "transformation", "prayer"],
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
