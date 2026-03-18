#!/usr/bin/env node
/**
 * Seed: See A Victory by Elevation Worship
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-see-a-victory.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "See A Victory",
    artist: "Elevation Worship",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[Am]The weapon may be [F]formed, but it [C]won't prosper
[Am]When the darkness [F]falls, it won't pre[C]vail
[Am]'Cause the God I [F]serve knows [C]only how to triumph
[Am]My God will [F]never [C]fail

{Chorus}
[Am]I'm gonna see a [F]victory
[C]I'm gonna see a [G]victory
[Am]For the battle be[F]longs to You, [C]Lord

{Bridge} * 3
[G]You take what the [A]enemy meant for evil
[D]And You turn it for [G]good
[Bm]You turn it for [A]good`,
    notes: "Key of E, Capo 2. Victory declaration.",
    bpm: 90,
    tags: ["worship", "victory", "faith"],
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
