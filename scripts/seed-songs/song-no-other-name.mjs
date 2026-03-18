#!/usr/bin/env node
/**
 * Seed: No Other Name by Joel Houston/Jonas Myrin
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-no-other-name.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "No Other Name",
    artist: "Joel Houston/Jonas Myrin",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro}
[Pad] [G]
[G] / / [D/F#] | [G] [Am] [G] [D/F#] | [Em] | [Em] / /

{Verse 1}
[G]One name holds [G]weight above them [Em]all
[G]His fame out[G]lasts the earth He [Em]formed
[C]His praise re[C]sounds be[C]yond the [Em]stars
[G]And echoes [C]in our hearts, the [C]greatest One of [Em]all [C]

{Verse 2}
[G]His face shines [G]brighter than the [Em]sun
[G]His grace as [G]boundless as His [Em]love
[C]He reigns with [C]healing in His [Em]wings
[G]The King above [C]all kings, the greatest [C]One of [Em]all [C]

{Chorus}
[G]Lift up our eyes, see the King has come
[Em]Light of the world reaching out for us
[G/B]There is no other [C]Name
[Em]There is no other [C]Name
[Em]Jesus Christ our [C]God
[G]Seated on high, the undefeated One
[Em]Mountains bow down as we lift Him up
[G/B]There is no other [C]Name
[Em]There is no other Name

{Bridge}
[G]The earth will shake and tremble before Him
[Em7]Chains will break as heaven and earth sing
[C(add9)]Holy is the name, [Em7]holy is the [C(add9)]name
of Jesus, Jesus

{Ending}
[Em]There is no other Name
[C]There is no other [G]Name, Jesus
[G] | [Em] | [Em] | [C] | [C] | [Em] | [C] | [G]`,
    notes: "Key of G. Exaltation anthem. Bridge builds to worship climax.",
    bpm: 80,
    tags: ["worship", "name of jesus", "praise"],
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
