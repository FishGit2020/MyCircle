#!/usr/bin/env node
/**
 * Seed: Good Good Father by Anthony Brown/Pat Barrett
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-good-good-father.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Good Good Father",
    artist: "Anthony Brown/Pat Barrett",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]I've heard a [Gsus]thousand [G5]stories
[G]Of what they [Gsus]think You're [G5]like
[G]But I've heard the [Gsus]tender [G5]whisper
[G]Of love in the [Gsus]dead [G5]of night
[C2(no3)]You tell me [G/B]that You're pleased
[Am7]And that I'm [D(4)]never alone

{Chorus}
[C2]You're a good, good [G]Father
[Am7]It's who You are, [D(4)]it's who You are
[C2]And I'm loved by [G]You; it's who I am
[Am7]It's who I am, [D(4)]it's who I am

{Verse 2}
[G]I've seen many [Gsus]searching [G5]
[G]For answers far [Gsus]and [G5]wide
[G]But I know we're [Gsus]all [G5]searching
[G]For answers only [Gsus]You pro[G5]vide
[C2(no3)]Because You [G/B]know just what we need
[Am7]Before we [D(4)]say a word

{Verse 3}
[G]Love so unde[Gsus]niable [G5]
[G]I can hardly [Gsus]speak [G5]
[G]Peace so unex[Gsus]plainable [G5]
[G]I can hardly [Gsus]think [G5]
[C2(no3)]As You call me [G/B]deeper still
[Am7]As You call me [G/B]deeper still
[C2(no3)]As You call me [G/B]deeper still
[Am7]Into love, [D(4)]love, love

{Bridge}
[C2]You are perfect in [Em7]all of Your ways
[Am7]You are perfect in [G]all of Your ways
[C2]You are perfect in [Em7]all of Your [D(4)]ways to us

{Instrumental}
||: [G] | [Gsus] [G5] | [G] | [Gsus] [G5] :||`,
    notes: "Key of G, Tempo 48, Time 6/8. Gentle identity song. Let the 6/8 feel carry the warmth.",
    bpm: 48,
    tags: ["worship", "identity", "father"],
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
