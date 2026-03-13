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
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]God of Abraham, [Am]You're the God of covenant
[F]And of faithful [G]promises
[C]Time and time again [Am]You have proven
[F]You'll do just what [G]You said

{Chorus}
[C]Though the storms may come and the [Am]winds may blow
[F]I'll remain stead[G]fast
[C]And let my heart learn when [Am]You speak a word
[F]It will come to [G]pass

{Verse 2}
[C]Great is Your faith[Am]fulness to me
[F]Great is Your faith[G]fulness to me
[C]From the rising [Am]sun to the setting same
[F]I will praise Your [G]name
[C]Great is Your faith[Am]fulness to me`,
    notes: "Declaration of faithfulness. Steady build throughout.",
    bpm: 71,
    tags: ["worship","faithfulness","promise"],
  },
  {
    title: "Breathe",
    artist: "Maverick City Music",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]This is the air I breathe
[B]This is the air I breathe
[C#m]Your holy presence [A]living in me

{Chorus}
[E]This is my daily bread
[B]This is my daily bread
[C#m]Your very word [A]spoken to me

{Verse 2}
[E]And I, [B]I'm desperate for You
[C#m]And I, [A]I'm lost without You

{Chorus}
[E]This is the air I breathe
[B]This is the air I breathe
[C#m]Your holy presence [A]living in me`,
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
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Miracle worker, [Em]promise keeper
[C]Light in the darkness, [D]my God
[G]That is who You are [Em]
[C]That is who You are [D]

{Chorus}
[G]Way maker, [Em]chain breaker
[C]That is who You [D]are

{Verse 2}
[G]This mountain, it may [Em]look so big
[C]But God we know that [D]You are bigger
[G]This sickness, it may [Em]look so big
[C]But God we know that [D]You are bigger

{Chorus}
[G]You're the man of Your [Em]word
[C]You never have and never [D]will
[G]Change Your mind, You're [Em]faithful
[C]You have been and always [D]will be good`,
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
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]I don't want to [D]do a thing
[Em]If You're not in [C]it
[G]I don't want to [D]go somewhere
[Em]If You're not [C]there

{Chorus}
[G]Move my heart [D]to move Your heart
[Em]Let me not be [C]satisfied
[G]Moving through this [D]world without You
[Em]Move Your [C]heart`,
    notes: "UPPERROOM collab. Tender and devotional, spontaneous worship feel.",
    bpm: 66,
    tags: ["worship","surrender","devotion","prayer"],
  },
  {
    title: "Wait on You",
    artist: "Maverick City Music",
    originalKey: "Ab",
    format: "chordpro",
    content: `{Verse 1}
[Ab]I'm gonna wait on [Eb]You
[Fm]I know You're never [Db]late
[Ab]I'm gonna worship [Eb]while I wait
[Fm]I'm not gonna [Db]move ahead of You

{Chorus}
[Ab]Wait on You, [Eb]Lord
[Fm]I'll wait on [Db]You
[Ab]My help comes [Eb]from You
[Fm]So I will wait on [Db]You`,
    notes: "Elevation collab. Patient and faith-filled. Gradual build, powerful bridge.",
    bpm: 68,
    tags: ["worship","patience","trust","waiting"],
  },
  {
    title: "Talking to Jesus",
    artist: "Maverick City Music",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]I've been talking to [D]Jesus
[Em]He said it's gonna [C]be alright
[G]I've been talking to [D]Jesus
[Em]And He said everything's [C]gonna be fine

{Chorus}
[G]Even when the [D]world seems out of control
[Em]Even when the [C]storms are raging
[G]I've been talking to [D]Jesus
[Em]He said it's gonna [C]be alright`,
    notes: "Maverick City x Elevation. Comforting and simple, prayer anthem.",
    bpm: 72,
    tags: ["worship","prayer","comfort"],
  },
  {
    title: "Fear Is Not My Future",
    artist: "Maverick City Music",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]Fear is not my [G]future
[Am]You are, You [F]are
[C]Sickness is not [G]my story
[Am]You are, You [F]are

{Chorus}
[C]You are my [G]future
[Am]You are my [F]joy
[C]You are my [G]comfort
[Am]My hope is [F]found in You`,
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
