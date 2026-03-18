#!/usr/bin/env node
/**
 * Seed: Better Is One Day by Matt Redman
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-better-is-one-day.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Better Is One Day",
    artist: "Matt Redman",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E5]How lovely is Your [A2]dwelling place
[E5]O Lord Al[Bsus]mighty
[E5]For my soul longs and [A2]even faints for [Bsus]You
[E5]For here my heart is [A2]satisfied
[E5]Within Your [Bsus]presence
[E5]I sing beneath the [Bsus]shadow of Your wings

{Chorus}
[A2]Better is one day in Your courts
[Bsus]Better is one day in Your house
[A2]Better is one day in Your courts than [A/C#]thou[Bsus]sands elsewhere
[E/G#]Better is [A2]one day in Your courts
[Bsus]Better is one day in Your house
[A2]Better is one day in Your courts than [Bsus]thou[A2]sands elsewhere (last time)
[E5]Than thousands elsewhere

{Verse 2}
[E5]One thing I ask and [A2]I would seek [Bsus]to see Your beauty
[E5]To find You in the [Bsus]place Your glory dwells
[E5]One thing I ask and [A2]I would seek [Bsus]to see Your beauty
[E5]To find You in the [Bsus]place Your glory dwells

{Bridge 1}
[C#m7]My heart and flesh cry [B]out [A2]for You the [Bsus]living God
[C#m7]Your Spirit's water [B]to my [A2]soul [Bsus]
[C#m7]I've tasted and I've [B]seen, [A2]come once again to me
[E/G#]I will draw near to You
[F#m7]I will draw [Bsus]near to [A2]You [Bsus] [A2] [Bsus]

{Bridge 2}
[A2]Better is one day, [Bsus]better is one day
[E/G#]Better is [A2]one day than [A/C#]thou[Bsus]sands elsewhere
[A2]Better is one day, [Bsus]better is one day
[A2]Better is one day than [Bsus]thou[A2]sands elsewhere`,
    notes: "Key of E. Passionate presence song. Bridge 1 is the emotional peak.",
    bpm: 110,
    tags: ["worship", "presence", "longing"],
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
