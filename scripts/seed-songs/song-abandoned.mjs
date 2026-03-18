#!/usr/bin/env node
/**
 * Seed: Abandoned by Benjamin William Hastings
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-abandoned.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Abandoned",
    artist: "Benjamin William Hastings",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro}
[G]

{Verse 1}
[G]Something isn't adding up
[D]This wild exchange You offer us
[Em]I gave my [D]worst, You gave Your blood
[C]Seems hard to believe

{Verse 2}
[G]You're telling me You chose the cross?
[D]You're telling me I'm worth that much?
[Em]If [D]that's the measure of Your love
[C]How else would I sing but

{Chorus}
[Em]Completely, [D]deeply, sold out
[C]Sincerely [G]abandoned
[Em]I'm completely, [D]freely, hands to the
[C]ceiling en[G]amored
[Em]My one life en[D]deavor, to match Your surrender
[C]To mirror not my will, but [G]Yours
[Em]I'm completely, [D]deeply, don't care
[C]who sees me abandoned

{Refrain}
[G]Oh, I [Em]surrender all
[D]I [C]surrender all
[G]I [Em]sur[D]render [C]all

{Bridge 1}
[G]The whole of my heart
The best of my soul
[D]Each phase of my life
Each breath in my lungs
[Am]Consider it Yours, Lord
[C]Consider it [D]Yours, Lord

{Bridge 2}
[G]The failures I hide
The victories I don't
[D]The battles I fight
Each crown that I hoard
[Am]Consider it Yours, Lord
[C]Consider it [D]Yours, Lord

{Bridge 3}
[Em]All the glory forever
The grave that You won
[D]The praise of the heavens
The kingdom to come
[Am]Consider it Yours, Lord
[C]Consider it [D]Yours, Lord`,
    notes: "Key of G. Intimate worship song that builds through bridges. Let the 'Consider it Yours' sections crescendo.",
    bpm: 76,
    tags: ["worship", "surrender", "devotion"],
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
