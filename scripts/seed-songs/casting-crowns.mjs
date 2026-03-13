#!/usr/bin/env node
/**
 * Seed Casting Crowns worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/casting-crowns.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Who Am I",
    artist: "Casting Crowns",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]Who am I, that the [D]Lord of all the earth
[F#m]Would care to know my [E]name
[A]Would care to feel my [D]hurt
[A]Who am I, that the [D]bright and morning star
[F#m]Would choose to light the [E]way
[A]For my ever wandering [D]heart

{Chorus}
[A]Not because of [D]who I am
[F#m]But because of [E]what You've done
[A]Not because of [D]what I've done
[F#m]But because of [E]who You are

{Verse 2}
[A]I am a flower quickly [D]fading
[F#m]Here today and gone to[E]morrow
[A]A wave tossed in the [D]ocean
[F#m]A vapor in the [E]wind
[A]Still You hear me when I'm [D]calling
[F#m]Lord You catch me when I'm [E]falling
[A]And You've told me who I [D]am
[F#m]I am [E]Yours, I am [A]Yours`,
    notes: "Classic CCM worship song. Very singable.",
    bpm: 68,
    tags: ["worship","identity","classic"],
  },
  {
    title: "Praise You in This Storm",
    artist: "Casting Crowns",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]I was sure by now, [B]God You would have reached down
[C#m]And wiped our tears a[A]way, stepped in and saved the day
[E]But once again, I [B]say amen
[C#m]And it's still [A]raining

{Chorus}
[E]And I'll praise You [B]in this storm
[C#m]And I will lift my [A]hands
[E]For You are who You [B]are
[C#m]No matter where I [A]am
[E]And every tear I've [B]cried
[C#m]You hold in Your [A]hand
[E]You never left my [B]side
[C#m]And though my heart is [A]torn
I will praise You in this [E]storm`,
    notes: "Song for the hard seasons. Comforting and honest.",
    bpm: 66,
    tags: ["worship","storm","perseverance"],
  },
  {
    title: "Scars in Heaven",
    artist: "Casting Crowns",
    originalKey: "F",
    format: "chordpro",
    content: `{Verse 1}
[F]If I had only [C]known the last time
[Dm]Would be the last time
[Bb]I would have put off all the things I had to do
[F]I would have stayed a [C]little longer
[Dm]Held on a little [Bb]tighter, now what I'd give for one more day with you

{Chorus}
[F]The only scars in [C]heaven
[Dm]They won't belong to [Bb]me and you
[F]There'll be no such thing as [C]broken
[Dm]And all the old made [Bb]new`,
    notes: "Tender grief song offering hope. Gentle throughout, piano-led.",
    bpm: 66,
    tags: ["worship","hope","grief","heaven"],
  },
  {
    title: "Thrive",
    artist: "Casting Crowns",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Here in this worn and [D]weary land
[Em]Where many a dream has [C]died
[G]Like a tree planted [D]by the water
[Em]We never will run [C]dry

{Chorus}
[G]We're gonna thrive, [D]not just survive
[Em]Oh we're gonna [C]thrive
[G]Into a life of [D]joy we'll grow
[Em]And we're gonna [C]thrive`,
    notes: "Upbeat and encouraging, driving beat, good for opening sets.",
    bpm: 142,
    tags: ["worship","growth","joy","encouragement"],
  },
  {
    title: "Just Be Held",
    artist: "Casting Crowns",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]Hold it all to[F]gether
[Gm]Everybody needs you [Eb]strong
[Bb]But life hits you out of [F]nowhere
[Gm]And barely leaves you [Eb]holding on

{Chorus}
[Bb]So when you're on your [F]knees and answers
[Gm]Seem so far a[Eb]way
[Bb]You're not alone, [F]stop holding on
[Gm]And just be [Eb]held`,
    notes: "Comfort anthem for hard seasons. Gentle and steady. Piano-driven.",
    bpm: 68,
    tags: ["worship","comfort","rest","trust"],
  },
  {
    title: "One Step Away",
    artist: "Casting Crowns",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]Maybe you've been [E]walking for days
[F#m]Maybe you've run [D]out of things to say
[A]Maybe life has [E]taken its toll
[F#m]Maybe you just [D]need to come back home

{Chorus}
[A]You're one step [E]away
[F#m]From surrender, [D]one prayer away
[A]From the arms of [E]Jesus
[F#m]One step a[D]way`,
    notes: "Invitation song, gentle and reassuring. Good for altar calls.",
    bpm: 72,
    tags: ["worship","invitation","grace","return"],
  },
  {
    title: "Nobody",
    artist: "Casting Crowns",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]Why You ever [G]chose me
[Am]Has always been a [F]mystery
[C]All my life I've [G]been told I belong
[Am]At the end of [F]a line

{Chorus}
[C]I'm just a nobody [G]trying to tell everybody
[Am]All about Somebody [F]who saved my soul
[C]Ever since You [G]rescued me
[Am]You gave my heart a [F]song to sing`,
    notes: "Feat. Matthew West. Upbeat testimony song, fun pop-rock feel.",
    bpm: 130,
    tags: ["worship","testimony","grace","calling"],
  },
  {
    title: "Healer",
    artist: "Casting Crowns",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]You hold my every [A]moment
[Bm]You calm my raging [G]seas
[D]You walk with me through [A]fire
[Bm]And heal all my [G]disease

{Chorus}
[D]I believe You're my [A]healer
[Bm]I believe You are [G]all I need
[D]I believe You're my [A]portion
[Bm]I believe You're more [G]than enough for me`,
    notes: "Kari Jobe original, Casting Crowns arrangement. Faith declaration.",
    bpm: 68,
    tags: ["worship","healing","faith","declaration"],
  },
  {
    title: "Great Are You Lord (CC)",
    artist: "Casting Crowns",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]You give life, You are [Em]love
[A]You bring light to the [D]darkness
[D]You give hope, You re[Em]store
[A]Every heart that is [D]broken

{Chorus}
[D]Great are You [Em]Lord
[A]It's Your breath in our [D]lungs
[D]So we pour out our [Em]praise
[A]We pour out our [D]praise
[D]It's Your breath in our [Em]lungs
[A]So we pour out our [D]praise to You only`,
    notes: "Casting Crowns arrangement, distinct from All Sons & Daughters version. Powerful live.",
    bpm: 70,
    tags: ["worship","praise","adoration"],
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
