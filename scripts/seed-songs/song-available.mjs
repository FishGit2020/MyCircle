#!/usr/bin/env node
/**
 * Seed: Available by Elevation Worship
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-available.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Available",
    artist: "Elevation Worship",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]Narrow as the road may [G]seem
[Em]I'll follow where Your [C]spirit leads
[C]Broken as my life may [G]be
[Em]I will give You [C]every piece

{Chorus}
[G]I hear [Em]You call
[D]I am [C]available
[G]I say [Em]yes Lord
[D]I am [C]available

{Verse 2}
[C]Here I am with [G]open hands
[Em]Counting on Your [C]grace again
[C]Less of me and [G]more of You
[Em]I just wanna [C]see You move

{Instrumental}
[G] [Em] [D] [C]

{Bridge}
[G]Here I am, [Em]here I am
[C]You can have it all
[C]You can have it all

{Verse 3}
[C]For the one who gave me [G]life
[Em]Nothing is a [C]sacrifice
[C]Use me how You [G]want to God
[Em]Have Your throne within [C]my heart`,
    notes: "Key of C. Congregational surrender song. Keep dynamics flowing through verse to chorus.",
    bpm: 72,
    tags: ["worship", "surrender", "obedience"],
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
