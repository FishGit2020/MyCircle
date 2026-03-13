#!/usr/bin/env node
/**
 * Seed We The Kingdom worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/we-the-kingdom.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Holy Water",
    artist: "We The Kingdom",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]God I'm on my [Bm]knees again
[G]God I'm begging [A]please again
[D]I need You oh [Bm]I need You
[G]Walking down these [A]desert roads
[D]Water for my [Bm]thirsty soul

{Chorus}
[G]I don't want to [A]walk alone
[Bm]I don't want to [A]walk alone

{Verse 2}
[D]Your forgiveness is like [Bm]sweet sweet honey on my lips
[G]Like the sound of a [A]symphony to my ears
[D]Like holy water [Bm]on my skin
[G]Dead man walking [A]come alive again`,
    notes: "Raw and emotional. Sparse verse building to powerful chorus. Southern gospel influence.",
    bpm: 74,
    tags: ["worship","repentance","grace","healing"],
  },
  {
    title: "God So Loved",
    artist: "We The Kingdom",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]Come all you [Eb]weary
[Bb]Come all you [F]thirsty
[Gm]Come to the [Eb]well that never runs [Bb]dry
[Bb]Drink of the [Eb]water come and thirst no [F]more

{Chorus}
[Bb]God so loved the [Eb]world that He gave us
[Gm]His one and [F]only Son to save [Eb]us
[Bb]Whoever believes [Eb]in Him will live for[Gm]ever

{Verse 2}
[Bb]Bring all your [Eb]failures bring your addictions
[Bb]Come lay them [F]down at the foot of the [Gm]cross
[Eb]Jesus is [F]waiting [Bb]there`,
    notes: "Tender and invitational. Beautiful for evangelistic services.",
    bpm: 68,
    tags: ["worship","gospel","invitation","love"],
  },
  {
    title: "Dancing on the Waves",
    artist: "We The Kingdom",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]Faith doesn't always [A]mean you understand
[C#m]It doesn't always [B]come the way you planned
[E]But when the waves are [A]high and the boat is [C#m]rocked
[B]You find out what you believe in

{Chorus}
[E]I'm dancing on the [A]waves
[C#m]I'm singing in the [B]rain
[E]I'm standing on the [A]rock
[C#m]When everything a[B]round me falls apart
[E]I'm walking on the [A]water
[C#m]Even if the [B]storms get harder
[A]I know I'll be [B]fine with You [E]Lord`,
    notes: "Upbeat faith declaration. Build energy through the choruses.",
    bpm: 126,
    tags: ["worship","faith","trust","joy"],
  },
  {
    title: "Don't Tread on Me",
    artist: "We The Kingdom",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]The enemy comes like a [B]thief in the night
[C#m]But I've got a secret a [A]weapon of light
[E]The blood of the Lamb and the [B]word of my mouth
[C#m]I won't be si[A]lenced I won't back down

{Chorus}
[E]Don't tread on me [B]don't tread on me
[C#m]I've got the power of [A]heaven backing me
[E]Don't tread on me [B]don't tread on me
[C#m]Greater is He that [A]lives in me

{Verse 2}
[E]So let the redeemed of the [B]Lord say so
[C#m]Let every chain and every [A]stronghold go`,
    notes: "Driving and intense. Southern rock meets worship. Electric guitar heavy.",
    bpm: 138,
    tags: ["worship","spiritual warfare","declaration","power"],
  },
  {
    title: "Child of Love",
    artist: "We The Kingdom",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]I was walking the [G]wrong way
[Am]Heart closed, [F]head down
[C]Like a stranger in a [G]strange land
[Am]You gave me a [F]new heart

{Chorus}
[C]I'm a child of [G]love
[Am]I was meant to be [F]right here
[C]A child of [G]love washed in the [Am]blood
[F]Born of the Spirit of God

{Verse 2}
[Am]Not what I've [F]done but who You [C]are
[G]Not where I've [Am]been but where You [F]bring me
[C]You've taken my [G]pain and held me up`,
    notes: "Soulful and warm. Testimony driven. Full family band feel.",
    bpm: 90,
    tags: ["worship","identity","love","testimony"],
  },
  {
    title: "Pieces",
    artist: "We The Kingdom",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Unremarkable it [C]looked so plain
[Em]Ordinary not the [D]frame I would have chose
[G]But with Your hands You [C]broke the bread
[Em]And with Your words You [D]blessed and broke and gave

{Chorus}
[G]Oh it's the pieces of my [C]broken heart
[Em]That needed breaking all a[D]long
[G]So take the pieces of this [C]broken life
[Em]And make something [D]beautiful with me

{Verse 2}
[C]Broken to be [G]given
[D]Spilled out to be [Em]shared
[C]This is how You [G]loved us [D]from the very start`,
    notes: "Emotional and raw. Communion-themed. Southern gospel roots.",
    bpm: 72,
    tags: ["worship","brokenness","communion","grace"],
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
