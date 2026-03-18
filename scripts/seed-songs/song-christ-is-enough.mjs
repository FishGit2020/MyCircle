#!/usr/bin/env node
/**
 * Seed: Christ Is Enough by Jonas Myrin/Reuben Morgan
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-christ-is-enough.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Christ Is Enough",
    artist: "Jonas Myrin/Reuben Morgan",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro}
| [G] ||: [Em] | [C] | [G] | [Dsus/F#] :||

{Verse 1}
[Em]Christ is my re[C]ward
[G]And all of my de[D/F#]votion
[Em]Now there's nothing in this [C]world
[G]That could ever [D/F#]satisfy
[Bm]Through every [C]trial
[G/B]Through every [C]storm [Em] [D]
No turning back I've been set free

{Chorus}
[G]Christ is e[Gsus]nough for [G]me
[Em7]Christ is e[D]nough for me
[C]Ev'rything I [D]need is in [Em]You
[C]Ev'rything I [D]need

{Verse 2}
[Em]Christ my all in [C]all the joy of my sal[G]vation [D/F#]
[Em]And this hope will [C]never fail
[G]Heaven is our [D/F#]home
[Bm]Through every [C]trial
[G/B]Through every [C]storm [Em] [D]
Jesus is here to God be the glory

{Bridge 1A}
[G]I have de[Gsus]cided to [G2(no3)]follow Je[G]sus
[C]No turning [Cmaj7]back [D]no turning back
[G]I have de[Gsus]cided to [G2(no3)]follow Je[G]sus
[C]No turning [D]back no [G]turning back

{Bridge 2}
[Em]The cross be[C]fore me the [D]world be[Em]hind me
[C]No turning [Em]back [D]no turning back
[Em]The cross be[C]fore me the [D]world be[Em]hind me
[C]No turning [D]back no [G]turning back`,
    notes: "Key of G, Tempo 82. Declaration song. Bridge builds with 'I have decided' anthem feel.",
    bpm: 82,
    tags: ["worship", "contentment", "faith"],
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
