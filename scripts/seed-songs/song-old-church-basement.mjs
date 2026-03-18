#!/usr/bin/env node
/**
 * Seed: Old Church Basement by Maverick City Music/Elevation Worship
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-old-church-basement.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Old Church Basement",
    artist: "Maverick City Music/Elevation Worship",
    originalKey: "C",
    format: "chordpro",
    content: `{Intro}
[F] [C] [Am] [G] 2x

{Verse 1}
[F] [C]I don't see anything wrong with the [Am]lights or stages
[G]
[F]I even [C]love it when the [Am]crowd gets [G]loud
[F]But every [C]now and then it can get a little [Am]compli[G]cated
[F]So I [C]remember when I was [Am]in that old
[G]church basement, singing

{Chorus}
[F]Halle[C]lujah is all I [G]need [Am]
[F]When I think of Your [C]goodness and Your love for [C]me
[F]Oh the joy of my sal[G]vation
[G]Is coming back to [Am]me
[Dm]It's just an old halle[C]lujah with a [G]new melody [C]
[F] [C] [G] [Am]
Oh, oh, oh, oh
[F] [C] [G] [C]
Oh, oh, oh, oh

{Verse 2}
[F]We got to[C]gether every Wednesday [Am]night
[G]About 30 teenagers
[F]My friend [C]Josh bought a cheap guitar and [Am]
[G]barely knew how to play it
[F]He wasn't [C]putting on a show, wasn't well [Am]
[G]known, wasn't trying to be famous
[F]But we [C]sure touched heaven in that [Am]old [G]
church basement

{Bridge}
[F]Great is Thy [C]faithfulness Lord [G]unto [C]me
[Dm]It's just an old halle[C]lujah with a [G]new melody [C]
[F]I once was [C]blind but [G]now I can [Am]see
[Dm]It's just an old halle[C]lujah with a [G]new melody [C]
[F]Over the mountains [C]and the sea [G]Your river
[C]runs with love for me
[Dm]It's just an old halle[C]lujah with a [G]new me[Am]lody
[F]Shout to the [C]Lord all the [G]earth let us sing
[Dm]It's just an old halle[C]lujah with a [G]new me[C]lody`,
    notes: "Key of C. Testimony song. Bridge quotes classic worship songs - beautiful mashup.",
    bpm: 80,
    tags: ["worship", "testimony", "gratitude"],
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
