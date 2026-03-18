#!/usr/bin/env node
/**
 * Seed: Goodness Of God by Ed Cash/Ben Fielding/Jason Ingram/Brian Johnson/Jenn Johnson
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-goodness-of-god.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Goodness Of God",
    artist: "Ed Cash/Ben Fielding/Jason Ingram/Brian Johnson/Jenn Johnson",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro}
[G] / / [Gsus] | [G] | [G] / / [Gsus] | [G] |

[G]I love You, Lord, [C]for Your mercy [G]never fails me
[Em]All my [C]days, I've been [Dsus]held in Your [D]hands
[Em]From the [C]moment that I [G]wake up, until I [D/F#]lay my [Em]head
[C]Oh, I will [Dsus]sing of the [G]good[Gsus]ness of God

[C]And all my life You have been [G]faithful
[C]And all my life You have been [G]so, so [D]good
[C]With every [G]breath that I am [D/F#]able [Em]
[C]Oh, I will [D]sing of the [G]good(Em)ness of God

[G]I love Your [C]voice, You have [G]led me through the fire
[Em]And in [C]darkest night You are [Dsus]close like no [D]other
[Em]I've known You as a [C]Father, I've known You as a [G]Friend
[C]And I have lived in the [Dsus]goodness of [G]God

{Bridge}
[G/B]'Cause Your goodness is [C]running after, it's [D]running after [G]me
[G/B]Your goodness is [C]running after, it's [D]running after [G]me
[G/B]With my life laid [C]down, I'm surren[D]dered now, I give You every[Em]thing
[G/B]'Cause Your goodness is [C]running after, it's [D]running after me [G] ([C] [G])
[x2]

[C]Oh, I'm gonna [D]sing of the [G]goodness of God`,
    notes: "Key of G, 72 BPM. Powerful testimony anthem. Bridge is the peak - drive it with energy.",
    bpm: 72,
    tags: ["worship", "faithfulness", "testimony"],
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
