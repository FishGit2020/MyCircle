#!/usr/bin/env node
/**
 * Seed: Victory Is Yours by Matt Crocker/Ben Fielding/Brian Johnson/Reuben Morgan
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-victory-is-yours.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Victory Is Yours",
    artist: "Matt Crocker/Ben Fielding/Brian Johnson/Reuben Morgan",
    originalKey: "G",
    format: "chordpro",
    content: `[pad] G5

[G]Our fight is with weapons unseen
[Em]Your enemies crash to their knees
[C]As we rise up in worship
[Em]When trials unleash like a flood
[D/F#]The battle belongs to our God
[C]As we cry out in worship [Am]

[Em]The victory is Yours
[C]
[G]You're riding on the storm
[D]Your name is unfailing
[Em]Though kingdoms rise and [C]fall
[G(G/D)]Your throne withstands it all
[D](Your name is [C]unshaken)

[G]What hell meant to break me has failed
[Em]Now nothing will silence my praise
[C]I will cry out in worship
[Em]The walls of the prison will [D/F#]shake
[G]The chain-breaking King will rise to save
[C]As we cry out in worship [Am]

[C]You roar like [D]thunder, nothing can tame God
[Em]All powerful all [G/B]powerful
[C]We pull down [D]Heaven, with shouts of praise
[Em]Oh God all [G/B]powerful all [D]powerful
[1st time x2][2nd time x1]`,
    notes: "Key of G. Worship warfare anthem. Build through bridge declarations.",
    bpm: 80,
    tags: ["worship", "victory", "warfare"],
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
