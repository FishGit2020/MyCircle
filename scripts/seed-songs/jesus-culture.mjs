#!/usr/bin/env node
/**
 * Seed Jesus Culture worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/jesus-culture.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Your Love Never Fails [INCOMPLETE - needs V2+Bridge]",
    artist: "Jesus Culture",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]Nothing can sepa[Eb]rate
[Gm]Even if I ran [F]away
[Bb]Your love never [Eb]fails
[Gm]I know I still [F]make mistakes but

{Chorus}
[Bb]You are my [Eb]hiding place
[Gm]Your love never [F]fails
[Bb]Your love never [Eb]fails
[Gm]Your love never [F]fails`,
    notes: "Anthemic, call-and-response friendly. Great for youth and conferences.",
    bpm: 136,
    tags: ["worship","love","faithfulness"],
  },
  {
    title: "Break Every Chain [INCOMPLETE - needs V2+Bridge]",
    artist: "Jesus Culture",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]There is power [F]in the name of Jesus
[Gm]There is power [Eb]in the name of Jesus
[Bb]There is power [F]in the name of Jesus
[Gm]To break every [Eb]chain, break every chain

{Chorus}
[Bb]Break every [F]chain
[Gm]Break every [Eb]chain
[Bb]Break every [F]chain
[Gm]Break every [Eb]chain`,
    notes: "Will Reagan. Powerful prayer and warfare song. Repeat chorus as led.",
    bpm: 80,
    tags: ["worship","spiritual warfare","freedom","prayer"],
  },
  {
    title: "Rooftops [INCOMPLETE - needs V2+Bridge]",
    artist: "Jesus Culture",
    originalKey: "Ab",
    format: "chordpro",
    content: `{Verse 1}
[Ab]Here I am be[Eb]fore You
[Fm]Falling at Your [Db]feet
[Ab]All I want is [Eb]to be with You
[Fm]Lost in Your [Db]glory

{Chorus}
[Ab]And I will shout it from the [Eb]rooftops
[Fm]Singing Your [Db]name
[Ab]You're everything to me, [Eb]Jesus
[Fm]I'll shout Your [Db]name`,
    notes: "Kim Walker-Smith classic. Passionate and emotive, powerful live song.",
    bpm: 130,
    tags: ["worship","praise","declaration"],
  },
  {
    title: "Fierce [INCOMPLETE - needs V2+Bridge]",
    artist: "Jesus Culture",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Nothing could hold [D]back the rising
[Em]Nothing could hold [C]You down
[G]The grave couldn't keep [D]You from rising
[Em]You tore through the [C]veil

{Chorus}
[G]Your love is fierce, [D]Your love is wild
[Em]Your love is fierce, [C]Your love is wild
[G]It chases me down, [D]fights till I'm found
[Em]Leaves the ninety-[C]nine`,
    notes: "Driving and passionate, builds to explosive worship moments.",
    bpm: 132,
    tags: ["worship","love","pursuit"],
  },
  {
    title: "Never Gonna Stop Singing [INCOMPLETE - needs V2+Bridge]",
    artist: "Jesus Culture",
    originalKey: "Ab",
    format: "chordpro",
    content: `{Verse 1}
[Ab]When You opened [Eb]up the heavens
[Fm]And stepped down from [Db]the throne
[Ab]You laid aside [Eb]Your crown
[Fm]To make a way [Db]back home

{Chorus}
[Ab]I'm never gonna [Eb]stop singing
[Fm]I'm never gonna [Db]stop praising
[Ab]I'm never gonna [Eb]stop
[Fm]I love You, [Db]Lord`,
    notes: "High energy, singable chorus, great for extended praise sets.",
    bpm: 144,
    tags: ["worship","praise","joy"],
  },
  {
    title: "Freedom [INCOMPLETE - needs V2+Bridge]",
    artist: "Jesus Culture",
    originalKey: "Ab",
    format: "chordpro",
    content: `{Verse 1}
[Ab]Where the Spirit of the [Eb]Lord is
[Fm]There is free[Db]dom
[Ab]Where the Spirit of the [Eb]Lord is
[Fm]There is free[Db]dom

{Chorus}
[Ab]I am free, I am [Eb]free
[Fm]In the name of [Db]Jesus I am free
[Ab]For the Spirit of the [Eb]Lord is [Fm]here [Db]`,
    notes: "2 Corinthians 3:17. Build layers as the song progresses.",
    bpm: 80,
    tags: ["worship","freedom","spirit"],
  },
  {
    title: "Love Has a Name [INCOMPLETE - needs V2+Bridge]",
    artist: "Jesus Culture",
    originalKey: "Ab",
    format: "chordpro",
    content: `{Verse 1}
[Ab]Love has a [Eb]name
[Fm]He wore my sin and [Db]bore my shame
[Ab]Love has a [Eb]name
[Fm]Jesus, [Db]Jesus

{Chorus}
[Ab]The God of the [Eb]universe came down
[Fm]And wrapped Himself in [Db]flesh and bone
[Ab]Love has a [Eb]name, and it's [Db]Jesus`,
    notes: "Kim Walker-Smith vocal. Big dynamic range.",
    bpm: 72,
    tags: ["worship","love","Jesus"],
  },
  {
    title: "Where You Go I Go [INCOMPLETE - needs V2+Bridge]",
    artist: "Jesus Culture",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]Where You go I'll [A]go
[Bm]Where You stay I'll [G]stay
[D]When You move I'll [A]move
[Bm]I will follow [G]You

{Chorus}
[D]Who You love I'll [A]love
[Bm]How You serve I'll [G]serve
[D]If this life I lose [A]I will follow [G]You`,
    notes: "Kim Walker-Smith lead. Commitment declaration song.",
    bpm: 76,
    tags: ["worship","commitment","following"],
  },
  {
    title: "Come Away [INCOMPLETE - needs V2+Bridge]",
    artist: "Jesus Culture",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]Come away with [E]me
[F#m]Come away with [D]me
[A]It's never too [E]late, it's not too [F#m]late
[D]It's not too late for [A]you

{Chorus}
[A]I have a plan for [E]you
[F#m]I have a plan for [D]you
[A]It's gonna be [E]wild, it's gonna be [F#m]great
[D]It's gonna be full of [A]Me`,
    notes: "Joyful invitation. Uptempo with a sense of adventure.",
    bpm: 134,
    tags: ["worship","invitation","joy"],
  },
  {
    title: "Holding Nothing Back [INCOMPLETE - needs V2+Bridge]",
    artist: "Jesus Culture",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]I'm not holding nothing [B]back
[C#m]I surrender [A]all to You
[E]I lay it down for [B]You alone
[C#m]Every fear, every [A]doubt

{Chorus}
[E]Holding nothing [B]back
[C#m]Holding nothing [A]back
[E]I give You every[B]thing I have
[C#m]I'm holding nothing [A]back`,
    notes: "Full surrender anthem. Builds to passionate declaration.",
    bpm: 78,
    tags: ["worship","surrender","commitment"],
  },
  {
    title: "One Thing Remains (JC) [INCOMPLETE - needs V2+Bridge]",
    artist: "Jesus Culture",
    originalKey: "B",
    format: "chordpro",
    content: `{Verse 1}
[B]Higher than the [F#]mountains that I face
[G#m]Stronger than the [E]power of the grave
[B]Constant in the [F#]trial and the change
[G#m]One thing re[E]mains

{Chorus}
[B]Your love never [F#]fails, it never gives [G#m]up
[E]It never runs out on [B]me
[B]Your love never [F#]fails, it never gives [G#m]up
[E]It never runs out on [B]me`,
    notes: "Brian Johnson, Jeremy Riddle, Christa Black. Conference staple.",
    bpm: 130,
    tags: ["worship","love","faithfulness","anthem"],
  },
  {
    title: "How He Loves (JC) [INCOMPLETE - needs V2+Bridge]",
    artist: "Jesus Culture",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]He is jealous for [C#m]me
[A]Loves like a hurricane, [B]I am a tree
[E]Bending beneath the [C#m]weight of His wind
[A]And [B]mercy

{Chorus}
[E]Oh how He loves us [C#m]oh
[A]Oh how He loves [B]us
[E]How He loves [C#m]us oh
[A]So how He [B]loves us`,
    notes: "John Mark McMillan cover. Kim Walker-Smith's arrangement is iconic.",
    bpm: 72,
    tags: ["worship","love","grace","classic"],
  }
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
