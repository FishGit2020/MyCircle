#!/usr/bin/env node
/**
 * Seed: Blessed Be Your Name by Matt Redman
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-blessed-be-your-name.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Blessed Be Your Name",
    artist: "Matt Redman",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Blessed be Your [D]name
[Em7]In the land that [C]is plentiful
[G]Where Your streams of a[D]bundance flow
[C]Blessed be Your name

{Verse 2}
[G]Blessed be Your [D]name
[Em7]When I'm found in the [C]desert place
[G]Though I walk through the [D]wilderness
[C]Blessed be Your name

{Pre-Chorus}
[G]Every blessing You [D]pour out I'll
[Em7]Turn back to [C]praise
[G]When the darkness [D]closes in, Lord
[Em7]Still I will [C]say

{Chorus}
[G]Blessed be the [D]name of the Lord
[Em7]Blessed be [C]Your name
[G]Blessed be the [D]name of the Lord
[Em7]Blessed be Your [D]glo[C]rious [G]name

{Verse 3}
[G]Blessed be Your [D]name
[Em7]When the sun's shining [C]down on me
[G]When the world's all as it [D]should be
[C]Blessed be Your name

{Verse 4}
[G]Blessed be Your [D]name
[Em7]On the road marked with [C]suffering
[G]Though there's pain in the [D]offering
[C]Blessed be Your name

{Bridge}
[G]You give and take a[D]way
[Em7]You give and take a[C]way
[G]My heart will choose to [D]say
[Em7]Lord blessed be [C]Your name`,
    notes: "Key of G, Tempo 116. Classic congregational anthem. Keep strong rhythm throughout.",
    bpm: 116,
    tags: ["worship", "praise", "faithfulness"],
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
