#!/usr/bin/env node
/**
 * Seed: Forever (Kari Jobe) by Kari Jobe/Brian Johnson/Christa Black Gifford/Joel Taylor/Gabriel Wilson
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-forever-kari-jobe.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Forever (Kari Jobe)",
    artist: "Kari Jobe/Brian Johnson/Christa Black Gifford/Joel Taylor/Gabriel Wilson",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]The moon and stars they [D]wept
[Em7]The morning sun was dead
[C]The Savior of the world was fallen
[G]His body on the [D]cross
[Em7]His blood poured out for us
[C]The weight of every curse upon Him

{Verse 2}
[G]One final breath He [D]gave
[Em7]As heaven looked away
[C]The Son of God was laid in darkness

{Pre-Chorus}
[G]The ground began to [D]shake
[Em7]The stone was rolled away
[C]His perfect love could not be overcome
[G/B]Now death where is [D]your sting
[Em7]Our resurrected King
[C]has rendered you defeated

{Chorus 1}
[G]Forever He is [D]glorified
[Em7]Forever He is [C]lifted high
[G]Forever He is [D]risen
[Em7]He is alive, He is [C]alive

{Bridge 1}
[G]We sing halle[D]lujah
[Em7]We sing halle[C]lujah
[G]We sing halle[D]lujah
[C]The Lamb has over[G]come`,
    notes: "Key of G, 72 BPM. Easter/resurrection anthem. Start gentle, build through pre-chorus to powerful chorus.",
    bpm: 72,
    tags: ["worship", "resurrection", "praise"],
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
