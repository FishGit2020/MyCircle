#!/usr/bin/env node
/**
 * Seed: Battle Belongs by Phil Wickham
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-battle-belongs.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Battle Belongs",
    artist: "Phil Wickham",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro/Turnaround}
||: [G] | [G] . [Gsus] [G] :||

{Verse 1}
[G]When all I see is the battle,
[C2]You see my victo[Em7]ry
[Dsus]When all I see is a moun[C2]tain moved
[G]And as I walk through the shadow,
[C2]Your love sur[Em7]rounds me
[Dsus]There's nothing to fear [G]now
For I am safe with You

{Chorus}
[C2]So when I [G]fight, I'll fight on my [D]knees
[Em7]With my hands lifted high
[C2]O [G]God, the battle be[D]longs to [Em7]You
[C2]I'll [G]sing through the night
[C2]O [G]God

{Verse 2}
[G]And if You are for me,
[C2]Who can be a[Em7]gainst me?
[Dsus]For Jesus, there's nothing
Im[C2]possible for You
[G]When all I see are the ashes,
[C2]You see the beau[Em7]ty
[Dsus]When all I see is a [G]cross,
God, You see the emp[C2]ty tomb

{Bridge}
[C]Almighty [G]Fortress, You go be[Dsus]fore us
[Em7]Nothing can stand a[Dsus]gainst the power of our [C]God
[C]You shine in the [G]shadows, You win ev'ry [Dsus]battle
[Em7]Nothing can stand a[Dsus]gainst the power of our God

{Tag}
[C2]O [G]God, the battle be[D]longs to [G]You

{Outro}
| [G] | [G] . [Gsus] [G] | [G] |`,
    notes: "Key of G, Tempo 81. Powerful declaration song. Build through verses to explosive chorus/bridge.",
    bpm: 81,
    tags: ["worship", "spiritual warfare", "faith"],
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
