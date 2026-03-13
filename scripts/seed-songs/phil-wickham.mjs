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
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]When all I see is the battle
[A]You see my victory
[Bm]When all I see is a mountain
[G]You see a mountain moved
[D]And as I walk through the shadow
[A]Your love surrounds me
[Bm]There's nothing to fear now
[G]For I am safe with You

{Chorus}
[D]So when I fight I'll fight on my knees
[A]With my hands lifted high
[Bm]Oh God the battle belongs to You
[G]And every fear I lay at Your feet
[D]I'll sing through the night
[A]Oh God the battle be[Bm]longs to [G]You`,
    notes: "Declarative anthem. Great for spiritual warfare sets.",
    bpm: 144,
    tags: ["praise","warfare","anthem"],
  },
  {
    title: "House of the Lord",
    artist: "Phil Wickham",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]We worship the God who was
[Dm]We worship the God who is
[Eb]We worship the God who ever[F]more will be
[Bb]He opened the prison doors
[Dm]He parted the raging sea
[Eb]My God, He holds the vic[F]tory

{Chorus}
[Bb]There's joy in the [Dm]house of the Lord
[Eb]There's joy in the [F]house of the Lord today
[Bb]And we won't be [Dm]quiet
[Eb]We shout out Your [F]praise
[Bb]There's joy in the [Dm]house of the Lord
[Eb]Our God is [F]surely in this [Bb]place
And we won't be quiet
[Eb]We shout out Your [F]praise`,
    notes: "Joyful and energetic. Great opener or closer.",
    bpm: 128,
    tags: ["praise","joy","celebration"],
  },
  {
    title: "Great Things",
    artist: "Phil Wickham",
    originalKey: "B",
    format: "chordpro",
    content: `{Verse 1}
[B]Come let us worship our [F#]King
[G#m]Come let us bow at His [E]feet
[B]He has done great [F#]things
[B]See what our Savior has [F#]done
[G#m]See how the victory's [E]won
[B]He has done great [F#]things

{Chorus}
[B]He has done great [F#]things
[G#m]Oh, hero of [E]heaven You conquered the grave
[B]You free every [F#]captive and break every chain
[G#m]Oh God, You have done [E]great things

{Verse 2}
[B]We dance in Your [F#]freedom, awake and alive
[G#m]Oh Jesus, our [E]Savior, Your name lifted high
[B]Oh God, You have done [F#]great things`,
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
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]Who breaks the power of sin and darkness
[Am]Whose love is mighty and so much stronger
[F]The King of Glory, the King above all kings

{Chorus}
[C]Who shakes the whole earth with holy thunder
[Am]And leaves us breathless in awe and wonder
[F]The King of Glory, the King above all kings

{Verse 2}
[C]This is amazing grace, [Am]this is unfailing love
[F]That You would take my place, [G]that You would bear my cross
[C]You laid down Your life, [Am]that I would be set free
[F]Oh, Jesus, I sing for [G]all that You've done for me`,
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
    originalKey: "B",
    format: "chordpro",
    content: `{Verse 1}
[B]There were walls be[F#]tween us
[G#m]By the cross You came and [E]broke them down
[B]You broke them [F#]down
[G#m]And there were chains a[E]round us

{Chorus}
[B]Your love a[F#]wakens me
[G#m]Awakens [E]me
[B]Your love lifts me [F#]up
[G#m]Your love a[E]wakens me
[B]From the dark[F#]ness
[G#m]Into the [E]light`,
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
