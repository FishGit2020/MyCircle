#!/usr/bin/env node
/**
 * Seed Third Day worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/third-day.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Cry Out to Jesus",
    artist: "Third Day",
    originalKey: "G",
    format: "chordpro",
    content: `[G]For the marriage [D]that's struggling just to hang on
[Em]They've lost all of their [C]faith in love
[G]They've done all they can [D]to make it right again
[Em]Still it's not [C]enough

[G]For the ones who can't [D]break the addictions and chains
[Em]You've tried to give it up but you [C]come back again
[G]Just remember that you're [D]not alone in your shame

[G]There is hope for the [D]helpless
[Em]Rest for the weary
[C]Love for the broken heart
[G]There is grace and for[D]giveness
[Em]Mercy and healing
[C]He'll meet you wherever you are
[G]Cry out to [D]Jesus, [Em]cry out to [C]Jesus`,
    notes: "Compassionate and pastoral, for invitation moments",
    bpm: 74,
    tags: ["worship","comfort","invitation"],
  },
  {
    title: "Revelation (Third Day)",
    artist: "Third Day",
    originalKey: "E",
    format: "chordpro",
    content: `[E]My life has led me down the [B]road that's so uncertain
[C#m]Now I am left a[A]lone and I am broken
[E]Trying to find my [B]way
[C#m]Trying to find the [A]faith that's gone

[E]This time I found my [B]way down
[C#m]On my knees a[A]gain

[E]Cause I need You and I [B]need Your love to guide me
[C#m]And I need this revelation [A]to take me
[E]Revelation [B]revelation
[C#m]Holy revela[A]tion`,
    notes: "Rock anthem with dynamic buildup",
    bpm: 130,
    tags: ["worship","rock","revelation"],
  },
  {
    title: "Your Love Oh Lord",
    artist: "Third Day",
    originalKey: "A",
    format: "chordpro",
    content: `[A]Your love oh Lord [E]reaches to the heavens
[F#m]Your faithfulness [D]stretches to the sky
[A]Your righteousness [E]is like the mighty mountains
[F#m]Your justice flows [D]like the ocean's tide

[A]I will lift my [E]voice to worship You [F#m]my King
[D]I will find my [A]strength in the [E]shadow of Your wings
[F#m]Your love oh [D]Lord
[A]Your love oh [E]Lord
[F#m]Reaches to the [D]heavens`,
    notes: "Psalm 36 setting, sweeping and majestic",
    bpm: 82,
    tags: ["worship","psalm","majestic"],
  },
  {
    title: "Show Me Your Glory (Third Day)",
    artist: "Third Day",
    originalKey: "E",
    format: "chordpro",
    content: `[E]I caught a glimpse of [B]Your splendor
[C#m]In the corner of [A]my eye
[E]The most beautiful [B]thing I've ever seen
[C#m]And it was like a [A]flash of lightning

[E]Show me Your glory [B]send down Your presence
[C#m]I want to see Your [A]face
[E]Show me Your glory [B]majesty shines about You
[C#m]I can't go on with[A]out You [E]Lord`,
    notes: "Prayerful rock ballad, building dynamics",
    bpm: 78,
    tags: ["worship","prayer","glory"],
  },
  {
    title: "Soul on Fire",
    artist: "Third Day",
    originalKey: "G",
    format: "chordpro",
    content: `[G]God I'm running for Your [D]heart
[Em]I'm running for Your [C]heart
[G]Till I am a soul on [D]fire
[Em]Lord I'm longing for Your [C]ways
[G]I'm waiting for the [D]day
[Em]When I am a soul on [C]fire

[Em]Lord restore the [C]joy I had
[G]I have wandered [D]bring me back
[Em]In this darkness [C]lead me through
[G]Until all I [D]see is You

[G]God I'm running for Your [D]heart
[Em]I'm running for Your [C]heart
[G]Till I am a soul on [D]fire
[Em]Till I am a soul on [C]fire`,
    notes: "Driving rhythm, passionate plea",
    bpm: 126,
    tags: ["worship","passion","revival"],
  },
  {
    title: "I Need a Miracle",
    artist: "Third Day",
    originalKey: "C",
    format: "chordpro",
    content: `[C]Well no matter who you [G]are
[Am]And no matter what you've [F]done
[C]There will always be a [G]place for you at the
[Am]Foot of the [F]cross

[C]Late at night I could [G]hear the crying
[Am]I could hear their hearts [F]breaking
[C]It's a long dark road [G]I know
[Am]It's a long dark [F]road

[C]I need a miracle, [G]I need a miracle
[Am]Lord won't You do something [F]for me tonight
[C]I need a miracle, [G]I need a miracle
[Am]Jesus won't You come [F]through and make me [C]whole`,
    notes: "Rock anthem with heart, strong vocal delivery needed",
    bpm: 120,
    tags: ["worship","rock","faith"],
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
