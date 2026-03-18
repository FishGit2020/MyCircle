#!/usr/bin/env node
/**
 * Seed: Bless God by Brandon Lake/Brooke Ligertwood/Cody Carnes
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-bless-god.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Bless God",
    artist: "Brandon Lake/Brooke Ligertwood/Cody Carnes",
    originalKey: "D",
    format: "chordpro",
    content: `{Intro}
|[D] / [Dsus/E] / | [Gmaj7] / / / |
|[Bm7] / [A(add4)] / | [G2] / [D] / / |

{Verse 1}
[D]Blessed are those who run to Him
[Dsus/E]Who place their hope and confidence
[G]In [D]Jesus
[Bm7]He won't for[Asus]sake them

{Verse 2}
[D]Blessed are those who seek His face
[Dsus/E]Who bend their knee and fix their gaze
[G]On [D]Jesus
[Bm7]They won't be [Asus]shaken

{Half-Chorus}
[D]Come on and [Dsus/E]praise the [Gmaj7]Lord with me
[Bm7]Sing if you [G]love His [A(add4)]name
[D]Come on and [Dsus/E]lift your [Gmaj7]voice with me
[Bm7]He's worthy of [A(add4)]all our [D]praise

{Turnaround}
|[Dsus] / [D] / | [Dsus] / [D] / |

{Verse 3}
[D]Blessed are those who walk with Him
[Dsus/E]Whose hearts are set on pilgrimage
[G]With [D]Jesus
[Bm7]They'll see His [A(add4)]glory

{Verse 4}
[D]Blessed are those who die to live
[Dsus/E]Whose joy it is to give it all for
[Bm7]Jesus, [A(add4)]and for [G]Him [D]only
[Bm7]Oh Je[A(add4)]sus
All for Your glory

{Chorus}
[D]Come on and [Dsus/E]praise the [Gmaj7]Lord with me
[Bm7]Sing if you [G]love His [A(add4)]name
[D]Come on and [Dsus/E]lift your [Gmaj7]voice with me
[Bm7]He's worthy of [A(add4)]all our [D]praise
[D]Come on and [Dsus/E]bring your [Gmaj7]offering
[Bm7]Sing if you've [G]known His [A(add4)]grace
[D]Come on and [Dsus/E]lift up your [Gmaj7]holy hands
[Bm7]He's worthy of [A(add4)]all our [D]praise

{Bridge}
[D/F#]Bless God in the sanctuary
[Em7]Bless God in the fields of plenty
[G2]Bless God in the darkest valley
[Bm7]Every chance I [A]get, I bless Your name

Bless God when my hands are empty
Bless God with a praise that costs me
Bless God when nobody's watching
Every chance I get I'll bless Your name

Bless God when the weapon's forming
Bless God when the walls are falling
Bless God 'cause He goes before me
Every chance I [Bm7]get, I [A]bless Your name

Bless God for He holds the victory
Bless God for He's always with me
Bless God for He's always worthy
Every chance I [Bm7]get, I [A]bless Your name

{Tag}
|[D/F#] / [G2] / |
[Bm7]Every chance I [A]get, I bless Your name
|[D/F#] / [G2] / | [Bm7] / [A] / |

{Ending}
|[D] / [Em7] [D/F#] |
[Bm7]He's worthy of [A(add4)]all our praise
|[D/F#] / [Em7] [D] |
[Bm7]He's worthy of [A(add4)]all our praise
|[G] [D/F#] [Em7] / | [D]`,
    notes: "Key of D, 72.5 BPM. Extended praise anthem. Bridge builds with each 'Bless God' section.",
    bpm: 72,
    tags: ["worship", "praise", "blessing"],
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
