#!/usr/bin/env node
/**
 * Seed: There Is None Like You by Lenny LeBlanc
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-there-is-none-like-you.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "There Is None Like You",
    artist: "Lenny LeBlanc",
    originalKey: "G",
    format: "chordpro",
    content: `{Chorus}
[G]There is none [D/F#]like [C/E]You [G/D]
[C]No one [G/B]else can touch [Am7]my heart like [Am7/D]You [D]do
[G]I could [D/F#]search for all [C/E]eternity [Dm/E]long
[G/D]And find there is [C/D]none [D]like [G]You

{Turnaround}
| [Em] [C2] | [G/D] . [Dsus] [D] |

{Verse}
[Cmaj7]Your mercy [C/D]flows like a river [G]wide [Em7]
[Am7]And healing [D7/F#]comes from Your [G]hands [G2/B]
[Cmaj7]Suffering [C/D]children are safe in Your [Em7]arms
[Am]There is [C/G]none [D/F#]like [G]You`,
    notes: "Key of G, Tempo 69. Classic intimate worship. Simple and powerful.",
    bpm: 69,
    tags: ["worship", "devotion", "classic"],
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
