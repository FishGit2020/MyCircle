#!/usr/bin/env node
/**
 * Seed Israel Houghton worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/israel-houghton.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "To Worship You I Live",
    artist: "Israel Houghton",
    originalKey: "G",
    format: "chordpro",
    content: `[G]To worship You I [Em]live
[C]To worship You I [D]live
[G]I live to wor[Em]ship You
[C]I live to wor[D]ship You

[G]To worship You I [Em]live
[C]I live to wor[D]ship You

[C]My life is [D]for Your glory
[Em]My life is [D]for Your praise
[C]Every breath [D]I'm breathing
[Em]Is an offering of [C]praise [D]

[G]Your presence is all I [Em]need
[C]Your presence is all I [D]need`,
    notes: "Simple devotional chorus that can repeat and build spontaneously.",
    bpm: 76,
    tags: ["worship","devotion","praise","spontaneous"],
  },
  {
    title: "Alpha and Omega",
    artist: "Israel Houghton",
    originalKey: "C",
    format: "chordpro",
    content: `[C]You are Alpha and O[Am]mega
[F]We worship You our [G]Lord
[C]You are worthy to be [Am]praised

[C]We give You all the [Am]glory
[F]We worship You our [G]Lord
[C]You are worthy to be [Am]praised

[F]You are Alpha and O[C]mega
[Dm]The beginning and the [G]end
[F]You are Alpha and O[C]mega
[Dm]We bow and wor[G]ship You

[C]Forever You will [Am]reign
[F]Seated on the [G]throne
[C]Holy is Your [Am]name`,
    notes: "Gospel-infused praise anthem. Let the choir carry the harmonies.",
    bpm: 118,
    tags: ["worship","praise","eternity","gospel"],
  },
  {
    title: "Your Presence Is Heaven",
    artist: "Israel Houghton",
    originalKey: "Eb",
    format: "chordpro",
    content: `[Eb]Who is like the [Bb]Lord strong and [Cm]mighty
[Ab]Who is like the Lord our [Bb]God
[Eb]Hallelujah [Bb]praise and [Cm]honor
[Ab]Your Presence is [Bb]heaven to me

[Eb]Your Presence is [Bb]heaven to me
[Cm]Your Presence is [Ab]heaven to me
[Eb]Wherever You are is where I [Bb]want to be
[Cm]Your Presence is [Ab]heaven to [Eb]me

[Ab]Here in Your [Eb]courts
[Bb]Here in Your [Cm]presence
[Ab]There's nowhere else I'd rather [Bb]be`,
    notes: "Beautiful worship ballad that builds. Latin-influenced rhythm section.",
    bpm: 74,
    tags: ["worship","presence","heaven","intimacy"],
  },
  {
    title: "Moving Forward",
    artist: "Israel Houghton",
    originalKey: "A",
    format: "chordpro",
    content: `[A]What a moment [E]You have brought me to
[F#m]Such a freedom [D]I have found in You
[A]You're the healer who [E]makes all things new

[D]I'm moving [A]forward
[E]I'm moving [F#m]forward
[D]You have made a [A]way for me
[E]And I'm moving [A]forward

[A]You've turned my mourning [E]into joyful dancing
[F#m]You've turned my sorrow [D]into shouts of joy
[A]I cannot be [E]silent I must lift my [F#m]voice and [D]sing`,
    notes: "Celebratory and energetic. Full band with horns if available.",
    bpm: 124,
    tags: ["worship","freedom","joy","breakthrough"],
  },
  {
    title: "Jesus at the Center",
    artist: "Israel Houghton",
    originalKey: "D",
    format: "chordpro",
    content: `[D]Jesus at the [A]center of it all
[Bm]Jesus at the [G]center of it all
[D]From beginning to the [A]end
[Bm]It will always be it's [G]always been You Jesus

[D]Nothing else [A]matters
[Bm]Nothing in this world will [G]do
[D]Jesus You're the [A]center
[Bm]Everything re[G]volves around You
[D]Jesus [A]You

[G]At the center of it [D]all
[A]At the center of it [Bm]all
[G]Jesus be at the center of it [D]all`,
    notes: "Declarative and focused. Can be used as a prayer of refocus.",
    bpm: 80,
    tags: ["worship","Jesus","devotion","declaration"],
  },
  {
    title: "Pour It Out",
    artist: "Israel Houghton",
    originalKey: "Bb",
    format: "chordpro",
    content: `[Bb]This is my [Eb]worship
[Gm]This is my [F]offering
[Bb]Like fragrant [Eb]oil upon Your feet
[Gm]I pour it [F]out

[Bb]I pour it [Eb]out I pour it [Gm]out [F]
[Bb]There's nothing [Eb]here I need to [Gm]keep [F]

[Eb]All of my [Bb]worship
[F]All of my [Gm]praise
[Eb]I pour it [Bb]out before Your [F]throne
[Eb]Take all the [Bb]glory take all the [F]honor
[Gm]Lord it's for [Eb]You and You a[Bb]lone`,
    notes: "Intimate offering of worship. Latin rhythms underneath. Beautiful devotional.",
    bpm: 80,
    tags: ["worship","offering","devotion","intimacy"],
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
