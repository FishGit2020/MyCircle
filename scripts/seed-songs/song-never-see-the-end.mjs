#!/usr/bin/env node
/**
 * Seed: Never See The End by Mission House
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-never-see-the-end.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Never See The End",
    artist: "Mission House",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro}
[G] [D] [Em] [G]
[C] [D]

{Verse 1}
[C]Where can we [D]run, where can we [G]hide
[Em]That You will not find us, God?
[C]Deepest of [D]depths, highest of [G]heights
[Em]Your love, it chases us
[C]No matter where [D]we've been,
[G]no matter what we've done
[Em]We can't escape Your [C]love, ooh

{Chorus}
[G]We will [D]never see the [Em]end
[G]We will never see the [C]end
[D]We will never see the end of Your [G]goodness
[G]We will [D]never see the [Em]end
[G]We will never see the [C]end
[D]We will never see the end of Your [G]goodness

{Bridge} * 2
[G]In our darkest [D]hours, on our [Em]hardest [G]days [C]
[D]We do not have to be afraid
[G]For You will [D]never leave, [Em]no, You
[G]will not for[C]sake
[D]The promises You have made

{Tag}
[G]And we can [D]say that`,
    notes: "Key of G. Faithfulness anthem. Bridge builds with assurance.",
    bpm: 80,
    tags: ["worship", "faithfulness", "eternity"],
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
