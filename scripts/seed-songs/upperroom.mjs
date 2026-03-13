#!/usr/bin/env node
/**
 * Seed UPPERROOM worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/upperroom.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Surrounded (UPPERROOM)",
    artist: "UPPERROOM",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]It may look like I'm sur[C]rounded
[G]But I'm surrounded by [D]You
[Em]It may look like I'm sur[C]rounded
[G]But I'm surrounded by [D]You

{Chorus}
[G]This is how I [C]fight my battles
[G]This is how I [D]fight my battles
[Em]This is how I [C]fight my battles
[G]This is how I [D]fight my battles

{Bridge}
[C]It may look like I'm sur[G]rounded
[D]But I'm surrounded by [Em]You
[C]God is on my [G]side`,
    notes: "Spontaneous worship feel. Let the repetition build prophetically.",
    bpm: 72,
    tags: ["worship","spiritual warfare","declaration","spontaneous"],
  },
  {
    title: "Yahweh",
    artist: "UPPERROOM",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]All of my hopes [Am]all of my plans
[F]All of my dreams I [G]place in Your hands
[C]All of my fears [Am]all of my past
[F]All of my questions I [G]lay at Your feet

{Chorus}
[C]Yahweh [Am]Yahweh
[F]I will trust in You a[G]lone
[C]Yahweh [Am]Yahweh
[F]I will follow where You [G]go

{Verse 2}
[C]All of the earth [Am]all of the sky
[F]Everything trembles at the [G]sound of Your name`,
    notes: "Simple and devotional. Room for spontaneous worship moments.",
    bpm: 70,
    tags: ["worship","surrender","trust","devotional"],
  },
  {
    title: "New Wine",
    artist: "UPPERROOM",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]In the crushing in the [F]pressing
[Gm]You are making [Eb]new wine
[Bb]In the soil I now [F]surrender
[Gm]You are breaking [Eb]new ground

{Pre-Chorus}
[Eb]So I yield to [Gm]You and to Your careful [F]hand
[Bb/D]When I trust You I don't need to under[Eb]stand

{Chorus}
[Bb]Make me Your [F]vessel
[Gm]Make me an [Eb]offering
[Bb]Make me what[F]ever You want me to [Gm]be [Eb]
[Bb]I came here with [F]nothing
[Gm]But all You have [Eb]given me
[Bb]Jesus bring [F]new wine out of [Eb]me`,
    notes: "Written by Brooke Ligertwood for Hillsong Worship. Intimate and surrendered.",
    bpm: 77,
    tags: ["worship","surrender","transformation"],
  },
  {
    title: "Mention of Your Name",
    artist: "UPPERROOM",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]At the mention of Your [C]name
[Em]Every knee will bow [D]down
[G]At the mention of Your [C]name
[Em]Every chain falls to the [D]ground

{Chorus}
[G]There is power in the [C]name of Jesus
[Em]There is freedom in the [D]name of Jesus
[G]There is healing in the [C]name of Jesus
[Em]At the mention of Your [D]name

{Verse 2}
[C]Heaven and earth [G]proclaim
[Em]Nothing is the [D]same
[C]At the mention of Your [G]name`,
    notes: "Prophetic and declarative. Build with layered worship team vocals.",
    bpm: 74,
    tags: ["worship","name of Jesus","power","spontaneous"],
  },
  {
    title: "Be Still",
    artist: "UPPERROOM",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]Be still and know that [B]I am God
[C#m]Be still and know that [A]I am good
[E]Be still and know that [B]I am here
[C#m]I am right [A]here

{Chorus}
[E]When the winds are [B]raging
[C#m]When the waves are [A]crashing
[E]I will be the [B]anchor
[C#m]I will hold you [A]fast

{Verse 2}
[A]Be still my [E]soul
[B]Be still my [C#m]heart
[A]Know that He is [E]faithful
[B]Know that He is [A]God`,
    notes: "Meditative and calming. Perfect for prayer ministry moments.",
    bpm: 62,
    tags: ["worship","peace","stillness","prayer"],
  },
  {
    title: "Lean Back",
    artist: "UPPERROOM",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]I just wanna [G]lean back
[Am]Into Your ever[F]lasting arms
[C]I just wanna [G]rest here
[Am]In Your presence [F]Lord

{Chorus}
[C]You are my [G]peace
[Am]You are my [F]safe place
[C]I lean back [G]into Your [F]love`,
    notes: "Restful, soaking song. Minimal instrumentation.",
    bpm: 58,
    tags: ["worship","rest","soaking"],
  },
  {
    title: "Open Up",
    artist: "UPPERROOM",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]Open up the [A]heavens
[Bm]Let the glory [G]fall
[D]Open up the [A]floodgates
[Bm]Pour out on [G]us all

{Chorus}
[D]We open up our [A]hearts to You
[Bm]Come fill this [G]place anew
[D]Open up [A]Lord [G]`,
    notes: "Extended worship song. Leave room for spontaneous moments.",
    bpm: 72,
    tags: ["worship","spirit","outpouring"],
  },
  {
    title: "Obsession",
    artist: "UPPERROOM",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]You are my one ob[D]session
[Em]My heart is fully [C]Yours
[G]Nothing else could [D]satisfy
[Em]You are all I'm [C]searching for

{Chorus}
[G]Obsessed with knowing [D]You
[Em]Obsessed with seeing [C]You
[G]My one desire is [D]more of [C]You`,
    notes: "Intimate worship. Vocal-led, build slowly.",
    bpm: 66,
    tags: ["worship","intimacy","desire"],
  },
  {
    title: "Nothing Without You",
    artist: "UPPERROOM",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]I am nothing with[B]out You
[C#m]Nothing without [A]You Lord
[E]Every breath I [B]breathe
[C#m]Every step I [A]take

{Chorus}
[E]You are the source of [B]everything
[C#m]Without You I have [A]nothing
[E]With You I have it [B]all [A]`,
    notes: "Dependence on God theme. Honest and raw worship.",
    bpm: 70,
    tags: ["worship","dependence","surrender"],
  },
  {
    title: "Land of the Living",
    artist: "UPPERROOM",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]I will see the [E]goodness of the Lord
[F#m]In the land of the [D]living
[A]I remain con[E]fident in this
[F#m]I will see His [D]goodness

{Chorus}
[A]In the land of the [E]living
[F#m]My hope is [D]found
[A]I will see Your [E]goodness [D]Lord`,
    notes: "Psalm 27:13. Confidence builder for the congregation.",
    bpm: 74,
    tags: ["worship","hope","psalm"],
  },
  {
    title: "Spontaneous Worship",
    artist: "UPPERROOM",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]Spirit lead us [A]now
[Bm]In this holy [G]moment
[D]We follow where You [A]go
[Bm]Speak and we will [G]listen

{Chorus}
[D]Here we are [A]Lord
[Bm]Open and [G]willing
[D]Move in this [A]place as only [G]You can`,
    notes: "Framework for spontaneous worship. Loop and let the Spirit lead.",
    bpm: 64,
    tags: ["worship","spontaneous","spirit"],
  },
  {
    title: "Table",
    artist: "UPPERROOM",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]You prepare a [D]table
[Em]In the presence of my [C]enemies
[G]You anoint my [D]head with oil
[Em]My cup over[C]flows

{Chorus}
[G]Surely goodness and [D]mercy
[Em]Will follow me all the [C]days of my life
[G]And I will dwell in Your [D]house for[C]ever`,
    notes: "Psalm 23 worship. Reverent and intimate.",
    bpm: 62,
    tags: ["worship","communion","psalm"],
  },
  {
    title: "I Will Wait",
    artist: "UPPERROOM",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]I will wait upon the [E]Lord
[F#m]My strength comes from [D]Him alone
[A]I will wait upon the [E]Lord
[F#m]He renews my [D]strength

{Chorus}
[A]They who wait on the [E]Lord
[F#m]Shall renew their [D]strength
[A]Mount up with wings like [E]eagles [D]`,
    notes: "Isaiah 40:31. Let the promise of the Word shine.",
    bpm: 68,
    tags: ["worship","waiting","scripture"],
  },
  {
    title: "In Your Presence",
    artist: "UPPERROOM",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]In Your presence [G]is fullness of joy
[Am]At Your right hand [F]are pleasures forever
[C]In Your presence [G]I find everything
[Am]I was made to [F]live here

{Chorus}
[C]Here in Your [G]presence
[Am]I have found my [F]home
[C]In Your [G]presence [F]Lord`,
    notes: "Psalm 16:11. Soaking song. Extended play encouraged.",
    bpm: 60,
    tags: ["worship","presence","joy"],
  },
  {
    title: "House of the Lord (UPPERROOM)",
    artist: "UPPERROOM",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]We worship in the [F]house of the Lord
[Gm]There's joy in the [Eb]house of the Lord
[Bb]There's freedom in the [F]house of the Lord
[Gm]We come alive in the [Eb]house of the Lord

{Chorus}
[Bb]This is where the [F]broken are mended
[Gm]This is where we [Eb]find our home`,
    notes: "Joyful and celebratory. Full band arrangement.",
    bpm: 126,
    tags: ["worship","church","joy"],
  },
  {
    title: "Anchor",
    artist: "UPPERROOM",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]You are my [D]anchor
[Em]In the storms of [C]life
[G]You hold me [D]steady
[Em]You are my [C]guide

{Chorus}
[G]When the waves crash [D]over me
[Em]I will not be [C]moved
[G]You are my [D]anchor [C]Lord`,
    notes: "Hebrews 6:19 theme. Steady beat, unshakable feel.",
    bpm: 72,
    tags: ["worship","anchor","stability"],
  },
  {
    title: "The Name",
    artist: "UPPERROOM",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]At the name of [B]Jesus
[C#m]Every knee shall [A]bow
[E]Every tongue con[B]fess
[C#m]That He is [A]Lord

{Chorus}
[E]The name above all [B]names
[C#m]The name that saves and [A]heals
[E]Jesus, there is [B]power in the [A]name`,
    notes: "Philippians 2:10-11. Exalting the name of Jesus.",
    bpm: 78,
    tags: ["worship","Jesus","exaltation"],
  },
  {
    title: "Sovereign",
    artist: "UPPERROOM",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]You are sov[A]ereign over all
[Bm]Nothing is beyond Your [G]reach
[D]Every detail [A]of my life
[Bm]Is held within Your [G]hands

{Chorus}
[D]Sovereign [A]God, You reign
[Bm]Over every[G]thing
[D]Sovereign [A]Lord, You [G]reign`,
    notes: "Majesty and authority. Strong, confident delivery.",
    bpm: 74,
    tags: ["worship","sovereignty","majesty"],
  },
  {
    title: "Pour Out Your Spirit",
    artist: "UPPERROOM",
    originalKey: "F",
    format: "chordpro",
    content: `{Verse 1}
[F]Pour out Your [C]Spirit Lord
[Dm]On all [Bb]flesh
[F]Sons and daughters [C]prophesying
[Dm]Old men dreaming [Bb]dreams

{Chorus}
[F]Come Holy [C]Spirit
[Dm]Fall fresh on [Bb]us
[F]Pour out Your [C]Spirit [Bb]Lord`,
    notes: "Acts 2 / Joel 2 reference. Expectant, cry-out atmosphere.",
    bpm: 68,
    tags: ["worship","spirit","outpouring"],
  },
  {
    title: "To the One",
    artist: "UPPERROOM",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]To the One who [E]sits on the throne
[F#m]And to the Lamb [D]be blessing
[A]And honor and [E]glory
[F#m]And power for[D]ever

{Chorus}
[A]Worthy is the [E]Lamb who was slain
[F#m]To receive all [D]praise
[A]To the One [E]forever [D]more`,
    notes: "Revelation 5:13. Majestic and glorious. Build to climax.",
    bpm: 76,
    tags: ["worship","revelation","glory"],
  },
  {
    title: "Room for More",
    artist: "UPPERROOM",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]There's always room for [D]more
[Em]More of Your Spirit, [C]Lord
[G]We make space in this [D]place
[Em]For You to move and [C]pour

{Chorus}
[G]Room for more, [D]room for more
[Em]We will never say [C]enough
[G]Come and fill this [D]house
[Em]There's room for [C]more`,
    notes: "Invitational worship. Creates space for the Spirit to move.",
    bpm: 70,
    tags: ["worship","spirit","invitation"],
  },
  {
    title: "Holy Spirit Come (UPPERROOM)",
    artist: "UPPERROOM",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]Holy Spirit [A]come
[Bm]Fill this place with Your [G]presence
[D]Holy Spirit [A]come
[Bm]We need You [G]now

{Chorus}
[D]Like a rushing [A]wind
[Bm]Like a fire with[G]in
[D]Holy Spirit [A]come
[Bm]Have Your way a[G]gain`,
    notes: "Simple prayer song. Extended worship with spontaneous moments.",
    bpm: 64,
    tags: ["worship","holy spirit","prayer"],
  },
  {
    title: "Abide",
    artist: "UPPERROOM",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]I will abide in [G]You
[Am]And You will abide in [F]me
[C]Apart from You I can [G]do nothing
[Am]So I remain in [F]You

{Chorus}
[C]Abide, [G]abide
[Am]In the vine I will [F]stay
[C]Your word in me, and [G]I in You
[Am]I will abide [F]always`,
    notes: "John 15 theme. Contemplative and peaceful.",
    bpm: 60,
    tags: ["worship","abiding","scripture"],
  },
  {
    title: "What He Says About Me",
    artist: "UPPERROOM",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]I am who He [E]says I am
[F#m]I can do what He [D]says I can
[A]I will go where He [E]says to go
[F#m]This is what He says a[D]bout me

{Chorus}
[A]Chosen, called, and [E]set apart
[F#m]Loved beyond what [D]I deserve
[A]He says I'm [E]His
[F#m]And that's enough for [D]me`,
    notes: "Identity declaration. Confidence-building worship.",
    bpm: 78,
    tags: ["worship","identity","declaration"],
  },
  {
    title: "Never Failing Love",
    artist: "UPPERROOM",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]Your love never [B]fails
[C#m]It never gives [A]up
[E]It never runs [B]out on me
[C#m]Your love never [A]fails

{Chorus}
[E]On and on and [B]on and on it goes
[C#m]It overwhelms and [A]satisfies my soul
[E]And I never ever [B]have to be afraid
[C#m]Your love never [A]fails`,
    notes: "Assurance and comfort. Warm, congregational feel.",
    bpm: 74,
    tags: ["worship","love","assurance"],
  },
  {
    title: "Encounter",
    artist: "UPPERROOM",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]One encounter with [D]You
[Em]Changes every[C]thing
[G]One moment in Your [D]presence
[Em]And I'll never be the [C]same

{Chorus}
[G]I came for an en[D]counter
[Em]Not just a [C]song
[G]Touch me, change me, [D]God
[Em]I want an en[C]counter with You`,
    notes: "Expectant and hungry. Sets atmosphere for ministry.",
    bpm: 66,
    tags: ["worship","encounter","presence"],
  },
  {
    title: "Throne Room (UPPERROOM)",
    artist: "UPPERROOM",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]We enter the [A]throne room
[Bm]By the blood of the [G]Lamb
[D]Boldly we come [A]before You
[Bm]Into the holy [G]place

{Chorus}
[D]Worthy, worthy, [A]worthy
[Bm]Is the Lamb upon the [G]throne
[D]We bow before Your [A]majesty
[Bm]The throne room is our [G]home`,
    notes: "Hebrews 4:16. Reverent and majestic. Extended worship.",
    bpm: 68,
    tags: ["worship","throne","reverence"],
  },
  {
    title: "Atmosphere",
    artist: "UPPERROOM",
    originalKey: "F",
    format: "chordpro",
    content: `{Verse 1}
[F]There's a shift in the [C]atmosphere
[Dm]Heaven's coming [Bb]down right here
[F]Can you feel it [C]changing
[Dm]Something is [Bb]breaking through

{Chorus}
[F]In this atmo[C]sphere
[Dm]Miracles are [Bb]happening
[F]When Your people [C]worship You
[Dm]The atmosphere [Bb]changes`,
    notes: "Expectant, prophetic worship. Dynamic transitions.",
    bpm: 72,
    tags: ["worship","atmosphere","breakthrough"],
  },
  {
    title: "Set Apart",
    artist: "UPPERROOM",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]Set apart for [E]You
[F#m]Holy unto the [D]Lord
[A]Consecrated and [E]called
[F#m]For such a time as [D]this

{Chorus}
[A]I am Yours, [E]set apart
[F#m]Every piece of my [D]heart
[A]For Your purpose and [E]glory alone
[F#m]I am set a[D]part`,
    notes: "Consecration song. Quiet intensity, builds to declaration.",
    bpm: 70,
    tags: ["worship","consecration","holiness"],
  },
  {
    title: "Come Alive",
    artist: "UPPERROOM",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]Dry bones come a[G]live
[Am]In the name of [F]Jesus
[C]Dead things come a[G]live
[Am]At the sound of Your [F]voice

{Chorus}
[C]Come alive, [G]come alive
[Am]Let faith arise [F]in this place
[C]Breathe on us, [G]breathe on us
[Am]And we will come a[F]live`,
    notes: "Ezekiel 37 theme. Prophetic and faith-filled.",
    bpm: 76,
    tags: ["worship","revival","faith"],
  },
  {
    title: "Holy Ghost",
    artist: "UPPERROOM",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]Holy Ghost, [B]come and fill this room
[C#m]Holy Ghost, [A]we make room for You
[E]Move in power, [B]move in fire
[C#m]Holy Ghost, You're our [A]one desire

{Chorus}
[E]We want You, [B]Holy Ghost
[C#m]More than anything we [A]know
[E]Come and have Your [B]way
[C#m]Holy Ghost, [A]come today`,
    notes: "Pentecostal fire atmosphere. Urgent and passionate.",
    bpm: 82,
    tags: ["worship","holy spirit","fire"],
  },
  {
    title: "Deep End",
    artist: "UPPERROOM",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Take me to the [D]deep end
[Em]Where my feet can't [C]touch the ground
[G]I don't want the [D]shallow
[Em]I want to be where [C]You are found

{Chorus}
[G]Into the deep, [D]into the deep
[Em]I'm diving in with [C]all of me
[G]Over my head in [D]Your love
[Em]Take me to the [C]deep end`,
    notes: "Luke 5:4 theme. Adventurous faith, total surrender.",
    bpm: 74,
    tags: ["worship","depth","surrender"],
  },
  {
    title: "New Sound",
    artist: "UPPERROOM",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]There's a new sound [A]rising
[Bm]From the people of [G]God
[D]A new song is [A]breaking through
[Bm]A sound of praise and [G]awe

{Chorus}
[D]Can you hear the [A]new sound
[Bm]Coming from the [G]ground
[D]Heaven's frequency is [A]here
[Bm]A brand new [G]sound`,
    notes: "Prophetic and fresh. Builds from quiet to explosive.",
    bpm: 80,
    tags: ["worship","new sound","prophetic"],
  },
  {
    title: "Awakening",
    artist: "UPPERROOM",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]There's an awaken[F]ing
[Gm]Stirring in the [Eb]land
[Bb]Hearts are turning [F]back to You
[Gm]Revival is at [Eb]hand

{Chorus}
[Bb]Wake up, wake [F]up
[Gm]O sleeper a[Eb]rise
[Bb]The light of Christ is [F]shining
[Gm]An awakening has [Eb]come`,
    notes: "Ephesians 5:14. Revival anthem. Builds with urgency.",
    bpm: 78,
    tags: ["worship","revival","awakening"],
  },
  {
    title: "King of My Heart (UPPERROOM)",
    artist: "UPPERROOM",
    originalKey: "Ab",
    format: "chordpro",
    content: `{Verse 1}
[Ab]Let the King of my [Eb]heart
[Fm]Be the mountain where I [Db]run
[Ab]The fountain I drink [Eb]from
[Fm]Oh He is my [Db]song

{Verse 2}
[Ab]Let the King of my [Eb]heart
[Fm]Be the shadow where I [Db]hide
[Ab]The ransom for my [Eb]life
[Fm]Oh He is my [Db]song

{Chorus}
[Ab]You are [Eb]good, good, [Fm]oh
[Db]You are good, good, [Ab]oh`,
    notes: "Written by John Mark & Sarah McMillan. Popularized by Bethel Music. Devotional and personal.",
    bpm: 72,
    tags: ["worship","devotion","goodness"],
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
