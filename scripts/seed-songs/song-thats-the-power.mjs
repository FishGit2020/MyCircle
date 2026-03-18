#!/usr/bin/env node
/**
 * Seed: That's The Power by Hillsong Worship
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-thats-the-power.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "That's The Power",
    artist: "Hillsong Worship",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Intro}
[Em7] [Dsus4] [Cadd9] (x2)

{Verse 1}
[Em7]There's a [Dsus4]name that levels [Cadd9]mountains.
[Em7]And carves out [Dsus4]highways through the [Cadd9]sea.
[Em7]And I've seen as [Dsus4]praise unravel [Cadd9]battles,
[Em7]right in[Dsus4]front of [Cadd9]me.

{Chorus 1}
[Em7]'Cause that's the [Dsus4]power of Your name.
[Cadd9]Just a [G]mention makes a way.
[Em7]Giants fall and [Dsus4]strongholds break
[Cadd9]and there is [G]healing.
[Em7]And that's the [Dsus4]power that I claim.
[Cadd9]It's the same that [G]rolled the grave.
[Em7]And there's no [Dsus4]power like the mighty name
[Cadd9]of [G]Jesus.

{Verse 2}
[Em7]Oh, there's a [Dsus4]hope that calls out [Cadd9]courage.
[Em7]And in the [Dsus4]furnace un[Cadd9]afraid.
[Em7]The kind of [Dsus4]daring expec[Cadd9]tation,
[Em7]That every [Dsus4]prayer I make, is on an empty [Cadd9]grave.

{Bridge}
[G]Oh I see You [Gsus4]taking ground. I see You
[G]press ahead.
[G]And Your power is [Gsus4]dangerous to the enemy's camp.
[G]But You still do [Gsus4]miracles.
And You will do what You said.
[Em7]For You're the same God [Dsus4]now as You've [Cadd9]always been. [G]

{Tag/Ending}
[Em7]And there's no [Dsus4]power like the mighty name
[Cadd9]of [G]Jesus.
[Em7]And there's no [Dsus4]power like the mighty name
[Cadd9]of [G]Jesus.`,
    notes: "Key of Bb, Capo 3. Power of the name anthem. Bridge is a powerful declaration moment.",
    bpm: 80,
    tags: ["worship", "power", "name of jesus"],
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
