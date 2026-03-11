#!/usr/bin/env node
/**
 * Seed Cody Carnes worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/cody-carnes.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Run to the Father",
    artist: "Cody Carnes",
    originalKey: "A",
    format: "chordpro",
    content: `[A]I've carried a [E]burden for too [F#m]long on my own
[D]I wasn't cre[A]ated to bear it a[E]lone
[A]I hear Your in[E]vitation to [F#m]let it all go
[D]I see it now I'm [A]laying it [E]down

[A]And oh I run to the [E]Father
[F#m]I fall into [D]grace
[A]I'm done with the [E]hiding
[F#m]No reason to [D]wait
[A]My heart needs a [E]surgeon
[F#m]My soul needs a [D]friend
[A]So I'll run to the [E]Father a[F#m]gain and a[D]gain`,
    notes: "Vulnerable and tender. Piano-driven with emotional build.",
    bpm: 72,
    tags: ["worship","grace","father","return"],
  },
  {
    title: "Nothing Else",
    artist: "Cody Carnes",
    originalKey: "E",
    format: "chordpro",
    content: `[E]I'm caught up in Your [B]presence
[C#m]I just want to sit [A]here at Your feet
[E]I'm caught up in this [B]holy moment
[C#m]I never want to [A]leave

[E]Nothing else [B]nothing else
[C#m]Nothing else [A]matters
[E]Just to sit here [B]at Your feet
[C#m]Nothing else [A]matters

[E]I'm not here for [B]blessing
[C#m]Jesus You don't owe me [A]anything
[E]More than anything that [B]You can do
[C#m]I just want [A]You`,
    notes: "Intimate soaking worship. Let it repeat and build in the Spirit.",
    bpm: 64,
    tags: ["worship","intimacy","presence","devotion"],
  },
  {
    title: "Christ Be Magnified",
    artist: "Cody Carnes",
    originalKey: "B",
    format: "chordpro",
    content: `[B]Were creation [E]both creation's [B]mean and end
[G#m]Ground for demon's [E]terror foun[F#]tain for the faint

[B]Oh Christ be magni[E]fied
[B]Let His praise a[F#]rise
[G#m]Christ be magni[E]fied in me
[B]Oh Christ be magni[E]fied
[B]From the altar [F#]of my life
[G#m]Christ be magni[E]fied in [B]me

[E]I won't bow to [B]idols I'll stand [F#]strong and worship [G#m]You
[E]And if it puts me [B]in the fire [F#]I'll rejoice cause You're there too`,
    notes: "Bold declaration. Builds from intimate verse to anthemic chorus.",
    bpm: 76,
    tags: ["worship","declaration","surrender","anthem"],
  },
  {
    title: "The Cross Has the Final Word",
    artist: "Cody Carnes",
    originalKey: "G",
    format: "chordpro",
    content: `[G]The cross has the [C]final word
[Em]The cross has the [D]final word
[G]Darkness cannot [C]overcome
[Em]Shame no longer [D]has a voice

[G]He has the [C]final word
[Em]He has the [D]final word

[C]Fear is a [G]liar [D]death is de[Em]feated
[C]The cross has the [G]final [D]word
[C]Love is vic[G]torious [D]heaven is [Em]speaking
[C]The cross has the [D]final [G]word

[G]The tomb where they [C]laid Him has [Em]nothing in[D]side`,
    notes: "Cross-centered anthem. Simple melody with powerful theology.",
    bpm: 78,
    tags: ["worship","cross","victory","declaration"],
  },
  {
    title: "Firm Foundation (Cody Carnes)",
    artist: "Cody Carnes",
    originalKey: "G",
    format: "chordpro",
    content: `[G]I will not be [C]shaken
[Em]I will not be [D]moved
[G]My feet are [C]firmly planted
[Em]My hope is built on [D]You

[G]Rain came and [C]wind blew
[Em]But my house was built on [D]You
[G]I'm safe with [C]You I'm going to make it [Em]through [D]

[C]Firm founda[G]tion
[D]You are my firm founda[Em]tion
[C]I will not be [G]shaken
[D]Steadfast unmov[Em]able
[C]My firm founda[G]tion [D]You are [Em]strong
[C]My firm founda[D]tion`,
    notes: "Cody Carnes version with Chandler Moore. Energetic gospel-worship fusion.",
    bpm: 130,
    tags: ["worship","foundation","faith","declaration"],
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
