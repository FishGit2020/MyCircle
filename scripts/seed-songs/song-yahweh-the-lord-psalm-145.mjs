#!/usr/bin/env node
/**
 * Seed: Yahweh The Lord (Psalm 145) by Unknown
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-yahweh-the-lord-psalm-145.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Yahweh The Lord (Psalm 145)",
    artist: "Unknown",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro}
[G] [G] [C] [C]

{Verse 1}
[G]Beautiful and kind, [G]beautiful and kind
[C]I'm forever satisfied, the [D]fountain of my life
[G]Beautiful and kind

{Verse 2}
[G]Abounding in grace, [G]abounding in grace
[C]Forgiving all my sin, You [D]heal me from within
[G]Abounding in grace

{Chorus}
[C]Yahweh the Lord
[G]Slow to anger and rich in love
[D]Your mercies are [G]new, steadfast and true
[C]Yahweh the Lord
[Em]Oh, Your faithfulness covers thousands
[C]Age to age the same, how great is Your [G]name
Yahweh the Lord

{Verse 3}
[G]Goodness and love, [G]goodness and love
[C]Your hands are open wide, ful[D]filling my desires
[G]Goodness and love

{Verse 4}
[G]Righteous and just, [G]righteous and just
[C]You care for the oppressed
[D]You're the lifter of their head
[G]Righteous and just

{Bridge}
[C/E]I'll bless the name of the Lord
[G]I'll bless the name of the Lord
[C/E]I'll bless the name of the Lord
[G]I'll bless the name of the Lord`,
    notes: "Key of G. Psalm 145 paraphrase. Builds through verses to joyful bridge.",
    bpm: 80,
    tags: ["worship", "psalm", "praise"],
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
