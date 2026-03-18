#!/usr/bin/env node
/**
 * Seed: Alabare Al Senor by Hillsong en Espanol
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-alabare-al-senor.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Alabare Al Senor",
    artist: "Hillsong en Espanol",
    originalKey: "C",
    format: "chordpro",
    content: `{Intro}
[C] [F] x2

{Verse 1}
[C]Recordare aquella cruz
[G]donde sangro y [Am]murio Jesus
[F]Heridas que por [C]mi sufrio
[G]Crucificado [C]Sal[F]vador.

{Verse 2}
[C]Su cuerpo envuelto en dolor
[G]En el se[Am]pulcro reposo
[F]En soledad [C]El se quedo
[G]Jesus, Mesias, el [C]Se[F]nor

{Chorus}
[C]Alabare al [F]Senor, mi [C]Dios
[Am]Tu nombre yo [G]proclamare
[C]Eternamente te [F]can[Am]tare
[F]Senor, [G]Senor, mi [C]Dios.

{Verse 3}
[C]Pero al tercer amanecer
[G]un gran [Am]estruendo se escucho
[F]Donde esta, [C]muerte, tu aguijon?
[G]Cristo Jesus [C]resucito.

{Verse 4}
[C]Muy pronto El regresara
[G]Su rostro res[Am]plandeckera
[F]En su pre[C]sencia estare
[G]y cara a [C]cara le vere.

{Instrumental}
[C] [F] [C] [Am] [G]
[C] [F] [Am] [F] [G] [C]

{Ending}
[C]Alabare al [F]Senor, mi [C]Dios
[Am]Tu nombre yo [G]proclamare
[C]Eternamente [F]te can[Am]tare
[F]Senor, [G]Senor, mi [C]Dios.
[F]Senor, [G]Senor, mi [C]Dios.`,
    notes: "Spanish worship song. Key of C. Joyful and celebratory. Great for bilingual services.",
    bpm: 120,
    tags: ["worship", "spanish", "praise"],
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
