#!/usr/bin/env node
/**
 * Seed Darlene Zschech worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/darlene-zschech.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Victor's Crown",
    artist: "Darlene Zschech",
    originalKey: "B",
    format: "chordpro",
    content: `[B]You are always [F#]fighting for us
[G#m]Heaven's angels [E]all around
[B]My delight is [F#]found in knowing
[G#m]That You wear the [E]Victor's crown

[B]You're my help and [F#]my defender
[G#m]You're my Savior [E]and my friend
[B]By Your grace I [F#]live and breathe to
[G#m]Worship [E]You

[B]At the cross the work was [F#]finished
[G#m]You were buried [E]in the ground
[B]But the grave could not con[F#]tain You
[G#m]For You wear the [E]Victor's crown`,
    notes: "Victory anthem, triumphant and bold",
    bpm: 128,
    tags: ["worship","victory","anthem"],
  },
  {
    title: "Worthy Is the Lamb",
    artist: "Darlene Zschech",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Thank You for the [D]cross Lord
[Em]Thank You for the [C]price You paid
[G]Bearing all my [D]sin and shame
[Em]In love You [C]came
[G]And gave amazing [D]grace

[G]Thank You for this [D]love Lord
[Em]Thank You for the [C]nail-pierced hands
[G]Washed me in Your [D]cleansing flow
[Em]Now all I [C]know
[G]Your forgiveness [D]and embrace

[C]Worthy is the [D]Lamb
[G]Seated on the [Em]throne
[C]Crown You now with [D]many crowns
[G]You reign victori[Em]ous
[C]High and lifted [D]up
[Em]Jesus Son of [C]God
[G]The darling of [D]heaven cruci[G]fied
[C]Worthy is the [D]Lamb [G]`,
    notes: "Hillsong classic, Darlene Zschech signature song",
    bpm: 72,
    tags: ["worship","communion","classic"],
  },
  {
    title: "In Jesus' Name",
    artist: "Darlene Zschech",
    originalKey: "G",
    format: "chordpro",
    content: `[G]God is fighting [D]for us
[Em]God is on our [C]side
[G]He has made a [D]way for us
[Em]And leads us with His [C]light

[G]In Jesus' name [D]we pray
[Em]Come and pour Your [C]Spirit out
[G]In Jesus' name [D]we pray
[Em]Come and fill this [C]place

[G]Your glory, God, is [D]what our hearts long for
[Em]To be overcome by [C]Your presence Lord
[G]In Jesus' [D]name
[Em]In Jesus' [C]name`,
    notes: "Prayerful and congregational, strong declaration",
    bpm: 82,
    tags: ["worship","prayer","declaration"],
  },
  {
    title: "God Is Here",
    artist: "Darlene Zschech",
    originalKey: "A",
    format: "chordpro",
    content: `[A]How we love You [E]Lord
[F#m]How we love You [D]Lord
[A]We give You our [E]hearts
[F#m]We give You our [D]lives

[A]God is here, [E]God is here
[F#m]Come and adore [D]Him
[A]God is here, [E]God is here
[F#m]We bow before [D]Him

[A]There's a fire that [E]burns within our hearts
[F#m]A passion for Your [D]name
[A]Come breathe on us, [E]come breathe on us
[F#m]Lord let Your glory [D]fall`,
    notes: "Atmospheric and reverent, builds to powerful declaration",
    bpm: 76,
    tags: ["worship","presence","adoration"],
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
