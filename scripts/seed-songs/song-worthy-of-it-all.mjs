#!/usr/bin/env node
/**
 * Seed: Worthy Of It All by David Brymer/Ryan Hall
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-worthy-of-it-all.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Worthy Of It All",
    artist: "David Brymer/Ryan Hall",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse}
[C]All the saints and angels
[C]They bow before Your throne [D/C]
[C]All the elders cast their [D/C]crowns
[C]Before the [D]Lamb of [Em]God and [G] [A]sing

{Chorus}
[G]You are worthy of it [A]all, You are worthy of it all
[C]For from You are all [D]things, [Dadd4]and to [E]You are all things
[G]You de[A]serve the glory

[2nd time] [repeat]
[4th time] [x3]
[6th time] [repeat as desired]

{Interlude 1}
[C] [D/C] [E/D] [C] [D/C] [E/D]
(Singing) Oh-oh-oh-oh-oh, Oh-oh-oh-oh-oh
[C] [D/C] [E/D] [C] [D] [G] [A]
Oh-oh-oh-oh-oh, Oh-oh, Oh-oh, Oh-oh

{Bridge}
[G]Day and [A]night, night and day, let incense arise
[Bm]Day and [C#m]night, night and day, let incense arise
[D]Day and [A/E]night, night and day, let [Dadd4]incense [E]arise
[Am]Day and [Bm]night, night and day, let [C]incense [D]arise
[1st time] [repeat]`,
    notes: "Key of C. Harp and bowl worship. Bridge builds with escalating key changes.",
    bpm: 72,
    tags: ["worship", "adoration", "devotion"],
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
