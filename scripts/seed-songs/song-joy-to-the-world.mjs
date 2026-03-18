#!/usr/bin/env node
/**
 * Seed: Joy To The World by Traditional Christmas
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-joy-to-the-world.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Joy To The World",
    artist: "Traditional Christmas",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Joy to the world, the [D]Lord is [G]come!
[C]Let [D]earth receive her [G]King;
[G]Let every heart prepare Him room,

And Heaven and [D]nature sing,
And [D]Heaven and nature sing,
[G]And [C]Heaven, and [G]Heaven, and [D]na[G]ture sing.

{Verse 2}
[G]Joy to the earth, the [D]Savior [G]reigns!
[C]Let [D]men their songs em[G]ploy;
[G]While fields and floods, rocks, hills and plains

Repeat the sounding joy,
[D]Repeat the sounding joy,
[G]Re[C]peat, re[G]peat, the [D]sound[G]ing joy.

{Verse 3}
[G]No more let sins and [D]sorrows [G]grow,
[C]Nor [D]thorns infest the [G]ground
[G]He comes to make His blessings flow

Far as the curse is found,
[D]Far as the curse is found,
[G]Far [C]as, far [G]as, the [D]curse [G]is found

{Verse 4}
[G]He rules the world with [D]truth and [G]grace,
[C]And makes the [D]nations [G]prove
[G]The glories of His righteousness,

And wonders of His love,
[D]And wonders of His love,
[G]And [C]wonders, [G]wonders, of [D]His [G]love.`,
    notes: "Classic Christmas hymn. Key of G. Joyful and majestic.",
    bpm: 120,
    tags: ["hymn", "christmas", "joy"],
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
