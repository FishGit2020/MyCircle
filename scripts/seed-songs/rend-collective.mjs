#!/usr/bin/env node
/**
 * Seed Rend Collective worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/rend-collective.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Build Your Kingdom Here",
    artist: "Rend Collective",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Come set Your rule and [C]reign
[G]In our hearts a[D]gain
[Em]Increase in us we [C]pray
[G]Unveil why we're [D]made

[G]Come set our hearts a[C]blaze with hope
[Em]Like wildfire [D]in our very souls
[G]Holy Spirit [C]come invade us now
[Em]We are Your [D]church and we need Your power in [G]us

[C]Build Your kingdom [G]here let the darkness fear
[D]Show Your mighty [Em]hand heal our streets and land
[C]Set Your church on [G]fire win this nation back
[D]Change the atmos[Em]phere build Your kingdom here we [G]pray`,
    notes: "Irish folk energy. Stomp and clap feel. Get the congregation moving.",
    bpm: 136,
    tags: ["worship","kingdom","revival","prayer"],
  },
  {
    title: "My Lighthouse",
    artist: "Rend Collective",
    originalKey: "A",
    format: "chordpro",
    content: `[A]In my wrestling [D]and in my doubts
[A]In my failures [E]You won't walk out
[A]Your great love will [D]lead me through
[A]You are the peace [E]in my troubled sea

[A]My lighthouse my [D]lighthouse
[A]Shining in the [E]darkness I will follow You
[A]My lighthouse my [D]lighthouse
[A]I will trust the [E]promise You will carry me
[D]Safe to [E]shore safe to [A]shore`,
    notes: "Joyful and bouncy. Irish folk instrumentation. Banjo and acoustic guitar.",
    bpm: 142,
    tags: ["worship","trust","joy","folk"],
  },
  {
    title: "Rescuer (Good News)",
    artist: "Rend Collective",
    originalKey: "C",
    format: "chordpro",
    content: `[C]There is good news [F]for the captive
[Am]Good news for the [G]shamed
[C]There is good news [F]for the one who walked away
[C]There is good news [F]for the doubter
[Am]The one religion [G]failed
[C]For the good Lord has [F]come to seek and save

[C]He's our Rescuer [F]He's our Rescuer
[Am]We are free from [G]sin forevermore
[C]Oh how sweet the [F]sound oh how grace a[Am]bounds
[G]We will praise the [C]Lord our Rescuer`,
    notes: "Celebratory and anthemic. Keep the energy high and joyful throughout.",
    bpm: 130,
    tags: ["worship","gospel","joy","salvation"],
  },
  {
    title: "Joy of the Lord",
    artist: "Rend Collective",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Though the tears may [D]fall my song will [Em]rise
[C]My song will rise to [G]You
[G]Though my heart may [D]fail my song will [Em]rise
[C]My song will rise to [G]You

[Em]While there's [C]breath in my [G]lungs
[D]I will praise You [Em]Lord

[G]The joy of the Lord [D]is my strength
[Em]The joy of the [C]Lord is my strength
[G]In the darkness [D]I'll dance
[Em]In the shadows [C]I'll sing
[G]The joy of the [D]Lord is my [G]strength`,
    notes: "Stomp-clap feel, builds joyfully. Great for opening worship.",
    bpm: 144,
    tags: ["worship","joy","strength","folk"],
  },
  {
    title: "Counting Every Blessing",
    artist: "Rend Collective",
    originalKey: "D",
    format: "chordpro",
    content: `[D]I was blind now I'm [G]seeing
[D]I was lost now I'm [A]found
[D]I was dead but now I'm [G]living
[D]Ever since You [A]turned my world a[D]round

[G]I'm counting every [D]blessing
[A]Counting every [Bm]blessing
[G]Letting go and [D]trusting
[A]When I cannot [D]see

[G]I'm counting every [D]blessing
[A]Surely every [Bm]season
[G]You are good to [D]me
[A]You are good to [D]me`,
    notes: "Grateful and warm. Simple arrangement building with joy.",
    bpm: 120,
    tags: ["worship","gratitude","thanksgiving","folk"],
  },
  {
    title: "You Will Never Run",
    artist: "Rend Collective",
    originalKey: "A",
    format: "chordpro",
    content: `[A]The God of angel [D]armies is always by my [A]side
[A]The God of every [D]answer is by my [E]side
[F#m]The God of gentle [D]mercy has heard my desperate [A]cry
[F#m]And I will praise You [D]Lord through the [E]storm

[A]You will never [D]run
[A]You'll never run from [E]me
[F#m]You will never [D]run no You'll never [A]run
[E]You'll never run from [A]me

[F#m]In the fire in the [D]flood I know You are [A]near
[E]I know You're never far [F#m]away`,
    notes: "Anthemic Irish folk worship. Builds with layered instrumentation.",
    bpm: 132,
    tags: ["worship","faithfulness","assurance","folk"],
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
