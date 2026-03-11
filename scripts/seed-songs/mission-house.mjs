#!/usr/bin/env node
/**
 * Seed Mission House worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/mission-house.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Wouldn't It Be Like You",
    artist: "Mission House",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Wouldn't it be [D]like You
[Em]To take my broken [C]pieces
[G]Wouldn't it be [D]like You
[Em]To turn them into [C]something beautiful

[G]Wouldn't it be [D]like You
[Em]To meet me in this [C]valley
[G]Wouldn't it be [D]like You
[Em]To carry me through the [C]night

[C]Oh, it'd be just like [Em]You
[D]It'd be just like [G]You
[C]To take the weight I'm [Em]under
[D]And turn it all a[G]round`,
    notes: "Signature Mission House song. Tender and building. Great for reflective moments.",
    bpm: 72,
    tags: ["worship","trust","faithfulness","reflective"],
  },
  {
    title: "Come and Listen",
    artist: "Mission House",
    originalKey: "D",
    format: "chordpro",
    content: `[D]Come and listen, [A]come and listen
[Bm]To what the Lord [G]has done
[D]Come and listen, [A]come and listen
[Bm]He has saved my [G]soul

[D]I was lost but [A]now I'm found
[Bm]Was blind but [G]now I see
[D]His grace has [A]turned my life around
[Bm]Come and listen [G]to His song of love

[G]He is faithful, [D]He is able
[Bm]He is worthy [A]of our praise
[G]Come and listen, [D]come and listen
[Bm]Lift His name [A]today`,
    notes: "Joyful invitation song. Works well as a gathering opener.",
    bpm: 120,
    tags: ["worship","praise","invitation","testimony"],
  },
  {
    title: "Already Done",
    artist: "Mission House",
    originalKey: "C",
    format: "chordpro",
    content: `[C]It's already [G]done
[Am]It's already [F]done
[C]The battle is the [G]Lord's
[Am]It's already [F]done

[C]I don't have to [G]worry
[Am]I don't have to [F]fear
[C]He goes before me [G]always
[Am]Victory is [F]here

[F]He who started a [Am]good work
[G]He will see it [C]through
[F]What He promised He [Am]will do
[G]It's already [C]done`,
    notes: "Declaration of faith. Build confidence with each chorus repeat.",
    bpm: 76,
    tags: ["worship","faith","victory","declaration"],
  },
  {
    title: "God You Are",
    artist: "Mission House",
    originalKey: "A",
    format: "chordpro",
    content: `[A]God You are [E]my salvation
[F#m]God You are [D]my strength
[A]God You are [E]my everything
[F#m]You're more than [D]enough

[A]You are faithful [E]and You are true
[F#m]You are mighty [D]and You are good
[A]You are worthy [E]of all the praise
[F#m]God You [D]are

[D]There is none like [A]You
[E]There is none like [F#m]You
[D]In the heavens and [A]the earth
[E]God You [A]are`,
    notes: "Simple declaration of who God is. Repeat chorus to build intensity.",
    bpm: 68,
    tags: ["worship","adoration","declaration","praise"],
  },
  {
    title: "Faithful",
    artist: "Mission House",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Morning by morning [C]new mercies I see
[Em]All I have needed Thy [D]hand has provided
[G]Faithful, [C]faithful
[Em]Great is Thy [D]faithfulness Lord unto me

[G]You have been faithful [C]through every season
[Em]You have been faithful [D]in joy and in pain
[G]Your word is a [C]lamp unto my feet
[Em]Faithful, [D]faithful

[C]In every season, [G]in every storm
[D]You never leave me, [Em]never alone
[C]Faithful forever, [G]faithful and true
[D]I put my trust in [G]You`,
    notes: "Hymn-inspired. Gentle acoustic feel. Beautiful for communion or prayer time.",
    bpm: 66,
    tags: ["worship","faithfulness","trust","hymn"],
  },
  {
    title: "My Soul Finds Rest",
    artist: "Mission House",
    originalKey: "D",
    format: "chordpro",
    content: `[D]My soul finds [A]rest in God alone
[Bm]My rock and [G]my salvation
[D]A fortress [A]strong against my foes
[Bm]I will not [G]be shaken

[D]Though lips may [A]bless but hearts may curse
[Bm]And trials come [G]in waves
[D]My soul finds [A]rest, my soul finds rest
[Bm]In God [G]alone

[G]Rest, my [D]soul
[A]He is all you [Bm]need
[G]Wait upon the [D]Lord
[A]He will be your [D]strength`,
    notes: "Based on Psalm 62. Contemplative worship, perfect for prayer sets.",
    bpm: 64,
    tags: ["worship","rest","psalm","contemplative","peace"],
  },
  {
    title: "Kindness",
    artist: "Mission House",
    originalKey: "C",
    format: "chordpro",
    content: `[C]It's Your kindness [G]Lord
[Am]That leads us [F]to repentance
[C]It's Your goodness [G]Lord
[Am]That breaks the [F]chains of sin

[C]Not by power, [G]not by might
[Am]But by Your [F]Spirit Lord
[C]Your tender [G]mercies call us home
[Am]Time after [F]time

[F]Oh Your kindness, [Am]Your kindness
[G]It's more than I [C]deserve
[F]Oh Your kindness, [Am]Your kindness
[G]Is leading me [C]home`,
    notes: "Gentle and intimate. Based on Romans 2:4. Let the tenderness come through.",
    bpm: 70,
    tags: ["worship","kindness","grace","intimate","repentance"],
  },
  {
    title: "Hymn of the Ages",
    artist: "Mission House",
    originalKey: "E",
    format: "chordpro",
    content: `[E]Holy, holy, [B]holy is the Lord
[C#m]God Almighty [A]who was and is to come
[E]Worthy, worthy, [B]worthy is the Lamb
[C#m]Who was slain for the [A]sins of man

[E]This is the hymn of the [B]ages
[C#m]Rising from the [A]saints of old
[E]This is the song of the [B]ransomed
[C#m]Echoing through [A]streets of gold

[A]Hallelujah, [E]hallelujah
[B]Forever we will [C#m]sing
[A]Hallelujah, [E]hallelujah
[B]To our God and [E]King`,
    notes: "Majestic and sweeping. Build from intimate to anthemic through sections.",
    bpm: 78,
    tags: ["worship","holy","praise","anthem","eternal"],
  },
  {
    title: "Let It Be Done",
    artist: "Mission House",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Let it be done [D]unto me
[Em]According to [C]Your word
[G]Let it be done [D]unto me
[Em]I trust in [C]You Lord

[G]Not my will [D]but Yours be done
[Em]I lay it [C]all down
[G]Take my life and [D]let it be
[Em]Consecrated [C]Lord to Thee

[C]I surrender [Em]all to You
[D]Every dream and [G]every plan
[C]Have Your way in [Em]me today
[D]Let it be [G]done`,
    notes: "Mary's prayer. Surrender song, deeply personal. Acoustic and tender.",
    bpm: 68,
    tags: ["worship","surrender","prayer","trust","intimate"],
  },
  {
    title: "You Satisfy My Soul",
    artist: "Mission House",
    originalKey: "A",
    format: "chordpro",
    content: `[A]You satisfy my [E]soul
[F#m]You satisfy my [D]soul
[A]Nothing in this [E]world
[F#m]Could ever take Your [D]place

[A]Like a deer that [E]pants for water
[F#m]So my soul longs [D]after You
[A]You alone are [E]my heart's desire
[F#m]You satisfy my [D]soul

[D]More than silver, [A]more than gold
[E]More than anything [F#m]this world could hold
[D]You are all I [A]need
[E]You satisfy my [A]soul`,
    notes: "Based on Psalm 42. Longing and devotional. Beautiful for worship transitions.",
    bpm: 72,
    tags: ["worship","devotion","psalm","longing","intimate"],
  },
  {
    title: "Promises",
    artist: "Mission House",
    originalKey: "D",
    format: "chordpro",
    content: `[D]God of the [A]promise
[Bm]You don't speak in [G]vain
[D]No word is [A]empty
[Bm]Your word remains [G]the same

[D]All Your promises are [A]yes and amen
[Bm]Every word You speak is [G]faithful to the end
[D]Standing on the [A]promises of God
[Bm]I will not be [G]moved

[G]Not one promise [D]has ever failed
[A]Not one word has [Bm]fallen to the ground
[G]Through the ages [D]Your truth prevails
[A]I'm standing on Your [D]promises now`,
    notes: "Firm declaration of God's faithfulness. Grows in confidence.",
    bpm: 74,
    tags: ["worship","promises","faithfulness","declaration","trust"],
  },
  {
    title: "Surely Goodness",
    artist: "Mission House",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Surely goodness and [D]mercy
[Em]Shall follow me [C]all my days
[G]Surely goodness and [D]mercy
[Em]Shall follow me [C]always

[G]I will dwell in the [D]house of the Lord
[Em]For all of my [C]days
[G]In the presence of [D]my God
[Em]Is where I will [C]stay

[C]Even though I walk [Em]through the valley
[D]I will fear no [G]evil
[C]For You are with [Em]me
[D]Your rod and Your [G]staff they comfort me`,
    notes: "Psalm 23 paraphrase. Peaceful and reassuring. Works great for communion.",
    bpm: 66,
    tags: ["worship","psalm","goodness","peace","trust"],
  },
  {
    title: "I Found What I've Been Looking For",
    artist: "Mission House",
    originalKey: "C",
    format: "chordpro",
    content: `[C]I found what I've been [G]looking for
[Am]In Your presence [F]Lord
[C]I found what I've been [G]searching for
[Am]You're all I need and [F]more

[C]My wandering heart has [G]found its home
[Am]My restless soul can [F]breathe
[C]I've chased the world and [G]come up short
[Am]But here I'm finally [F]free

[F]You are everything I [Am]need
[G]Everything I've been [C]searching for
[F]In Your arms I've [Am]found my peace
[G]I found what I've been [C]looking for`,
    notes: "Testimony song of finding rest in God. Warm and inviting. Good opener.",
    bpm: 76,
    tags: ["worship","testimony","rest","devotion","searching"],
  },
  {
    title: "Jealousy",
    artist: "Mission House",
    originalKey: "E",
    format: "chordpro",
    content: `[E]Your love is like a [B]jealous fire
[C#m]Burning all that's [A]not of You
[E]Consuming every [B]vain desire
[C#m]Making all things [A]new

[E]You won't let me [B]settle for less
[C#m]Your heart burns with [A]holy love
[E]A jealousy that [B]won't relent
[C#m]Til I'm fully [A]Yours

[A]Set me ablaze with [E]holy fire
[B]Burn away the [C#m]lesser things
[A]I want nothing [E]more than You Lord
[B]You're my every[E]thing`,
    notes: "Based on God's jealous love. Intense and passionate. Builds throughout.",
    bpm: 82,
    tags: ["worship","holiness","fire","devotion","passionate"],
  },
  {
    title: "Take My Life",
    artist: "Mission House",
    originalKey: "D",
    format: "chordpro",
    content: `[D]Take my life and [A]let it be
[Bm]Consecrated [G]Lord to Thee
[D]Take my moments [A]and my days
[Bm]Let them flow in [G]ceaseless praise

[D]Take my hands and [A]let them move
[Bm]At the impulse [G]of Thy love
[D]Take my voice and [A]let me sing
[Bm]Always only [G]for my King

[G]Here I am, [D]all of me
[A]Take my life, [Bm]take everything
[G]Every breath and [D]every word
[A]All for You, [D]all for You Lord`,
    notes: "Modern arrangement of Frances Havergal's classic hymn. Reverent and earnest.",
    bpm: 70,
    tags: ["worship","surrender","hymn","consecration","classic"],
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
