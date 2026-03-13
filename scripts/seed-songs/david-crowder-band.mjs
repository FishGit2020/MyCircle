#!/usr/bin/env node
/**
 * Seed David Crowder Band worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/david-crowder-band.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "How He Loves",
    artist: "David Crowder Band",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]He is jealous for me, [Am]loves like a hurricane
[F]I am a tree bending [G]beneath the weight of His
[C]Wind and mercy, when the [Am]oceans of kindness
[F]So much bigger than we [G]ever could imagine

{Chorus}
[C]And we are His por[Am]tion and He is our prize
[F]Drawn to redemption by the [G]grace in His eyes
[F]If grace is an ocean we're all [G]sinking

{Verse 2}
[C]And oh how He loves [Am]us oh
[F]Oh how He loves [G]us
[C]How He loves [Am]us all
[F]Yeah He [G]loves us`,
    notes: "Iconic worship anthem, swelling dynamics throughout",
    bpm: 76,
    tags: ["worship","love","anthem"],
  },
  {
    title: "Wholly Yours",
    artist: "David Crowder Band",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]I am full of earth, You are [A]heaven's worth
[Bm]I am stained with dirt, prone to de[G]pravity
[D]You are everything that is [A]bright and clean
[Bm]The antonym of [G]me

{Chorus}
[D]You are divinity [A]but
[Bm]A certain sign of [G]grace is this
[D]From the broken earth [A]flowers come up
[Bm]Pushing through the [G]dirt

{Verse 2}
[G]And I am so [D]wholly Yours
[A]I am wholly [Bm]Yours
[G]I am wholly, [D]I am wholly
[A]I am wholly [D]Yours`,
    notes: "Beautiful contrast imagery, acoustic to full band build",
    bpm: 72,
    tags: ["worship","devotional","surrender"],
  },
  {
    title: "No One Like You (Crowder)",
    artist: "David Crowder Band",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]You are more beautiful than [B]anyone ever
[C#m]Every day You're the same, [A]You never change no never
[E]And how could I ever [B]deny the love of my
[C#m]Savior? You are to me [A]everything

{Chorus}
[E]All I need is You [B]Lord, is You Lord
[C#m]All I need is [A]You
[E]There is no one [B]like, no one like [C#m]You
[A]There is no one [E]like You, God`,
    notes: "Energetic rock worship, driving electric guitar",
    bpm: 134,
    tags: ["worship","rock","praise"],
  },
  {
    title: "Everything Glorious",
    artist: "David Crowder Band",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]The day is [E]brighter here with You
[F#m]The night is [D]lighter than its hue
[A]Would lead me [E]to believe
[F#m]Which leads me [D]back to You

{Chorus}
[A]You make [E]everything [F#m]glorious
[D]You make everything glorious
[A]You make [E]everything [F#m]glorious
[D]And I am Yours
[A]What does that [E]make me?
[F#m]What does that [D]make me?`,
    notes: "Celebratory and bright, full band arrangement",
    bpm: 126,
    tags: ["worship","celebration","praise"],
  },
  {
    title: "SMS (Shine)",
    artist: "David Crowder Band",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Shine Your light so all can see it
[Em]Lift it up cause the whole world needs it
[C]Just show up and let God breathe it
[D]There's enough for everyone

{Chorus}
[G]Shine, make em [Em]wonder what you got
[C]Make em wish that they were [D]not
[G]On the outside looking [Em]bored
[C]Come let your light [D]shine before all

{Verse 2}
[C]Let it shine, [D]let it shine
[Em]Let it shine, [G]let it shine
[C]Let your [D]light [G]shine`,
    notes: "Fun and catchy, handclap rhythms",
    bpm: 138,
    tags: ["worship","upbeat","fun"],
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
