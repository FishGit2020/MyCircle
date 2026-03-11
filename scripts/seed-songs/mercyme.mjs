#!/usr/bin/env node
/**
 * Seed MercyMe worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/mercyme.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "I Can Only Imagine",
    artist: "MercyMe",
    originalKey: "E",
    format: "chordpro",
    content: `[E]I can only i[A]magine
[E]What it will be like
[B]When I walk by Your [A]side
[E]I can only i[A]magine
[E]What my eyes will see
[B]When Your face is be[A]fore me

[E]Surrounded by Your [A]glory
[E]What will my heart [B]feel
[E]Will I dance for You [A]Jesus
[E]Or in awe of [B]You be still`,
    notes: "Iconic worship crossover. Build gradually, powerful emotional climax.",
    bpm: 80,
    tags: ["worship","heaven","hope","classic"],
  },
  {
    title: "Even If",
    artist: "MercyMe",
    originalKey: "Ab",
    format: "chordpro",
    content: `[Ab]They say sometimes You [Eb]win some
[Fm]Sometimes You [Db]lose some
[Ab]And right now, right [Eb]now I'm losing bad
[Fm]I've stood on this [Db]stage night after night

[Ab]I know You're able and I [Eb]know You can
[Fm]Save through the fire with Your [Db]mighty hand
[Ab]But even if You [Eb]don't
[Fm]My hope is You a[Db]lone`,
    notes: "Deeply personal faith declaration in suffering. Tender and powerful.",
    bpm: 72,
    tags: ["worship","faith","suffering","trust"],
  },
  {
    title: "Greater",
    artist: "MercyMe",
    originalKey: "E",
    format: "chordpro",
    content: `[E]Bring your tired and [B]bring your shame
[C#m]Bring your guilt and [A]bring your pain
[E]Don't you know that's not your [B]name
[C#m]You will always [A]be much more to me

[E]He's greater, He's [B]greater
[C#m]Greater is the One [A]living inside of me
[E]He's greater, He's [B]greater
[C#m]Than he that is [A]in the world`,
    notes: "Upbeat identity anthem. Pop-rock energy, great for encouragement.",
    bpm: 140,
    tags: ["worship","identity","victory","encouragement"],
  },
  {
    title: "Word of God Speak",
    artist: "MercyMe",
    originalKey: "Bb",
    format: "chordpro",
    content: `[Bb]I'm finding myself at a [F]loss for words
[Gm]And the funny thing is it's [Eb]okay
[Bb]The last thing I need is to [F]be heard
[Gm]But to hear what [Eb]You would say

[Bb]Word of God speak
[F]Would You pour down like rain
[Gm]Washing my eyes to see
[Eb]Your majesty
[Bb]To be still and [F]know
[Gm]That You're in this [Eb]place`,
    notes: "Quiet devotional classic. Stripped-back arrangement, minimal instrumentation.",
    bpm: 60,
    tags: ["worship","prayer","stillness","devotion"],
  },
  {
    title: "Flawless",
    artist: "MercyMe",
    originalKey: "C",
    format: "chordpro",
    content: `[C]There's got to be more
[G]Than going back and forth
[Am]From doing right to [F]doing wrong
[C]Cause we were taught that's [G]who we are
[Am]Come on get in [F]line right behind me

[C]No matter the bumps, [G]no matter the bruises
[Am]No matter the scars, [F]still the truth is
[C]The cross has made, [G]the cross has made you
[Am]Flaw[F]less`,
    notes: "Upbeat pop-rock identity anthem. Fun energy, clap-along.",
    bpm: 136,
    tags: ["worship","identity","grace","freedom"],
  },
  {
    title: "Dear Younger Me",
    artist: "MercyMe",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Dear younger me, [D]where do I start
[Em]If I could tell you [C]everything that I have learned so far
[G]Then you could be [D]one step ahead
[Em]Of all the painful [C]memories still running through my head

[G]Dear younger me, [D]it's not your fault
[Em]You were never meant to [C]carry this beyond the cross
[G]Dear younger me, [D]you'll be okay
[Em]Dear younger [C]me`,
    notes: "Reflective and personal, letter-style lyrics. Builds emotionally.",
    bpm: 76,
    tags: ["worship","healing","reflection","grace"],
  },
  {
    title: "Almost Home",
    artist: "MercyMe",
    originalKey: "G",
    format: "chordpro",
    content: `[G]I can see the [D]light at the end of this tunnel
[Em]I know it's bright and [C]I won't stumble
[G]Through these valleys [D]and these shadows
[Em]The road less [C]traveled to green meadows

[G]We're almost [D]home
[Em]Brother, it won't be [C]long
[G]We're almost [D]home
[Em]Sister, keep pressing [C]on
[G]We're almost [D]home`,
    notes: "Hopeful perseverance anthem. Medium tempo, builds to full-band chorus.",
    bpm: 78,
    tags: ["worship","hope","heaven","perseverance"],
  },
  {
    title: "Glorious Unfolding",
    artist: "MercyMe",
    originalKey: "D",
    format: "chordpro",
    content: `[D]Lay your head [A]down tonight
[Bm]Take a rest from the [G]fight
[D]Don't try to figure it [A]all out
[Bm]Just listen to what [G]I'm whispering to your heart

[D]This is going to be a [A]glorious unfolding
[Bm]Just you wait and see [G]and you will be amazed
[D]You've just gotta [A]believe the way it's all
[Bm]Gonna work out, [G]it's a glorious unfolding`,
    notes: "Encouraging perseverance anthem. Medium tempo, narrative style.",
    bpm: 78,
    tags: ["worship","hope","encouragement","trust"],
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
