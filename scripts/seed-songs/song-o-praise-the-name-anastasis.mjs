#!/usr/bin/env node
/**
 * Seed: O Praise The Name (Anastasis) by Hillsong
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-o-praise-the-name-anastasis.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "O Praise The Name (Anastasis)",
    artist: "Hillsong",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]I cast my mind to Calvary
[D]Where Jesus [Em]bled and died for me
[C]I see His wounds, His [G]hands, His feet
[D]My Savior on that [G]cursed tree

{Verse 2}
[G]His body bound and drenched in tears
[D]They laid Him [Em]down in Joseph's tomb
[C]The entrance sealed by [G]heavy stone
[D]Messiah still and all a[G]lone

{Chorus}
[G]O praise the [C]Name of the [G]Lord our God
[Em]O praise His [Dsus]Name for[D]evermore
[G]For endless [C]days we will [Em]sing Your praise
[C]Oh [D]Lord, oh [G]Lord our God

{Verse 3}
[G]And then on the third at break of dawn
[D]The Son of [Em]Heaven rose again
[C]O trampled death, [G]where is your sting?
[D]The angels roar for [G]Christ the [Gsus]King

{Verse 4}
[G]He shall return in robes of white
[D]The blazing [Em]sun shall pierce the night
[C]And He will rise [G]among the saints
[D]My gaze transfixed on [G]Jesus' face

{Bridge Ending}
[C]Oh Lord, oh [Dsus]Lord our [G]God
[C]Oh Lord, oh [D]Lord our [G]God`,
    notes: "Key of G, Capo 2 for original A. Easter narrative anthem. Each verse tells the story.",
    bpm: 72,
    tags: ["worship", "resurrection", "cross"],
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
