#!/usr/bin/env node
/**
 * Seed: Ever Be by Chris Greely/Kalley Heiligenthal/Bobby Strand/Gabriel Wilson
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-ever-be.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Ever Be",
    artist: "Chris Greely/Kalley Heiligenthal/Bobby Strand/Gabriel Wilson",
    originalKey: "C",
    format: "chordpro",
    content: `{Intro}
[C] | [Am9] | [Em] | [Fmaj7] | [C] | [Am9] | [Em] | [Fmaj7] |

[C]Your love is de[Dm]voted like a ring of [F]solid gold
[Em]Like a vow that is [G]tested like a [C]covenant of old
[Dm]Your love is en[F]during through the winter rain
[Em]And beyond the [G]horizon with [F]mercy for today

[C]Faithful You have [G]been and faithful You will be
[Dm7]You pledge Yourself to me and [C]it's why I sing

[F(Fmaj7)]Your praise will ever be on my [C]lips, ever be on my lips
[Am]Your praise will ever be on my [G]lips, ever be on my lips
[2nd, 3rd time repeat chorus]

[C]You Father the [Dm]orphan, Your kindness [F]makes us whole
[Em]You shoulder our [G]weakness, and Your [C]strength becomes our own
[Dm]You're making me [F(maj7)]like You, clothing me in white
[Em]Bringing beauty from [G]ashes, for You will have [F]Your bride

[C]Free of all her [G]guilt and rid of all her shame
[Dm7]And known by her true name and it's [C]why I sing

[C]You will be [G(Dm)]praised, You will be praised
[Am]With angels and [F]saints we sing [C]worthy are You Lord [x4]

[F] | [C] | [Am7] | [G] | [F] | [C] | [Am7] | [G] |`,
    notes: "Key of C. Lyrical devotion song. Build through bridges.",
    bpm: 72,
    tags: ["worship", "devotion", "love"],
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
