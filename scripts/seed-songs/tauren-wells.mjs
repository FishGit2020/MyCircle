#!/usr/bin/env node
/**
 * Seed Tauren Wells worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/tauren-wells.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Known",
    artist: "Tauren Wells",
    originalKey: "E",
    format: "chordpro",
    content: `[E]In the middle of the [B]ocean
[C#m]You are there right [A]here beside me
[E]When I'm lost in the [B]shadows
[C#m]You see every[A]thing

[E]I'm fully [B]known and loved by You
[C#m]You won't let [A]go no matter what I do
[E]And it's not because I'm [B]worthy
[C#m]It's who You [A]are

[E]Nothing I could do could [B]make You love me less
[C#m]Nothing I could do could [A]make You love me more
[E]It's who You are, [B]it's who You are
[C#m]It's who You [A]are`,
    notes: "Identity in Christ. Smooth pop worship feel.",
    bpm: 72,
    tags: ["worship","identity","love"],
  },
  {
    title: "Famous For (I Believe)",
    artist: "Tauren Wells",
    originalKey: "B",
    format: "chordpro",
    content: `[B]I believe You're my [F#]healer
[G#m]I believe You are [E]all I need
[B]I believe You're my [F#]portion
[G#m]I believe You're more than [E]enough for me
[B]Jesus You're all I [F#]need

[B]You're famous for [F#]miracles
[G#m]Wonders and signs [E]follow You everywhere You go
[B]Heaven and earth [F#]respond whenever You speak
[G#m]Famous for miracles [E]wonders and signs
[B]You're famous [F#]for
[G#m]I believe [E]I believe`,
    notes: "With Jenn Johnson, building declaration anthem",
    bpm: 130,
    tags: ["worship","faith","declaration"],
  },
  {
    title: "Hills and Valleys",
    artist: "Tauren Wells",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Father, let Your [D]kingdom come
[Em]Let Your will be [C]done
[G]So my heart would [D]feel the weight of
[Em]Your Son's love for [C]me

[G]On the mountains [D]I will bow my life
[Em]To the One who [C]set me there
[G]In the valley [D]I will lift my eyes
[Em]To the One who [C]sees me there

[G]When I'm standing on the [D]mountain I didn't get there on my own
[Em]When I'm walking through the [C]valley I know I am not alone
[G]You're God of the [D]hills and valleys
[Em]Hills and [C]valleys
[G]God of the [D]hills and [Em]val[C]leys`,
    notes: "Testimony anthem, great for all seasons of life",
    bpm: 82,
    tags: ["worship","testimony","faithfulness"],
  },
  {
    title: "When We Pray",
    artist: "Tauren Wells",
    originalKey: "A",
    format: "chordpro",
    content: `[A]Mountains fall, [E]seas will part
[F#m]Healing comes to [D]every heart
[A]Prison walls [E]crumble and break
[F#m]All will change when [D]we pray

[A]When we pray [E]heaven invades
[F#m]Angels fight, [D]strongholds break
[A]Every fear [E]has to flee
[F#m]At the name of [D]Jesus every knee

[A]Bow low, [E]chains will fall
[F#m]There's freedom in the [D]name of Jesus
[A]When we [E]pray
[F#m]When we [D]pray`,
    notes: "Powerful declaration on prayer, building energy",
    bpm: 118,
    tags: ["worship","prayer","declaration"],
  },
  {
    title: "Fake It",
    artist: "Tauren Wells",
    originalKey: "G",
    format: "chordpro",
    content: `[G]I got bills I can't pay
[D]I got problems every day
[Em]I got weight on my shoulders
[C]That could break me in two

[G]But I know You won't leave me alone
[D]You said You'd never go
[Em]So I won't fake it
[C]No I won't fake it

[G]I'm not gonna [D]fake it
[Em]When the truth is I'm [C]breaking
[G]Not gonna [D]hide behind a smile
[Em]I won't pretend that [C]everything's fine
[G]But I'll come to You [D]honest
[Em]God I know that [C]You want this
[G]Real`,
    notes: "Vulnerable and honest, raw dynamics",
    bpm: 100,
    tags: ["worship","honesty","vulnerability"],
  },
  {
    title: "God's Not Done with You",
    artist: "Tauren Wells",
    originalKey: "Bb",
    format: "chordpro",
    content: `[Bb]You may think you're too [F]far gone
[Gm]But grace runs deeper still
[Eb]You may think you're past the [Bb]point of rescue
[F]But God is reaching, [Gm]He sees all your [Eb]pieces

[Bb]Don't give up, you are [F]loved
[Gm]God's not done with [Eb]you
[Bb]Even with your broken [F]heart and your wounds
[Gm]Even with your faded [Eb]scars
[Bb]God's not done with [F]you
[Gm]Oh He's not done with [Eb]you
[Bb]He's not done with you`,
    notes: "Encouragement anthem, soulful vocal delivery",
    bpm: 76,
    tags: ["worship","encouragement","grace"],
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
