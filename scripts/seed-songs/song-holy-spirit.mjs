#!/usr/bin/env node
/**
 * Seed: Holy Spirit by Bryan Torwalt/Katie Torwalt
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-holy-spirit.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Holy Spirit",
    artist: "Bryan Torwalt/Katie Torwalt",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro}
[D] | [D] | [GM7] | [G] | [x2]

[D]There's nothing worth more that will [G]ever come close
[D]No thing can compare, You're our [D]living hope
[G]Your Presence

[D]I've tasted and seen, of the [G]sweetest of Loves
[D]Where my heart becomes free, and my shame is undone
[G]In Your Presence Lord

[D]Holy Spirit You are welcome here
[G]Come flood this place and [Em]fill the atmosphere
[D]Your Glory, God is what our hearts long for
[G]To be overcome by [Em]Your Presence Lord

[D]Your Pres[Dsus]ence [D]Lord [GM9] [Em]

{Bridge}
[G]Let us become more [D/F#]aware of Your [Em]Presence
[G]Let us experience the [D/F#]Glory of Your [Em]Goodness [D/F#] [repeat]
[last time] [GM7] | [GM7] |`,
    notes: "Key of D originally, also played G with capo 2. Intimate worship invocation. Let moments breathe.",
    bpm: 72,
    tags: ["worship", "holy spirit", "presence"],
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
