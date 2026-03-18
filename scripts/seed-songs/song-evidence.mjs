#!/usr/bin/env node
/**
 * Seed: Evidence by Josh Baldwin
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-evidence.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Evidence",
    artist: "Josh Baldwin",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro}
|[G] / / /|

{Verse 1}
[Em]All throughout my [D]histo[G]ry
[Am]Your faithfulness has [G]walked beside [D]me
[Em]The winter storms [D]made way for [G]spring
[Am]In every [Em]season, from where I'm [D]standing

{Chorus}
[G]I see the evidence of [D]Your goodness
[Em]All over my [D]life, all [C]over my life
[G]I see Your promises in [D]fulfillment
[Em]All over my [D]life, all [C]over my life

{Verse 2}
[Em]Help me re[D]member [G]when I'm weak
[Am]Fear may [G]come but fear will [D]leave
[Em]You lead my [D]heart to vic[G]tory
[Am]You are my [Em]strength and You [D]always will be

{Bridge}
[C]See the cross, the [D]empty grave
[Em]The evidence is [D]end[G]less
[C]All my sin [D]rolled away
[Em]Because of [D]You, oh [G]Jesus

Oh

{Outro}
[G]So why should I [D]fear? The evidence is [Em]here
[G]Why should I [D]fear? Oh, the evidence is [Em] [C]here`,
    notes: "Key of G. Testimony song. Great for building congregational confidence.",
    bpm: 78,
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
