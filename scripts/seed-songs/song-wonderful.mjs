#!/usr/bin/env node
/**
 * Seed: Wonderful by Sam Yoder
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-wonderful.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Wonderful",
    artist: "Sam Yoder",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro}
[G] | [C2] / [C] / | [D] | [Gsus] / [G] / |
[C] | [Dsus] / [D] / | [C] / [D] / | [G] |

{Verse 1}
[G]Father, You're [C2]holy [C]
[D]Jesus, You're [Gsus]wor[G]thy
[C]Spirit, You're [Dsus]love[D]ly
[C]God, You're [D]wonderful [G] [Gsus]

{Verse 2}
[G]Father, we [C2]need [C]You
[D]Jesus, we [Gsus]love [G]You
[C]Spirit, You're [Dsus]welcome [D]here
[C]God, You're [D]wonderful [G] [Gsus]

{Chorus}
[C]Father, You are [G]heavenly
[Dsus]You are kindness [D]and goodness without [C]end
[G]Jesus, You are royalty
[Dsus]You are honored, You're [D]worthy of all our [C]days
[G]Spirit, You are a holy wind
[Dsus]Would You breathe [D]and move and fall on [C]us

{Verse 3}
[G]Father in [C]heaven
[D]Jesus [Gsus]among [G]us
[C]Spirit [Dsus]within [D]us
[C]God, You're [D]wonderful [G] [Gsus]

{Verse 4}
[G]God, You're our [C]father
[D]Jesus, our [Gsus]bro[G]ther
[C]Spirit, our [Dsus]hel[D]per
[C]God, You're [D]wonderful [G]

{Bridge}
[C]Wonderful, [G]yes You are, [G/D]yes You [Bm/D]are
[D]You are great and [C]wonderful [G]
[Dsus]Yes You [D]are, yes You are`,
    notes: "Key of G, Capo 2. Trinitarian praise. Simple and beautiful.",
    bpm: 80,
    tags: ["worship", "praise", "trinity"],
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
