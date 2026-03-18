#!/usr/bin/env node
/**
 * Seed: Do It Again by Elevation Worship
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-do-it-again.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Do It Again",
    artist: "Elevation Worship",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro}
[CM7] [G/B] [G/B]

{Verse 1}
[CM7]Walking around these [G/B]walls
[G/B]I thought by now they'd [C6]fall
[C6]But You have never [G]failed me yet

{Verse 2}
[CM7]Waiting for change to [G/B]come
[G/B]Knowing the battle's [C6]won
[C6]For You have never [G]failed me yet

{Chorus}
[C/E]Your promise still [D/F#]stands
[G]Great is Your faithful[C]ness, faithfulness
[C/E]I'm still in Your [D/F#]hands
[G]This is my confidence, You've never [C]failed me yet

{Turnaround}
[G/B] [C] [G/B] [C]

{Verse 3}
[CM7]I know the night won't [G/B]last
[G/B]Your word will come to [C6]pass
[C6]My heart will sing Your [G]praise again

{Bridge} * 3
[G/B]I've seen You [C]move
[G/B]You move the [C]mountains
[D/F#]And I [G]believe
[G/B]I'll see You do it a[C]gain

[G/B]You made a [C]way
[D/F#]When there [G]was no [G/B]way
[C]And I believe
[D/F#]I'll see You do it a[C]gain

{Ending}
[G/B] [C] [G/B] [C]
You've never [G/B]failed me [C]yet
I never will for[G/B]get [C]
You've never [G/B]failed me [C]yet`,
    notes: "Key of G. Testimony of God's faithfulness. Let bridge build with crescendo energy.",
    bpm: 72,
    tags: ["worship", "faithfulness", "declaration"],
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
