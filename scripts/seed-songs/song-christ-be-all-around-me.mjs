#!/usr/bin/env node
/**
 * Seed: Christ Be All Around Me by David Leonard/Jack Mooring/Leeland Mooring/Leslie Jordan
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-christ-be-all-around-me.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Christ Be All Around Me",
    artist: "David Leonard/Jack Mooring/Leeland Mooring/Leslie Jordan",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro}
| [G] | [Bm/F#] | [Em] | [C] |

{Verse 1}
[G]As I rise [Bm/F#]strength of God [Em]go before [C]lift me up
[G]As I wake [Bm/F#]eyes of God [Em]look upon [C]be my sight

{Verse 2}
[G]As I wait [Bm/F#]heart of God [Em]satisfy [C]and sustain
[G]As I hear [Bm/F#]voice of God [Em]lead me on [C]be my [D]guide

{Chorus 1}
[C]Above and be[G]low me, be[Em]fore and be[D]hind me
[C]In every eye that [G]sees me, Christ be [D]all a[Em]round me
[C]Above and be[G]low me, be[Em]fore and be[D]hind me
[C]In every eye that [G]sees me, Christ be [D]all a[Em]round [C]me yeah

{Verse 3}
[G]As I go [Bm/F#]hand of God [Em]my defense [C]by my side
[G]As I rest [Bm/F#]breath of God [Em]fall upon [C]bring me [D]peace

{Interlude}
[G]Oh [Em]oh [D]Christ be all around [Em]me [C]yeah

{Bridge}
[D]Your life Your death Your [Em]blood was shed
[C]For every [G]moment ev'ry [D]moment`,
    notes: "Key of G, Tempo 75. Prayerful song for God's presence. Build dynamics through the interlude.",
    bpm: 75,
    tags: ["worship", "presence", "devotion"],
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
