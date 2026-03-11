#!/usr/bin/env node
/**
 * Seed Tim Hughes worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/tim-hughes.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Here I Am to Worship",
    artist: "Tim Hughes",
    originalKey: "D",
    format: "chordpro",
    content: `[D]Light of the world You [A]stepped down into darkness
[Em]Opened my eyes let [G]me see
[D]Beauty that made this [A]heart adore You
[Em]Hope of a life spent [G]with You

[D]Here I am to [A]worship
[Em]Here I am to [G]bow down
[D]Here I am to [A]say that You're my God
[Em]You're altogether [G]lovely
[D]Altogether [A]worthy
[Em]Altogether [G]wonderful to me

[D]King of all days, [A]oh so highly exalted
[Em]Glorious in heaven [G]above`,
    notes: "Tim Hughes classic, one of the most-sung worship songs globally",
    bpm: 76,
    tags: ["worship","classic","adoration"],
  },
  {
    title: "Happy Day",
    artist: "Tim Hughes",
    originalKey: "G",
    format: "chordpro",
    content: `[G]The greatest day in [D]history
[Em]Death is beaten [C]You have rescued me
[G]Sing it out, [D]Jesus is alive
[Em]The empty cross, the [C]empty grave
[G]Life eternal [D]You have won the day
[Em]Sing it out, [C]Jesus is alive
[G]He's a[D]live

[G]Oh happy day, [D]happy day
[Em]You washed my sin [C]away
[G]Oh happy day, [D]happy day
[Em]I'll never be the [C]same
[G]Forever I am [D]changed`,
    notes: "Celebration anthem, great for Easter and baptisms",
    bpm: 136,
    tags: ["worship","celebration","easter"],
  },
  {
    title: "God of Justice",
    artist: "Tim Hughes",
    originalKey: "A",
    format: "chordpro",
    content: `[A]God of justice, [E]Savior to all
[F#m]Came to rescue the [D]weak and the poor
[A]Chose to serve and [E]not be served
[F#m]Jesus You have [D]called us

[A]Freely we've re[E]ceived
[F#m]Now freely we will [D]give

[A]Fill us up and [E]send us out
[F#m]Fill us up and [D]send us out
[A]Fill us up and [E]send us out Lord
[F#m]Lord we hear Your [D]call
[A]We hear Your [E]call
[F#m]We hear Your [D]call`,
    notes: "Social justice worship, missional heart",
    bpm: 118,
    tags: ["worship","justice","missions"],
  },
  {
    title: "Spirit Break Out (Tim Hughes)",
    artist: "Tim Hughes",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Our Father, all of [Em]heaven roars Your name
[C]Come closer, let Your [D]fire fall in this place
[G]Our Father, pour Your [Em]blessings out on us
[C]Sing louder, all the [D]heavens shout Your name

[G]Spirit break out, [Em]break our walls down
[C]Spirit break out, [D]heaven come down
[G]Spirit break out, [Em]break our walls down
[C]Spirit break out, [D]heaven come down

[G]King Jesus You're the [Em]name we're lifting high
[C]Your glory shaking [D]all the earth and sky`,
    notes: "Tim Hughes version, explosive worship energy",
    bpm: 130,
    tags: ["worship","holy-spirit","revival"],
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
