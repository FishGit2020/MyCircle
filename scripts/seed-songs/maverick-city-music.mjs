#!/usr/bin/env node
/**
 * Seed Maverick City Music worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/maverick-city-music.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Promises",
    artist: "Maverick City Music",
    originalKey: "Ab",
    format: "chordpro",
    content: `{Verse 1}
[Ab]God of Abraham, [Fm]You're the God of covenant
[Db]And of faithful [Eb]promises
[Ab]Time and time again [Fm]You have proven
[Db]You'll do just what [Eb]You said

{Chorus}
[Ab]Though the storms may come and the [Fm]winds may blow
[Db]I'll remain stead[Eb]fast
[Ab]And let my heart learn when [Fm]You speak a word
[Db]It will come to [Eb]pass

{Verse 2}
[Ab]Great is Your faith[Fm]fulness to me
[Db]Great is Your faith[Eb]fulness to me
[Ab]From the rising [Fm]sun to the setting same
[Db]I will praise Your [Eb]name
[Ab]Great is Your faith[Fm]fulness to me`,
    notes: "Declaration of faithfulness. Steady build throughout.",
    bpm: 71,
    tags: ["worship","faithfulness","promise"],
  },
  {
    title: "Breathe",
    artist: "Maverick City Music",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]This is the air I breathe
[E]This is the air I breathe
[F#m]Your holy presence [D]living in me

{Chorus}
[A]This is my daily bread
[E]This is my daily bread
[F#m]Your very word [D]spoken to me

{Verse 2}
[A]And I, [E]I'm desperate for You
[F#m]And I, [D]I'm lost without You

{Chorus}
[A]This is the air I breathe
[E]This is the air I breathe
[F#m]Your holy presence [D]living in me`,
    notes: "Intimate worship. Acoustic, gentle, prayerful.",
    bpm: 60,
    tags: ["worship","intimacy","prayer"],
  },
  {
    title: "Jireh (feat. Chandler Moore)",
    artist: "Maverick City Music",
    originalKey: "B",
    format: "chordpro",
    content: `{Verse 1}
[B]I'll never be more [G#m]loved than I am right now
[E]Wasn't holding You up, so there's nothing I can do to [B]let You down
[B]Doesn't take a [G#m]trophy to make You proud
[E]I'll never be more [F#]loved than I am right [B]now

{Chorus}
[B]Jireh, You are e[G#m]nough
[E]Jireh, You are e[F#]nough

{Verse 2}
[B]I will be con[G#m]tent in every circum[E]stance
You are [F#]Jireh, You are e[B]nough

{Chorus}
[B]Already [G#m]enough, already [E]enough, already [F#]enough`,
    notes: "Same song as Elevation version but with Chandler Moore ad-libs. Gentle and free.",
    bpm: 69,
    tags: ["worship","provision","contentment"],
  },
  {
    title: "Refiner",
    artist: "Maverick City Music",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]I want to be tried by [B]fire, purified
[C#m]You take whatever You de[A]sire
Lord here I [E]am

{Chorus}
[E]I wanna be more like [B]You, and all I need
[C#m]I know I'll find it in [A]You
So take my [E]life

{Verse 2}
[E]Refiner's [B]fire, my heart's one de[C#m]sire
Is to be [A]holy
[E]Set apart for [B]You, Lord
I choose to be [C#m]holy
[A]Set apart for You my [E]master
[B]Ready to do Your [C#m]will`,
    notes: "Surrender song. Acoustic led, intimate moment.",
    bpm: 68,
    tags: ["worship","surrender","holiness"],
  },
  {
    title: "Man of Your Word",
    artist: "Maverick City Music",
    originalKey: "B",
    format: "chordpro",
    content: `{Verse 1}
[B]Miracle worker, [G#m]promise keeper
[E]Light in the darkness, [F#]my God
[B]That is who You are [G#m]
[E]That is who You are [F#]

{Chorus}
[B]Way maker, [G#m]chain breaker
[E]That is who You [F#]are

{Verse 2}
[B]This mountain, it may [G#m]look so big
[E]But God we know that [F#]You are bigger
[B]This sickness, it may [G#m]look so big
[E]But God we know that [F#]You are bigger

{Chorus}
[B]You're the man of Your [G#m]word
[E]You never have and never [F#]will
[B]Change Your mind, You're [G#m]faithful
[E]You have been and always [F#]will be good`,
    notes: "Declaration anthem. Works great with a worship team.",
    bpm: 82,
    tags: ["praise","faithfulness","declaration"],
  },
  {
    title: "Thank You",
    artist: "Maverick City Music",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]Thank You for the [G]cross, Lord
[Am]Thank You for the [F]price You paid
[C]Bearing all my [G]sin and shame
[Am]In love You [F]came

{Chorus}
[C]Thank You, [G]thank You
[Am]For the grace You [F]gave me
[C]Thank You, [G]thank You
[Am]My whole life changed [F]forever`,
    notes: "Grateful worship, simple and heartfelt. Piano-led, gradually builds.",
    bpm: 70,
    tags: ["worship","gratitude","cross"],
  },
  {
    title: "Fresh Wind",
    artist: "Maverick City Music",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Come and breathe on [D]us now
[Em]Spirit, come and [C]fill this place
[G]Come and breathe on [D]us now
[Em]Holy Spirit, [C]have Your way

{Chorus}
[G]Fresh wind, come and [D]breathe on us
[Em]Fresh fire, come and [C]burn in us
[G]All consuming [D]God
[Em]Have Your [C]way`,
    notes: "Prayer anthem. Chandler Moore lead. Build from whisper to shout.",
    bpm: 76,
    tags: ["worship","Holy Spirit","prayer","revival"],
  },
  {
    title: "Firm Foundation",
    artist: "Maverick City Music",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]I've got a firm [G]foundation
[Am]I've got a firm [F]foundation
[C]Rain came and [G]wind blew
[Am]But my house was built on [F]You

{Chorus}
[C]I put my faith in [G]Jesus
[Am]My anchor to the [F]ground
[C]Unmovable, un[G]shakeable
[Am]My hope is built on [F]nothing less`,
    notes: "Cody Carnes co-write. Singable anthem, great for congregational singing.",
    bpm: 132,
    tags: ["worship","faith","foundation"],
  },
  {
    title: "Move Your Heart",
    artist: "Maverick City Music",
    originalKey: "B",
    format: "chordpro",
    content: `{Verse 1}
[B]I don't want to [F#]do a thing
[G#m]If You're not in [E]it
[B]I don't want to [F#]go somewhere
[G#m]If You're not [E]there

{Chorus}
[B]Move my heart [F#]to move Your heart
[G#m]Let me not be [E]satisfied
[B]Moving through this [F#]world without You
[G#m]Move Your [E]heart`,
    notes: "UPPERROOM collab. Tender and devotional, spontaneous worship feel.",
    bpm: 66,
    tags: ["worship","surrender","devotion","prayer"],
  },
  {
    title: "Wait on You",
    artist: "Maverick City Music",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]I'm gonna wait on [A]You
[Bm]I know You're never [G]late
[D]I'm gonna worship [A]while I wait
[Bm]I'm not gonna [G]move ahead of You

{Chorus}
[D]Wait on You, [A]Lord
[Bm]I'll wait on [G]You
[D]My help comes [A]from You
[Bm]So I will wait on [G]You`,
    notes: "Elevation collab. Patient and faith-filled. Gradual build, powerful bridge.",
    bpm: 68,
    tags: ["worship","patience","trust","waiting"],
  },
  {
    title: "Talking to Jesus",
    artist: "Maverick City Music",
    originalKey: "B",
    format: "chordpro",
    content: `{Verse 1}
[B]I've been talking to [F#]Jesus
[G#m]He said it's gonna [E]be alright
[B]I've been talking to [F#]Jesus
[G#m]And He said everything's [E]gonna be fine

{Chorus}
[B]Even when the [F#]world seems out of control
[G#m]Even when the [E]storms are raging
[B]I've been talking to [F#]Jesus
[G#m]He said it's gonna [E]be alright`,
    notes: "Maverick City x Elevation. Comforting and simple, prayer anthem.",
    bpm: 72,
    tags: ["worship","prayer","comfort"],
  },
  {
    title: "Fear Is Not My Future",
    artist: "Maverick City Music",
    originalKey: "Eb",
    format: "chordpro",
    content: `{Verse 1}
[Eb]Fear is not my [Bb]future
[Cm]You are, You [Ab]are
[Eb]Sickness is not [Bb]my story
[Cm]You are, You [Ab]are

{Chorus}
[Eb]You are my [Bb]future
[Cm]You are my [Ab]joy
[Eb]You are my [Bb]comfort
[Cm]My hope is [Ab]found in You`,
    notes: "Brandon Lake x Chandler Moore. Bold declaration, stadium-ready anthem.",
    bpm: 134,
    tags: ["worship","hope","declaration","freedom"],
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
