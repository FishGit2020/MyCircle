#!/usr/bin/env node
/**
 * Seed Gateway Worship worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/gateway-worship.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Great I Am",
    artist: "Gateway Worship",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]I want to be [Eb]close close to Your side
[Gm]So heaven is [F]real and death is a lie
[Bb]I want to hear [Eb]voices of angels
[Gm]Above my crying [F]out

{Chorus}
[Bb]Oh great I [Eb]Am oh great I [Gm]Am [F]
[Bb]I bow before the [Eb]holy one and I [Gm]sing oh [F]great I Am

{Verse 2}
[Bb]I want to be [Eb]near near to Your heart
[Gm]Loving the [F]world and hating the dark
[Bb]I want to see [Eb]dry bones living again
[Gm]Singing as the [F]old come to life`,
    notes: "Reverent and powerful. Kari Jobe featured vocalist. Build dynamically.",
    bpm: 72,
    tags: ["worship","reverence","awe","declaration"],
  },
  {
    title: "Spirit of the Living God",
    artist: "Gateway Worship",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Spirit of the living [C]God come fall a[G]fresh on me
[Em]Spirit of the living [C]God come fall a[D]fresh on me
[G]Melt me mold me [C]fill me [G]use me
[Em]Spirit of the [C]living [D]God come fall afresh on [G]me

{Chorus}
[C]Come like a [G]rushing wind
[D]Breathe new [Em]life again
[C]Come like a [G]burning flame
[D]Purify my [G]heart

{Verse 2}
[G]Holy Spirit [C]You are welcome here
[Em]Come flood this [D]place and fill the atmos[G]phere`,
    notes: "Classic hymn reimagined. Gentle and invitational for the Holy Spirit.",
    bpm: 68,
    tags: ["worship","Holy Spirit","prayer","hymn"],
  },
  {
    title: "Forever Yours",
    artist: "Gateway Worship",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]I am forever [D]Yours
[F#m]I am forever [E]Yours
[A]You don't have to [D]worry
[F#m]My love will not run [E]out

{Chorus}
[A]Nothing in this [D]world could ever change my mind
[F#m]I have found what's [E]real since I found You
[A]God You were [D]faithful through the [F#m]good times and the bad
[E]I am forever [A]Yours

{Verse 2}
[D]I'm running to Your [A]arms
[E]I'm falling at Your [F#m]feet
[D]I'm living for Your [A]love
[E]I am forever Yours`,
    notes: "Joyful covenant declaration. Mid-tempo with full band energy.",
    bpm: 84,
    tags: ["worship","devotion","commitment","love"],
  },
  {
    title: "Revelation",
    artist: "Gateway Worship",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]The veil is [B]getting thinner
[C#m]The light is [A]growing strong
[E]Every eye will [B]see You
[C#m]And every [A]tongue confess

{Chorus}
[E]Revelation [B]of the Son of God
[C#m]Revelation [A]of the Holy One
[E]All creation [B]bows at Your throne
[C#m]Heaven and [A]earth proclaim

{Verse 2}
[A]Holy holy [E]holy
[B]Is the Lord God [C#m]Almighty
[A]Who was and is and [E]is to [B]come`,
    notes: "Revelatory worship. Build from mystery to full declaration.",
    bpm: 76,
    tags: ["worship","revelation","holiness","declaration"],
  },
  {
    title: "No One Like Our God",
    artist: "Gateway Worship",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]There is no one [C]like our God
[Em]Strong and mighty [D]faithful and true
[G]There is no one [C]like our God
[Em]Who loved us [D]first who carries us through

{Chorus}
[G]Nothing compares to [C]You Lord
[Em]No one comes [D]close
[G]You are above all [C]things
[Em]Worthy of our [D]praise

{Verse 2}
[C]No one like [G]You Lord
[D]No one like [Em]You
[C]You are for[G]ever
[D]Faithful and [G]true`,
    notes: "Simple congregational anthem. Strong declaration of God's uniqueness.",
    bpm: 80,
    tags: ["worship","praise","declaration","faithfulness"],
  },
];

const skipExisting = process.argv.includes('--skip-existing');

async function main() {
  const col = db.collection('worshipSongs');
  let existingKeys = new Set();
  if (skipExisting) {
    const snapshot = await col.get();
    for (const doc of snapshot.docs) {
      const d = doc.data();
      existingKeys.add(`${d.title}|||${d.artist}`);
    }
    console.log(`Found ${existingKeys.size} existing songs in Firestore.`);
  }
  let batch = db.batch();
  let count = 0;
  let batchCount = 0;
  for (const song of SONGS) {
    const key = `${song.title}|||${song.artist}`;
    if (skipExisting && existingKeys.has(key)) {
      console.log(`  SKIP: ${song.title} - ${song.artist}`);
      continue;
    }
    const ref = col.doc();
    batch.set(ref, {
      ...song,
      createdBy: 'seed-script',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    count++;
    batchCount++;
    console.log(`  ADD:  ${song.title} - ${song.artist}`);
    if (batchCount >= 450) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }
  if (batchCount > 0) await batch.commit();
  console.log(`\nSeeded ${count} songs (total in script: ${SONGS.length}).`);
}

main().catch((err) => { console.error('Seed failed:', err); process.exit(1); });
