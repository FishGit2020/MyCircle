#!/usr/bin/env node
/**
 * Seed Matt Redman worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/matt-redman.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "10,000 Reasons (Bless the Lord)",
    artist: "Matt Redman",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Bless the Lord, [Em]oh my soul, [C]oh my soul
[G]Worship His [D]holy name
[Em]Sing like [C]never before, [G]oh my [D]soul
[G]I'll worship Your holy name

[G]The sun comes up, [Em]it's a new day dawning
[C]It's time to sing Your [D]song again
[G]Whatever may pass and [Em]whatever lies before me
[C]Let me be singing when the [D]evening comes

[G]You're rich in love and [Em]You're slow to anger
[C]Your name is great and [D]Your heart is kind
[G]For all Your goodness [Em]I will keep on singing
[C]Ten thousand reasons for my [D]heart to find`,
    notes: "One of the most popular worship songs of the decade. Simple and powerful.",
    bpm: 73,
    tags: ["worship","praise","classic"],
  },
  {
    title: "Blessed Be Your Name",
    artist: "Matt Redman",
    originalKey: "B",
    format: "chordpro",
    content: `[B]Blessed be Your name in the [E]land that is plentiful
[B]Where Your streams of a[F#]bundance flow, [E]blessed be Your name
[B]Blessed be Your name when I'm [E]found in the desert place
[B]Though I walk through the [F#]wilderness, [E]blessed be Your name

[B]Every blessing You [E]pour out I'll turn back to praise
[B]When the darkness [F#]closes in, Lord, [E]still I will say

[B]Blessed be the name of the [E]Lord, blessed be Your name
[B]Blessed be the name of the [F#]Lord
[E]Blessed be Your glorious [B]name`,
    notes: "Classic worship anthem for all seasons. Easy to lead.",
    bpm: 128,
    tags: ["worship","praise","all seasons"],
  },
  {
    title: "Heart of Worship",
    artist: "Matt Redman",
    originalKey: "D",
    format: "chordpro",
    content: `[D]When the music [A]fades, all is stripped a[Em]way
[G]And I simply [D]come
[D]Longing just to [A]bring something that's of [Em]worth
[G]That will bless Your [A]heart

[D]I'll bring You more than a [A]song
[Em]For a song in itself is [G]not what You have re[D]quired
[D]You search much deeper with[A]in
[Em]Through the way things ap[G]pear, You're looking into my [A]heart

[D]I'm coming back to the [A]heart of worship
[Em]And it's all about [G]You, all about [D]You Jesus
[D]I'm sorry Lord for the [A]thing I've made it
[Em]When it's all about [G]You, all about [D]You Jesus`,
    notes: "Back to basics worship. Acoustic, intimate, stripped down.",
    bpm: 72,
    tags: ["worship","intimacy","classic"],
  },
  {
    title: "One Day",
    artist: "Matt Redman",
    originalKey: "Bb",
    format: "chordpro",
    content: `[Bb]One day when [F]heaven opens up
[Gm]When we see [Eb]Jesus face to face
[Bb]When all the [F]shadows flee away
[Gm]And our eyes be[Eb]hold that day

[Bb]One day, [F]one day
[Gm]Every tongue will [Eb]confess Your name
[Bb]One day, [F]one day
[Gm]You will make all [Eb]things new again`,
    notes: "Eschatological hope anthem. Builds grandly to the bridge.",
    bpm: 76,
    tags: ["worship","hope","heaven","return"],
  },
  {
    title: "Never Once",
    artist: "Matt Redman",
    originalKey: "Bb",
    format: "chordpro",
    content: `[Bb]Standing on this [F]mountaintop
[Gm]Looking just how [Eb]far we've come
[Bb]Knowing that for [F]every step
[Gm]You were with [Eb]us

[Bb]Never once did we [F]ever walk alone
[Gm]Never once did You [Eb]leave us on our own
[Bb]You are faithful, [F]God You are faithful
[Gm]You are [Eb]faithful`,
    notes: "Testimony of faithfulness. Reflective verse, powerful chorus declaration.",
    bpm: 72,
    tags: ["worship","faithfulness","testimony"],
  },
  {
    title: "You Never Let Go",
    artist: "Matt Redman",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Even though I walk through the [D]valley
[Em]Of the shadow of [C]death
[G]Your perfect love is [D]casting out fear
[Em]And even when I'm [C]caught in the middle

[G]Oh no, You never let [D]go
[Em]Through the calm and [C]through the storm
[G]Oh no, You never let [D]go
[Em]Every high and [C]every low
[G]Oh no, You never let [D]go
[Em]Lord, You never let go of [C]me`,
    notes: "Classic reassurance anthem. Upbeat feel despite valley imagery.",
    bpm: 130,
    tags: ["worship","comfort","faithfulness","trust"],
  },
  {
    title: "Better Is One Day",
    artist: "Matt Redman",
    originalKey: "E",
    format: "chordpro",
    content: `[E]How lovely is Your [B]dwelling place
[C#m]O Lord Al[A]mighty
[E]My soul longs and [B]even faints
[C#m]For You[A]

[E]Better is one day in Your [B]courts
[C#m]Better is one day in Your [A]house
[E]Better is one day in Your [B]courts
[C#m]Than thousands else[A]where`,
    notes: "Psalm 84 paraphrase. Classic Matt Redman, joyful and devotional.",
    bpm: 128,
    tags: ["worship","devotion","psalm","classic"],
  },
  {
    title: "Let Everything That Has Breath",
    artist: "Matt Redman",
    originalKey: "A",
    format: "chordpro",
    content: `[A]Let everything that, [E]everything that
[F#m]Everything that has [D]breath praise the Lord
[A]Let everything that, [E]everything that
[F#m]Everything that has [D]breath praise the Lord

[A]Praise You in the [E]morning
[F#m]Praise You in the [D]evening
[A]Praise You when I'm [E]young and when I'm old
[F#m]Praise You when I'm [D]laughing
[A]Praise You when I'm [E]grieving`,
    notes: "Psalm 150 celebration. High energy, congregational classic.",
    bpm: 144,
    tags: ["worship","praise","psalm","celebration"],
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
