#!/usr/bin/env node
/**
 * Seed All Sons & Daughters worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/all-sons-and-daughters.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Great Are You Lord (All Sons & Daughters)",
    artist: "All Sons & Daughters",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]You give life You are [Em]love
[A]You bring light to the [D]darkness
[D]You give hope You re[Em]store
[A]Every heart that is [D]broken

{Chorus}
[D]Great are You [Em]Lord

{Verse 2}
[D]It's Your breath in our [Em]lungs
[A]So we pour out our [D]praise
[D]We pour out our [Em]praise
[A]It's Your breath in our [D]lungs
[D]So we pour out our [Em]praise to [A]You on[D]ly`,
    notes: "The original All Sons & Daughters version. Intimate duo arrangement.",
    bpm: 70,
    tags: ["worship","praise","breath prayer","intimate"],
  },
  {
    title: "Rising Sun",
    artist: "All Sons & Daughters",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]Praise Him all you [B]sinners
[C#m]For His love pur[A]sues
[E]Praise Him all you [B]lost ones
[C#m]He has carried [A]you

{Chorus}
[E]Lift your weary [B]head it's time to [C#m]rise up
[A]We are people of the rising [E]sun
[E]We are fire and [B]we are burn[C#m]ing
[A]It is who we are

{Verse 2}
[A]We are people [E]of the rising [B]sun
[A]Of the rising [E]sun`,
    notes: "Building anthem. Start sparse and let it build to full band declaration.",
    bpm: 82,
    tags: ["worship","declaration","hope","anthem"],
  },
  {
    title: "Called Me Higher",
    artist: "All Sons & Daughters",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]I could just sit [D]I could just sit and [Em]wait for all Your [C]goodness
[G]Hope to feel Your [D]presence and I'll [Em]do my best to [C]worship

{Chorus}
[G]Or I could [D]step out on the [Em]water
[C]What ever You [G]call me to [D]do
[Em]Cause You have [C]called me higher
[G]You have called me [D]deeper
[Em]Into Your [C]will into Your [G]heart

{Verse 2}
[G]I will love the [D]ones You love and [Em]serve like You have [C]served me
[G]I will go and [D]do Your will [Em]Lord You've called me [C]higher`,
    notes: "Moderate tempo with room for reflection. Acoustic guitar driven.",
    bpm: 78,
    tags: ["worship","calling","obedience","acoustic"],
  },
  {
    title: "Reason to Sing",
    artist: "All Sons & Daughters",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]Tonight I can [E]see the stars
[F#m]Oh they're shining [D]so bright tonight
[A]And I wonder why [E]this broken world
[F#m]Is still turning a[D]round

{Chorus}
[A]Oh how could I [E]have this hope
[F#m]When everything [D]around me falls

{Verse 2}
[A]You give me a [E]reason to sing
[F#m]You give me a [D]reason to sing
[A]You give me a [E]reason
[F#m]I'm living for [D]something more than just a song`,
    notes: "Reflective verse building to hopeful chorus. Beautiful harmonies.",
    bpm: 74,
    tags: ["worship","hope","purpose","acoustic"],
  },
  {
    title: "Sovereign Over Us",
    artist: "All Sons & Daughters",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]There is strength with[C]in the sorrow
[Em]There is beauty [D]in our tears
[G]And You meet us [C]in our mourning
[Em]With a love that [D]casts out fear

{Chorus}
[G]You are working [C]in our waiting
[Em]Sanctifying [D]us
[G]When beyond our [C]understanding
[Em]You're teaching [D]us to trust

{Verse 2}
[C]Your plans are [G]still to prosper
[D]You have not for[Em]gotten us
[C]You're with us in the [G]fire and the [D]flood
[C]You're faithful for[G]ever perfect in [D]love
[Em]You are sovereign [C]over [G]us`,
    notes: "Michael W. Smith cover made popular by All Sons & Daughters. Tender and comforting.",
    bpm: 74,
    tags: ["worship","sovereignty","trust","lament"],
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
