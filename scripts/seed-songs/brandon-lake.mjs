#!/usr/bin/env node
/**
 * Seed Brandon Lake worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/brandon-lake.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Gratitude",
    artist: "Brandon Lake",
    originalKey: "B",
    format: "chordpro",
    content: `{Verse 1}
[B]All my words fall short, I got [G#m]nothing new
[E]How could I express all my [F#]gratitude

{Pre-Chorus}
[B]I could sing these songs as I [G#m]often do
[E]But every song must end and [F#]You never do

{Chorus}
[B]So I throw up my [G#m]hands and praise You again and again
[E]'Cause all that I have is a [F#]hallelujah, hallelujah
[B]And I know it's not [G#m]much but I've nothing else
[E]Fit for a King except for a [F#]heart singing hallelujah

{Bridge}
[B]Come on my soul, oh don't you get [G#m]shy on me
[E]Lift up your song, 'cause you got a [F#]lion inside of those lungs
[B]Get up and praise the [G#m]Lord`,
    notes: "Joyful praise. Let the gratitude overflow. Full energy.",
    bpm: 81,
    tags: ["praise","gratitude","joy"],
  },
  {
    title: "Coat of Many Colors",
    artist: "Brandon Lake",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]Every color tells a [A]story
[Bm]Every thread a lesson [G]learned
[D]Through the tearing and the [A]mending
[Bm]God was making something [G]beautiful

{Chorus}
[D]He's putting on a [A]coat of many colors
[Bm]He's weaving every [G]heartbreak into gold
[D]What the enemy meant for [A]evil
[Bm]God has turned for [G]good
[D]A coat of many [A]colors
[Bm]Tells the story of His [G]love`,
    notes: "Story-driven worship, vulnerable and personal",
    bpm: 78,
    tags: ["worship","testimony","redemption"],
  },
  {
    title: "I Need a Ghost",
    artist: "Brandon Lake",
    originalKey: "F#m",
    format: "chordpro",
    content: `{Verse 1}
[F#m]I've been running on [A]empty
[E]I've been trying to [F#m]fill this void
[F#m]But nothing in this [A]world
[E]Can give me what I [F#m]need

{Chorus}
[F#m]I need a Ghost, the [A]Holy Ghost
[E]Come fill me up, I [F#m]need You most
[F#m]More than the air I [A]breathe
[E]More than a melody [F#m]I need
[F#m]I need a Ghost, the [A]Holy Ghost
[E]Come set a fire [F#m]in my bones
[F#m]Spirit I'm calling [A]out
[E]I can't live with[F#m]out You now`,
    notes: "Passionate cry for the Spirit, dynamic buildup",
    bpm: 124,
    tags: ["worship","holy-spirit","passion"],
  },
  {
    title: "Count 'Em",
    artist: "Brandon Lake",
    originalKey: "Bm",
    format: "chordpro",
    content: `{Verse 1}
[Bm]Start from the beginning [G]go back to the start
[D]Think of all the times He [A]healed your broken heart
[Bm]And when you lose your [G]focus and you can't see His hand
[D]Count your bless[A]ings one by one

{Chorus}
[Bm]Count em, count em, [G]count your blessings
[D]One by one and [A]you will see
[Bm]Count em, count em, [G]count your blessings
[D]Name them one by [A]one
[Bm]And it will surprise you [G]what the Lord has done
[D]Count [A]em`,
    notes: "Joyful and grateful, clap-along energy",
    bpm: 126,
    tags: ["worship","gratitude","joy"],
  },
  {
    title: "More (Brandon Lake)",
    artist: "Brandon Lake",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]I've tasted and I've [E]seen
[F#m]But I want more of [D]You
[A]There's a longing in my [E]soul
[F#m]Only You can [D]fill

{Chorus}
[A]More, I want [E]more
[F#m]More of Your presence [D]Lord
[A]More, give me [E]more
[F#m]I can never get e[D]nough
[A]Of Your love, of Your [E]grace
[F#m]Of Your power and Your [D]face
[A]I want more, [E]more
[F#m]Give me [D]more`,
    notes: "Intimate prayer building to passionate cry",
    bpm: 80,
    tags: ["worship","prayer","hunger"],
  },
  {
    title: "Graves to Gardens (Brandon Lake)",
    artist: "Brandon Lake",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]I searched the world but it [F]couldn't fill me
[Gm]Man's empty praise and [Eb]treasures that fade
[Bb]Are never enough [F]
[Gm]Then You came along and [Eb]put me back together

{Chorus}
[Bb]And every part of me [F]cries out
[Gm]More, more, [Eb]more

{Verse 2}
[Bb]You turn mourning to [F]dancing
[Gm]You give beauty for [Eb]ashes
[Bb]You turn graves into [F]gardens
[Gm]You turn bones into [Eb]armies
[Bb]You turn seas into [F]highways
[Gm]You're the only one [Eb]who can
[Bb]You're the only one [F]who can`,
    notes: "Brandon Lake version emphasis, raw worship energy",
    bpm: 72,
    tags: ["worship","transformation","testimony"],
  },
  {
    title: "House of Miracles",
    artist: "Brandon Lake",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]This is the house of [F]miracles
[Gm]This is where You [Eb]move
[Bb]Nothing is impos[F]sible
[Gm]When we call on [Eb]You

{Chorus}
[Bb]Miracles happen [F]here
[Gm]In the presence of the [Eb]Lord
[Bb]This is the house of [F]miracles [Eb]`,
    notes: "Faith declaration over the house of God. Builds to climax.",
    bpm: 76,
    tags: ["worship","miracles","faith"],
  },
  {
    title: "Tear Off the Roof",
    artist: "Brandon Lake",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]We're tearing off the [E]roof
[F#m]Nothing's gonna stop us [D]now
[A]We're bringing every[E]thing to Jesus
[F#m]Laying it all [D]down

{Chorus}
[A]Like the friends who [E]tore the roof
[F#m]We will do what[D]ever it takes
[A]To get to [E]You [D]Lord`,
    notes: "Mark 2:1-12 reference. High-energy, faith-filled.",
    bpm: 138,
    tags: ["worship","faith","scripture"],
  },
  {
    title: "Greater Still",
    artist: "Brandon Lake",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]Greater still than [E]any mountain
[F#m]Greater still than [D]any sea
[A]Greater still than [E]all my failures
[F#m]Is the One who [D]lives in me

{Chorus}
[A]Greater still, [E]greater still
[F#m]Your love is greater [D]still
[A]Nothing compares to [E]who You are
[F#m]You are greater [D]still`,
    notes: "Bold declaration of God's greatness. Big sound, full energy.",
    bpm: 78,
    tags: ["worship","greatness","declaration"],
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
