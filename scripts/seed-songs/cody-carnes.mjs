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
    title: "Run to the Father [INCOMPLETE - needs V2+Bridge]",
    artist: "Cody Carnes",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]I've carried a [G]burden for too [Am]long on my own
[F]I wasn't cre[C]ated to bear it a[G]lone
[C]I hear Your in[G]vitation to [Am]let it all go
[F]I see it now I'm [C]laying it [G]down

{Chorus}
[C]And oh I run to the [G]Father
[Am]I fall into [F]grace
[C]I'm done with the [G]hiding
[Am]No reason to [F]wait
[C]My heart needs a [G]surgeon
[Am]My soul needs a [F]friend
[C]So I'll run to the [G]Father a[Am]gain and a[F]gain`,
    notes: "Vulnerable and tender. Piano-driven with emotional build.",
    bpm: 72,
    tags: ["worship","grace","father","return"],
  },
  {
    title: "Nothing Else [INCOMPLETE - needs Bridge]",
    artist: "Cody Carnes",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]I'm caught up in Your [G]presence
[Am]I just want to sit [F]here at Your feet
[C]I'm caught up in this [G]holy moment
[Am]I never want to [F]leave

{Chorus}
[C]Nothing else [G]nothing else
[Am]Nothing else [F]matters
[C]Just to sit here [G]at Your feet
[Am]Nothing else [F]matters

{Verse 2}
[C]I'm not here for [G]blessing
[Am]Jesus You don't owe me [F]anything
[C]More than anything that [G]You can do
[Am]I just want [F]You`,
    notes: "Intimate soaking worship. Let it repeat and build in the Spirit.",
    bpm: 64,
    tags: ["worship","intimacy","presence","devotion"],
  },
  {
    title: "Christ Be Magnified [INCOMPLETE - needs Bridge]",
    artist: "Cody Carnes",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]Were creation [D]both creation's [A]mean and end
[F#m]Ground for demon's [D]terror foun[E]tain for the faint

{Chorus}
[A]Oh Christ be magni[D]fied
[A]Let His praise a[E]rise
[F#m]Christ be magni[D]fied in me
[A]Oh Christ be magni[D]fied
[A]From the altar [E]of my life
[F#m]Christ be magni[D]fied in [A]me

{Verse 2}
[D]I won't bow to [A]idols I'll stand [E]strong and worship [F#m]You
[D]And if it puts me [A]in the fire [E]I'll rejoice cause You're there too`,
    notes: "Bold declaration. Builds from intimate verse to anthemic chorus.",
    bpm: 76,
    tags: ["worship","declaration","surrender","anthem"],
  },
  {
    title: "The Cross Has the Final Word",
    artist: "Cody Carnes",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]The cross has the [C]final word
[Em]The cross has the [D]final word
[G]Darkness cannot [C]overcome
[Em]Shame no longer [D]has a voice

{Chorus}
[G]He has the [C]final word
[Em]He has the [D]final word

{Verse 2}
[C]Fear is a [G]liar [D]death is de[Em]feated
[C]The cross has the [G]final [D]word
[C]Love is vic[G]torious [D]heaven is [Em]speaking
[C]The cross has the [D]final [G]word

{Bridge}
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
    content: `{Verse 1}
[G]I will not be [C]shaken
[Em]I will not be [D]moved
[G]My feet are [C]firmly planted
[Em]My hope is built on [D]You

{Chorus}
[G]Rain came and [C]wind blew
[Em]But my house was built on [D]You
[G]I'm safe with [C]You I'm going to make it [Em]through [D]

{Bridge}
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
