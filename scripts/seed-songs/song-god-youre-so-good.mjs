#!/usr/bin/env node
/**
 * Seed: God You're So Good by Brooke Ligertwood/Scott Ligertwood/Kristian Stanfill/Brett Younker
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-god-youre-so-good.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "God You're So Good",
    artist: "Brooke Ligertwood/Scott Ligertwood/Kristian Stanfill/Brett Younker",
    originalKey: "G",
    format: "chordpro",
    content: `{Pad}
| [G] | [C/G] | [G] | [Dsus] / [D] / |

{Verse 1}
[G]Amazing love, that [G/C]welcomes me
[G]The kindness of [Dsus]mercy [D]
[G]That bought with blood, [G/C]wholeheartedly
[Em]My soul un[Dsus]deserving [D]

{Chorus}
[G]God, You're so [D]good, [D/F#]God, [G] [G/F#]You're so good
[Em]God, You're so [C/G]good, [G/D]You're so [D]good to [G]me

{Verse 2}
[G]Behold the [C/G]cross, age to age
[G]And hour by [Dsus]hour [D]
[G]The dead are [C/G]raised, the sinner saved
[Em]The work of [Dsus]Your [D]power

{Bridge}
[D]I am blessed, I am called
[Em]I am healed, I am whole
[C]I am saved in [G]Jesus' [D]name
Highly favored, anointed
[Em]Filled with Your power
[C]For the glory of [G]Jesus' [D]name
[1st time x2, 2nd time x1]

{Verse 3}
[G]And should this [C/G]life bring suffering
[G]Lord, I will [Dsus]remember [D]
[Em]What Calvary has [C]bought for me
[G]Both now and [Dsus]forever [D]`,
    notes: "Key of G. Testimony of God's goodness. Build through declaration section.",
    bpm: 72,
    tags: ["worship", "goodness", "praise"],
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
