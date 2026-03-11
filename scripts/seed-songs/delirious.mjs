#!/usr/bin/env node
/**
 * Seed Delirious? worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/delirious.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "History Maker",
    artist: "Delirious?",
    originalKey: "E",
    format: "chordpro",
    content: `[E]Is it true today that [B]when people pray
[C#m]Cloudless skies will [A]break
[E]Kings and queens will [B]shake
[C#m]Yes it's true and I be[A]lieve it
[E]I'm living for [B]You

[E]I'm gonna be a [B]history maker
[C#m]In this land [A]I'm gonna be
[E]A speaker of [B]truth to
[C#m]All of man[A]kind
[E]I'm gonna stand, I'm gonna [B]run
[C#m]Into Your arms, [A]into Your arms again`,
    notes: "Iconic 90s anthem, driving rock energy",
    bpm: 138,
    tags: ["worship","anthem","rock"],
  },
  {
    title: "What a Friend I've Found",
    artist: "Delirious?",
    originalKey: "G",
    format: "chordpro",
    content: `[G]What a friend I've [Em]found
[C]Closer than a [D]brother
[G]I have felt Your [Em]touch
[C]More intimate than [D]lovers

[G]Jesus, [Em]Jesus
[C]Jesus, friend for[D]ever

[G]What a hope I've [Em]found
[C]More faithful than a [D]mother
[G]It would break my [Em]heart
[C]To ever lose each [D]other`,
    notes: "Gentle and personal, acoustic guitar led",
    bpm: 76,
    tags: ["worship","intimate","devotional"],
  },
  {
    title: "Majesty (Delirious)",
    artist: "Delirious?",
    originalKey: "D",
    format: "chordpro",
    content: `[D]Here I am, humbled by Your [A]majesty
[Bm]Covered by Your [G]grace so free
[D]Here I am, knowing I'm a [A]sinful man
[Bm]Covered by the [G]blood of the Lamb

[D]Now I've found the [A]greatest love of all
[Bm]Is mine, since You [G]laid down Your life
[D]The greatest sacri[A]fice

[G]Majesty, [A]majesty
[Bm]Your grace has found [G]me just as I am
[D]Empty handed but [A]alive in Your hands
[G]Majesty, [A]majes[D]ty`,
    notes: "Devotional rock ballad, build second chorus bigger",
    bpm: 74,
    tags: ["worship","devotional","rock"],
  },
  {
    title: "Did You Feel the Mountains Tremble",
    artist: "Delirious?",
    originalKey: "D",
    format: "chordpro",
    content: `[D]Did you feel the mountains tremble
[G]Did you hear the oceans roar
[D]When the people rose to sing of
[A]Jesus Christ the risen Lord

[D]Did you feel the people tremble
[G]Did you hear the singers roar
[D]When the lost began to sing of
[A]Jesus Christ the saving Lord

[G]And we can see that [D]God You're moving
[A]A mighty river [Bm]through the nations
[G]And young and old will [D]turn to Jesus
[A]Fling wide you [Bm]heavenly [D]gates
[G]Prepare the [A]way of the risen [D]Lord`,
    notes: "Revival anthem, strong rhythmic guitar pattern",
    bpm: 120,
    tags: ["worship","revival","anthem"],
  },
  {
    title: "Rain Down",
    artist: "Delirious?",
    originalKey: "A",
    format: "chordpro",
    content: `[A]Looks like tonight the [E]sky is heavy
[F#m]Feels like the winds are gonna [D]change
[A]Beneath my feet the [E]earth is ready
[F#m]I know it's time for heaven's [D]rain

[A]It's gonna rain [E]rain
[F#m]Open the flood[D]gates of heaven
[A]It's gonna rain [E]rain
[F#m]Let it rain, let it [D]rain

[A]Do not shut, [E]do not shut your
[F#m]Heavens, heavens [D]rain down
[A]Rain down on [E]us
[F#m]Rain [D]down`,
    notes: "Atmospheric build, use dynamics for effect",
    bpm: 118,
    tags: ["worship","prayer","atmospheric"],
  },
  {
    title: "My Glorious",
    artist: "Delirious?",
    originalKey: "G",
    format: "chordpro",
    content: `[G]The world's shaking with the [D]love of God
[Em]Great and glorious [C]let the whole earth sing
[G]And all You ever [D]do is change the old for new
[Em]People we believe that [C]God is bigger than the

[G]Air I breathe, the [D]world we'll leave
[Em]God will save the [C]day and all will say
[G]My glorious! [D]My glorious!
[Em]My glori[C]ous!
[G]My [D]glori[Em]ous! [C]Oh!`,
    notes: "Explosive energy, big stadium rock feel",
    bpm: 140,
    tags: ["worship","rock","celebration"],
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
