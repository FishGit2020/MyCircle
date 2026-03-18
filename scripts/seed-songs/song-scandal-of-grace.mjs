#!/usr/bin/env node
/**
 * Seed: Scandal Of Grace by Joel Houston/Matt Crocker
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-scandal-of-grace.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Scandal Of Grace",
    artist: "Joel Houston/Matt Crocker",
    originalKey: "C",
    format: "chordpro",
    content: `{Intro}
| [C] | [C2] |

{Verse 1}
[C]Grace what have You done
[Am]Murdered for me on that [F]cross
[C]Accused in absence of wrong
[Am]My sin washed a[F]way in Your blood

{Pre-Chorus 1}
[Em]Too much to make [F]sense of it all
[Em]I know that Your [F]love breaks my fall
[G]The scandal of [Am]grace You died in my place
[F]So my soul will live

{Chorus}
[C]Oh to be like You
[G6]Give all I have just to know You
[F]Jesus there's no-one be[Am]side You
Forever the [C]hope in my heart

{Verse 2}
[C]Death where is your sting
[Am]Your pow'r is as dead as my [F]sin
[C]The cross has taught me to live
[Am]And mercy my [F]heart now to sing

{Pre-Chorus 2}
[Em]The day and its [F]troubles shall come
[Em]I know that Your [F]strength is enough
[G]The scandal of [Am]grace You died in my place
[F]So my soul will live

{Bridge}
[F]And it's all because of You Jesus
[G]It's all because of You Jesus
[Am]It's all because of Your love
[F]That my soul will live`,
    notes: "Key of C, Tempo 42, 6/8 time. Grace anthem. Beautiful and intimate.",
    bpm: 42,
    tags: ["worship", "grace", "cross"],
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
