#!/usr/bin/env node
/**
 * Seed: Gratitude by Brandon Lake/Dante Bowe/Benjamin Hastings
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-gratitude.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Gratitude",
    artist: "Brandon Lake/Dante Bowe/Benjamin Hastings",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[G]All my words fall short
[Em]I got nothing new
[D]How could I express
[C]All my gratitude?

{Verse 2}
[G]I could sing these songs
[Em]As I often do
[D]But every song must end
[C]And You never do

{Chorus}
[G]So I throw up my hands
[D]And praise You again and again
[D]'Cause all that I have is a
[C]Hallelujah, [Em]halle[D]lujah
[G]And I know it's not much
[D]But I've nothing else fit for a King
[D]Except for a heart singing
[C]Hallelujah, hallelu[Em]-[D]jah

{Verse 3}
[G]I've got one response
[Em]I've got just one move
[D]With my arms stretched wide
[C]I will worship You

{Bridge} x3
[G]Oh, come on my soul,
[D]oh, don't you get shy on me
[C]Lift up your song, 'cause you've got a lion
inside of those lungs
[G]Get up and praise the [Em]Lo[D]rd

{Interlude}
| [C] | [C] | [Em] | [D] |`,
    notes: "Key of D, original B. Tempo 52, 6/8 feel. Joyful gratitude anthem. Bridge is high-energy - let the band drive it.",
    bpm: 52,
    tags: ["worship", "gratitude", "praise"],
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
