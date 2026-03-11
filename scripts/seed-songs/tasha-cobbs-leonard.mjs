#!/usr/bin/env node
/**
 * Seed Tasha Cobbs Leonard worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/tasha-cobbs-leonard.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Break Every Chain (Tasha Cobbs)",
    artist: "Tasha Cobbs Leonard",
    originalKey: "Bb",
    format: "chordpro",
    content: `[Bb]There is power in the [Eb]name of Jesus
[Gm]There is power in the [F]name of Jesus
[Bb]There is power in the [Eb]name of Jesus
[Gm]To break every [F]chain break every [Bb]chain

[Bb]Break every chain [Eb]break every chain
[Gm]Break every [F]chain
[Bb]Break every chain [Eb]break every chain
[Gm]Break every [F]chain

[Bb]There's an army [Eb]rising up
[Gm]There's an army [F]rising up
[Bb]To break every [Eb]chain break every [Gm]chain [F]break every chain`,
    notes: "Tasha Cobbs signature version. Powerful gospel arrangement, build with choir.",
    bpm: 76,
    tags: ["worship","freedom","deliverance","gospel"],
  },
  {
    title: "You Know My Name",
    artist: "Tasha Cobbs Leonard",
    originalKey: "Db",
    format: "chordpro",
    content: `[Db]I may be [Ab]weak but Your [Bbm]Spirit's strong in [Gb]me
[Db]My flesh may [Ab]fail but my [Bbm]God You never [Gb]will

[Db]You know my [Ab]name
[Bbm]You know my [Gb]name
[Db]You have called me [Ab]called me called me
[Bbm]By my [Gb]name

[Db]You know my [Ab]every thought
[Bbm]You see my [Gb]every tear
[Db]Surely You have [Ab]come near and [Bbm]You know my [Gb]name`,
    notes: "Powerful gospel ballad. Let the vocals soar on the chorus.",
    bpm: 70,
    tags: ["worship","identity","intimacy","gospel"],
  },
  {
    title: "Gracefully Broken",
    artist: "Tasha Cobbs Leonard",
    originalKey: "Ab",
    format: "chordpro",
    content: `[Ab]Take all I [Eb]have
[Fm]Take every[Db]thing
[Ab]I lay it [Eb]down Lord
[Fm]I surrender [Db]all to You

[Ab]I am gracefully [Eb]broken
[Fm]I am gracefully [Db]broken
[Ab]But beautifully [Eb]new
[Fm]Beautifully [Db]new

[Ab]I was broken [Eb]but You mend me
[Fm]I was lost but [Db]now I'm found
[Ab]In surrender [Eb]I discover
[Fm]In Your hands my [Db]wholeness now`,
    notes: "Gospel ballad with powerful build. Great for altar call moments.",
    bpm: 64,
    tags: ["worship","brokenness","surrender","gospel"],
  },
  {
    title: "Fill Me Up",
    artist: "Tasha Cobbs Leonard",
    originalKey: "Eb",
    format: "chordpro",
    content: `[Eb]Fill me up [Bb]God
[Cm]Fill me up [Ab]God
[Eb]Fill me up [Bb]God fill me [Cm]up [Ab]

[Eb]Empty me [Bb]of the selfishness in[Cm]side
[Ab]Every vain ambition and the [Eb]poison of my pride
[Eb]And any foolish [Bb]thing my heart holds [Cm]to
[Ab]Lord empty me of [Bb]me so I can be [Eb]filled with You

[Eb]Pour out Your [Bb]Spirit
[Cm]Pour out Your [Ab]power
[Eb]Lord I need [Bb]Your presence every [Cm]day every [Ab]hour`,
    notes: "Call-and-response gospel worship. Strong congregational engagement.",
    bpm: 68,
    tags: ["worship","Holy Spirit","surrender","gospel"],
  },
  {
    title: "Your Spirit",
    artist: "Tasha Cobbs Leonard",
    originalKey: "F",
    format: "chordpro",
    content: `[F]Lord I believe in [Bb]You I believe that [Dm]You are moving
[C]I believe that You can [F]do it
[F]Lord I believe in [Bb]You I believe that [Dm]fresh wind is blowing
[C]I believe that You can [F]do it

[F]Your Spirit is [Bb]here
[Dm]Your Spirit is [C]here with me
[F]Your Spirit is [Bb]here
[Dm]And I know that [C]You are here with [F]me

[Bb]Open up the [F]heavens
[Dm]We want to see [C]You
[Bb]Open up the [F]flood gates of [Dm]glory [C]glory`,
    notes: "Features Kierra Sheard. Big gospel production with choir harmonies.",
    bpm: 78,
    tags: ["worship","Holy Spirit","presence","gospel"],
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
