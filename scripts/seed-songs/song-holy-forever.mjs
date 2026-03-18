#!/usr/bin/env node
/**
 * Seed: Holy Forever by Chris Tomlin/Phil Wickham/Brian Johnson/Jenn Johnson/Jason Ingram
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-holy-forever.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Holy Forever",
    artist: "Chris Tomlin/Phil Wickham/Brian Johnson/Jenn Johnson/Jason Ingram",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro}
| [C] . . [Em] | [Dsus] | [G/B] | [Em] [Dsus] |

{Verse 1}
[G]A thousand [C2]genera[G]tions falling down in worship
[Em7]To sing the [Dsus]song of ages [C2]to the Lamb
[G]And all who've [C2]gone be[G]fore us and all who will believe
[Em7]Will sing the [Dsus]song of [C2]ages to the Lamb

{Pre-Chorus}
[C2](Jesus) Your name is the [Em7]highest
[D]Your name is the greatest
[Em7]Your name stands a[Am7]bove them all
[C2]All thrones and [Em7]dominions
[D]All powers and positions
[Em7]Your name stands a[Am7]bove them all

{Chorus 1}
[C2]And the [Em7]angels cry [D]Holy
[G/B]All creation [Em7]cries Holy
[Am7]You are [D]lifted high, Ho[G]ly
[G]Ho[Gsus]ly for[G]ever

{Verse 2}
[G]If you've been for[C2]given and if you've been re[G]deemed
[Em7]Sing the [Dsus]song for[C2]ever to the Lamb
[G]If you walk in [C2]freedom and if you bear His [G]name
[Em7]Sing the [Dsus]song for[C2]ever to the Lamb
[Em7]We'll sing the [Dsus]song for[C2]ever and amen

{Chorus 2}
[G/B]Hear Your [C2]people [Em7]sing Ho[D]ly
To the King of [Em7]Kings Ho[Am7]ly
[Am7]You will [D]always be Ho[G]ly
Holy forever

{Tag}
[Am7]You will [D]always be Ho[G]ly
[G]Ho[Gsus]ly for[G]ever`,
    notes: "Key of G, 72 BPM. Eternal worship anthem. Pre-chorus builds to chorus declarations.",
    bpm: 72,
    tags: ["worship", "holiness", "eternal"],
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
