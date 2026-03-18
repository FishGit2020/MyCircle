#!/usr/bin/env node
/**
 * Seed: For The One by Brian & Jenn Johnson
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-for-the-one.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "For The One",
    artist: "Brian & Jenn Johnson",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]Let me be filled
[F]With kindness and com[G]passion for the [C]one
[F]The one for whom You [G]loved and gave Your [Am]son
[F]For humanity in[G]crease my [C]love

{Chorus}
[F]Help me to love with [G]open arms like You [C]do
[F]A love that erases [G]all the lines and sees the [C]truth
[F]Oh that when they [G]look in my eyes they would [Am]see You
[F]Even in just a [G]smile they would feel the [C]Father's love

{Verse 2}
[C]Oh how You love us
[F]From the homeless [G]to the famous and [C]in-between
[F]You formed us, You [G]made us care[Am]fully
[C]'Cause in [F]the end, we're [G]all Your [C]children

{Bridge}
[G]Let all my [C]life tell of [F]who You are
[G]And the wonder of Your [C]never-ending [F]love
[G]Let all my [C]life tell of [F]who You are
[G]You're wonderful and [C]such a good [F]Father.`,
    notes: "Key of C. Heart for the lost/marginalized. Gentle and building.",
    bpm: 72,
    tags: ["worship", "love", "compassion"],
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
