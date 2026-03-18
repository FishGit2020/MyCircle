#!/usr/bin/env node
/**
 * Seed: This Kingdom by Geoff Bullock
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-this-kingdom.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "This Kingdom",
    artist: "Geoff Bullock",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]Jesus, [G/B]God's righteous[Am7]ness re[C/G]vealed
[F]The Son of Man, the [C/E]Son of God
[Dm7]His kingdom [F/G] [G7]comes
[Am7]Jesus, [C/G]redemption's [F]sacri[Em7]fice [Dm7]
[C/E]Now glori[F]fied, now justi[G]fied
His kingdom comes

{Chorus}
[C]And this kingdom will [G/B]know no end
[Am7]And its glory shall [C/G]know no [Em7]bounds
[F]For the majes[G/F]ty and [C/E]power [Am7]
[D/F#]Of this [G7sus]Kingdom's [G7]King [F/A]has come
[G/B]And this [C]kingdom's [G/B]reign
And this kingdom's rule
[Am7]And this kingdom's [Em/G]power and au[F]thority
[F]Je[C/G]sus [Am7]God's [Dm7]righteous[G7sus]ness re[C]vealed

{Verse 2}
[C]Jesus the [G/B]expression [Am7]of God's [C/G]love
[F]The grace of [C/E]God, the Word of God
[Dm7]Revealed to [F/G] [G7]us
[Am7]Jesus, [C/G]God's holi[F]ness dis[Em7]played [Dm7]
[C/E]Now glori[F]fied, now justi[G]fied
His kingdom comes

{Instrumental}
| [C] | [Fm/C] | [C] | [Fm/C] | (C) (Last x)`,
    notes: "Key of C, Tempo 85. Majestic kingdom anthem. Let the grandeur build through chorus.",
    bpm: 85,
    tags: ["worship", "kingdom", "praise"],
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
