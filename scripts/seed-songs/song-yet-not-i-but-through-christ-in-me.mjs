#!/usr/bin/env node
/**
 * Seed: Yet Not I But Through Christ In Me by Jonny Robinson/Rich Thompson/Michael Farren
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-yet-not-i-but-through-christ-in-me.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Yet Not I But Through Christ In Me",
    artist: "Jonny Robinson/Rich Thompson/Michael Farren",
    originalKey: "D",
    format: "chordpro",
    content: `{Intro/Turnaround}
| [D] | [G6/B] | [D/A] | [G6/B] |

{Verse}
[A]The Lord bless you and keep you
[D2]and be [A]gracious to you
[F#m]Make His face shine upon you
[F#m]and be [D2]gracious to you
[A]The Lord turn His face toward you
[A]and give you [D]peace (2x)

{Chorus}
[Am]A[F]men [C]Amen [G]Amen

{Bridge 1}
[F#m]May His favor be upon you
[D2]And a thousand generations
[A]And your family and your children
[E]And their children and their children
[1st time, x4][2nd and 3rd time, x1]

{Verse 2}
[D]What gift of grace is Jesus, my Re[G]deemer
[D]There is no more for [Bm]heaven [A]now to give
[D]He is my joy, my righteous[G]ness, and freedom
[D]My steadfast [Asus]love, my [D]deep and boundless peace
[D/F#]To this I hold: my [G]hope is only [D]Jesus
[D]For my life is wholly [Em7]bound to His
[D]Oh how strange and [D/F#]divine, I can sing: [G]all is mine!
[D/A]Yet not I, but through [Asus]Christ in [D]me

{Verse 3}
[D]No fate I dread, I know I am for[G]given
[D]The future sure, the [Bm]price it [A]has been paid
[D]For Jesus bled and suffered [G]for my pardon
[D/F#]And He was [D]raised to over[G]throw the [D]grave
[D]To this I hold: my sin has been de[Em7]feated
[D]Jesus now and [D/F#]ever is my [G]plea
[D]Oh the chains are re[D/F#]leased, I can [G]sing: I am free!
[D/A]Yet not I, but through [Asus]Christ in [D]me

{Bridge 2}
[F#m]I am [E]chosen, not for[A]saken
[A]I am who You [D]say I am
[F#m]You are for [E]me, not a[A]gainst me
[A]I am who You [D]say I am

{Verse 4}
[D]With every breath I long to follow [G]Jesus
[D]For He has [Bm]said that [A]He will bring me home
[D]And day by day I know He will [G]renew me
[D]Until I stand [Asus]with [D]joy be[G]fore the throne
[D]When the race is com[D/F#]plete,
[D/F#]Still my lips shall re[G]peat:
[D/A]Yet not I, but through [Asus]Christ in [D]me

{Ending}
[A] [D] [Em7] |
[D/A]Yet not I, but through [Asus]Christ in [D]me`,
    notes: "Key of D, Tempo 75. Identity anthem. Poetic narrative through verses.",
    bpm: 75,
    tags: ["worship", "identity", "christ"],
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
