#!/usr/bin/env node
/**
 * Seed: At The Cross by Hillsong Worship
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-at-the-cross.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "At The Cross",
    artist: "Hillsong Worship",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro}
| [C] [G] [C] | [D] | x4

{Verse 1}
[G]Oh Lord You've [C]searched [D]me
[G]You know my [C]way [D]
[G]Even when I [C]fail [D]You
[C]I know You [D]love me

{Verse 2}
[G]Your holy [C]pres[D]ence [Em]surrounding me
[G]In every [C]sea[D]son
[G]I know You [C]love [D]me
[C]I know You [D]love me

{Chorus}
[G]At the cross I [D]bow my [Em]knee
Where Your [G]blood was [C]shed for me
[D]There's no greater love than this
[G]You have over[D]come the [Em]grave
Your [G]glory fills the [C]highest place
[D]What can separate me now

[Chorus] * 2

[Bridge] * 2
[C]You [D]tore the veil, You [Em]made a way
[C]When You [Em]said that it is [D]done

{Verse 3}
[G]You go be[C]fore [D]me [Em]
[G]You shield my [C]way [D]
[G]Your hand up[C]holds [D]me [Em]
[C]I know You [D]love me

{Verse 4}
[G]And when the [C]earth [D]fades [Em]
[G]Falls from my [C]eyes [D]
[G]And You stand be[C]fore [D]me [Em]
[C]I know You [D]love me
[C]I know You [D]love me

{Outro}
| [C] [G] [C] | [D] (hold)`,
    notes: "Key of G, Capo 2 original key A. Starts intimate, builds to powerful chorus. Let bridge build dynamically.",
    bpm: 70,
    tags: ["worship", "cross", "devotion"],
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
