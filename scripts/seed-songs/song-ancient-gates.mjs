#!/usr/bin/env node
/**
 * Seed: Ancient Gates by Worship Together (Brooke Ligertwood/Jason Ingram/Scott Ligertwood)
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-ancient-gates.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Ancient Gates",
    artist: "Worship Together (Brooke Ligertwood/Jason Ingram/Scott Ligertwood)",
    originalKey: "D",
    format: "chordpro",
    content: `{Intro}
|[D] / / / | [D] / / / | [Em7(4)] / / / |
| [Em7(4)] / / / |
|[G2] / / / | [G2] / / / | [D] / / / / |
/ / / |

{Verse 1}
[D]There is singing at the ancient [D]gates
[D]There's a melody of ceaseless [D]praise
[G]Age to age the sound is [G]only growing [D]stronger [D]

{Verse 2}
[D]There's a throne beneath the Name of [D]names
[D]There seated on it One who [D]reigns
[G]And His kingdom now
[G]Is here and getting [D]closer [D]

{Pre-Chorus 1}
[D]Praise Him like we're [D]there in glory
[Em7(4)]Here and now He's [Em7(4)]just as holy
[G]Jesus, He's so [G]worthy of it [D]all [D]

{Chorus}
[D]Worship Him with [D]joyful sound [Em7]
[G]Sing until your voice gives out
[Em7(4)]No matter where or [D]who's [D]around
Release your worship

{Pre-Chorus 2}
[D]Praise Him like we're [D]there in glory
[Em7(4)]Here and now He's [Em7(4)]just as holy
[G]Jesus, He's so [G]worthy of it [D]all [D]
[D]Bring your song: He [D]loves to hear it
[Em7(4)]Bring Him every [Em7(4)]prayer-soaked lyric
[G]Jesus, He's so [G]worthy of it [D]all [D]

{Bridge 1}
[D]The One who was, the [Em7(4)]One who is
[D/F#]The One who is to [Em7(4)]come`,
    notes: "Key of D. Eternal worship anthem. Build through pre-chorus sections.",
    bpm: 72,
    tags: ["worship", "praise", "eternity"],
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
