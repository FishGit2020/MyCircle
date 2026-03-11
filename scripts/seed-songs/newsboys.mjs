#!/usr/bin/env node
/**
 * Seed Newsboys worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/newsboys.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "God's Not Dead",
    artist: "Newsboys",
    originalKey: "E",
    format: "chordpro",
    content: `[E]Let love explode and [B]bring the dead to life
[C#m]A love so bold to [A]see a revolution some how
[E]Let love explode and [B]bring the dead to life
[C#m]A love so bold to [A]bring a revolution somehow

[E]Now I'm lost in Your [B]freedom
[C#m]Oh this world I'll over[A]come

[E]My God's not dead He's [B]surely alive
[C#m]He's living on the [A]inside roaring like a lion
[E]God's not dead He's [B]surely alive
[C#m]He's living on the [A]inside roaring like a lion`,
    notes: "Powerful declaration, full band with strong beat",
    bpm: 128,
    tags: ["worship","declaration","rock"],
  },
  {
    title: "We Believe",
    artist: "Newsboys",
    originalKey: "G",
    format: "chordpro",
    content: `[G]In this time of despe[Em]ration
[C]When all we know is [D]doubt and fear
[G]There is only one foun[Em]dation
[C]We believe, [D]we believe

[G]We believe in God the [Em]Father
[C]We believe in Jesus [D]Christ
[G]We believe in the Holy [Em]Spirit
[C]And He's given us [D]new life
[G]We believe in the cruci[Em]fixion
[C]We believe that He con[D]quered death
[G]We believe in the resur[Em]rection
[C]And He's coming [D]back a[G]gain
[C]We be[D]lieve`,
    notes: "Creedal anthem, strong congregational singalong",
    bpm: 132,
    tags: ["worship","creed","anthem"],
  },
  {
    title: "He Reigns",
    artist: "Newsboys",
    originalKey: "D",
    format: "chordpro",
    content: `[D]It's the song of the re[A]deemed
[Bm]Rising from the Afri[G]can plain
[D]It's the song of the for[A]given
[Bm]Drowning out the Amazon [G]rain
[D]The song of Asian be[A]lievers
[Bm]Filled with God's holy [G]fire

[D]It's every tribe, every [A]tongue, every nation
[Bm]A love song born of a [G]grateful choir
[D]It's all God's [A]children singing
[Bm]Glory, glory, [G]hallelujah
[D]He reigns, [A]He reigns
[Bm]He [G]reigns`,
    notes: "Global worship anthem, percussive world-music feel",
    bpm: 116,
    tags: ["worship","anthem","missions"],
  },
  {
    title: "Born Again",
    artist: "Newsboys",
    originalKey: "A",
    format: "chordpro",
    content: `[A]Today is the day [E]You've made
[F#m]I will rejoice and be [D]glad in it
[A]Nothing can take Your [E]place
[F#m]Only the joy of [D]Your salvation

[A]I wanna live like [E]there's no tomorrow
[F#m]I wanna dance like [D]no one's around
[A]I wanna sing [E]like nobody's listening
[F#m]Before I lay my [D]body down

[A]I wanna be born [E]again, again, [F#m]again
[D]I wanna be born [A]again`,
    notes: "Joyful celebration, high energy with fun rhythm",
    bpm: 136,
    tags: ["worship","celebration","joy"],
  },
  {
    title: "Shine (Newsboys)",
    artist: "Newsboys",
    originalKey: "C",
    format: "chordpro",
    content: `[C]Dull as dirt, you can't assert the [F]kind of light
[G]That might persuade a [Am]strict dictator to re[F]tire
[C]Fire the army, teach the [F]poor origami
[G]The survey says You've got [Am]to sharpen your [F]rally

[C]Make em wonder what you've [F]got
[G]Make em wish that they were [Am]not
[F]On the outside looking [C]bored

[C]Shine, make em [F]wonder what you've got
[G]Make em wish that they were [Am]not
[F]On the outside looking [C]bored
[F]Shine, let it [G]shine before all [C]men`,
    notes: "Classic Newsboys pop-rock, fun and punchy",
    bpm: 132,
    tags: ["worship","pop-rock","classic"],
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
