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
    originalKey: "E",
    format: "chordpro",
    content: `[E]Come out of [B]sadness
[C#m]From wherever you've [A]been
[E]Come broken[B]hearted
[C#m]Let rescue be[A]gin

[E]Come find your mercy, [B]oh sinner come kneel
[C#m]Earth has no sorrow [A]that heaven can't heal
[E]So lay down your [B]burdens
[C#m]Lay down your [A]shame
[E]Come as you [B]are`,
    notes: "Altar call classic. Gentle invitation, builds warmth throughout.",
    bpm: 73,
    tags: ["worship","invitation","grace","mercy"],
  },
  {
    title: "All My Hope",
    artist: "Crowder",
    originalKey: "G",
    format: "chordpro",
    content: `[G]I've been held by the [C]Savior
[Em]I've felt fire from [D]above
[G]I've been down to the [C]river
[Em]I ain't the same, [D]a prodigal found

[G]All my hope is in [C]Jesus
[Em]Thank God that [D]yesterday's gone
[G]All my sins are for[C]given
[Em]I've been washed [D]by the blood`,
    notes: "Tauren Wells collab. Southern gospel-meets-modern worship. Foot-stomping.",
    bpm: 130,
    tags: ["worship","hope","salvation","testimony"],
  },
  {
    title: "Good God Almighty",
    artist: "Crowder",
    originalKey: "E",
    format: "chordpro",
    content: `[E]I was blind but [B]now I can see
[C#m]Once was bound but [A]now I'm free
[E]You opened up my [B]eyes to see
[C#m]The good, the good [A]God in me

[E]Good God Al[B]mighty
[C#m]Is there anything [A]You can't do
[E]Good God Al[B]mighty
[C#m]I'm gonna give it [A]all to You`,
    notes: "Upbeat, joyful, southern gospel energy. Clap-along, feel-good worship.",
    bpm: 140,
    tags: ["worship","praise","joy","testimony"],
  },
  {
    title: "Red Letters",
    artist: "Crowder",
    originalKey: "E",
    format: "chordpro",
    content: `[E]There on a hill, [B]there on a cross
[C#m]Is a sacrifice that [A]none could exhaust
[E]Hands that were nailed [B]to a rugged tree
[C#m]Are the hands that have [A]set us all free

[E]Red letters, [B]red letters
[C#m]The gospel in [A]red letters
[E]The story of [B]redemption written
[C#m]In red [A]letters`,
    notes: "Cross-focused, driving rock worship. Strong electric guitar.",
    bpm: 134,
    tags: ["worship","cross","gospel","salvation"],
  },
  {
    title: "Let It Rain",
    artist: "Crowder",
    originalKey: "D",
    format: "chordpro",
    content: `[D]Let it rain, [A]let it rain
[Bm]Open the flood [G]gates of heaven
[D]Let it rain, [A]let it rain
[Bm]Open the flood [G]gates of heaven

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
    content: `[E]Singing praise in the [B]house of God
[C#m]Dancing free in the [A]house of God
[E]Every chain is gonna [B]break tonight
[C#m]In the house, in the [A]house of God

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
    content: `[C]You came for criminals [G]and every Pharisee
[Am]You came for hypocrites [F]even one like me
[C]You carried the cross [G]Lord You carried me
[Am]You were buried in [F]a grave but the grave could not hold Thee

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
