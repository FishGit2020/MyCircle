#!/usr/bin/env node
/**
 * Seed Michael W. Smith worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/michael-w-smith.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Above All",
    artist: "Michael W. Smith",
    originalKey: "A",
    format: "chordpro",
    content: `[A]Above all [E/G#]powers, above all [F#m]kings
[D]Above all [A/C#]nature and all [Bm]created [E]things
[A]Above all [E/G#]wisdom and all the [F#m]ways of man
[D]You were here be[E]fore the world be[A]gan

[D]Crucified, [A/C#]laid behind a [Bm]stone
[D]You lived to [A/C#]die, rejected and [E]alone
[F#m]Like a rose [E]trampled on the [D]ground
[A/C#]You took the fall and thought of [Bm]me
[E]Above [A]all`,
    notes: "Tender and reverent, let the lyrics breathe",
    bpm: 66,
    tags: ["worship","devotional","communion"],
  },
  {
    title: "Agnus Dei",
    artist: "Michael W. Smith",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Alleluia, [C]alleluia
[D]For the Lord God Almighty [G]reigns
[G]Alleluia, [C]alleluia
[D]For the Lord God Almighty [G]reigns
[Em]Alle[C]lu[G]ia

[C]Holy, [G/B]holy
[Am]Are You Lord God Al[G]mighty
[C]Worthy is the [G/B]Lamb
[Am]Worthy is the [D]Lamb
[G]You are holy, [C]ho[D]ly
[G]Are You Lord God Al[C]mighty [D]
[G]Worthy is the [C]Lamb [D]
[G]Worthy is the Lamb [C]A[D]men`,
    notes: "Classic worship moment, build layers gradually",
    bpm: 72,
    tags: ["worship","reverence","classic"],
  },
  {
    title: "Great Is the Lord",
    artist: "Michael W. Smith",
    originalKey: "C",
    format: "chordpro",
    content: `[C]Great is the Lord, He is [F]holy and just
[G]By His power we [Am]trust in His [F]love
[C]Great is the Lord, He is [F]faithful and true
[G]By His mercy He [Am]proves He is [F]love

[Dm]Great is the [G]Lord
[C]And worthy of [Am]glory
[Dm]Great is the [G]Lord
[C]And worthy of [Am]praise
[Dm]Great is the [G]Lord
[Am]Now lift up your [F]voice
[G]Now lift up your [C]voice
[Dm]Great [G]is the [C]Lord`,
    notes: "Timeless praise song, let the congregation sing strong",
    bpm: 116,
    tags: ["worship","classic","praise"],
  },
  {
    title: "Ancient Words",
    artist: "Michael W. Smith",
    originalKey: "D",
    format: "chordpro",
    content: `[D]Holy words long pre[G]served
[A]For our walk in this [D]world
[D]They resound with God's [G]own heart
[A]Oh let the ancient [D]words impart

[D]Ancient words ever [G]true
[A]Changing me and changing [Bm]you
[G]We have come with open [D/F#]hearts
[Em]Oh let the [A]ancient words im[D]part

[G]Words of life, [A]words of hope
[Bm]Give us strength, [G]help us cope
[D/F#]In this world [Em]where'er we roam
[A]Ancient words will guide us [D]home`,
    notes: "Prayerful and reflective, great for scripture reading transitions",
    bpm: 80,
    tags: ["worship","devotional","scripture"],
  },
  {
    title: "Breathe (Michael W. Smith)",
    artist: "Michael W. Smith",
    originalKey: "A",
    format: "chordpro",
    content: `[A]This is the [E]air I breathe
[F#m]This is the [D]air I breathe
[A]Your holy [E]presence
[F#m]Living in [D]me

[A]This is my [E]daily bread
[F#m]This is my [D]daily bread
[A]Your very [E]Word
[F#m]Spoken to [D]me

[A]And I, [E]I'm desperate for [F#m]You
[D]And I, [A]I'm lost without [E]You
[F#m]I'm lost with[D]out You`,
    notes: "Intimate worship moment, minimal instrumentation preferred",
    bpm: 68,
    tags: ["worship","devotional","intimate"],
  },
  {
    title: "Open the Eyes of My Heart (MWS)",
    artist: "Michael W. Smith",
    originalKey: "D",
    format: "chordpro",
    content: `[D]Open the eyes of my heart Lord
[A]Open the eyes of my heart
[Bm]I want to [G]see You
[D]I want to [A]see You

[D]Open the eyes of my heart Lord
[A]Open the eyes of my heart
[Bm]I want to [G]see You
[D]I want to [A]see You

[G]To see You [A]high and lifted [Bm]up
[G]Shining in the [A]light of Your [D]glory
[G]Pour out Your [A]power and [Bm]love
[G]As we cry [A]holy holy [D]holy`,
    notes: "Paul Baloche original, MWS arrangement with fuller band",
    bpm: 106,
    tags: ["worship","prayer","classic"],
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
