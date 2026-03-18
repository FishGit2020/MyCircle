#!/usr/bin/env node
/**
 * Seed PDF songbook worship songs (Part 3: M–Z) into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/pdf-songbook-part3.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Mighty To Save",
    artist: "Hillsong Worship",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C2]Everyone needs com[G]passion
[Em]A love that's never [D]failing
Let mercy [C2]fall on [G]me
[C2]Everyone needs for[G]giveness
[Em]The kindness of a [D]Savior
The hope of [C2]nations [G]

{Chorus}
[G]Savior, He can [D]move the mountains
[C2]My God is [G]mighty to save
[Em]He is [D]mighty to save
[G]Forever, author of sal[D]vation
[C2]He rose and [G]conquered the grave
[Em]Jesus [D]conquered the grave

{Bridge} x2
[C2]Shine Your [D]light and let the whole world see
[C2]For the glory [G]of the risen [D]King, Jesus`,
    notes: "Key of C, Capo 2. Classic Hillsong anthem.",
    bpm: 72,
    tags: ["worship", "salvation", "praise"],
  },
  {
    title: "No Longer Slaves",
    artist: "Jonathan David Helser/Melissa Helser",
    originalKey: "C",
    format: "chordpro",
    content: `[C]You unravel me, with a melody
[F/C]You surround me with a [G/C]song of deliverance
[F/C]from my [G/C]enemies
Till all my fears are gone

{Chorus}
[F]I'm no [G(add4)]longer a [C]slave to [Am]fear
[G]I am a [C]child of God
[F]I'm no [G(add4)]longer a [C]slave to fear
[Am]I am a child of [C]God

{Verse 2}
[D]From my Mother's womb [F#m]You have chosen me
[G]Love has [A]called my [D]name
[D]I've been born again, into a [F#5]family
[G]Your blood flows through my [C]veins

{Bridge}
[Am]You split the [G7/B]sea, so I could walk [C]right through it
[Am]My fears were [G7/B]drowned in per[C]fect love
[Am]You rescued [G7/B]me, so I could [C]stand and sing
[F]I am a [G7]child of [C]God`,
    notes: "Key of C, also D. Freedom anthem. Build through bridge.",
    bpm: 72,
    tags: ["worship", "freedom", "identity"],
  },
  {
    title: "Nothing Else",
    artist: "Cody Carnes",
    originalKey: "C",
    format: "chordpro",
    content: `{Chorus}
[Dm7(4)]I'm caught up in Your [F2]presence
[C]I just want to sit here at Your feet
[Dm7(4)]I'm caught up in this [F2]holy moment
[C]I never want to leave
[Dm7(4)]Oh I'm not here for [F2]blessings
[C]Jesus You don't owe me anything
[Dm7(4)]More than any[F2]thing that You can do
[C]I just want You

{Verse 1}
[F2]I'm sorry when I've just gone through the motions
[C/E]I'm sorry when I just sang another song
[F2]Take me back to where we [C]started
I open up my heart to You

{Bridge}
[Dm]I just want [F]You, nothing [Am]else
Nothing [G]else will do`,
    notes: "Key of C, Tempo 68. Intimate worship.",
    bpm: 68,
    tags: ["worship", "intimacy", "devotion"],
  },
  {
    title: "O Come To The Altar",
    artist: "Elevation Worship",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse}
[G]Are you hurting and [C]broken within?
[C]Overwhelmed by the [Em]weight of your sin?
[C]Jesus is calling.
[G]Have you [C]come to the end of yourself?
[C]Do you thirst for a [Em]drink from the well?
[C]Jesus is calling.

{Chorus}
[G]O come [Am]to the altar,
[Em]the Father's arms are open [C]wide.
[G]For[Am]giveness
[Em]was bought with the precious blood of [C]Jesus Christ.

{Bridge}
[G]Oh what a Saviour,
[Em]isn't He wonderful,
[C]sing hallelujah Christ is risen,
[G]bow down before Him,
[Em]for He is Lord of all,
[C]sing hallelujah Christ is risen.`,
    notes: "Key of G, Capo 4 for original B.",
    bpm: 72,
    tags: ["worship", "invitation", "grace"],
  },
  {
    title: "Only King Forever",
    artist: "Elevation Worship",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]Our God, a firm foundation
[C]Our rock, the only [Am7]solid ground
[F]As nations [C]rise and fall
[C]Kingdoms once strong now [Am7]shaken
[F]But we trust forever in [C]Your name
[Am7]The name of [F]Jesus

{Chorus}
[C]You are the only [C/E]King forever
[F]Almighty God we lift You higher
[C/G]You are the only [F]King forever
[F]Forevermore, You are victorious

{Bridge} * 2
[Dm]We lift our [C]banner high
[G]We lift the name of Jesus
[Dm]From age to [C]age You reign
[G]Your kingdom has no end`,
    notes: "Key of C. Declaration anthem.",
    bpm: 85,
    tags: ["worship", "praise", "declaration"],
  },
  {
    title: "Raise A Hallelujah",
    artist: "Bethel Music",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]I raise a Hallelujah in the [F]presence of my enemies
[Am]I raise a Hallelujah [G]louder than the unbelief
[C]I raise a Hallelujah, my [F]weapon is a melody
[Am]I raise a Hallelujah, [G]heaven comes to fight for me

{Chorus}
[F]I'm gonna sing in the [C]middle of the storm
[Am]Louder and louder, you're gonna [G]hear my praises roar
[F]Up from the ashes, [C]hope will arise
[Am]Death is defeated, the [G]King is alive

{Bridge}
[C]Sing a little louder (in the presence of my enemies)
[G]Sing a little louder (louder than the unbelief)
[Am]Sing a little louder (my weapon is a melody)
[F]Sing a little louder (heaven comes to fight for me)

{Tag}
[C]I raise a Hallelujah
[F]I raise a Hallelujah
[Am]I raise a Hallelujah
[G]I raise a Hallelujah`,
    notes: "Key of C. Spiritual warfare anthem.",
    bpm: 84,
    tags: ["worship", "spiritual warfare", "praise"],
  },
  {
    title: "Reckless Love",
    artist: "Cory Asbury/Caleb Culver/Ran Jackson",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[Am]Before I spoke a word, [G]You were singing over [F2]me
[Am]You have been so, [G]so good to [F2]me
[Am]Before I took a [G]breath, You breathed Your [F2]life in me
[Am]You have been so, [G]so kind to [F2]me

{Chorus}
[Am]Oh, the overwhelming, [G]never-ending, [F]reckless love of [C]God
[Am]Oh, it chases me down, [G]fights til I'm found, [F]leaves the ninety-[C]nine
[Am]I couldn't earn it, I [G]don't deserve it, still [F]You give Yourself a[C]way
[Am]Oh, the overwhelming, [G]never-ending, [F]reckless love of [C]God

{Bridge}
[Am]There's no shadow You [G]won't light up
Mountain You won't [C]climb up, coming after me
[Am7]There's no wall You won't [G]kick down
Lie You won't tear [C]down, coming after me [x3]`,
    notes: "Original key D, Capo 2 with C shapes.",
    bpm: 88,
    tags: ["worship", "love", "grace"],
  },
  {
    title: "Stand In Your Love",
    artist: "Bethel Music",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]When darkness tries to [C]roll over my bones
[G]When sorrow comes to [C]steal the joy I own
[Em]When brokenness and [D]pain is all [C]I know
[Em]Oh, I won't be [D]shaken, no, I won't be [C]shaken

{Chorus}
[G]My fear doesn't [D]stand a chance when I [C]stand in Your love
[G]My fear doesn't [D]stand a chance when I [C]stand in Your love
[Em]My fear doesn't [D]stand a chance when I [C]stand in Your love

{Bridge} * 2
[D]There's power that can [Em]break off every chain
[C]There's power that can [G]empty out a grave
[D]There's resurrection [Em]power that can save
[C]There's power in Your name, power in Your [G]name`,
    notes: "Key of G. Declaration of freedom from fear.",
    bpm: 72,
    tags: ["worship", "faith", "love"],
  },
  {
    title: "See A Victory",
    artist: "Elevation Worship",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[Am]The weapon may be [F]formed, but it [C]won't prosper
[Am]When the darkness [F]falls, it won't pre[C]vail
[Am]'Cause the God I [F]serve knows [C]only how to triumph
[Am]My God will [F]never [C]fail

{Chorus}
[Am]I'm gonna see a [F]victory
[C]I'm gonna see a [G]victory
[Am]For the battle be[F]longs to You, [C]Lord

{Bridge} * 3
[G]You take what the [A]enemy meant for evil
[D]And You turn it for [G]good
[Bm]You turn it for [A]good`,
    notes: "Key of E, Capo 2. Victory declaration.",
    bpm: 90,
    tags: ["worship", "victory", "faith"],
  },
  {
    title: "Surrounded (Fight My Battles)",
    artist: "Elyssa Smith",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[C]There's a [G]table [D]that You've [Em]prepared for me
[C]In the [G]pres[D]ence of my [Em]enemies
[C]It's Your [G]body and [D]Your blood You shed for [Em]me
[C]This is how I [G]fight my [D]bat[Em]tles

{Pre-Chorus}
[G/B]And I [C]believe You've over[Dsus]come
[Em]And I will [G/B]lift my song of
[C]Praise for what You've [Dsus]done

{Chorus}
[G]This is how I [C2]fight my battles
[Dsus]This is how I [Em7]fight my battles
[G]This is how I [C2]fight my battles
[D]This is [Em]how

{Bridge}
[G/B]It may look like [C2]I'm surrounded
[Dsus]But I'm sur[Em7]rounded by You`,
    notes: "Key of G, 69 BPM. Trust song.",
    bpm: 69,
    tags: ["worship", "spiritual warfare", "trust"],
  },
  {
    title: "The Blessing",
    artist: "Elevation Worship/Kari Jobe/Cody Carnes",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse}
[C]The Lord bless you [F]and keep [C]you
[G]Make His face shine upon you
[Am]Be gracious to you
[F]The Lord turn His [C]face toward you
[G]And give you [C]peace

{Chorus} * 4
[Am]A[F]men, [C]Amen, [G]Amen

{Bridge}
[Am]May His favor be upon you
[F]And a thousand generations
[C]And your family and your children
[G]And their children, and their children

[Am]May His presence go before you
[F]And behind you, and beside you
[C]All around you, and within you
[G]He is with you, He is with you`,
    notes: "Key of A, also G with capo 2. Priestly blessing.",
    bpm: 140,
    tags: ["worship", "blessing", "prayer"],
  },
  {
    title: "Living Hope",
    artist: "Phil Wickham/Brian Johnson",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro}
[G] [C] [G] [C]

{Verse 1}
[G]How great the chasm that [D]lay between us
[C]How high the [Em]mountain I [D]could not climb
[G]In desperation I [D]turned to heaven
[C]And spoke Your [D]name into the [G]night
[C]Then through the darkness Your [G]loving kindness
[Em]Tore through the [D]shadows of my soul
[G]The work is finished, the [D]end is written
[C]Jesus [D]Christ, my [G]Living Hope

{Chorus}
[C] [G]Hallelujah, [D]praise the one who set me [Em]free
[C] [G]Hallelujah, [D]death has lost its grip on [Em]me
[C]You have [G]broken every [D]chain, there's [Em]salvation in Your Name
[C]Jesus [D]Christ, my [G]Living Hope

{Verse 3}
[G]Then came the morning that [D]sealed the promise
[C]Your buried [Em]body be[D]gan to breathe
[G]Out of the silence the [D]roaring Lion
[C]Declared the [D]grave has no [G]claim on me
[C]Jesus, [D]Yours is the [G]victory

{Final}
[C]Jesus Christ, my [D]Living [Em]Hope [G]
[C]Oh God, You [D]are my Living [G]Hope`,
    notes: "Original Eb, Capo 3 plays G. Resurrection anthem.",
    bpm: 72,
    tags: ["worship", "hope", "resurrection"],
  },
  {
    title: "Lion And The Lamb",
    artist: "Bethel Music",
    originalKey: "D",
    format: "chordpro",
    content: `{Intro (2X)}
[C] [Dm] [F]

{Verse 1}
[C]He's coming on the clouds
[Dm]Kings and kingdoms [F]will bow down
[Am]And every chain will break
[G]As broken [F]hearts declare His praise
For who can stop the [G]Lord almighty?

{Chorus}
[C]Our God is the Lion, [G]the Lion of [Am]Judah
He's roaring with [G]power and fighting our [F]battles
[G]Every knee will bow before [C]Him
Our God is the Lamb, [G]the Lamb that was [Am]slain
For the sins of the world, [G]His blood breaks the [F]chains
[G]Every knee will bow before
[F]the Lion and the Lamb

{Bridge}
[Dm]Who can stop the [C/E]Lord almighty?
[F]Who can stop the [G]Lord almighty?`,
    notes: "Key of D, Capo 2. Powerful declaration.",
    bpm: 90,
    tags: ["worship", "praise", "declaration"],
  },
  {
    title: "Way Maker",
    artist: "Osinachi Kalu Okoro",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]You are here, moving in our [G]midst
[D]I worship [Em]You, I worship You
[C]You are here, working in this [G]place
[D]I worship [Em]You, I worship You

{Chorus}
[C2]Way maker, Miracle [G]worker, Promise Keeper
[D(add4)]Light in the darkness, My [Em]God, that is who You are

{Tag}
[C]That is who You are, that is [C/E]who You are
[G]That is who You [Am]are, that is who You are

{Bridge}
[F2]Even when I don't see it, You're working
[C]Even when I don't feel it, You're working
[Gsus]You never stop, You never stop working
[Am7]You never stop, You never stop working [x4]`,
    notes: "Key of C, Capo 3. Declaration of God's nature.",
    bpm: 68,
    tags: ["worship", "miracles", "praise"],
  },
  {
    title: "What A Beautiful Name",
    artist: "Hillsong Worship",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[G]You were the Word at the beginning
[C]One With [Em]God the Lord Most [D]High
[Em]Your hidden [D]glory in cre[G]ation
[C]Now re[Em]vealed in [D]You Our Christ

{Chorus 1}
[G]What a beautiful Name it [D]is, What a beautiful Name it is
[Em]The Name of [D]Jesus Christ my [C]King
[G]What a beautiful Name it [D]is, Nothing compares to this
[Em]What a [D]beautiful Name it [C]is, The Name of Jesus

{Bridge}
[C]Death could not hold [D]You, The veil tore before You
[Em]You silenced the [Bm]boast of sin and grave
[C]The heavens are [D]roaring, the praise of Your glory
[Em]For you are [D]raised to life again
[C]You have no [D]rival, You have no equal
[Em]Now and forever God [Bm]You reign
[C]Yours is the [D]Kingdom, Yours is the glory
[Em]Yours is the [D]Name above all names`,
    notes: "Key of A, commonly G. The quintessential modern worship anthem.",
    bpm: 68,
    tags: ["worship", "name of jesus", "praise"],
  },
  {
    title: "Who You Say I Am",
    artist: "Ben Fielding/Reuben Morgan",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Who am I that the highest [Em]King would [D]welcome [G]me
[Em]I was lost but He [D]brought me [C]in
[Em]Oh His [D]love for [C]me

{Chorus}
[G]Who the Son sets free, [D]oh is free indeed
[Em]I'm a child of [D]God, [C]Yes I [G]am
[G]In my Father's house, [D]there's a place for me
[Em]I'm a child of [D]God, [C]Yes I [G]am

{Bridge} (x2)
[Em]I am chosen, [D/F#]not for[G]saken
[A]I am who You [D]say I am
[Em]You are for me, [D/F#]not a[G]gainst me
[A]I am who You [D]say I am

{Tag}
[Em]I am [D/F#]who You [C]say I am`,
    notes: "Key of G. Identity anthem.",
    bpm: 72,
    tags: ["worship", "identity", "freedom"],
  },
  {
    title: "Worthy",
    artist: "Elevation Worship",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]It was my cross You [G]bore
[C]So I could live in the [F]freedom You [C]died [G]for
[C]And now my life is [G]Yours
[C]And I will [F]sing of [C]Your goodness forevermore

{Chorus}
[F]Worthy is Your [G]name, Jesus
[C]You deserve the praise
[Am]Worthy is Your name

{Bridge} * 2
[F]Be exalted now in the heavens
[Dm]As Your glory fills this place
[Am]You alone deserve our praise
[G]You're the [C]name above all names`,
    notes: "Key of C. Cross-centered praise.",
    bpm: 72,
    tags: ["worship", "cross", "praise"],
  },
  {
    title: "Yes And Amen",
    artist: "Anthony Brown/Chris McClarney/Nate Moore",
    originalKey: "D",
    format: "chordpro",
    content: `{Intro}
[D] [Em7] [C2] [G] [x2]

{Verse 1}
[D]Father of [Em7]kindness, You have [C2]poured out [G]grace
[D]Brought me out [Em7]of darkness, You have [C2]filled me with [D]peace
[Em7]Giver of [C2]mercy, You're my [C2]help in time of need
[D]Lord, I can't help but [G]sing

{Chorus}
[D]Faithful, [Em7]You are, [C] [G] [D]faithful, [Em7]forever [C]You will [G]be
[D]Faithful, [Em7]You are, all Your [Em7]promises are [C]yes and [G]amen

{Bridge}
[Dsus] [Em]I will rest [C]in Your [G]promises [x4]
My confidence [C]is Your [G]faithfulness`,
    notes: "Key of D. Faithfulness anthem.",
    bpm: 72,
    tags: ["worship", "faithfulness", "promises"],
  },
  {
    title: "Your Love Never Fails",
    artist: "Chris McClarney/Anthony Skinner",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[Em]Nothing can [C]separate, [G]even if I [D]ran away
[Em]Your love [C]never [G]fails [D]
[Em]I know I [C]still make mistakes, but
[G]You have new mercy for [D]me everyday
[Em]Your love [C]never [G]fails [D]

{Chorus}
[C]You stay the [G]same through the [D]ages, [Am]Your love never [C]changes
[G]There may be [D]pain in the [Am]night, but [C]joy comes in the morning
[G]And when the [D]oceans rage, [Am]I don't have to be [C]afraid
[G]Because I [D]know that You love me, and Your love never fails

{Bridge}
[C]You make [Em]all things work together for my [D]good`,
    notes: "Key of G. Love declaration anthem.",
    bpm: 80,
    tags: ["worship", "love", "faithfulness"],
  },
  {
    title: "Your Name",
    artist: "Paul Baloche",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro} * 2
[G] [C] [D] [G]

{Verse}
[G]As morning [C]dawns and [D]evening [G]fades
[G]You in[C]spire [D]songs of [G]praise
[G]That rise from [C]earth to [D]touch Your [Em]heart
[C]And [D]glorify Your [G]Name

{Chorus}
[D]Your [Em]Name is a [G]strong and mighty [C]tower
[D]Your [Em]Name is a [G]shelter like no [C]other
[D]Your [Em]Name, let the [G]nations sing it [C]louder
[G]'Cause nothing has the [C]power to [D]save
[G]But Your [C]Name [D] [G]`,
    notes: "Key of G, Capo 3. Strong praise anthem.",
    bpm: 84,
    tags: ["worship", "praise", "name of god"],
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
