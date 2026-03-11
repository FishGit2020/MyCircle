#!/usr/bin/env node
/**
 * Seed Todd Dulaney worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/todd-dulaney.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Worship You Forever",
    artist: "Todd Dulaney",
    originalKey: "Bb",
    format: "chordpro",
    content: `[Bb]I'm going to worship You for[Eb]ever
[Gm]I'm going to praise You for[F]ever
[Bb]I'm going to worship You for[Eb]ever
[Gm]You are worthy of it [F]all

[Bb]Even when I [Eb]can't see
[Gm]Even when it [F]hurts
[Bb]I'm going to [Eb]trust You
[Gm]You're faithful to Your [F]word

[Eb]Forever [Bb]forever
[F]Forever [Gm]Lord
[Eb]I will worship [F]You for[Bb]ever`,
    notes: "Gospel worship anthem. Let the repetition build with the congregation.",
    bpm: 82,
    tags: ["worship","praise","commitment","gospel"],
  },
  {
    title: "King of Glory",
    artist: "Todd Dulaney",
    originalKey: "Ab",
    format: "chordpro",
    content: `[Ab]Lift up your heads [Eb]o ye gates
[Fm]And be ye lifted [Db]up ye everlasting doors
[Ab]And the King of [Eb]glory shall come [Fm]in [Db]

[Ab]Who is the King of [Eb]glory
[Fm]The Lord strong and [Db]mighty
[Ab]Who is the King of [Eb]glory
[Fm]The Lord mighty in [Db]battle

[Ab]He is the King of [Eb]glory [Fm]He is the King of [Db]glory
[Ab]The Lord of [Eb]hosts He is the [Fm]King of [Db]glory`,
    notes: "Psalm 24 based. Majestic and powerful. Build to a grand declaration.",
    bpm: 88,
    tags: ["worship","psalm","glory","declaration"],
  },
  {
    title: "Victory Belongs to Jesus",
    artist: "Todd Dulaney",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Oh victory [D]victory
[Em]Victory be[C]longs to Jesus
[G]Victory [D]victory
[Em]Victory be[C]longs to Him

[G]By the blood of the [D]Lamb
[Em]We over[C]come
[G]By the word of our [D]testimony
[Em]We over[C]come

[C]Every battle [G]every war
[D]I will trust the [Em]Lord
[C]Every chain [G]every stronghold
[D]Victory belongs to [G]Jesus`,
    notes: "High energy gospel praise. Clap and stomp feel. Great for celebration.",
    bpm: 132,
    tags: ["worship","victory","declaration","gospel"],
  },
  {
    title: "Your Great Name",
    artist: "Todd Dulaney",
    originalKey: "Eb",
    format: "chordpro",
    content: `[Eb]Lost are saved find their [Bb]way
[Cm]At the sound of Your [Ab]great name
[Eb]All condemned feel no [Bb]shame
[Cm]At the sound of Your [Ab]great name

[Eb]Every fear has no [Bb]place
[Cm]At the sound of Your [Ab]great name
[Eb]The enemy is de[Bb]feated
[Cm]At the sound of Your [Ab]great name

[Eb]Jesus [Bb]worthy is the [Cm]Lamb that was [Ab]slain for us
[Eb]Son of God and [Bb]man You are [Cm]high and lifted [Ab]up
[Eb]And all the world will [Bb]praise Your great [Cm]name [Ab]`,
    notes: "Name-of-Jesus anthem. Powerful for corporate declaration.",
    bpm: 78,
    tags: ["worship","name of Jesus","declaration","power"],
  },
  {
    title: "Proverbs 3 (Trust in the Lord)",
    artist: "Todd Dulaney",
    originalKey: "C",
    format: "chordpro",
    content: `[C]Trust in the Lord with [Am]all your heart
[F]And lean not on [G]your own understanding
[C]In all your ways ac[Am]knowledge Him
[F]And He shall direct [G]your path

[C]So I trust in [Am]You Lord
[F]With all of my [G]heart
[C]I will not lean on [Am]my own
[F]I acknowledge [G]You in every[C]thing

[F]Trust Him [G]trust Him
[Am]In every [G]season [F]trust Him
[G]He'll make your [C]path straight`,
    notes: "Scripture song straight from Proverbs 3:5-6. Teaching worship.",
    bpm: 72,
    tags: ["worship","scripture","trust","wisdom"],
  },
  {
    title: "Standing on the Promises",
    artist: "Todd Dulaney",
    originalKey: "Ab",
    format: "chordpro",
    content: `[Ab]Standing on the [Eb]promises of [Fm]Christ my King
[Db]Through eternal ages [Ab]let His praises ring
[Ab]Glory in the [Eb]highest I will [Fm]shout and sing
[Db]Standing on the [Eb]promises of [Ab]God

[Ab]Standing [Eb]standing
[Fm]Standing on the [Db]promises of God my Savior
[Ab]Standing [Eb]standing
[Fm]I'm standing on the [Db]promises of [Ab]God

[Db]Every word You [Ab]speak I hold on [Eb]to
[Fm]Every promise [Db]made I know is [Ab]true`,
    notes: "Classic hymn reimagined with gospel flair. Full choir arrangement.",
    bpm: 92,
    tags: ["worship","promises","hymn","faith","gospel"],
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
