#!/usr/bin/env node
/**
 * Seed Crowder worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/crowder.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Come As You Are",
    artist: "Crowder",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]Come out of [G]sadness
[Am]From wherever you've [F]been
[C]Come broken[G]hearted
[Am]Let rescue be[F]gin

{Chorus}
[C]Come find your mercy, [G]oh sinner come kneel
[Am]Earth has no sorrow [F]that heaven can't heal
[C]So lay down your [G]burdens
[Am]Lay down your [F]shame
[C]Come as you [G]are`,
    notes: "Altar call classic. Gentle invitation, builds warmth throughout.",
    bpm: 73,
    tags: ["worship","invitation","grace","mercy"],
  },
  {
    title: "All My Hope",
    artist: "Crowder",
    originalKey: "Ab",
    format: "chordpro",
    content: `{Verse 1}
[Ab]I've been held by the [Db]Savior
[Fm]I've felt fire from [Eb]above
[Ab]I've been down to the [Db]river
[Fm]I ain't the same, [Eb]a prodigal found

{Chorus}
[Ab]All my hope is in [Db]Jesus
[Fm]Thank God that [Eb]yesterday's gone
[Ab]All my sins are for[Db]given
[Fm]I've been washed [Eb]by the blood`,
    notes: "Tauren Wells collab. Southern gospel-meets-modern worship. Foot-stomping.",
    bpm: 130,
    tags: ["worship","hope","salvation","testimony"],
  },
  {
    title: "Good God Almighty",
    artist: "Crowder",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]I was blind but [A]now I can see
[Bm]Once was bound but [G]now I'm free
[D]You opened up my [A]eyes to see
[Bm]The good, the good [G]God in me

{Chorus}
[D]Good God Al[A]mighty
[Bm]Is there anything [G]You can't do
[D]Good God Al[A]mighty
[Bm]I'm gonna give it [G]all to You`,
    notes: "Upbeat, joyful, southern gospel energy. Clap-along, feel-good worship.",
    bpm: 140,
    tags: ["worship","praise","joy","testimony"],
  },
  {
    title: "Red Letters",
    artist: "Crowder",
    originalKey: "B",
    format: "chordpro",
    content: `{Verse 1}
[B]There on a hill, [F#]there on a cross
[G#m]Is a sacrifice that [E]none could exhaust
[B]Hands that were nailed [F#]to a rugged tree
[G#m]Are the hands that have [E]set us all free

{Chorus}
[B]Red letters, [F#]red letters
[G#m]The gospel in [E]red letters
[B]The story of [F#]redemption written
[G#m]In red [E]letters`,
    notes: "Cross-focused, driving rock worship. Strong electric guitar.",
    bpm: 134,
    tags: ["worship","cross","gospel","salvation"],
  },
  {
    title: "Let It Rain",
    artist: "Crowder",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]Let it rain, [A]let it rain
[Bm]Open the flood [G]gates of heaven
[D]Let it rain, [A]let it rain
[Bm]Open the flood [G]gates of heaven

{Chorus}
[D]We need You [A]here
[Bm]We need Your [G]spirit
[D]Let it rain, [A]let it rain
[Bm]Pour out Your [G]power`,
    notes: "Revival anthem, congregational prayer. Build intensity through repetition.",
    bpm: 80,
    tags: ["worship","Holy Spirit","revival","prayer"],
  },
  {
    title: "In the House",
    artist: "Crowder",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]Singing praise in the [B]house of God
[C#m]Dancing free in the [A]house of God
[E]Every chain is gonna [B]break tonight
[C#m]In the house, in the [A]house of God

{Chorus}
[E]There's freedom in the [B]house
[C#m]There's joy in the [A]house
[E]There is love, there is [B]grace
[C#m]In the house of [A]God tonight`,
    notes: "Celebration anthem. High energy, foot-stomping rhythm.",
    bpm: 146,
    tags: ["worship","praise","celebration","joy"],
  },
  {
    title: "My Victory",
    artist: "Crowder",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]You came for criminals [G]and every Pharisee
[Am]You came for hypocrites [F]even one like me
[C]You carried the cross [G]Lord You carried me
[Am]You were buried in [F]a grave but the grave could not hold Thee

{Chorus}
[C]My victory, [G]my victory
[Am]Is in You, is [F]in You
[C]My defeat was [G]defeated at the cross
[Am]My victory, [F]my victory`,
    notes: "Darren Whitehead co-write. Resurrection power anthem. Driving and bold.",
    bpm: 136,
    tags: ["worship","victory","cross","resurrection"],
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
