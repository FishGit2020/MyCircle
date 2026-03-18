#!/usr/bin/env node
/**
 * Seed: I Surrender All by J.W. VanDeVenter (SDA Hymnal #309)
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-i-surrender-all.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "I Surrender All",
    artist: "J.W. VanDeVenter (SDA Hymnal #309)",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]All to [C]Je[G]sus I sur[D7]render,
[G]All to [C]Him I [G]free[D7]ly [G]give;
[G]I will [C]ev[G]er love and [D7]trust [Bm]Him,
[G]In His [C]pres[G]ence [D7]daily [G]live.

{Refrain}
[G]I sur[C]ren[G]der [D7]all,
I surrender all,
[G]I [D7]sur[G]render all;
I surrender all,
[G]All to [C]Thee, my [G]blessed [D7]Sav[C]-ior,
[G]I sur[D7]ren[G]der all.

{Verse 2}
[G]All to [C]Je[G]sus I sur[D7]render,
[G]Humbly [C]at [G]His [D7]feet I [G]bow,
[G]Worldly [C]pleas[G]ures all for[D7]saken; [Bm]
[G]Take me, [C]Je[G]sus, [D7]take me [G]now;

{Verse 3}
[G]All to [C]Je[G]sus I sur[D7]render,
[G]Make me, [C]Sav[G]ior, [D7]wholly [G]Thine;
[G]Let me [C]feel [G]the [D7]Holy [Bm]Spirit,
[G]Truly [C]know [G]that [D7]Thou art [G]mine;

{Verse 4}
[G]All to [C]Je[G]sus I sur[D7]render;
[G]Now I [C]feel [G]the [D7]sacred [G]flame.
[G]O the [C]joy [G]of [D7]full sal[Bm]vation!
[G]Glory, [C]Glo[G]ry [D7]to His [G]name!`,
    notes: "Classic hymn. Key of G. SDA Hymnal #309. Solemn surrender. Each verse builds commitment.",
    bpm: 84,
    tags: ["hymn", "surrender", "classic"],
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
