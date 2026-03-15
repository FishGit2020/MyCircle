#!/usr/bin/env node
/**
 * Seed Paul Baloche worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/paul-baloche.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Open the Eyes of My Heart [INCOMPLETE - needs Bridge]",
    artist: "Paul Baloche",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]Open the eyes of my heart Lord
[B]Open the eyes of my heart
[A]I want to [B]see You
[A]I want to [B]see You

{Chorus}
[E]Open the eyes of my heart Lord
[B]Open the eyes of my heart
[A]I want to [B]see You
[A]I want to [B]see You

{Verse 2}
[A]To see You [B]high and lifted [C#m]up
[A]Shining in the [B]light of Your [C#m]glory
[A]Pour out Your power and [B]love
[C#m]As we sing [A]holy holy [E]holy`,
    notes: "Classic worship anthem. Simple and powerful for large congregations.",
    bpm: 104,
    tags: ["worship","prayer","vision","classic"],
  },
  {
    title: "Hosanna (Praise Is Rising) [INCOMPLETE - needs Bridge]",
    artist: "Paul Baloche",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Praise is [Em]rising eyes are [C]turning to [D]You
[G]We turn to [Em]You
[G]Hope is [Em]stirring hearts are [C]yearning for [D]You
[G]We long for [Em]You

{Chorus}
[C]Cause when we see [D]You we find [Em]strength to face the [D]day
[C]In Your pres[D]ence all our fears are washed a[Em]way [D]washed away

{Verse 2}
[G]Hosanna ho[C]sanna
[G]You are the God who [D]saves us
[Em]Worthy of all our [C]praises
[G]Hosanna ho[D]sanna`,
    notes: "Building worship anthem. Great for transitioning from praise to worship.",
    bpm: 86,
    tags: ["worship","praise","hosanna","classic"],
  },
  {
    title: "Your Name [INCOMPLETE - needs Bridge]",
    artist: "Paul Baloche",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]As morning [D]dawns and evening [Em]fades
[C]You inspire [G]songs of [D]praise
[G]That rise from [D]earth to touch Your [Em]heart
[C]And glorify Your [D]name

{Chorus}
[G]Your name [D]is a strong and mighty [Em]tower
[C]Your name [G]is a [D]shelter like no [Em]other
[C]Your name [G]let the [D]nations sing it [Em]louder
[C]Cause nothing has the [D]power to [G]save but Your name

{Verse 2}
[G]Jesus in Your [D]name we pray
[Em]Come and fill our [C]hearts today`,
    notes: "Features Paul and Lenny LeBlanc. Strong melody for congregational singing.",
    bpm: 78,
    tags: ["worship","name of Jesus","praise","classic"],
  },
  {
    title: "What a Good God [INCOMPLETE - needs Bridge]",
    artist: "Paul Baloche",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]Look what You've done for [G]me
[Am]Gave me a life of [F]freedom
[C]Who could imagine [G]all the things
[Am]That You would do through [F]me

{Chorus}
[C]What a good God [G]what a good God
[Am]What a good God [F]You are
[C]What a good God [G]what a good God
[Am]What a good God [F]You are

{Verse 2}
[Am]Your goodness [G]follows me
[F]Your mercy [C]covers me
[Am]Your love is [G]everything I [F]need`,
    notes: "Grateful worship song. Simple and joyful arrangement.",
    bpm: 84,
    tags: ["worship","goodness","gratitude","praise"],
  },
  {
    title: "Offering [INCOMPLETE - needs Bridge]",
    artist: "Paul Baloche",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]The sun cannot [D]compare to the [Em]glory of Your [C]love
[G]There is no [D]shadow in Your [Em]presence [C]
[G]No mortal man would [D]dare to stand [Em]before Your [C]throne
[G]Before the Holy [D]One of [Em]heaven [C]

{Chorus}
[G]It's only by Your [D]blood
[Em]And it's only through Your [C]mercy
[G]Lord I come [D]I come

{Verse 2}
[C]I bring an [G]offering of [D]worship to my [Em]King
[C]No one on [G]earth de[D]serves the praises that I [Em]sing
[C]Jesus may [G]You re[D]ceive the honor that You're [Em]due
[C]O Lord I [D]bring an offering to [G]You`,
    notes: "Classic offertory worship. Gentle and reverent. Piano and acoustic.",
    bpm: 72,
    tags: ["worship","offering","reverence","devotion"],
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
