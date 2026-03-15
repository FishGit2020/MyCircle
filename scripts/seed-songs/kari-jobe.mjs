#!/usr/bin/env node
/**
 * Seed Kari Jobe worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/kari-jobe.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Revelation Song [INCOMPLETE - needs Bridge]",
    artist: "Kari Jobe",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]Worthy is the [Am]Lamb who was slain
[C]Holy, holy is [G]He
[D]Sing a new song [Am]to Him who sits on
[C]Heaven's mercy [G]seat

{Chorus}
[D]Holy, holy, [Am]holy is the Lord God Al[C]mighty
[G]Who was and is and [D]is to come
[D]With all creation [Am]I sing praise to the [C]King of kings
[G]You are my every[D]thing and I will adore You

{Verse 2}
[D]Clothed in rainbows [Am]of living color
[C]Flashes of lightning, [G]rolls of thunder
[D]Blessing and honor, [Am]strength and glory
[C]And power be to [G]You, the only wise King`,
    notes: "Prophetic worship. Let it breathe and build.",
    bpm: 66,
    tags: ["worship","revelation","holiness"],
  },
  {
    title: "The Blessing",
    artist: "Kari Jobe",
    originalKey: "B",
    format: "chordpro",
    content: `{Verse 1}
[B]The Lord bless you and [F#]keep you
[G#m]Make His face shine upon [E]you
And be gracious to [B]you
The Lord turn His [F#]face toward you
[G#m]And give you [E]peace

{Chorus}
[B]Amen, [F#]amen, [G#m]amen
[E]Amen, [B]amen, [F#]amen

{Verse 2}
[G#m]May His [E]favor be upon you
[B]And a thousand [F#]generations
[G#m]And your [E]family and your children
[B]And their [F#]children and their children

{Bridge}
[G#m]May His [E]presence go before you
[B]And behind you [F#]and beside you
[G#m]All a[E]round you and within you
[B]He is [F#]with you, He is with you`,
    notes: "Benediction song. Powerful extended worship. Based on Numbers 6:24-26.",
    bpm: 72,
    tags: ["worship","blessing","prayer"],
  },
  {
    title: "Forever (We Sing Hallelujah)",
    artist: "Kari Jobe",
    originalKey: "Ab",
    format: "chordpro",
    content: `{Verse 1}
[Ab]The moon and stars they [Fm]wept
[Db]The morning sun was [Ab]dead
[Ab]The Savior of the [Fm]world was fallen
[Db]His body on the [Eb]cross
[Db]His blood poured out for [Eb]us
[Ab]The weight of every [Fm]curse upon Him

{Verse 2}
[Ab]One final breath He [Fm]gave
[Db]As heaven looked a[Ab]way
[Ab]The Son of God was [Fm]laid in darkness
[Db]A battle in the [Eb]grave
[Db]The war on death was [Eb]waged
[Ab]The power of hell for[Fm]ever broken

{Verse 3}
[Ab]The ground began to [Fm]shake, the stone was rolled [Db]away
[Ab]His perfect love could [Fm]not be overcome
[Db]Now death where is your [Eb]sting, our resurrected [Fm]King
[Db]Has rendered you de[Eb]feated

{Chorus}
[Ab]Forever He is [Fm]glorified, forever He is [Db]lifted high
[Ab]Forever He is [Fm]risen, He is a[Db]live, He is a[Eb]live`,
    notes: "Resurrection anthem. Builds from somber verse to explosive chorus.",
    bpm: 74,
    tags: ["worship","resurrection","victory"],
  },
  {
    title: "I Am Not Alone [INCOMPLETE - needs V2+Bridge]",
    artist: "Kari Jobe",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]When I walk through [A]deep waters
[C#m]I know that You will [B]be with me
[E]When I'm standing [A]in the fire
[C#m]I will not be over[B]come

{Chorus}
[E]I am not a[A]lone
[C#m]I am not a[B]lone
[E]You will go be[A]fore me
[C#m]You will never [B]leave me`,
    notes: "Isaiah 43:2. Powerful reassurance anthem.",
    bpm: 72,
    tags: ["worship","comfort","promise"],
  },
  {
    title: "Speak to Me (Kari Jobe) [INCOMPLETE - needs V2+Bridge]",
    artist: "Kari Jobe",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]Speak to me, [E]speak to me
[F#m]Holy Spirit [D]come
[A]Open my ears to [E]hear Your voice
[F#m]Above the noise of [D]this world

{Chorus}
[A]Speak, for Your [E]servant hears
[F#m]Quiet the storm in [D]me
[A]Speak to me [E]Lord [D]`,
    notes: "1 Samuel 3:10 inspired. Meditative and still.",
    bpm: 60,
    tags: ["worship","listening","prayer"],
  },
  {
    title: "Heal Our Land [INCOMPLETE - needs V2+Bridge]",
    artist: "Kari Jobe",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]If My people will [D]humbly pray
[Em]Turn from their sin and [C]seek My face
[G]I will hear from [D]heaven
[Em]And heal their [C]land

{Chorus}
[G]Heal our land, [D]heal our land
[Em]Lord we cry [C]out to You
[G]Heal our [D]land [C]Lord`,
    notes: "2 Chronicles 7:14. Corporate prayer and repentance.",
    bpm: 68,
    tags: ["worship","prayer","nation"],
  },
  {
    title: "First Love [INCOMPLETE - needs V2+Bridge]",
    artist: "Kari Jobe",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]Take me back to my [G]first love
[Am]Where my heart was [F]fully Yours
[C]Take me back to the [G]beginning
[Am]When I lived for [F]You alone

{Chorus}
[C]You're my first [G]love
[Am]Nothing compares to [F]You
[C]You're my first [G]love [F]Lord`,
    notes: "Revelation 2:4. Returning to devotion. Tender.",
    bpm: 66,
    tags: ["worship","devotion","return"],
  },
  {
    title: "You Are for Me [INCOMPLETE - needs V2+Bridge]",
    artist: "Kari Jobe",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]So I will not [E]fear
[F#m]You are for [D]me
[A]So I will not [E]fear
[F#m]You are for [D]me

{Chorus}
[A]I know who goes be[E]fore me
[F#m]I know who stands be[D]hind
[A]The God of angel [E]armies
[F#m]Is always by my [D]side`,
    notes: "Romans 8:31 declaration. Builds in confidence.",
    bpm: 74,
    tags: ["worship","courage","assurance"],
  },
  {
    title: "We Are [INCOMPLETE - needs V2+Bridge]",
    artist: "Kari Jobe",
    originalKey: "F",
    format: "chordpro",
    content: `{Verse 1}
[F]We are the [C]light of the world
[Dm]We are a city on a [Bb]hill
[F]We are the [C]light of the world
[Dm]We gotta, we gotta, we gotta let the [Bb]light shine

{Chorus}
[F]We are, we [C]are
[Dm]Called to be [Bb]Your hands and feet
[F]We are, we [C]are the body of [Bb]Christ`,
    notes: "Matthew 5:14. Mission and identity anthem.",
    bpm: 128,
    tags: ["worship","mission","identity"],
  },
  {
    title: "Keeper of My Heart [INCOMPLETE - needs V2+Bridge]",
    artist: "Kari Jobe",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]You are the keeper [A]of my heart
[Bm]You hold it all to[G]gether
[D]When the world is [A]falling apart
[Bm]You hold me [G]together

{Chorus}
[D]Keeper of my [A]heart
[Bm]Nothing can [G]pull me apart from You
[D]Keeper of my [A]heart [G]`,
    notes: "Intimate love song to God. Piano-driven.",
    bpm: 66,
    tags: ["worship","love","intimacy"],
  },
  {
    title: "Let the Heavens Open [INCOMPLETE - needs V2+Bridge]",
    artist: "Kari Jobe",
    originalKey: "F",
    format: "chordpro",
    content: `{Verse 1}
[F]Let the heavens [C]open
[Dm]Let Your glory [Bb]fall
[F]Rain down, rain [C]down on us
[Dm]We need You [Bb]Lord

{Chorus}
[F]Open up the [C]heavens
[Dm]We wanna see [Bb]You
[F]Let the heavens [C]open [Bb]now`,
    notes: "Atmospheric, building worship. Great for prayer sets.",
    bpm: 70,
    tags: ["worship","heaven","prayer"],
  },
  {
    title: "Breathe on Us [INCOMPLETE - needs V2+Bridge]",
    artist: "Kari Jobe",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Breathe on us, [D]breathe on us
[Em]Holy Spirit [C]come breathe on us
[G]Like a rushing [D]wind
[Em]Like a holy [C]flame

{Chorus}
[G]Breathe on us [D]Lord
[Em]Bring life where [C]there is none
[G]Breathe on [D]us [C]Lord`,
    notes: "Ezekiel 37 valley of dry bones inspiration. Desperate prayer.",
    bpm: 64,
    tags: ["worship","spirit","prayer"],
  },
  {
    title: "Steady My Heart [INCOMPLETE - needs V2+Bridge]",
    artist: "Kari Jobe",
    originalKey: "Ab",
    format: "chordpro",
    content: `{Verse 1}
[Ab]Wish it could be [Eb]easy
[Fm]Why is life so [Db]messy
[Ab]Why is pain a [Eb]part of us
[Fm]There are days I [Db]feel like
[Ab]Nothing ever [Eb]goes right

{Chorus}
[Ab]Steady my heart [Eb]Lord
[Fm]Even when I [Db]can't see
[Ab]I will trust in [Eb]You [Db]Lord`,
    notes: "Honest vulnerability. Women's ministry favorite.",
    bpm: 68,
    tags: ["worship","trust","honesty"],
  },
  {
    title: "Fall Afresh [INCOMPLETE - needs V2+Bridge]",
    artist: "Kari Jobe",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]Fall afresh on [A]me
[Bm]Spirit of the [G]living God
[D]Fall afresh on [A]me
[Bm]Come and fill this [G]place

{Chorus}
[D]Awaken my [A]soul
[Bm]Come awaken my [G]soul
[D]Come and fill this [A]place
[Bm]Let us see Your [G]face`,
    notes: "Gateway Worship era. Spirit invitation song.",
    bpm: 62,
    tags: ["worship","spirit","renewal"],
  },
  {
    title: "Hands to the Heavens [INCOMPLETE - needs V2+Bridge]",
    artist: "Kari Jobe",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]With our hands to the [F]heavens
[Gm]Alive in Your pre[Eb]sence
[Bb]O God, when You [F]come
[Gm]Blessed are we who are [Eb]hungry

{Chorus}
[Bb]Hands to the [F]heavens
[Gm]We lift our [Eb]voices
[Bb]Be glorified [F]Lord [Eb]`,
    notes: "Physical expression worship. Encourage the room.",
    bpm: 76,
    tags: ["worship","praise","expression"],
  },
  {
    title: "Lead Me to the Cross [INCOMPLETE - needs V2+Bridge]",
    artist: "Kari Jobe",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]Savior I come, [E]quiet my soul
[F#m]Remember re[D]demption's hill
[A]Where Your blood was [E]spilled
[F#m]For my ran[D]som

{Chorus}
[A]Lead me to the [E]cross
[F#m]Where Your love poured [D]out
[A]Bring me to my [E]knees
[F#m]Lord I lay me [D]down`,
    notes: "Originally Brooke Fraser / Hillsong, Kari Jobe version. Communion.",
    bpm: 66,
    tags: ["worship","cross","surrender"],
  },
  {
    title: "Beautiful [INCOMPLETE - needs V2+Bridge]",
    artist: "Kari Jobe",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]I see Your face in [A]every sunrise
[Bm]The colors of the [G]morning are inside Your eyes
[D]The world awakens [A]in the light of the day
[Bm]I look up to the [G]sky and say

{Chorus}
[D]You're beautiful, [A]beautiful
[Bm]God You're beautiful, [G]beautiful
[D]Everything You are is [A]beautiful [G]`,
    notes: "From her debut album. Simple adoration of God's beauty.",
    bpm: 70,
    tags: ["worship","beauty","creation"],
  },
  {
    title: "The Garden [INCOMPLETE - needs V2+Bridge]",
    artist: "Kari Jobe",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]I had all but [G]given up
[Am]Desperate for a [F]sign from love
[C]Something good, some[G]thing kind
[Am]Bringing peace to [F]every corner of my mind

{Chorus}
[C]Then I saw the [G]garden
[Am]You had planted [F]for me
[C]In the middle of my [G]darkest night
[Am]It was blooming [F]beautifully
[C]Faith was the evi[G]dence
[Am]Of what only [F]You could do`,
    notes: "From the Garden album. Personal testimony of hope in grief.",
    bpm: 64,
    tags: ["worship","hope","healing","testimony"],
  },
  {
    title: "Savior's Here [INCOMPLETE - needs V2+Bridge]",
    artist: "Kari Jobe",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]I can hear You [F]calling my name
[Gm]I can feel You [Eb]right here in this place
[Bb]Every burden is [F]lifted
[Gm]Every chain falls [Eb]away

{Chorus}
[Bb]The Savior's [F]here
[Gm]The Savior's [Eb]here
[Bb]Open your eyes the [F]Savior's here
[Gm]He's right here in this [Eb]place`,
    notes: "Presence-focused worship. Great for altar moments.",
    bpm: 70,
    tags: ["worship","presence","savior"],
  },
  {
    title: "Only Your Love [INCOMPLETE - needs V2+Bridge]",
    artist: "Kari Jobe",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Only Your love can [D]satisfy
[Em]Only Your love could [C]fill this heart of mine
[G]I've tried the [D]world and all its ways
[Em]But only Your love can [C]save

{Chorus}
[G]Only Your love, [D]only Your grace
[Em]Could take someone [C]like me
[G]And make me [D]whole a[C]gain`,
    notes: "Personal testimony of sufficiency in God. Piano-led.",
    bpm: 68,
    tags: ["worship","love","sufficiency"],
  },
  {
    title: "Holy Spirit (Kari Jobe) [INCOMPLETE - needs Bridge]",
    artist: "Kari Jobe",
    originalKey: "Ab",
    format: "chordpro",
    content: `{Verse 1}
[Ab]Holy Spirit [Eb]You are welcome here
[Fm]Come flood this place and [Db]fill the atmosphere
[Ab]Your glory God is [Eb]what our hearts long for
[Fm]To be overcome by [Db]Your presence Lord

{Chorus}
[Ab]Holy [Eb]Spirit
[Fm]You are welcome [Db]here
[Ab]Come flood this [Eb]place and fill the atmo[Db]sphere

{Verse 2}
[Ab]Let us become more [Eb]aware of Your presence
[Fm]Let us experience the [Db]glory of Your goodness`,
    notes: "With Bryan & Katie Torwalt. Atmospheric and invitational.",
    bpm: 66,
    tags: ["worship","spirit","presence"],
  },
  {
    title: "No Sweeter Name [INCOMPLETE - needs V2+Bridge]",
    artist: "Kari Jobe",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]No sweeter name than the [D]name of Jesus
[Em]No sweeter name have I [C]ever known
[G]No sweeter name than the [D]name of Jesus
[Em]You are the [C]risen King

{Chorus}
[G]You are the [D]Prince of Peace
[Em]Wonderful Coun[C]selor
[G]You are the [D]mighty God [C]`,
    notes: "Early Kari Jobe worship classic. Adoration of the name.",
    bpm: 72,
    tags: ["worship","name","adoration"],
  },
  {
    title: "Here (Kari Jobe) [INCOMPLETE - needs V2+Bridge]",
    artist: "Kari Jobe",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]Come and be [G]near
[Am]Draw close as we [F]sing
[C]There's nowhere we'd [G]rather be
[Am]Than here in Your [F]presence

{Chorus}
[C]Here, [G]here
[Am]We are [F]here
[C]In the place where [G]heaven meets earth
[Am]We are [F]here with You`,
    notes: "Simple presence declaration. Great set opener.",
    bpm: 68,
    tags: ["worship","presence","gathering"],
  },
  {
    title: "Majestic (Kari Jobe) [INCOMPLETE - needs V2+Bridge]",
    artist: "Kari Jobe",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]O Lord our Lord how [B]majestic
[C#m]Is Your name in [A]all the earth
[E]You have set Your [B]glory
[C#m]Above the [A]heavens

{Chorus}
[E]Majestic, [B]majestic
[C#m]Your name is [A]high above all
[E]Majestic [B]Lord [A]`,
    notes: "Psalm 8:1. Grand and declarative. Full band arrangement.",
    bpm: 76,
    tags: ["worship","majesty","psalm"],
  },
  {
    title: "Look Upon the Lord [INCOMPLETE - needs V2+Bridge]",
    artist: "Kari Jobe",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]Look upon the [B]Lord
[C#m]And be radi[A]ant
[E]Let no shame cover [B]your face
[C#m]He's the lifter of [A]your head

{Chorus}
[E]Look upon the [B]Lord
[C#m]Gaze into His [A]eyes
[E]And see the love that [B]never ends
[C#m]Look upon the [A]Lord`,
    notes: "Psalm 34:5. Encountering God face to face.",
    bpm: 62,
    tags: ["worship","gaze","encounter"],
  },
  {
    title: "I Need You (Kari Jobe) [INCOMPLETE - needs V2+Bridge]",
    artist: "Kari Jobe",
    originalKey: "F#",
    format: "chordpro",
    content: `{Verse 1}
[F#]I need You, [C#]oh I need You
[Ebm]Every hour I [B]need You
[F#]My one defense, my [C#]righteousness
[Ebm]Oh God how I [B]need You

{Chorus}
[F#]Where sin runs [C#]deep Your grace is more
[Ebm]Where grace is found is [B]where You are
[F#]And where You are Lord [C#]I am free
[Ebm]Holiness is [B]Christ in me`,
    notes: "Hymn meets modern worship. Matt Maher co-write.",
    bpm: 70,
    tags: ["worship","need","grace"],
  },
  {
    title: "Exhale [INCOMPLETE - needs V2+Bridge]",
    artist: "Kari Jobe",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]Breathe in, breathe [F]out
[Gm]Let the Spirit of [Eb]God breathe through you
[Bb]Breathe in, breathe [F]out
[Gm]Let go of every [Eb]worry

{Chorus}
[Bb]Exhale, [F]exhale
[Gm]Cast your cares on [Eb]Him
[Bb]Exhale and [F]breathe Him in [Eb]`,
    notes: "Soaking worship. Slow and meditative. 1 Peter 5:7.",
    bpm: 56,
    tags: ["worship","rest","peace"],
  },
  {
    title: "Embers [INCOMPLETE - needs V2+Bridge]",
    artist: "Kari Jobe",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]Fan the flame inside of [A]me
[Bm]Don't let this fire burn [G]out
[D]What was once an [A]ember
[Bm]Is now a raging [G]fire

{Chorus}
[D]Let the embers [A]glow
[Bm]Let the fire [G]grow
[D]Holy Spirit [A]come
[Bm]Set my heart a[G]blaze for [D]You`,
    notes: "2 Timothy 1:6. Stirring up the gifts. Builds in intensity.",
    bpm: 74,
    tags: ["worship","fire","revival"],
  },
  {
    title: "Love Came Down [INCOMPLETE - needs V2+Bridge]",
    artist: "Kari Jobe",
    originalKey: "Ab",
    format: "chordpro",
    content: `{Verse 1}
[Ab]If my heart is over[Eb]whelmed
[Fm]And I cannot hear Your [Db]voice
[Ab]I'll hold on to what is [Eb]true
[Fm]Though I cannot see [Db]

{Chorus}
[Ab]Love came [Eb]down
[Fm]And rescued [Db]me
[Ab]Love came [Eb]down
[Fm]And set me [Db]free
[Ab]I am Yours, [Eb]Lord [Db]forever I am Yours`,
    notes: "Brian Johnson co-write. Bethel meets Kari. Anthem of rescue.",
    bpm: 72,
    tags: ["worship","love","rescue"],
  },
  {
    title: "The More I Seek You [INCOMPLETE - needs V2+Bridge]",
    artist: "Kari Jobe",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]The more I seek [B]You
[C#m]The more I find [A]You
[E]The more I find [B]You
[C#m]The more I love [A]You

{Chorus}
[E]I want to sit at Your [B]feet
[C#m]Drink from the cup in Your [A]hand
[E]Lay back against [B]You and breathe
[C#m]Feel Your heart[A]beat
[E]This love is so [B]deep it's more than [A]I can stand`,
    notes: "Gateway classic. Intimate soaking worship. Let it breathe.",
    bpm: 58,
    tags: ["worship","intimacy","seeking"],
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
