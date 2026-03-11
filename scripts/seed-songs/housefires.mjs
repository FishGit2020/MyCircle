#!/usr/bin/env node
/**
 * Seed Housefires worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/housefires.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Good Good Father (Housefires)",
    artist: "Housefires",
    originalKey: "A",
    format: "chordpro",
    content: `[A]Oh I've heard a [E]thousand stories
[F#m]Of what they think You're [D]like
[A]But I've heard the [E]tender whisper
[F#m]Of love in the [D]dead of night

[A]You tell me that You're [E]pleased
[F#m]And that I'm never a[D]lone

[A]You're a good good [E]Father
[F#m]It's who You are it's who You [D]are
[A]And I'm loved by [E]You
[F#m]It's who I am it's who I [D]am`,
    notes: "Original Housefires version. Raw and intimate live worship recording.",
    bpm: 72,
    tags: ["worship","identity","father","intimacy"],
  },
  {
    title: "We Say Yes",
    artist: "Housefires",
    originalKey: "F",
    format: "chordpro",
    content: `[F]We say yes Lord we say [Bb]yes
[Dm]To everything You [C]have for us
[F]We say yes Lord we say [Bb]yes
[Dm]You can have it [C]all

[Bb]We open up our [F]hearts
[C]We open up our [Dm]hands
[Bb]We lay down every[F]thing
[C]For Your greater [Dm]plan

[F]Whatever You're do[Bb]ing we want in
[Dm]Wherever You're go[C]ing we'll follow
[F]Whatever it [Bb]costs whatever it [Dm]takes
[C]We say yes`,
    notes: "Spontaneous worship anthem. Simple and repeatable for congregational moments.",
    bpm: 78,
    tags: ["worship","surrender","obedience","spontaneous"],
  },
  {
    title: "Crash",
    artist: "Housefires",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Let Your waves crash [D]over me
[Em]Like a rushing [C]river
[G]Let Your praise wash [D]over me
[Em]Spirit I sur[C]render

[G]Come and crash like [D]ocean waves
[Em]Your love is like the [C]sea
[G]Rising up with [D]every breath
[Em]Overwhelming [C]me

[C]Spirit come [D]Spirit fall
[Em]Crash like waves on [G]me
[C]Spirit rain [D]Spirit move
[Em]Fill the atmos[C]phere`,
    notes: "Atmospheric and flowing. Let the worship team build spontaneously.",
    bpm: 68,
    tags: ["worship","Holy Spirit","presence","spontaneous"],
  },
  {
    title: "Remembrance",
    artist: "Housefires",
    originalKey: "D",
    format: "chordpro",
    content: `[D]Oh how could it [A]be
[Bm]That my God would [G]welcome me
[D]Into this mys[A]tery
[Bm]Say take this bread [G]take this wine

[D]Now let us [A]take communion
[Bm]The bread and the [G]wine
[D]Remember He has [A]won it
[Bm]He has risen from the [G]grave

[D]And I will [A]remember
[Bm]This is re[G]membrance
[D]So do this in re[A]membrance of [Bm]Me [G]`,
    notes: "Perfect communion song. Keep it reverent and intimate.",
    bpm: 66,
    tags: ["worship","communion","remembrance","intimate"],
  },
  {
    title: "We Give You Glory",
    artist: "Housefires",
    originalKey: "E",
    format: "chordpro",
    content: `[E]We give You [B]glory
[C#m]We give You [A]glory
[E]We give You [B]glory Lord
[C#m]All of the [A]glory

[E]Everything we [B]have is from Your [C#m]hands
[A]Everything we [E]are is by Your [B]grace
[C#m]So we lift our [A]voices high

[A]All the glory [E]all the honor
[B]All the praise be[C#m]longs to You
[A]You are worthy [E]You are worthy
[B]Lord we give You [E]glory`,
    notes: "Spontaneous worship feel. Simple and repeatable. Let the room carry it.",
    bpm: 76,
    tags: ["worship","glory","praise","spontaneous"],
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
