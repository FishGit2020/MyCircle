#!/usr/bin/env node
/**
 * Seed Phil Wickham worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/phil-wickham.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Battle Belongs",
    artist: "Phil Wickham",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]When all I see is the battle
[G]You see my victory
[Am]When all I see is a mountain
[F]You see a mountain moved
[C]And as I walk through the shadow
[G]Your love surrounds me
[Am]There's nothing to fear now
[F]For I am safe with You

{Chorus}
[C]So when I fight I'll fight on my knees
[G]With my hands lifted high
[Am]Oh God the battle belongs to You
[F]And every fear I lay at Your feet
[C]I'll sing through the night
[G]Oh God the battle be[Am]longs to [F]You`,
    notes: "Declarative anthem. Great for spiritual warfare sets.",
    bpm: 144,
    tags: ["praise","warfare","anthem"],
  },
  {
    title: "House of the Lord",
    artist: "Phil Wickham",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]We worship the God who was
[Bm]We worship the God who is
[C]We worship the God who ever[D]more will be
[G]He opened the prison doors
[Bm]He parted the raging sea
[C]My God, He holds the vic[D]tory

{Chorus}
[G]There's joy in the [Bm]house of the Lord
[C]There's joy in the [D]house of the Lord today
[G]And we won't be [Bm]quiet
[C]We shout out Your [D]praise
[G]There's joy in the [Bm]house of the Lord
[C]Our God is [D]surely in this [G]place
And we won't be quiet
[C]We shout out Your [D]praise`,
    notes: "Joyful and energetic. Great opener or closer.",
    bpm: 128,
    tags: ["praise","joy","celebration"],
  },
  {
    title: "Great Things",
    artist: "Phil Wickham",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]Come let us worship our [A]King
[Bm]Come let us bow at His [G]feet
[D]He has done great [A]things
[D]See what our Savior has [A]done
[Bm]See how the victory's [G]won
[D]He has done great [A]things

{Chorus}
[D]He has done great [A]things
[Bm]Oh, hero of [G]heaven You conquered the grave
[D]You free every [A]captive and break every chain
[Bm]Oh God, You have done [G]great things

{Verse 2}
[D]We dance in Your [A]freedom, awake and alive
[Bm]Oh Jesus, our [G]Savior, Your name lifted high
[D]Oh God, You have done [A]great things`,
    notes: "Celebration song. Full band, big energy.",
    bpm: 100,
    tags: ["praise","celebration","victory"],
  },
  {
    title: "Living Hope",
    artist: "Phil Wickham",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]How great the chasm that [Am]lay between us
[F]How high the mountain I [C]could not climb
[C]In desperation I [Am]turned to heaven
[F]And spoke Your name into the [G]night

{Verse 2}
[C]Then through the darkness Your [Am]loving-kindness
[F]Tore through the shadows of my [C]soul
[C]The work is finished, the [Am]end is written
[F]Jesus Christ, my living [G]hope

{Chorus}
[Am]Hallelujah, [F]praise the One who set me free
[C]Hallelujah, death has lost its [G]grip on me
[Am]You have broken every [F]chain
There's salvation in Your [C]name
[G]Jesus Christ, my living [C]hope`,
    notes: "Easter anthem. Builds beautifully to the chorus.",
    bpm: 74,
    tags: ["worship","hope","resurrection"],
  },
  {
    title: "This Is Amazing Grace",
    artist: "Phil Wickham",
    originalKey: "B",
    format: "chordpro",
    content: `{Verse 1}
[B]Who breaks the power of sin and darkness
[G#m]Whose love is mighty and so much stronger
[E]The King of Glory, the King above all kings

{Chorus}
[B]Who shakes the whole earth with holy thunder
[G#m]And leaves us breathless in awe and wonder
[E]The King of Glory, the King above all kings

{Verse 2}
[B]This is amazing grace, [G#m]this is unfailing love
[E]That You would take my place, [F#]that You would bear my cross
[B]You laid down Your life, [G#m]that I would be set free
[E]Oh, Jesus, I sing for [F#]all that You've done for me`,
    notes: "Anthem of grace. Big, bold chorus. Play in A with capo 2.",
    bpm: 100,
    tags: ["praise","grace","anthem"],
  },
  {
    title: "Hymn of Heaven",
    artist: "Phil Wickham",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]How I long to breathe the [G]air of heaven
[Am]Where pain is gone and [F]mercy fills the streets
[C]To look upon the [G]one who bled to save me
[Am]And walk with Him for [F]all eternity

{Chorus}
[C]What a day, [G]what a day that will be
[Am]When my Jesus [F]I will see
[C]When He reaches out [G]His hands
[Am]And pulls me close to [F]Him again
[C]What a day, [G]what a day that will be`,
    notes: "Hopeful heaven anthem. Beautiful melody, builds grandly. Modern hymn feel.",
    bpm: 74,
    tags: ["worship","heaven","hope","hymn"],
  },
  {
    title: "Sunday Is Coming",
    artist: "Phil Wickham",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]They took Him to the [E]hill of Calvary
[F#m]Hung Him up for the [D]world to see
[A]Heaven and earth they [E]shook that day
[F#m]The stone was [D]rolled away

{Chorus}
[A]Friday's here but [E]Sunday is coming
[F#m]The grave could not con[D]tain the King
[A]Death was stung and [E]hell defeated
[F#m]All hail the risen [D]King`,
    notes: "Easter anthem. Narrative arc from crucifixion to resurrection.",
    bpm: 136,
    tags: ["worship","Easter","resurrection","cross"],
  },
  {
    title: "Your Love Awakens Me",
    artist: "Phil Wickham",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]There were walls be[E]tween us
[F#m]By the cross You came and [D]broke them down
[A]You broke them [E]down
[F#m]And there were chains a[D]round us

{Chorus}
[A]Your love a[E]wakens me
[F#m]Awakens [D]me
[A]Your love lifts me [E]up
[F#m]Your love a[D]wakens me
[A]From the dark[E]ness
[F#m]Into the [D]light`,
    notes: "Bright and uplifting, builds from gentle verse to soaring chorus.",
    bpm: 130,
    tags: ["worship","love","awakening","freedom"],
  },
  {
    title: "Divine Exchange",
    artist: "Phil Wickham",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]You took my sin, [D]gave me Your righteousness
[Em]You took my shame, [C]clothed me in holiness
[G]Carried my curse, [D]nailed it to the cross
[Em]Divine ex[C]change

{Chorus}
[G]What a divine ex[D]change
[Em]The innocent for [C]the guilty
[G]What a divine ex[D]change
[Em]His life for [C]mine`,
    notes: "Atonement-focused. Reverent and powerful, great for communion services.",
    bpm: 68,
    tags: ["worship","atonement","cross","grace"],
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
