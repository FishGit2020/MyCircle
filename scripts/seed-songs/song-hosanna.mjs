#!/usr/bin/env node
/**
 * Seed: Hosanna by Hillsong United
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-hosanna.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Hosanna",
    artist: "Hillsong United",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro}
[Em] [G] [Am] [Bm]
[Em] [G] [Am] [Bm]

{Verse 1}
[G]I see the king of glory
[Em]Coming on the clouds with fire
[Am]The whole earth [D]shakes, [Em]the whole earth shakes
[G]I see His love and mercy
[Em]Washing over all our sin
[Am]The people [D]sing, the people sing

{Chorus}
[G]Hosanna, [C]hosanna [D] [Em]
[C]Hosanna in the [Em]highest [D]
[G]Hosanna, [C]hosanna [D] [Em]
[C]Hosanna in the [Em]highest [G]

{Verse 2}
[G]I see a generation
[Em]Rising up to take the place
[Am]With selfless [D]faith, with selfless faith
[G]I see a new revival
[Em]Stirring as we pray and seek
[Am]We're on our [D]knees, we're on our knees

{Instrumental}
[Em] [G] [Am] [Bm]

{Bridge}
[C]Heal my heart and [D]make it clean
[G]Open up my [Em]eyes to the things unseen
[C]Show me how to [D]love like You have loved me
[C]Break my heart for what [D]is yours
[G]Everything I [Em]am for your kingdom's cause
[C]As I walk from [D]earth into [Em]eternity`,
    notes: "Key of G, Capo 4 for original key B. Revival anthem. Build through verses to bridge climax.",
    bpm: 105,
    tags: ["worship", "praise", "revival"],
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
