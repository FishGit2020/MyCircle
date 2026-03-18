#!/usr/bin/env node
/**
 * Seed: Here For You by Tim Hughes/Jesse Reeves/Matt Redman/Chris Tomlin
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-here-for-you.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Here For You",
    artist: "Tim Hughes/Jesse Reeves/Matt Redman/Chris Tomlin",
    originalKey: "C",
    format: "chordpro",
    content: `{Intro}
[C]

{Verse 1}
[C]Let our praise be Your welcome,
Let our songs be a [F]sign
[F]We are here for [C]You, we are here for You
[C]Let Your breath come from heaven,
Fill our hearts with Your [F]life
[F]We are here for [C]You, we are here for You

{Chorus}
[F]To You our [G]hearts are open
[C]Nothing here is [F]hidden [Dm]
[C]You are our one de[F]sire, You alone are holy
[G]Only You are [C]worthy
[G]God, let Your fire [F]fall down
[2nd time]
[F]Let it [F]fall [3x]

{Verse 2}
[C]Let our shout be Your anthem,
Your renown fill the [F]sky
[F]We are here for [C]You, we are here for You
[C]Let Your Word move in power,
let what's dead come to [F]life
[F]We are here for [C]You, we are here for You

{Ending}
[C]We welcome You with praise, we welcome You with praise
[Am]Almighty God of [F]love, be welcome in this place [2x]
[C]Let every heart adore, let every soul awake
[Am]Almighty God of [F]love, Be welcome in this place
[F]Be welcome in Your [C]house, Lord, be welcome in Your house [C] [end]`,
    notes: "Key of C, 4/4 meter 85 BPM. Prayer-style worship. Let the ending build as a declaration.",
    bpm: 85,
    tags: ["worship", "prayer", "surrender"],
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
