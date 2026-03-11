#!/usr/bin/env node
/**
 * Seed Traditional (Modern) worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/traditional-modern.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Be Thou My Vision",
    artist: "Traditional (Modern)",
    originalKey: "D",
    format: "chordpro",
    content: `[D]Be Thou my [G]Vision, O [D]Lord of my [A]heart
[Bm]Naught be all [G]else to me, [A]save that Thou [D]art
[D]Thou my best [G]thought, by [D]day or by [A]night
[Bm]Waking or [G]sleeping, Thy [A]presence my [D]light

[D]Riches I [G]heed not, nor [D]man's empty [A]praise
[Bm]Thou mine in[G]heritance, [A]now and al[D]ways
[D]Thou and Thou [G]only, [D]first in my [A]heart
[Bm]High King of [G]heaven, my [A]treasure Thou [D]art`,
    notes: "Irish hymn, can be acoustic or full band arrangement",
    bpm: 78,
    tags: ["worship","hymn","traditional"],
  },
  {
    title: "Come Thou Fount",
    artist: "Traditional (Modern)",
    originalKey: "D",
    format: "chordpro",
    content: `[D]Come Thou fount of [G]every [D]blessing
[D]Tune my [A]heart to sing Thy [D]grace
[D]Streams of mercy [G]never [D]ceasing
[D]Call for [A]songs of loudest [D]praise
[G]Teach me [D]some melodious [G]sonnet
[D]Sung by [G]flaming [A]tongues above
[D]Praise the [G]mount I'm [D]fixed upon it
[D]Mount of [A]Thy redeeming [D]love

[D]Here I raise my [G]Eben[D]ezer
[D]Hither [A]by Thy help I've [D]come
[D]And I hope by [G]Thy good [D]pleasure
[D]Safely [A]to arrive at [D]home`,
    notes: "Robert Robinson classic, modern folk arrangement works well",
    bpm: 82,
    tags: ["worship","hymn","traditional"],
  },
  {
    title: "It Is Well with My Soul",
    artist: "Traditional (Modern)",
    originalKey: "Bb",
    format: "chordpro",
    content: `[Bb]When peace like a [Eb]river at[Bb]tendeth my way
[Eb]When sorrows like [Bb]sea billows [F]roll
[Bb]Whatever my [Eb]lot Thou hast [Bb]taught me to [F]say
[Bb]It is well, [Eb]it is [F]well with my [Bb]soul

[Bb]It is [Eb]well [Bb]with my [F]soul
[Bb]It is [Eb]well, it is [F]well with my [Bb]soul

[Bb]My sin oh the [Eb]bliss of this [Bb]glorious thought
[Eb]My sin not in [Bb]part but the [F]whole
[Bb]Is nailed to the [Eb]cross and I [Bb]bear it no [F]more
[Bb]Praise the Lord, [Eb]praise the [F]Lord O my [Bb]soul`,
    notes: "Horatio Spafford classic, powerful story behind the song",
    bpm: 72,
    tags: ["worship","hymn","peace"],
  },
  {
    title: "How Great Thou Art",
    artist: "Traditional (Modern)",
    originalKey: "Bb",
    format: "chordpro",
    content: `[Bb]O Lord my [Eb]God, when I in [Bb]awesome wonder
[F]Consider all the [Bb]worlds Thy hands have [Eb]made
[Bb]I see the [Eb]stars, I hear the [Bb]rolling thunder
[F]Thy power throughout the [Bb]universe dis[Eb]played

[Bb]Then sings my [Eb]soul, my [Bb]Savior God to [F]Thee
[Bb]How great Thou [Eb]art, how [F]great Thou [Bb]art
[Bb]Then sings my [Eb]soul, my [Bb]Savior God to [F]Thee
[Bb]How great Thou [Eb]art, how [F]great Thou [Bb]art`,
    notes: "Swedish hymn, massive congregational anthem",
    bpm: 70,
    tags: ["worship","hymn","majesty"],
  },
  {
    title: "Great Is Thy Faithfulness",
    artist: "Traditional (Modern)",
    originalKey: "D",
    format: "chordpro",
    content: `[D]Great is Thy [G]faithfulness, [D]O God my [A]Father
[D]There is no [G]shadow of [A]turning with [D]Thee
[D]Thou changest [G]not, Thy com[D]passions they [Bm]fail not
[G]As Thou hast [D]been, Thou for[A]ever wilt [D]be

[D]Great is Thy [G]faithfulness, [D]great is Thy [A]faithfulness
[Bm]Morning by [G]morning new [A]mercies I [D]see
[D]All I have [G]needed Thy [D]hand hath pro[Bm]vided
[G]Great is Thy [D]faithful[A]ness, Lord unto [D]me`,
    notes: "Thomas Chisholm classic, Lamentations 3:22-23",
    bpm: 76,
    tags: ["worship","hymn","faithfulness"],
  },
  {
    title: "O Come O Come Emmanuel",
    artist: "Traditional (Modern)",
    originalKey: "Em",
    format: "chordpro",
    content: `[Em]O come O come Em[Am]man[D]u[G]el
[C]And ransom captive [Am]Is[Bm]ra[Em]el
[Em]That mourns in lonely [Am]ex[D]ile [G]here
[C]Until the Son of [Am]God [Bm]ap[Em]pear

[Em]Rejoice, re[D]joice, Em[G]man[C]uel
[Am]Shall come to [Bm]thee O [Am]Is[Bm]ra[Em]el

[Em]O come Thou Day-spring [Am]come [D]and [G]cheer
[C]Our spirits [Am]by Thine [Bm]ad[Em]vent here
[Em]Disperse the gloomy [Am]clouds [D]of [G]night
[C]And death's dark [Am]shadows [Bm]put to [Em]flight`,
    notes: "Advent hymn, haunting minor key, great for Christmas season",
    bpm: 72,
    tags: ["worship","hymn","advent","christmas"],
  },
  {
    title: "Joy to the World",
    artist: "Traditional (Modern)",
    originalKey: "D",
    format: "chordpro",
    content: `[D]Joy to the world, the [A]Lord is [D]come
[G]Let [A]earth re[D]ceive her King
[D]Let every heart pre[D]pare Him room
[D]And heaven and nature [A]sing
[G]And heaven and nature [D]sing
[D]And [G]heaven and [D]heaven and [A]nature [D]sing

[D]He rules the world with [A]truth and [D]grace
[G]And [A]makes the [D]nations prove
[D]The glories of His righteousness
[D]And wonders of His [A]love
[G]And wonders of His [D]love
[D]And [G]wonders [D]wonders [A]of His [D]love`,
    notes: "Isaac Watts, universal Christmas worship song",
    bpm: 108,
    tags: ["worship","hymn","christmas"],
  },
  {
    title: "Silent Night",
    artist: "Traditional (Modern)",
    originalKey: "Bb",
    format: "chordpro",
    content: `[Bb]Silent night, [F]holy night
[Bb]All is calm, [Eb]all is bright
[Eb]Round yon virgin [Bb]mother and child
[Eb]Holy infant so [Bb]tender and mild
[F]Sleep in heavenly [Bb]peace
[F]Sleep in heavenly [Bb]peace

[Bb]Silent night, [F]holy night
[Bb]Son of God, [Eb]love's pure light
[Eb]Radiant beams from [Bb]Thy holy face
[Eb]With the dawn of re[Bb]deeming grace
[F]Jesus Lord at Thy [Bb]birth
[F]Jesus Lord at Thy [Bb]birth`,
    notes: "Franz Gruber classic, candlelight service staple",
    bpm: 56,
    tags: ["worship","hymn","christmas"],
  },
  {
    title: "O Holy Night",
    artist: "Traditional (Modern)",
    originalKey: "C",
    format: "chordpro",
    content: `[C]O holy [F]night the [C]stars are brightly [G]shining
[C]It is the [F]night of our [C]dear Savior's [G]birth
[C]Long lay the [F]world in [C]sin and error [Em]pining
[Am]Till He ap[Em]peared and the [F]soul felt its [G]worth

[Am]A thrill of [Em]hope the [F]weary world re[C]joices
[Am]For yonder [Em]breaks a [F]new and glorious [G]morn
[C]Fall on your [F]knees, O [Am]hear the angel [C]voices
[F]O night di[C]vine, [G]O night when Christ was [C]born
[F]O night di[C]vine, [G]O night O [C]night divine`,
    notes: "Adolphe Adam, dramatic build to \"Fall on your knees\"",
    bpm: 66,
    tags: ["worship","hymn","christmas"],
  },
  {
    title: "What Child Is This",
    artist: "Traditional (Modern)",
    originalKey: "Em",
    format: "chordpro",
    content: `[Em]What child is this who [D]laid to rest
[Em]On Mary's lap is [B7]sleeping
[Em]Whom angels greet with [D]anthems sweet
[Em]While [B7]shepherds watch are [Em]keeping

[G]This, this is [D]Christ the King
[Em]Whom shepherds guard and [B7]angels sing
[G]Haste, haste to [D]bring Him laud
[Em]The [B7]babe the son of [Em]Mary

[Em]So bring Him incense [D]gold and myrrh
[Em]Come peasant king to [B7]own Him
[Em]The King of kings sal[D]vation brings
[Em]Let [B7]loving hearts en[Em]throne Him`,
    notes: "Greensleeves melody, haunting and beautiful",
    bpm: 90,
    tags: ["worship","hymn","christmas"],
  },
  {
    title: "Angels We Have Heard on High",
    artist: "Traditional (Modern)",
    originalKey: "F",
    format: "chordpro",
    content: `[F]Angels we have [Dm]heard on [Bb]high
[F]Sweetly singing [C]o'er the [F]plains
[F]And the mountains [Dm]in re[Bb]ply
[F]Echoing their [C]joyous [F]strains

[F]Glo[C]o[Dm]o[C]o[Bb]o[A]o[Bb]o[C]ria
[Dm]In ex[C]celsis [F]De[Bb]o [F/A] [C]
[F]Glo[C]o[Dm]o[C]o[Bb]o[A]o[Bb]o[C]ria
[Dm]In ex[C]celsis [F]De[Bb]o [F]

[F]Come to Bethle[Dm]hem and [Bb]see
[F]Him whose birth the [C]angels [F]sing
[F]Come adore on [Dm]bended [Bb]knee
[F]Christ the Lord the [C]newborn [F]King`,
    notes: "French carol, glorious Gloria section",
    bpm: 104,
    tags: ["worship","hymn","christmas"],
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
