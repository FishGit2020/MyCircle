#!/usr/bin/env node
/**
 * Seed: Move by Jesus Culture
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-move.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Move",
    artist: "Jesus Culture",
    originalKey: "Db",
    format: "chordpro",
    content: `{Instrumental} * 2
[Am] [F] [C]

{Verse 1}
[Am]When You [F]move, darkness runs for [C]cover
[Am]When You [F]move, no one's turned a[C]way
[Am]Because where You [F]are, fear turns into [C]praises
[Am]And where You [F]are, no heart's left un[C]changed

{Chorus}
[F]So come move, let [C]justice roll on like a river
[Am]Let worship turn into revival
[F]Lord, lead us [G]back to You

{Verse 2}
[Am]When You [F]move, the outcast finds a [C]family
[Am]When You [F]move, the orphan finds a [C]home
[Am]Lord, here we [F]are, oh, teach us to love [C]mercy
[Am]With humble [F]hearts, we bow down at Your [C]throne

{Bridge}
[Am]King of all [C]generations
[F]Let every tongue and [G]nation
[Am]Surrender [C]all to You alone, [F]Jesus [G]
[Am]King of all [C]generations
[F]Let every tongue and [G]nation

{Spontaneous}
[F]Back to You, Jesus
[F]Back to You
[C]Back to our first love
[Am]Back to our first love
[G]Jesus, Jesus`,
    notes: "Key of Db, Capo 1. Revival/justice song. Bridge builds with mounting declaration.",
    bpm: 76,
    tags: ["worship", "revival", "justice"],
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
