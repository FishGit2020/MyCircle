#!/usr/bin/env node
/**
 * Seed William McDowell worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/william-mcdowell.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "I Give Myself Away",
    artist: "William McDowell",
    originalKey: "F",
    format: "chordpro",
    content: `[F]I give myself a[Bb]way
[Dm]I give myself a[C]way
[F]So You can [Bb]use me

[F]I give myself a[Bb]way
[Dm]I give myself a[C]way
[F]So You can [Bb]use [F]me

[Bb]Here I am [F]here I stand
[Dm]Lord my life is [C]in Your hands
[Bb]I am longing to [F]see
[Dm]Your desires re[C]vealed in me

[F]Take my heart take my [Bb]life
[Dm]As a living [C]sacrifice
[F]All my dreams all my [Bb]plans
[Dm]Lord I place them [C]in Your hands`,
    notes: "Gospel surrender anthem. Simple but powerful. Let the moment linger.",
    bpm: 64,
    tags: ["worship","surrender","gospel","devotion"],
  },
  {
    title: "Withholding Nothing",
    artist: "William McDowell",
    originalKey: "Db",
    format: "chordpro",
    content: `[Db]I'm withholding [Ab]nothing
[Bbm]I'm withholding [Gb]nothing
[Db]I give You every[Ab]thing
[Bbm]I give You every[Gb]thing

[Db]Search me try me [Ab]judge me
[Bbm]Come and purify my [Gb]heart
[Db]I want to be [Ab]holy
[Bbm]I want to be [Gb]righteous

[Db]I surrender [Ab]all to You
[Bbm]Every dream and [Gb]every plan
[Db]I surrender [Ab]all to You
[Bbm]I place it in Your [Gb]hands`,
    notes: "Deep worship moment. Let the altar call flow naturally from this song.",
    bpm: 60,
    tags: ["worship","surrender","holiness","gospel"],
  },
  {
    title: "Spirit Break Out",
    artist: "William McDowell",
    originalKey: "Eb",
    format: "chordpro",
    content: `[Eb]Our Father [Bb]all of heaven roars Your [Cm]name
[Ab]Sing louder let this place [Eb]erupt with praise
[Eb]Can You hear it [Bb]all of heaven roars Your [Cm]name
[Ab]Sing louder let this place [Eb]erupt with praise

[Eb]Spirit break [Bb]out break our [Cm]walls down
[Ab]Spirit break [Eb]out heaven [Bb]come down

[Eb]King Jesus [Bb]You're the name I'm calling
[Cm]King Jesus [Ab]You are all I want
[Eb]King Jesus [Bb]You are why I'm living
[Cm]King Jesus [Ab]You are all I need`,
    notes: "Explosive worship moment. Build from prayer into full declaration.",
    bpm: 130,
    tags: ["worship","Holy Spirit","breakthrough","gospel"],
  },
  {
    title: "You Are God Alone",
    artist: "William McDowell",
    originalKey: "Ab",
    format: "chordpro",
    content: `[Ab]You are not a [Eb]God created
[Fm]By human [Db]hands
[Ab]You are not a [Eb]God dependent
[Fm]On any [Db]mortal man
[Ab]You are not a [Eb]God in need of
[Fm]Anything we can [Db]give
[Ab]By Your plan [Eb]that's just the way it [Fm]is [Db]

[Ab]You are God a[Eb]lone from before time [Fm]began [Db]
[Ab]You were on Your [Eb]throne You are God a[Fm]lone [Db]
[Ab]And right now in the [Eb]good times and bad
[Fm]You are on Your [Db]throne and You are God a[Ab]lone`,
    notes: "Sovereignty declaration. Strong and confident. Great for opening worship.",
    bpm: 80,
    tags: ["worship","sovereignty","declaration","gospel"],
  },
  {
    title: "Send Me",
    artist: "William McDowell",
    originalKey: "F",
    format: "chordpro",
    content: `[F]Here I am Lord [Bb]send me
[Dm]Here I am Lord [C]use me
[F]Here I am Lord [Bb]break me
[Dm]And reshape me for [C]Your glory

[F]Send me to the [Bb]nations
[Dm]Send me to the [C]lost
[F]Send me with Your [Bb]message
[Dm]Regardless of the [C]cost

[Bb]Here I am [F]here I am
[Dm]Willing and o[C]bedient
[Bb]I will go where [F]You lead
[Dm]I will speak what [C]You say`,
    notes: "Missions commissioning song. Reverent and committed. Great for sending services.",
    bpm: 72,
    tags: ["worship","missions","surrender","calling"],
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
