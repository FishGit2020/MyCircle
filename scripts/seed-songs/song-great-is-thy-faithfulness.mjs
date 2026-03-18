#!/usr/bin/env node
/**
 * Seed: Great Is Thy Faithfulness by Traditional Hymn
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-great-is-thy-faithfulness.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Great Is Thy Faithfulness",
    artist: "Traditional Hymn",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[G]Great is Thy [C]faith[D]fulness, O God my [G]Father,
[C]There is no [G]shadow of [A]turning with [D]Thee;
[D]Thou changest [G]not, Thy compassions they [Am]fail not
[C]As Thou hast [G]been [D]Thou for[G]ever wilt be.

{Chorus}
[D]Great is Thy [G]faithfulness!
[E]Great is Thy [Am]faithfulness!
[D]Morning by [G]morning new [D]mercies I [A] [D]see.
[D]All I have [G]needed Thy [Am]hand hath provided
[C]Great is Thy [G]faith[D]fulness, Lord [G]unto me.

{Verse 2}
[G]Summer and [C]winter, and [D]springtime and [G]harvest,
[C]Sun, moon, and [G]stars in their [A]courses above
[D]Join with all [G]nature in [Am]manifold witness
[C]To Thy great [G]faithful[D]ness, mercy and [G]love.

{Verse 3}
[G]Pardon for [C]sin and a [D]peace that en[G]dureth,
[C]Thy own dear [G]presence to [A]cheer and to [D]guide.
[D]Strength for [G]today and bright hope for [Am]tomorrow
[C]Blessings all [G]mine, with ten [D]thousand [G]beside.`,
    notes: "Classic hymn. Key of D. Stately and reverent. Full congregational singing.",
    bpm: 84,
    tags: ["hymn", "faithfulness", "classic"],
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
