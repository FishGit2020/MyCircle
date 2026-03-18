#!/usr/bin/env node
/**
 * Seed: I Need You More by Kim Walker-Smith
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-i-need-you-more.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "I Need You More",
    artist: "Kim Walker-Smith",
    originalKey: "C",
    format: "chordpro",
    content: `{Intro}
[G] [C] [G] [C] x2

{Chorus}
[G]I need You [Am]more, more than yesterday
[D]I need You [C]more, more than [G]words can say.
[Em]I need You more, [C]than [G]ever [Am]before
[G]I need You, [D]Lord, I [G]need You, Lord.

{Verse}
[C]More than the air [D]I breathe, [Em]more than the song I sing
[C]More than the [Am]next heart[G]beat, more than anything.
[C]And lord, as [D]time goes by, [Em]I'll be by Your side
[Am]Cause I never [G]want to go [D]back to my old life.

{Bridge}
[C]We give You the highest praise,
[G]We give You the highest praise,
[Am]We give You the [D]highest praise

(C G Am D) - Repeat

[C]More than the air I breathe
[G]More than the songs I sing
[Am]More than anything
[D](I need You [G]more)

{Outro}
[C] [G] [Am] [D]`,
    notes: "Key of C. Intimate need/longing song. Let the simplicity speak.",
    bpm: 76,
    tags: ["worship", "longing", "need"],
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
