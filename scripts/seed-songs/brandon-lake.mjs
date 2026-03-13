#!/usr/bin/env node
/**
 * Seed Brandon Lake worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/brandon-lake.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Gratitude",
    artist: "Brandon Lake",
    originalKey: "B",
    format: "chordpro",
    content: `{Verse 1}
[B]All my words fall short, I got [G#m]nothing new
[E]How could I express all my [F#]gratitude

{Chorus}
[B]I could sing these songs as I [G#m]often do
[E]But every song must end and [F#]You never do

{Verse 2}
[B]So I throw up my [G#m]hands and praise You again and again
[E]'Cause all that I have is a [F#]hallelujah, hallelujah
[B]And I know it's not [G#m]much but I've nothing else
[E]Fit for a King except for a [F#]heart singing hallelujah

{Chorus}
[B]Come on my soul, oh don't you get [G#m]shy on me
[E]Lift up your song, 'cause you got a [F#]lion inside of those lungs
[B]Get up and praise the [G#m]Lord`,
    notes: "Joyful praise. Let the gratitude overflow. Full energy.",
    bpm: 81,
    tags: ["praise","gratitude","joy"],
  },
  {
    title: "Coat of Many Colors",
    artist: "Brandon Lake",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]Every color tells a [A]story
[Bm]Every thread a lesson [G]learned
[D]Through the tearing and the [A]mending
[Bm]God was making something [G]beautiful

{Chorus}
[D]He's putting on a [A]coat of many colors
[Bm]He's weaving every [G]heartbreak into gold
[D]What the enemy meant for [A]evil
[Bm]God has turned for [G]good
[D]A coat of many [A]colors
[Bm]Tells the story of His [G]love`,
    notes: "Story-driven worship, vulnerable and personal",
    bpm: 78,
    tags: ["worship","testimony","redemption"],
  },
  {
    title: "I Need a Ghost",
    artist: "Brandon Lake",
    originalKey: "F#m",
    format: "chordpro",
    content: `{Verse 1}
[F#m]I've been running on [A]empty
[E]I've been trying to [F#m]fill this void
[F#m]But nothing in this [A]world
[E]Can give me what I [F#m]need

{Chorus}
[F#m]I need a Ghost, the [A]Holy Ghost
[E]Come fill me up, I [F#m]need You most
[F#m]More than the air I [A]breathe
[E]More than a melody [F#m]I need
[F#m]I need a Ghost, the [A]Holy Ghost
[E]Come set a fire [F#m]in my bones
[F#m]Spirit I'm calling [A]out
[E]I can't live with[F#m]out You now`,
    notes: "Passionate cry for the Spirit, dynamic buildup",
    bpm: 124,
    tags: ["worship","holy-spirit","passion"],
  },
  {
    title: "Count 'Em",
    artist: "Brandon Lake",
    originalKey: "Bm",
    format: "chordpro",
    content: `{Verse 1}
[Bm]Start from the beginning [G]go back to the start
[D]Think of all the times He [A]healed your broken heart
[Bm]And when you lose your [G]focus and you can't see His hand
[D]Count your bless[A]ings one by one

{Chorus}
[Bm]Count em, count em, [G]count your blessings
[D]One by one and [A]you will see
[Bm]Count em, count em, [G]count your blessings
[D]Name them one by [A]one
[Bm]And it will surprise you [G]what the Lord has done
[D]Count [A]em`,
    notes: "Joyful and grateful, clap-along energy",
    bpm: 126,
    tags: ["worship","gratitude","joy"],
  },
  {
    title: "More (Brandon Lake)",
    artist: "Brandon Lake",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]I've tasted and I've [E]seen
[F#m]But I want more of [D]You
[A]There's a longing in my [E]soul
[F#m]Only You can [D]fill

{Chorus}
[A]More, I want [E]more
[F#m]More of Your presence [D]Lord
[A]More, give me [E]more
[F#m]I can never get e[D]nough
[A]Of Your love, of Your [E]grace
[F#m]Of Your power and Your [D]face
[A]I want more, [E]more
[F#m]Give me [D]more`,
    notes: "Intimate prayer building to passionate cry",
    bpm: 80,
    tags: ["worship","prayer","hunger"],
  },
  {
    title: "Graves to Gardens (Brandon Lake)",
    artist: "Brandon Lake",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]I searched the world but it [F]couldn't fill me
[Gm]Man's empty praise and [Eb]treasures that fade
[Bb]Are never enough [F]
[Gm]Then You came along and [Eb]put me back together

{Chorus}
[Bb]And every part of me [F]cries out
[Gm]More, more, [Eb]more

{Verse 2}
[Bb]You turn mourning to [F]dancing
[Gm]You give beauty for [Eb]ashes
[Bb]You turn graves into [F]gardens
[Gm]You turn bones into [Eb]armies
[Bb]You turn seas into [F]highways
[Gm]You're the only one [Eb]who can
[Bb]You're the only one [F]who can`,
    notes: "Brandon Lake version emphasis, raw worship energy",
    bpm: 72,
    tags: ["worship","transformation","testimony"],
  },
  {
    title: "Praise Through It",
    artist: "Brandon Lake",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]I'm gonna praise through [F]it
[Gm]I'm gonna praise through [Eb]it
[Bb]When the night is [F]long
[Gm]And the battle [Eb]rages on

{Chorus}
[Bb]I will praise through [F]it
[Gm]Every wall will [Eb]fall
[Bb]I'm gonna praise my [F]way [Eb]through`,
    notes: "Warfare worship. Keep energy high and relentless.",
    bpm: 130,
    tags: ["worship","praise","warfare"],
  },
  {
    title: "We Need the Fire",
    artist: "Brandon Lake",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]We need the fire [B]falling down
[C#m]Holy Spirit [A]come right now
[E]Like You did at [B]Pentecost
[C#m]Send the fire, [A]at any cost

{Chorus}
[E]We need the [B]fire
[C#m]We need the [A]fire
[E]Holy Ghost [B]fire [A]`,
    notes: "Acts 2 Pentecost passion. Raw, urgent energy.",
    bpm: 134,
    tags: ["worship","fire","spirit"],
  },
  {
    title: "House of Miracles",
    artist: "Brandon Lake",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]This is the house of [F]miracles
[Gm]This is where You [Eb]move
[Bb]Nothing is impos[F]sible
[Gm]When we call on [Eb]You

{Chorus}
[Bb]Miracles happen [F]here
[Gm]In the presence of the [Eb]Lord
[Bb]This is the house of [F]miracles [Eb]`,
    notes: "Faith declaration over the house of God. Builds to climax.",
    bpm: 76,
    tags: ["worship","miracles","faith"],
  },
  {
    title: "Household of Faith",
    artist: "Brandon Lake",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]We are a household of [A]faith
[Bm]Built on the rock that is [G]Jesus
[D]Standing on promises [A]made
[Bm]Generation to gener[G]ation

{Chorus}
[D]The gates of hell shall [A]not prevail
[Bm]Against the church He [G]built
[D]A household of [A]faith [G]`,
    notes: "Multigenerational anthem. Great for church families.",
    bpm: 78,
    tags: ["worship","church","faith"],
  },
  {
    title: "Tear Off the Roof",
    artist: "Brandon Lake",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]We're tearing off the [E]roof
[F#m]Nothing's gonna stop us [D]now
[A]We're bringing every[E]thing to Jesus
[F#m]Laying it all [D]down

{Chorus}
[A]Like the friends who [E]tore the roof
[F#m]We will do what[D]ever it takes
[A]To get to [E]You [D]Lord`,
    notes: "Mark 2:1-12 reference. High-energy, faith-filled.",
    bpm: 138,
    tags: ["worship","faith","scripture"],
  },
  {
    title: "Keep on Praising",
    artist: "Brandon Lake",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]I'm gonna keep on [D]praising
[Em]Keep on praising Your [C]name
[G]Even when I [D]can't see it
[Em]I'll keep on [C]praising

{Chorus}
[G]Through the storm, through the [D]fire
[Em]I keep on praising [C]higher
[G]Never gonna [D]stop, I keep on [C]praising`,
    notes: "Relentless praise energy. Great for pushing through.",
    bpm: 128,
    tags: ["worship","praise","perseverance"],
  },
  {
    title: "Fire",
    artist: "Brandon Lake",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]Send Your fire [G]down
[Am]Let it burn in [F]us
[C]Holy fire [G]consume
[Am]Everything that's [F]not of You

{Chorus}
[C]Fire, [G]fire
[Am]Fall on [F]us
[C]Holy Spirit [G]fire [F]come`,
    notes: "Short, intense worship moment. Loop-able for extended sets.",
    bpm: 80,
    tags: ["worship","fire","holiness"],
  },
  {
    title: "I Believe (Brandon Lake)",
    artist: "Brandon Lake",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]I believe in the [F]power of God
[Gm]I believe in the [Eb]name of Jesus
[Bb]I believe that the [F]Word is alive
[Gm]And it cuts like the [Eb]sharpest sword

{Chorus}
[Bb]I believe, [F]I believe
[Gm]Lord I be[Eb]lieve
[Bb]Help my unbe[F]lief [Eb]`,
    notes: "Mark 9:24 conclusion. Bold statement of faith.",
    bpm: 74,
    tags: ["worship","faith","declaration"],
  },
  {
    title: "Ready to Praise",
    artist: "Brandon Lake",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]I came here [B]ready to praise
[C#m]Ready to give You [A]everything
[E]Nothing held [B]back
[C#m]I'm ready to [A]praise

{Chorus}
[E]With everything I [B]am
[C#m]Every breath in my [A]lungs
[E]I came ready to [B]praise [A]`,
    notes: "High energy opener. Sets the tone for worship.",
    bpm: 136,
    tags: ["worship","praise","energy"],
  },
  {
    title: "Waking Up",
    artist: "Brandon Lake",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]Something's waking [A]up inside of me
[Bm]Like a fire that [G]will not sleep
[D]Revival starting [A]in my soul
[Bm]I'm waking up to [G]who You are

{Chorus}
[D]Waking up, [A]waking up
[Bm]To the truth that [G]sets me free
[D]Waking up [A]again [G]`,
    notes: "Ephesians 5:14 theme. Morning worship vibe.",
    bpm: 118,
    tags: ["worship","awakening","revival"],
  },
  {
    title: "Bethlehem",
    artist: "Brandon Lake",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]O little town of [D]Bethlehem
[Em]Where the Savior [C]came
[G]Heaven touched the [D]earth that night
[Em]Nothing was the [C]same

{Chorus}
[G]In a manger [D]small and lowly
[Em]God became a [C]man
[G]Bethlehem, where [D]it all be[C]gan`,
    notes: "Christmas / Advent song. Reflective, wonder-filled.",
    bpm: 64,
    tags: ["worship","christmas","advent"],
  },
  {
    title: "Rivers",
    artist: "Brandon Lake",
    originalKey: "F",
    format: "chordpro",
    content: `{Verse 1}
[F]Rivers of living [C]water
[Dm]Flowing from the [Bb]throne
[F]Streams in the [C]desert
[Dm]You are never [Bb]done

{Chorus}
[F]Like a river [C]rushing through
[Dm]Your Spirit flows and [Bb]makes all new
[F]Rivers of [C]life [Bb]`,
    notes: "John 7:38. Flowing, dynamic arrangement.",
    bpm: 72,
    tags: ["worship","spirit","life"],
  },
  {
    title: "Pour It Out (Brandon Lake)",
    artist: "Brandon Lake",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]Pour it out, pour it [E]out
[F#m]Like perfume on Your [D]feet
[A]Pour it out, pour it [E]out
[F#m]This worship is for [D]You

{Chorus}
[A]Nothing held [E]back
[F#m]Nothing too [D]precious
[A]I pour it [E]out at Your [D]feet`,
    notes: "Mary anointing Jesus. Extravagant worship theme.",
    bpm: 68,
    tags: ["worship","surrender","devotion"],
  },
  {
    title: "Overflow",
    artist: "Brandon Lake",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]Let Your presence over[G]flow
[Am]Fill every corner [F]of my soul
[C]More than I can [G]hold
[Am]Let it over[F]flow

{Chorus}
[C]Overflow, [G]overflow
[Am]Let Your love [F]overflow
[C]From my life to [G]everyone I [F]know`,
    notes: "Outward-focused worship. Joy and generosity.",
    bpm: 120,
    tags: ["worship","overflow","joy"],
  },
  {
    title: "Thank You Lord",
    artist: "Brandon Lake",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Thank You Lord for [D]all You've done
[Em]Thank You Lord for [C]every one
[G]Thank You for Your [D]faithful love
[Em]That never gives [C]up

{Chorus}
[G]In the morning [D]I will praise
[Em]Through the night I'll [C]sing Your name
[G]Thank You [D]Lord [C]`,
    notes: "Gratitude anthem. Warm, congregational feel.",
    bpm: 74,
    tags: ["worship","gratitude","thanksgiving"],
  },
  {
    title: "Healing in Your Hands",
    artist: "Brandon Lake",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]There is healing in Your [D]hands
[Em]There is power in Your [C]name
[G]Every sickness has to [D]bow
[Em]At the sound of Your [C]name

{Chorus}
[G]You are the God who [D]heals
[Em]You are the God who [C]restores
[G]I believe there's [D]healing in Your hands
[Em]Nothing is too [C]hard for You`,
    notes: "Faith declaration for healing. Builds with intensity.",
    bpm: 76,
    tags: ["worship","healing","faith"],
  },
  {
    title: "On and On",
    artist: "Brandon Lake",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]Your love goes on and [G]on
[Am]It never stops, it [F]never ends
[C]From the beginning to the [G]end
[Am]Your faithfulness goes [F]on and on

{Chorus}
[C]On and on and [G]on
[Am]Your mercy keeps on [F]running
[C]On and on and [G]on
[Am]I'll sing of Your good[F]ness forever`,
    notes: "Celebratory and upbeat. Great for congregational singing.",
    bpm: 132,
    tags: ["worship","faithfulness","joy"],
  },
  {
    title: "Greater Still",
    artist: "Brandon Lake",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]Greater still than [E]any mountain
[F#m]Greater still than [D]any sea
[A]Greater still than [E]all my failures
[F#m]Is the One who [D]lives in me

{Chorus}
[A]Greater still, [E]greater still
[F#m]Your love is greater [D]still
[A]Nothing compares to [E]who You are
[F#m]You are greater [D]still`,
    notes: "Bold declaration of God's greatness. Big sound, full energy.",
    bpm: 78,
    tags: ["worship","greatness","declaration"],
  },
  {
    title: "Mind to Flesh",
    artist: "Brandon Lake",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]You became mind to [B]flesh
[C#m]Heaven's King took human [A]breath
[E]Wrapped in frailty, [B]full of grace
[C#m]Love came down to [A]take my place

{Chorus}
[E]From the throne to a [B]manger
[C#m]From the glory to the [A]grave
[E]Mind to flesh, the [B]God who saves
[C#m]You gave it [A]all`,
    notes: "Incarnation theme. Reverent and awe-filled.",
    bpm: 68,
    tags: ["worship","incarnation","grace"],
  },
  {
    title: "Dwelling Place",
    artist: "Brandon Lake",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]You are my dwelling [A]place
[Bm]My refuge and my [G]strength
[D]In the shadow of Your [A]wings
[Bm]I find my hiding [G]place

{Chorus}
[D]Here in Your [A]presence
[Bm]I am safe and [G]found
[D]You are my dwelling [A]place
[Bm]My feet are on solid [G]ground`,
    notes: "Psalm 91 theme. Intimate and restful worship.",
    bpm: 66,
    tags: ["worship","refuge","peace"],
  },
  {
    title: "The One",
    artist: "Brandon Lake",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]You're the One my [F]heart is after
[Gm]You're the One my [Eb]soul adores
[Bb]Not another, [F]there's no other
[Gm]You're the One I'm [Eb]living for

{Chorus}
[Bb]The One who was and [F]is and is to come
[Gm]The One who holds it [Eb]all together
[Bb]You are the [F]One [Eb]`,
    notes: "Passionate devotion. Focused on the supremacy of Christ.",
    bpm: 74,
    tags: ["worship","devotion","Jesus"],
  },
  {
    title: "Dangerous Prayers",
    artist: "Brandon Lake",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Break me, mold me, [D]fill me, use me
[Em]These are dangerous [C]prayers
[G]Search me, know me, [D]try me, lead me
[Em]Lord, I'm not [C]scared

{Chorus}
[G]I'll pray the prayers that [D]scare me
[Em]I'll say the words that [C]break me
[G]Whatever it costs, [D]I surrender it all
[Em]These dangerous [C]prayers`,
    notes: "Challenging and convicting. Invites bold surrender.",
    bpm: 82,
    tags: ["worship","prayer","surrender"],
  },
  {
    title: "All Hail King Jesus (Brandon Lake)",
    artist: "Brandon Lake",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]All hail King [G]Jesus
[Am]All hail the Lord of [F]heaven
[C]Every throne must [G]bow
[Am]At the sound of Your [F]name

{Chorus}
[C]All hail King [G]Jesus
[Am]We will shout Your [F]praise forever
[C]Lift your voice and [G]sing
[Am]All hail the [F]King of kings`,
    notes: "Royal proclamation. Full-voiced congregational anthem.",
    bpm: 80,
    tags: ["worship","kingship","praise"],
  },
  {
    title: "Throne Room (Brandon Lake)",
    artist: "Brandon Lake",
    originalKey: "F",
    format: "chordpro",
    content: `{Verse 1}
[F]Take me to the [C]throne room
[Dm]Where the angels [Bb]cry
[F]Holy, holy, [C]holy
[Dm]Is the Lord Most [Bb]High

{Chorus}
[F]In the throne room [C]of Your glory
[Dm]I will bow be[Bb]fore You
[F]Heaven and earth are [C]filled with Your praise
[Dm]Holy is the [Bb]Lord`,
    notes: "Isaiah 6 / Revelation 4 imagery. Weighty and reverent.",
    bpm: 70,
    tags: ["worship","holiness","throne"],
  },
  {
    title: "Philippians 1",
    artist: "Brandon Lake",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]For me to live is [A]Christ
[Bm]And to die is [G]gain
[D]He who began a [A]good work
[Bm]Will be faithful to com[G]plete it

{Chorus}
[D]I am confident of [A]this
[Bm]That He who started [G]it
[D]Will carry it [A]on
[Bm]To the day of Christ [G]Jesus`,
    notes: "Scripture song. Meditative, builds with conviction.",
    bpm: 72,
    tags: ["worship","scripture","faith"],
  },
  {
    title: "Mountains",
    artist: "Brandon Lake",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]Move mountains, [E]move mountains
[F#m]With a word You can [D]move mountains
[A]Speak and the earth will [E]shake
[F#m]Nothing stands in [D]Your way

{Chorus}
[A]I speak to the [E]mountain
[F#m]In the name of [D]Jesus, move
[A]My God is bigger than [E]any mountain
[F#m]I will not be [D]moved`,
    notes: "Mark 11:23 faith declaration. Bold and energetic.",
    bpm: 130,
    tags: ["worship","faith","declaration"],
  },
  {
    title: "New Season",
    artist: "Brandon Lake",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]I can feel it in the [D]air
[Em]Something new is [C]happening
[G]The old is gone, the [D]new has come
[Em]A brand new [C]season

{Chorus}
[G]New season, [D]new sound
[Em]New anointing [C]coming down
[G]I step into the [D]new thing
[Em]You are doing [C]now`,
    notes: "Isaiah 43:19. Fresh expectation and hope.",
    bpm: 120,
    tags: ["worship","new season","hope"],
  },
  {
    title: "Praise Break",
    artist: "Brandon Lake",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]Let the praise [F]break out
[Gm]Can't hold it [Eb]in
[Bb]Every chain is [F]breaking
[Gm]Let the praise be[Eb]gin

{Chorus}
[Bb]Praise break, [F]praise break
[Gm]We give You all the [Eb]glory
[Bb]When the praises [F]go up
[Gm]The walls come [Eb]down`,
    notes: "High energy, explosive praise moment. Full band and congregation.",
    bpm: 140,
    tags: ["worship","praise","breakthrough"],
  },
  {
    title: "Holy Ground",
    artist: "Brandon Lake",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]We are standing on [B]holy ground
[C#m]And I know that there are [A]angels all around
[E]Let us praise [B]Jesus now
[C#m]We are standing in His [A]presence on holy ground

{Chorus}
[E]This is holy [B]ground
[C#m]We're standing on [A]holy ground
[E]For the Lord is [B]here
[C#m]And where He is, is [A]holy`,
    notes: "Reverent and awe-filled. Sense of the sacred.",
    bpm: 64,
    tags: ["worship","holiness","presence"],
  },
  {
    title: "Declarations",
    artist: "Brandon Lake",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]I declare the [G]promises of God
[Am]Over my life, over my [F]home
[C]What He said He [G]will do
[Am]Every word is [F]true

{Chorus}
[C]I declare that [G]I am free
[Am]I declare His [F]victory
[C]The Word of the Lord [G]stands forever
[Am]I will speak His [F]declarations`,
    notes: "Prophetic declaration song. Authoritative and bold.",
    bpm: 84,
    tags: ["worship","declaration","faith"],
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
