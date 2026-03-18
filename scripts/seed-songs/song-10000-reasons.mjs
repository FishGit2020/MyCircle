#!/usr/bin/env node
/**
 * Seed: 10000 Reasons by Rend Collective
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-10000-reasons.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "10000 Reasons",
    artist: "Rend Collective",
    originalKey: "G",
    format: "chordpro",
    content: `{Chorus}
[C]Bless the [G]Lord, [D]O my [Em]soul,
[D]O [Em]my soul,
[C]Worship [G]His [D]holy [Em]name.
[C]Sing like [G]never be[Em]fore,
[D]O [Em]my soul,
[C]I'll worship [G]Your [D]holy [Em]name.

{Verse 1}
[C]The [G]sun comes [D]up, it's a [Em]new day dawning;
[C]It's [G]time to [D]sing Your [Em]song again.
[C]What[G]ever may [D]pass, and what[Em]ever lies before me,
[C]Let me be [G]singing when the [D]evening comes.

{Verse 2}
[C]You're [G]rich in [D]love, and You're [Em]slow to anger.
[C]Your [G]name is [D]great, and Your [Em]heart is kind.
[C]For [G]all Your [D]goodness, I will [Em]keep on singing;
[C]Ten thousand [G]reasons for my [D]heart to [Em]find.

{Verse 3}
[C]And on [G]that day [D]when my [Em]strength is failing,
[C]The end [G]draws near, and my [D]time has [Em]come;
[C]Still my [G]soul will sing Your [D]praise un[Em]ending:
[C]Ten thousand [G]years and then [D]forever[Em]more!`,
    notes: "Key of G, Capo 2 for original key Bb. Strong congregational song - build dynamics through verses.",
    bpm: 73,
    tags: ["worship", "praise", "thanksgiving"],
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
