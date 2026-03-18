#!/usr/bin/env node
/**
 * Seed: Graves Into Gardens by Elevation Worship/The Worship Initiative
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-graves-into-gardens.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Graves Into Gardens",
    artist: "Elevation Worship/The Worship Initiative",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro}
[G] [C/G]
[G]

{Verse 1}
[C/G]I searched the [G]world
[C/G]But it couldn't [G]fill me
[Em]Man's empty praise
[D]And treasures that [C]fade
(are) never enough

{Verse 2}
[C/G]Then You came a[G]long
[C/G]And put me back to[G]gether
[Em]And every de[D]sire is now satisfied
[C]Here in Your love

{Chorus}
[G]Oh there's nothing better than [Em]You
There's nothing better than [C]You
Lord there's nothing
[G]Nothing is better than You

{Verse 3}
[C/G]I'm not a[G]fraid
[C/G]To show You my [G]weakness
[Em]My failures and [D]flaws
Lord You've seen them all
[C]And You still call me friend

{Verse 4}
[G]'Cause the God of the mountain
[C/G]Is the God of the [G]valley
[Em]There's not a place
[D]Your mercy and grace
[C]Won't find me again

{Chorus} * 2

{Bridge} * 2
[G]You turn mourn[C]ing to [G]dancing
[C]You give beauty for [G]ashes
[C]You turn shame into glory
[Em]You're the [C]only one who [G]can`,
    notes: "Key of G, Capo 3. Powerful transformation anthem. Bridge builds to highest point of the song.",
    bpm: 80,
    tags: ["worship", "transformation", "praise"],
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
