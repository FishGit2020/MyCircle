#!/usr/bin/env node
/**
 * Seed: Did You Feel The Mountains Tremble by Martin Smith
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-did-you-feel-the-mountains-tremble.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Did You Feel The Mountains Tremble",
    artist: "Martin Smith",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]Did you feel the mountains tremble
[G/D]Did you hear the oceans roar
[Em7]When the people rose to sing of
[Dsus]Jesus Christ [A7sus]the risen [D]One

{Verse 2}
[D]Did you feel the people tremble
[G/D]Did you hear the singers roar
[Em7]When the lost began to sing of
[Dsus]Jesus Christ [A7sus]the saving [D]One

{Pre-Chorus}
[G]And we can see that [D]God You're moving
[G]A mighty river [D]through the nations
[G]And young and old will [D]turn to Jesus
[Em7]Fling wide you heavenly gates
[G]Prepare the [Asus]way of the [D]risen Lord (To TA 1)

{Chorus}
[D]Open up the doors and [G/B]let the music play
[Em7]Let the streets re[D]sound with [A7sus]singing
[D]Songs that bring Your [G/B]hope, songs that bring Your joy
[Em7]Dancers who dance upon in[D]justice

{Turnaround}
| [D] | [A7sus] | [D] | [A7sus] |

{Verse 3}
[D]Do you feel the darkness tremble
[G/D]When all the saints join in one song
[Em7]And all the streams flow as one river
[Dsus]To wash away [A7sus]our broken[D]ness`,
    notes: "Key of D, Tempo 102. Revival anthem. Energetic and building.",
    bpm: 102,
    tags: ["worship", "revival", "praise"],
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
