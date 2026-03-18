#!/usr/bin/env node
/**
 * Seed: Better Word by Leeland
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-better-word.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Better Word",
    artist: "Leeland",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Your blood is healing every wound
[Em]Your blood is making all things new
[C]Your blood speaks a [G]better word

{Verse 2}
[G]Your blood, the measure of my worth
[Em]Your blood, more than I deserve
[C]Your blood speaks a better word
[D]Speaks a better word

{Chorus}
[G]It's singing out with life
[Em]It's shouting down the lies
[C]It echoes through the night

The precious blood of Christ
[Em]Speaks a [D]better word, speaks a better word

{Chorus 2}
[G]It's singing out with life
[Em]It's shouting down the lies
[C]It echoes through the night

The precious blood of Christ
[Em]Speaks a [D]better word, speaks a better word

{Verse 3}
[G]Your blood a robe of righteousness
[Em]Your blood my hope and my defense
[C]Your blood forever covers me
[D]Forever covers me

{Instrumental}
[C] [Em] [D] [G]

{Bridge}
[C]It's rewriting my history
[Em]It covers me with destiny
[D]It's making all things right
[G]The precious blood of Christ

[C]It's rewriting my history
[Em]It covers me with destiny
[D]It's making all things right
[G]The precious blood of Christ`,
    notes: "Key of G. Powerful declaration about the blood of Christ. Build through bridge sections.",
    bpm: 80,
    tags: ["worship", "blood of christ", "praise"],
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
