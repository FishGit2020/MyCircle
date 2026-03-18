#!/usr/bin/env node
/**
 * Seed: On Repeat by Worship Together (Aodhan King/Ben Fielding/Benjamin Hastings/Joel Houston)
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-on-repeat.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "On Repeat",
    artist: "Worship Together (Aodhan King/Ben Fielding/Benjamin Hastings/Joel Houston)",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]Every time I come running
[Am7]I find grace on [C]repeat
[C]You welcome me with open arms
[F]No matter where I have been
[C]Every time I sur[C/D]render [C]
[C]Every time I fall
[G]I find [Am]grace more [C]precious [F]did before
[G]I'm gonna lay my [Am]world [G]down

{Chorus}
[C/E]So I'm gonna lay my [F]world down
[G]Here at Your [Am]feet
[F]Every time I come [C/E]running
[F]I find grace on [C]repeat
[G]Grace upon [Am]grace
[C/E]Morning by [F]morning
[C]God be ex[Am7]alted
[F]Over and over a[Gsus]gain [G]

{Tag}
[G]'Cause You're the God
[Am]Who's never [F]given up on [C]me

{Bridge 1}
[C]Grace upon [F]grace
[Am7]Morning by [F]morning
[C]Day after [Gsus]day will I [G]sing
[C]Praise upon [F]praise
[Am7]God be exalted
[Gsus]Over and over a[G]gain

{Bridge 2}
[Am7]Grace upon [F]grace
Morning by [C/E]morning
[Gsus]Day after day [G]will I sing
[Am7]Praise upon [F]praise
[C/E]God be exalted
[Gsus]Over and over a[G]gain`,
    notes: "Key of C, 68 BPM. Grace anthem. Bridge builds with repetition.",
    bpm: 68,
    tags: ["worship", "grace", "praise"],
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
