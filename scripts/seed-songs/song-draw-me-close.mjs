#!/usr/bin/env node
/**
 * Seed: Draw Me Close by Michael W. Smith
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-draw-me-close.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Draw Me Close",
    artist: "Michael W. Smith",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Intro}
[G] [C] (x2)

{Verse 1}
[G]Draw me close to [C]You
[D]Never let me [G]go
[D]I lay it all [C]down again
[Em]To hear You say that [C]I'm Your friend

{Verse 2}
[G]You are my de[C]sire
[D]No one else will [G]do
[D]'Cause nothing else could [C]take Your place
[Em]To feel the warmth of [C]Your embrace
[G]Help me find the [Am]way, [D]bring me back to [G]You

{Chorus}
[G]You're all I [D]want [C]
[G]You're all I [D]ever [C]needed [D]
[G]You're all I [D]want [C]
[Am]Help me know You [D]are [G]near

(ending * 3)`,
    notes: "Key of Bb, Capo 3 plays G shapes. Simple, intimate prayer song. Keep dynamics soft and building.",
    bpm: 68,
    tags: ["worship", "intimacy", "prayer"],
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
