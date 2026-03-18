#!/usr/bin/env node
/**
 * Seed: Egypt by Bethel Music
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-egypt.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Egypt",
    artist: "Bethel Music",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro}
[G]

{Verse 1}
[Em]I won't for[C]get the wonder of [G]how
[D]You brought
[Em]Deliverance, the [C]exodus of my [G]heart [D]
[Em]You found me, [C]You freed me
[G]Held back the [D]waters for my [Em]release
[C]Oh [D]Yahweh

{Chorus}
[Em]You're the God who fights for me
[C]Lord of every victory
[G]Hallelujah, [D]hallelujah
[Em]You have torn apart the sea
[C]You have led me through the deep
[G]Hallelujah, [D]hallelujah

{Instrumental}
[Em] [C] [G] [D]

{Verse 2}
[Em]A cloud by [C]day, a sign that [G]You are with me
[D]
[Em]The fire by [C]night, a guiding [G]light to my feet
[D]
[Em]You found me, [C]You freed me
[G]Held back the [D]waters for my [Em]release
[C]Oh [D]Yahweh

{Chorus} 2x

{Interlude}
[C] [D] [Em] [G]

{Bridge} * 2
[C]You stepped into my [D]Egypt, You took me by the hand
[Em]You marched me out in [G]freedom into the promised land
[C]Now I will not for[D]get You, I'll sing of all You've done
[Em]Death is swallowed up forever by the fury of Your [G]love

{Outro}
[C] [D] [Em] [Bm]`,
    notes: "Key of G. Powerful deliverance anthem. Bridge is the climax - drive it with energy.",
    bpm: 76,
    tags: ["worship", "deliverance", "praise"],
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
