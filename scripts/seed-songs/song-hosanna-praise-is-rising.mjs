#!/usr/bin/env node
/**
 * Seed: Hosanna (Praise Is Rising) by Brenton Brown/Paul Baloche
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-hosanna-praise-is-rising.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Hosanna (Praise Is Rising)",
    artist: "Brenton Brown/Paul Baloche",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G5]Praise is rising, [C2]eyes are [G5]turning to You
[G5]Hope is stirring, [C2]hearts are yearning for You
[G5]We long for You

{Pre-Chorus}
[D(4)]'Cause when we see [C]You
[C]We find strength to [G5]face the day
[D(4)]In Your [C]presence
[G5]All our fears are washed away (To Pre-Chorus)
[D]Washed away

{Chorus}
[Gsus]Ho[G]san[Em7]na, ho[C2]san-na
[G5]You are the [Dsus]God who saves us
[Em7]Worthy of [C2]all our praises
[Gsus]Ho[G]san[Em7]na, ho[C2]san-na
[G5]Come have Your [Dsus]way among us
[Em7]We welcome You [C2]here Lord Jesus

{Verse 2}
[G5]Hear the sound of [C2]hearts re[G5]turning to You
[G5]We turn to You
[G5]In Your Kingdom [C2]broken lives are made [G5]new
You make us new

{Instrumental}
||: [Gsus] | [G] | [Em7] | [C2] |
| [G5] | [Dsus] | [Em7] | [C2] :||

{Ending}
| [Gsus] | [G] | [Gsus] | [G] |
[Gsus]Ho[G]san[Gsus]na, ho[G]san-na`,
    notes: "Key of G, Tempo 114. Upbeat praise anthem. Build through pre-chorus to explosive chorus.",
    bpm: 114,
    tags: ["worship", "praise", "coming of god"],
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
