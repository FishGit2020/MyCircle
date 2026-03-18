#!/usr/bin/env node
/**
 * Seed: Like Incense / Sometimes By Step by David Strasser/Rich Mullins/Brooke Ligertwood
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-like-incense-sometimes-by-step.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Like Incense / Sometimes By Step",
    artist: "David Strasser/Rich Mullins/Brooke Ligertwood",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]May my prayer like incense rise before You
[Em]The lifting of my hands a sacrifice
[C]Oh Lord Jesus turn Your eyes upon me
[Am]For I know there is [D]mercy in Your sight

{Verse 2}
[G]Your statues are my heritage forever
[Em]My heart is set on keeping Your decrees
[C]Please still my anxious urge toward rebellion
[Am]Let love keep my [D]will upon its knees

{Chorus}
[G]Oh God, You are [D]my God
[Am]And I will [Em]ever praise You
[G]Oh God, You are [D]my God
[Am]And I will [Em]ever praise You

{Verse 3}
[G]To all creation I can see a limit
[Em]But Your commands are boundless and have none
[C]So Your word is my joy and meditation
[Am]From rising to the [D]setting of the sun

{Verse 4}
[G]All Your ways are loving and are faithful
[Em]Your road is narrow but Your burden light
[C]Because You gladly lean to lead the humble
[Am]I shall gladly [D]kneel to leave my pride

{Bridge}
[Em]I will seek You [D]in the morning
[Am]And I will learn to [C]walk in Your ways
[G]And step by step You'll [D]lead me
[Am]And I will follow You [C]all of my days`,
    notes: "Key of G, 80 BPM. Prayer and devotion combined. Bridge is the commitment section.",
    bpm: 80,
    tags: ["worship", "prayer", "devotion"],
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
