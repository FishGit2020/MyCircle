#!/usr/bin/env node
/**
 * Seed: Stand In Your Love by Bethel Music
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-stand-in-your-love.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Stand In Your Love",
    artist: "Bethel Music",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]When darkness tries to [C]roll over my bones
[G]When sorrow comes to [C]steal the joy I own
[Em]When brokenness and [D]pain is all [C]I know
[Em]Oh, I won't be [D]shaken, no, I won't be [C]shaken

{Chorus}
[G]My fear doesn't [D]stand a chance when I [C]stand in Your love
[G]My fear doesn't [D]stand a chance when I [C]stand in Your love
[Em]My fear doesn't [D]stand a chance when I [C]stand in Your love

{Bridge} * 2
[D]There's power that can [Em]break off every chain
[C]There's power that can [G]empty out a grave
[D]There's resurrection [Em]power that can save
[C]There's power in Your name, power in Your [G]name`,
    notes: "Key of G. Declaration of freedom from fear.",
    bpm: 72,
    tags: ["worship", "faith", "love"],
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
