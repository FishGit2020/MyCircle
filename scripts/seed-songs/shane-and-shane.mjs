#!/usr/bin/env node
/**
 * Seed Shane & Shane worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/shane-and-shane.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Psalm 23 (The Lord Is My Shepherd)",
    artist: "Shane & Shane",
    originalKey: "G",
    format: "chordpro",
    content: `[G]The Lord is my [C]shepherd
[G]I shall not [D]want
[Em]He makes me lie [C]down in green [G]pastures
[Em]He leads me be[C]side still [D]waters

[G]He restores my [C]soul
[G]He leads me in [D]paths of righteousness
[Em]For His name's [C]sake

[C]Surely goodness and [G]mercy
[Em]Shall follow [D]me
[C]All the days of my [G]life
[Em]And I will [C]dwell in the [D]house of the [G]Lord forever`,
    notes: "Gentle acoustic feel. Let the scripture breathe through the arrangement.",
    bpm: 70,
    tags: ["worship","psalm","peace","acoustic"],
  },
  {
    title: "Though You Slay Me",
    artist: "Shane & Shane",
    originalKey: "E",
    format: "chordpro",
    content: `[E]I come God I [B]come
[C#m]I return to the [A]Lord
[E]The one who's [B]broken
[C#m]The one who's [A]torn me apart

[E]You struck down to [B]bind me up
[C#m]You say You do it [A]all in love
[E]That I might [B]know You in Your [A]suffering

[E]Though You slay me [B]yet I will praise You
[C#m]Though You take from [A]me I will bless Your name
[E]Though You ruin [B]me still I will worship
[C#m]Sing a song to [A]the One who's all I need`,
    notes: "Raw and vulnerable. Acoustic guitar with minimal production. Features John Piper.",
    bpm: 68,
    tags: ["worship","lament","trust","suffering"],
  },
  {
    title: "Yearn",
    artist: "Shane & Shane",
    originalKey: "D",
    format: "chordpro",
    content: `[D]Holy design [G]this place in time
[Bm]That I might [A]seek and find my [D]God
[D]Lord I want to [G]yearn for You
[Bm]I want to [A]burn with passion [D]over You

[G]And only [D]You
[Bm]Lord I want to [A]yearn
[G]No other [D]fire
[Bm]No other [A]flame will do

[D]Your name is [G]like a fragrance
[Bm]In a meadow [A]fair and sweet
[D]Riding on the [G]wind and drawing [Bm]me to [A]You`,
    notes: "Intimate worship moment. Keep dynamics low and personal.",
    bpm: 66,
    tags: ["worship","intimacy","longing"],
  },
  {
    title: "The One You Love",
    artist: "Shane & Shane",
    originalKey: "C",
    format: "chordpro",
    content: `[C]Oh the over[G]whelming never[Am]ending reckless
[F]Love of [C]God
[C]Oh it chases [G]me down fights till I'm [Am]found
[F]Leaves the ninety-[C]nine

[Am]I am the [F]one You love
[C]I am the [G]one You love
[Am]Out of the [F]many called
[C]I am the [G]one You love

[C]And I don't de[G]serve it still You [Am]give Your[F]self away
[C]And I can't be[G]lieve it but You [Am]say I'm [F]one You love`,
    notes: "Tender and personal. Beautiful acoustic worship moment.",
    bpm: 72,
    tags: ["worship","love","identity","acoustic"],
  },
  {
    title: "Seas of Crimson",
    artist: "Shane & Shane",
    originalKey: "A",
    format: "chordpro",
    content: `[A]Would You part the [D]seas of crimson
[F#m]So that I might [E]cross to You
[A]Would You span the [D]great divide with
[F#m]Arms nailed [E]wide for me

[A]Oh the blood that [D]makes a way
[F#m]Grace that opened [E]wide the grave
[A]Death defeated [D]life complete
[F#m]Mercy flowing [E]wild and free

[D]Oh the wonder [A]of the cross
[D]Oh the beauty [A]of the blood
[D]That covers [F#m]all my [E]sin and [A]shame`,
    notes: "Cross-centered worship. Moderate tempo with emotional build.",
    bpm: 76,
    tags: ["worship","cross","grace","redemption"],
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
