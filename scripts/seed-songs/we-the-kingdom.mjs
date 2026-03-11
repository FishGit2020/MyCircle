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
    originalKey: "G",
    format: "chordpro",
    content: `[G]God I'm on my [Em]knees again
[C]God I'm begging [D]please again
[G]I need You oh [Em]I need You
[C]Walking down these [D]desert roads
[G]Water for my [Em]thirsty soul

[C]I don't want to [D]walk alone
[Em]I don't want to [D]walk alone

[G]Your forgiveness is like [Em]sweet sweet honey on my lips
[C]Like the sound of a [D]symphony to my ears
[G]Like holy water [Em]on my skin
[C]Dead man walking [D]come alive again`,
    notes: "Raw and emotional. Sparse verse building to powerful chorus. Southern gospel influence.",
    bpm: 74,
    tags: ["worship","repentance","grace","healing"],
  },
  {
    title: "God So Loved",
    artist: "We The Kingdom",
    originalKey: "Bb",
    format: "chordpro",
    content: `[Bb]Come all you [Eb]weary
[Bb]Come all you [F]thirsty
[Gm]Come to the [Eb]well that never runs [Bb]dry
[Bb]Drink of the [Eb]water come and thirst no [F]more

[Bb]God so loved the [Eb]world that He gave us
[Gm]His one and [F]only Son to save [Eb]us
[Bb]Whoever believes [Eb]in Him will live for[Gm]ever

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
    originalKey: "A",
    format: "chordpro",
    content: `[A]Faith doesn't always [D]mean you understand
[F#m]It doesn't always [E]come the way you planned
[A]But when the waves are [D]high and the boat is [F#m]rocked
[E]You find out what you believe in

[A]I'm dancing on the [D]waves
[F#m]I'm singing in the [E]rain
[A]I'm standing on the [D]rock
[F#m]When everything a[E]round me falls apart
[A]I'm walking on the [D]water
[F#m]Even if the [E]storms get harder
[D]I know I'll be [E]fine with You [A]Lord`,
    notes: "Upbeat faith declaration. Build energy through the choruses.",
    bpm: 126,
    tags: ["worship","faith","trust","joy"],
  },
  {
    title: "Don't Tread on Me",
    artist: "We The Kingdom",
    originalKey: "E",
    format: "chordpro",
    content: `[E]The enemy comes like a [B]thief in the night
[C#m]But I've got a secret a [A]weapon of light
[E]The blood of the Lamb and the [B]word of my mouth
[C#m]I won't be si[A]lenced I won't back down

[E]Don't tread on me [B]don't tread on me
[C#m]I've got the power of [A]heaven backing me
[E]Don't tread on me [B]don't tread on me
[C#m]Greater is He that [A]lives in me

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
    content: `[C]I was walking the [G]wrong way
[Am]Heart closed, [F]head down
[C]Like a stranger in a [G]strange land
[Am]You gave me a [F]new heart

[C]I'm a child of [G]love
[Am]I was meant to be [F]right here
[C]A child of [G]love washed in the [Am]blood
[F]Born of the Spirit of God

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
    content: `[G]Unremarkable it [C]looked so plain
[Em]Ordinary not the [D]frame I would have chose
[G]But with Your hands You [C]broke the bread
[Em]And with Your words You [D]blessed and broke and gave

[G]Oh it's the pieces of my [C]broken heart
[Em]That needed breaking all a[D]long
[G]So take the pieces of this [C]broken life
[Em]And make something [D]beautiful with me

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
