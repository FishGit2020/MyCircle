#!/usr/bin/env node
/**
 * Seed: I Will Offer Up My Life by Matt Redman
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-i-will-offer-up-my-life.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "I Will Offer Up My Life",
    artist: "Matt Redman",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]I will [C/E]offer up my [F]life
[G]In spirit and [C]truth,
[C/E]Pouring out the [F]oil of love
[G]As my worship to [C]You
[C/E]In surrender I [F]must [G]give my [C]every part;
[C/E]Lord, receive the [F]sacrifice
[G]Of a [C]broken heart

{Chorus}
[F]Jesus, what can I [G]give, what can I [C]bring
[F]To so faithful a [G]friend, to so loving a [C]King?
[F]Savior, what can be [G]said, what can be [C]sung
[F]As a praise of Your name
[G]For the [C]things You have done?
[Dm]Oh my words could not [C/E]tell, not even in [F]part
[Dm]Of the debt of [C/E]love that is [F]owed
[G]By this thankful [C]heart

{Verse 2}
[C]You de[C/E]serve my every [F]breath
[G]For You've paid the [C]great cost;
[C]Giving up Your [C/E]life to [F]death,
[G]Even death on a [C]cross
[C/E]You took all my [F]shame away,
[G]There defeated my [C]sin
[C/E]Opened up the [F]gates of heaven
[G]And have beckoned me [C]in`,
    notes: "Key of C. Classic surrender song. Keep dynamics reflective and building.",
    bpm: 72,
    tags: ["worship", "surrender", "devotion"],
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
