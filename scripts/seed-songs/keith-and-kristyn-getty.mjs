#!/usr/bin/env node
/**
 * Seed Keith & Kristyn Getty worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/keith-and-kristyn-getty.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "In Christ Alone",
    artist: "Keith & Kristyn Getty",
    originalKey: "D",
    format: "chordpro",
    content: `[D]In Christ a[G]lone my [A]hope is [D]found
[D]He is my [G]light my [A]strength my [D]song
[D]This corner[G]stone this [A]solid [Bm]ground
[G]Firm through the [A]fiercest drought and [D]storm

[D]What heights of [G]love what [A]depths of [D]peace
[D]When fears are [G]stilled when [A]strivings [D]cease
[D]My comfor[G]ter my [A]all in [Bm]all
[G]Here in the [A]love of Christ I [D]stand`,
    notes: "Classic hymn, keep it reverent and building. Works well with strings or simple piano.",
    bpm: 80,
    tags: ["worship","hymn","foundation"],
  },
  {
    title: "Speak O Lord",
    artist: "Keith & Kristyn Getty",
    originalKey: "C",
    format: "chordpro",
    content: `[C]Speak O Lord as [F]we come to [C]You
[Am]To receive the [F]food of Your [G]holy word
[C]Take Your truth plant [F]it deep in [C]us
[Am]Shape and [F]fashion [G]us in Your [C]likeness

[F]That the light of [C]Christ might be [Am]seen today
[F]In our acts of [C]love and our [G]deeds of faith
[C]Speak O Lord and [F]fulfill in [C]us
[Am]All Your [F]purposes [G]for Your [C]glory`,
    notes: "Prayerful opening, gentle piano lead. Let the congregation sing softly.",
    bpm: 72,
    tags: ["worship","prayer","hymn"],
  },
  {
    title: "The Power of the Cross (Getty)",
    artist: "Keith & Kristyn Getty",
    originalKey: "Eb",
    format: "chordpro",
    content: `[Eb]Oh to see the [Ab]dawn of the [Eb]darkest day
[Cm]Christ on the [Ab]road to [Bb]Calvary
[Eb]Tried by sinful [Ab]men torn and [Eb]beaten then
[Cm]Nailed to a [Bb]cross of [Eb]wood

[Eb]This the power [Ab]of the [Eb]cross
[Cm]Christ became [Ab]sin for [Bb]us
[Eb]Took the blame [Ab]bore the [Eb]wrath
[Cm]We stand for[Bb]given at the [Eb]cross`,
    notes: "Solemn and powerful, suits Good Friday services. Build slowly.",
    bpm: 68,
    tags: ["worship","cross","hymn","easter"],
  },
  {
    title: "By Faith",
    artist: "Keith & Kristyn Getty",
    originalKey: "G",
    format: "chordpro",
    content: `[G]By faith we see the [C]hand of God
[G]In the light of [D]creation's grand de[G]sign
[G]In the lives of [C]those who prove His
[G]Faithful[D]ness who walk by [G]faith and not by sight

[C]We will stand as [G]children of the [D]promise
[C]We will fix our [G]eyes on Him our [D]soul's reward
[C]Till the race is [G]finished and the [Em]work is [D]done
[C]We'll walk by [D]faith and not by [G]sight`,
    notes: "Congregational hymn with strong melody. Irish-influenced arrangement.",
    bpm: 76,
    tags: ["worship","faith","hymn"],
  },
  {
    title: "My Worth Is Not in What I Own",
    artist: "Keith & Kristyn Getty",
    originalKey: "D",
    format: "chordpro",
    content: `[D]My worth is not in [G]what I own
[D]Not in the [A]strength of flesh and [D]bone
[Bm]But in the [G]costly wounds of [A]love at the [D]cross

[D]My worth is not in [G]skill or name
[D]In win or [A]lose in pride or [D]shame
[Bm]But in the [G]blood of Christ that [A]flowed at the [D]cross

[G]I rejoice in [D]my Redeemer
[G]Greatest treasure [D]wellspring of my [A]soul
[G]I will trust in [D]Him no other
[Bm]My soul is [G]satisfied in [A]Him a[D]lone`,
    notes: "Reflective tempo, works beautifully as a hymn of identity and assurance.",
    bpm: 74,
    tags: ["worship","identity","hymn","cross"],
  },
  {
    title: "Facing a Task Unfinished",
    artist: "Keith & Kristyn Getty",
    originalKey: "Bb",
    format: "chordpro",
    content: `[Bb]Facing a task un[Eb]finished
[Bb]That drives us [F]to our [Bb]knees
[Bb]A need that un[Eb]diminished
[Bb]Rebukes our [F]slothful [Bb]ease

[Eb]We who rejoice to [Bb]know Thee
[Eb]Renew before Thy [Bb]throne
[Eb]The solemn [Bb]pledge we [F]owe Thee
[Eb]To go and [F]make Thee [Bb]known

[Bb]We go to [Eb]all the [Bb]world
[Gm]With kingdom [Eb]hope un[F]furled
[Bb]No other [Eb]name has [Bb]power to [F]save
[Eb]But Jesus [F]Christ the [Bb]Lord`,
    notes: "Majestic mission hymn. Full band with brass if possible.",
    bpm: 108,
    tags: ["worship","missions","hymn","declaration"],
  },
  {
    title: "He Will Hold Me Fast",
    artist: "Keith & Kristyn Getty",
    originalKey: "A",
    format: "chordpro",
    content: `[A]When I fear my [D]faith will fail
[A]Christ will hold me [E]fast
[A]When the tempter [D]would prevail
[A]He will [E]hold me [A]fast

[D]He will hold me [A]fast
[D]He will hold me [A]fast
[A]For my Savior [D]loves me [A]so
[A]He will [E]hold me [A]fast

[A]Those He saves are [D]His delight
[A]Christ will hold me [E]fast
[A]Precious in His [D]holy sight
[A]He will [E]hold me [A]fast`,
    notes: "Simple and reassuring. Piano-driven with gentle build.",
    bpm: 78,
    tags: ["worship","assurance","hymn","trust"],
  },
  {
    title: "Keith Getty Hymn Medley",
    artist: "Keith & Kristyn Getty",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Come people of the [C]risen King
[Em]Who delight to [D]bring Him praise
[G]Come all and tune your [C]hearts to sing
[Em]To the morning [D]star of grace

[G]From the shifting [C]shadows of the earth
[Em]We will lift our [D]eyes to Him
[G]Where steady arms of [C]mercy reach
[Em]To gather [D]children [G]in

[C]Rejoice re[G]joice let every [D]tongue rejoice
[C]One heart one [G]voice O [D]Church of Christ re[G]joice`,
    notes: "Celebratory gathering hymn. Irish feel with fiddle and bodhran.",
    bpm: 118,
    tags: ["worship","hymn","gathering","celebration"],
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
