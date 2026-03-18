#!/usr/bin/env node
/**
 * Seed: King Of Kings by Hillsong Worship
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-king-of-kings.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "King Of Kings",
    artist: "Hillsong Worship",
    originalKey: "C",
    format: "chordpro",
    content: `{Intro}
[C] [C]

{Verse 1}
[C/E]In the [F]darkness we were waiting
[G]Without [C]hope, without light
[C/E]Till from [F]Heaven You came running
[G]There was [C]mercy in Your eyes
[C/E]To fulfil the [F]law and prophets
[G]To a virgin [C]came the Word
[C/E]From a [F]throne of endless glory
[G]To a cradle in the [C]dirt

{Chorus}
[C]Praise the [F]Father, praise the Son
[Am]Praise the [Gsus]Spirit three in [G]one
[C]God of [F]glory, Majesty
[Am]Praise for[F]ever to the [G]King of [C]Kings

{Verse 2}
[C/E]To reveal the [F]kingdom coming
[G]And to reconcile the [C]lost
[C/E]To redeem the [F]whole creation
[G]You did not despise the [C]Cross
[C/E]For even [F]in your suffering
[G]You saw to the other [C]side
[C/E]Knowing [F]this was our salvation
[G]Jesus for our sake You [C]died

{Verse 3}
[Am]And the [F]morning that You rose
[G]All of heaven held its [C]breath
[Am]Till that [F]stone was moved for good
[G]For the Lamb had conquered [C]death
[Am]And the [F]dead rose from their tombs
[G]And the angels stood in [C]awe
[Am]For the [F]souls of all who'd come
[G]To the Father are re[C]stored

{Verse 4}
[C/E]And the [F]church of Christ was born
[G]Then the Spirit lit the [C]flame
[C/E]Now this [F]gospel truth of old
[G]Shall not kneel, shall not [C]faint
[C/E]By His [F]blood and in His name
[G]In His freedom I am [C]free
[C/E]For the [F]love of Jesus Christ
[G]Who has resurrected [C]me`,
    notes: "Key of C, Capo 2 for original D. Epic resurrection narrative. Build through verses.",
    bpm: 68,
    tags: ["worship", "resurrection", "praise"],
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
