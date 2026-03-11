#!/usr/bin/env node
/**
 * Seed Charity Gayle worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/charity-gayle.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "I Speak Jesus",
    artist: "Charity Gayle",
    originalKey: "Bb",
    format: "chordpro",
    content: `[Bb]I just want to [Eb]speak the name of [Bb]Jesus
[Gm]Over every [F]heart and every mind
[Bb]Cause I know there is [Eb]peace within Your [Bb]presence
[Gm]I speak [F]Jesus

[Bb]I speak [Eb]Jesus over [Gm]fear and all a[F]nxiety
[Bb]Over every [Eb]dark and trembling [Gm]thought [F]
[Bb]I speak [Eb]Jesus over [Gm]every strong[F]hold
[Bb]Over every [Eb]mountain I speak [Gm]Jesus [F]

[Eb]Your name is [F]power
[Gm]Your name is [Bb]healing
[Eb]Your name is [F]life`,
    notes: "Powerful declaration anthem. Let it build through repeated choruses.",
    bpm: 72,
    tags: ["worship","name of Jesus","declaration","healing"],
  },
  {
    title: "Firm Foundation (Charity Gayle)",
    artist: "Charity Gayle",
    originalKey: "G",
    format: "chordpro",
    content: `[G]I've got a firm foun[C]dation
[G]My feet are on the [D]rock
[Em]Even when the storm is [C]raging
[G]I'm never shaking [D]not

[G]He is faithful [C]faithful
[Em]He is faithful [D]through it all
[G]He is faithful [C]faithful
[Em]He is faithful [D]through it all

[C]Rain came wind [G]blew
[D]But my house was built on [Em]You
[C]I'm safe with [G]You I'm gonna make it [D]through
[C]Firm foun[D]dation I'm standing [G]strong`,
    notes: "Charity Gayle arrangement. Gospel-infused energy. Choir harmonies.",
    bpm: 126,
    tags: ["worship","foundation","faith","gospel"],
  },
  {
    title: "Endless Alleluia",
    artist: "Charity Gayle",
    originalKey: "D",
    format: "chordpro",
    content: `[D]There's an endless [A]alleluia
[Bm]Rising from my [G]soul
[D]There's an endless [A]alleluia
[Bm]You have made me [G]whole

[D]From the morning to the [A]evening
[Bm]My praise will never [G]cease
[D]For the joy that You have [A]given me
[Bm]Brings an endless [G]peace

[D]Alleluia [A]alleluia
[Bm]Alleluia [G]alleluia
[D]Forever I will [A]sing
[Bm]Of Your good[G]ness and Your [D]grace`,
    notes: "Joyful and flowing. Build with layered vocals and instrumentation.",
    bpm: 80,
    tags: ["worship","praise","joy","alleluia"],
  },
  {
    title: "Thank You Jesus for the Blood (Charity Gayle)",
    artist: "Charity Gayle",
    originalKey: "F",
    format: "chordpro",
    content: `[F]I was a wretch [Bb]I remember who I was
[Dm]I was lost I was [C]blind I was running out of time
[F]Sin separated [Bb]the breach was far too wide
[Dm]But from the far side of [C]the chasm You held me in Your sight

[F]Thank You Jesus for the [Bb]blood applied
[Dm]Thank You Jesus it has [C]washed me clean
[F]Thank You Jesus for the [Bb]blood applied
[Dm]Thank You Jesus You have [C]saved my life

[Bb]What a sacrifice that [F]saved my life
[Dm]Took my place and [C]bled and died`,
    notes: "Charity Gayle original arrangement. Powerful testimony song.",
    bpm: 76,
    tags: ["worship","blood of Jesus","testimony","gospel"],
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
