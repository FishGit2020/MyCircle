#!/usr/bin/env node
/**
 * Seed: Know You Will by Hillsong United
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-know-you-will.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Know You Will",
    artist: "Hillsong United",
    originalKey: "C",
    format: "chordpro",
    content: `{Intro}
[Am] [F] [C]
[Am] [F] [C]

{Verse 1}
[Am]When the road runs [F]dead, You can see a way I [C]don't
[Am]And it makes no [F]sense, but You say that's what faith is [C]for
[Am]When I see a [F]flood, You see a promise
[C]When I see a grave, You see a door
[Am]And when I'm at my [F]end, You see where the future [C]starts

{Chorus}
[Am]I don't know how You [F]make a way
But I [C]know You will
[Am]I don't know how You [F]make a way
But I [C]know You will
[Am]You've been good on every [G]promise, from [F]Eden to Zion
[Am]Through every dead [F]end and out of that [C]grave
[Am]I don't know how You [F]make a way
But I [C]know You will

{Verse 2}
[Am]When the world's on [F]fire, it's not like You don't have a [C]plan
[Am]And when the earth gives [F]way, on this rock Your Church will [C]stand
[Am]Nothing has ever [F]once surprised You
[C]Nothing has ever made You flinch
[Am]And when it all shakes [F]out, the gates of hell don't stand a [C]chance

{Bridge}
[F]You pulled my heart from [G]Egypt
[Am]You carved a road through [G]sea
[C]From all our chains to endless praise
[Em]The story ends in You`,
    notes: "Key of C. Faith declaration. Bridge builds to triumphant ending.",
    bpm: 72,
    tags: ["worship", "faith", "trust"],
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
