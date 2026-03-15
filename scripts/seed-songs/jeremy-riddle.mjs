#!/usr/bin/env node
/**
 * Seed Jeremy Riddle worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/jeremy-riddle.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Furious [INCOMPLETE - needs V2+Bridge]",
    artist: "Jeremy Riddle",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]Nothing can stop Your [Am]love for me
[F]You delight in [G]showing mercy
[C]Nothing will ever [Am]take Your place
[F]You've been faithful [G]from the start

{Chorus}
[C]His love is [Am]furious, His love is [F]furious
[G]His love is furious for [C]me
[C]His love is [Am]deep, His love is [F]wide
[G]And it covers us
[C]His love is [Am]fierce, His love is [F]strong
[G]It is furious`,
    notes: "Passionate declaration of God's fierce love. Medium build.",
    bpm: 80,
    tags: ["worship","love","passion"],
  },
  {
    title: "Fall Afresh [INCOMPLETE - needs V2+Bridge]",
    artist: "Jeremy Riddle",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]Awaken my soul, come [B]awake
[C#m]To hunger, to [A]seek, to thirst
[E]Awaken first love, come [B]alive
[C#m]And do as You [A]please

{Chorus}
[E]Spirit of the living [B]God come fall afresh on me
[C#m]Come wake me from my [A]sleep
[E]Blow through the caverns [B]of my soul
[C#m]Pour in me to [A]overflow
[E]To over[B]flow`,
    notes: "Intimate prayer song. Let it breathe. Acoustic-led.",
    bpm: 66,
    tags: ["worship","prayer","Holy Spirit"],
  },
  {
    title: "Sweetly Broken [INCOMPLETE - needs Bridge]",
    artist: "Jeremy Riddle",
    originalKey: "B",
    format: "chordpro",
    content: `{Verse 1}
[B]To the cross I [F#]look, to the cross I [G#m]cling
[E]Of its suffering [F#]I do drink
[B]Of its work I [F#]do sing
[G#m]On it my Savior, [E]both bruised and [F#]crushed
[B]Showed that God is [F#]love
[G#m]And God is [E]just

{Chorus}
[B]At the cross You [F#]beckon me
[G#m]You draw me [E]gently to my [F#]knees and I am
[B]Lost for words, so [F#]lost in love
[G#m]I'm sweetly [E]broken, wholly [F#]surrendered

{Verse 2}
[B]What a priceless [F#]gift, undeserved [G#m]life
[E]Have I been [F#]given
[B]Through Christ [F#]crucified`,
    notes: "Communion song. Tender and reverent. Acoustic guitar focus.",
    bpm: 70,
    tags: ["worship","communion","cross"],
  },
  {
    title: "Prepare the Way [INCOMPLETE - needs Bridge]",
    artist: "Jeremy Riddle",
    originalKey: "Em",
    format: "chordpro",
    content: `{Verse 1}
[Em]You have called us [C]out of darkness
[G]Into Your mar[D]velous light
[Em]We are Your people, [C]Your possession
[G]Set apart to [D]worship You

{Chorus}
[Em]Prepare the [C]way, prepare the [G]way
[D]Prepare the way of the [Em]Lord
[C]Make straight the [G]paths
[D]Here in our hearts

{Verse 2}
[Em]Let every valley [C]be lifted up
[G]Let every mountain [D]be made low
[Em]Let every crooked [C]path be made straight
[G]For the glory of the [D]Lord`,
    notes: "Based on Isaiah 40. Prophetic worship moment.",
    bpm: 82,
    tags: ["worship","prophetic","preparation"],
  },
  {
    title: "Worthy [INCOMPLETE - needs Bridge]",
    artist: "Jeremy Riddle",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]Holy, holy, [A]Lord God Almighty
[Bm]Who was and is and [G]is to come
[D]With all creation I [A]sing
[Bm]Praise to the [G]King of kings
[D]You are my [A]everything
[Bm]And I will a[G]dore You

{Chorus}
[D]Worthy is the [A]Lamb who was slain
[Bm]Worthy is the [G]King who conquered the grave
[D]Worthy is the [A]Lamb who was slain
[Bm]Worthy, [G]worthy, worthy

{Verse 2}
[D]Crown Him with many [A]crowns
[Bm]The Lamb upon [G]His throne`,
    notes: "Heavenly worship. Rev 4-5 inspired. Majestic.",
    bpm: 72,
    tags: ["worship","worthy","revelation"],
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
