#!/usr/bin/env node
/**
 * Seed: House Of The Lord by Phil Wickham/Jonathan Smith
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-house-of-the-lord.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "House Of The Lord",
    artist: "Phil Wickham/Jonathan Smith",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro x2}
[G] [G2] [G] [Dsus] [C] [C6] [C] [Dsus]

{Verse 1}
[G]We worship the God who was, we worship the God who is
[Em]We worship the God who ever[Dsus]more will [C]be
[G]He opened the prison doors, He parted the raging sea
[G]My [Em]God, He holds the vic[Dsus]to[C]ry

{Chorus 1}
[G]There's joy in the house of the Lord
[Dsus]There's [C2]joy in the house of the Lord today
[C]And we won't be quiet, we shout out Your praise
[G]There's joy in the house of the Lord
[C]Our God is [F]surely in this place
[F]And we won't be quiet, we shout out Your [C]praise

{Verse 2}
[G]We sing to the God who heals, we sing to the God who saves
[Em]We sing to the God who always [Dsus]makes a [D]way
[C]'Cause He hung upon that Cross, [Dm]then He rose up from that grave
[Am]My God's still [G]rolling stones a[F]way

{Bridge}
[Am7]Cause He hung upon that cross then
[Em]He rose up from that [D]grave
[Am7]My God's still [C]rolling stones away
[G]There's joy in the house of the Lord
[Dsus]There's [C2]joy in the house of the Lord today`,
    notes: "Key of G, Capo 3. High-energy joy anthem. Don't hold back on the chorus energy.",
    bpm: 130,
    tags: ["worship", "joy", "praise"],
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
