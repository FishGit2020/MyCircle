#!/usr/bin/env node
/**
 * Seed: Tremble by Hank Bentley/Mia Fieldes/Andres Figueroa/Mariah McManus
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-tremble.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Tremble",
    artist: "Hank Bentley/Mia Fieldes/Andres Figueroa/Mariah McManus",
    originalKey: "C",
    format: "chordpro",
    content: `{Intro}
[Am] | [Fmaj7] | [C] | [G(add4)] |

[Am]Peace, bring it all to [Fmaj7]peace
[C]The storms surrounding [G(add4)]me, let it break at Your name
[Am]Still, call the [Fmaj7]sea to still
[C]The rage in me to [G(add4)]still, every wave at Your name

[F]Jesus, [Am]Jesus, [G(add4)]You make the darkness tremble
[F]Jesus, [Am]Jesus, [G(add4)]You silence fear
[F]Jesus, [Am]Jesus, [G(add4)]You make the darkness tremble
[F]Jesus, [Am] [G(add4)]Jesus

[Am]Breathe, call these [Fmaj7]bones to live
[C]Call these lungs to [Em]sing, once again, I will praise

[F]Your name is a [C]light that the shadows can't deny
[F]Your [G]name cannot be [Am]overcome
[F]Your name is [C]alive, forever lifted [G]high
[F]Your [G]name cannot be [Am]overcome
[1st time x1, 2nd time x2]

[F]Jesus, [C]Jesus, [G]You make the darkness tremble
[F]Jesus, [C]Jesus, [G]You silence fear
[F]Jesus, [C]Jesus, [G]You make the darkness tremble
[F]Jesus, [Am] [G(add4)]Jesus

[Fmaj7] | [Am] / [G] / | [Fmaj7] | [Am] / [G] / |

[F]Jesus, [Am] [G(add4)]Jesus
[F]Jesus, [Am] [G(add4)]Jesus`,
    notes: "Key of C. Authority over fear/darkness. Name section builds powerfully.",
    bpm: 72,
    tags: ["worship", "peace", "authority"],
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
