#!/usr/bin/env node
/**
 * Seed Hillsong UNITED worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/hillsong-united.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Oceans (Where Feet May Fail)",
    artist: "Hillsong UNITED",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[Bm]You call me out upon the [A/C#]waters
[D]The great un[A]known where feet may [Bm]fail
[Bm]And there I find You in the [A/C#]mystery
[D]In oceans [A]deep my faith will [Bm]stand

{Chorus}
[A]And I will [D]call upon Your Name
[G]And keep my [Bm]eyes above the [A]waves
When oceans [D]rise
My soul will [G]rest in Your em[Bm]brace
For I am [D]Yours [A]and You are [Bm]mine

{Verse 2}
[Bm]Your grace a[A/C#]bounds in deepest [D]waters
[D]Your sovereign [A]hand will be my [Bm]guide
[Bm]Where feet may [A/C#]fail and fear sur[D]rounds me
[D]You've never [A]failed and You won't start [Bm]now

{Bridge}
[D]Spirit lead me where my [A]trust is without borders
[Bm]Let me walk upon the [G]waters
[D]Wherever You would [A]call me
[D]Take me deeper than my [A]feet could ever wander
[Bm]And my faith will be made [G]stronger
[D]In the presence of my [A]Savior`,
    notes: "Iconic song. Extended bridge section works well for prayer moments.",
    bpm: 66,
    tags: ["worship","faith","prayer"],
  },
  {
    title: "So Will I (100 Billion X)",
    artist: "Hillsong UNITED",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]God of creation
[Em]There at the start, before the [C]beginning of time
[G]With no point of reference
[Em]You spoke to the dark and [C]fleshed out the wonder of [D]light

{Chorus}
[G]And as You speak
[Em]A hundred billion [C]galaxies are born
[G]In the vapor of Your [Em]breath the planets form
[C]If the stars were made to [D]worship so will I

{Verse 2}
[G]God of Your promise
[Em]You don't speak in vain, no [C]syllable empty or void
[G]For once You have spoken
[Em]All nature and science [C]follow the sound of Your [D]voice

{Chorus}
[G]And as You speak
[Em]A hundred billion [C]creatures catch Your breath
[G]Evolving in pur[Em]suit of what You said
[C]If it all reveals Your [D]nature so will I`,
    notes: "Poetic and expansive. Let the dynamics breathe. Great for reflection.",
    bpm: 67,
    tags: ["worship","creation","devotion"],
  },
  {
    title: "Even When It Hurts (Praise Song)",
    artist: "Hillsong UNITED",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[Bb]Take this fainted heart
[Gm]Take these tainted hands
[Eb]Wash me in Your love
[F]Come like grace again

{Chorus}
[Bb]Even when my strength is lost
[Gm]I'll praise You
[Eb]Even when I have no song
[F]I'll praise You
[Bb]Even when it's hard to find the [Gm]words
[Eb]Louder then I'll sing Your [F]praise

{Tag}
[Bb]I will only sing Your [Gm]praise
[Eb]I will only sing Your [F]praise

{Verse 2}
[Bb]Take this mountain weight
[Gm]Take these ocean tears
[Eb]Hold me through the trial
[F]Come like hope again`,
    notes: "Vulnerable worship moment. Acoustic arrangement works well.",
    bpm: 71,
    tags: ["worship","lament","perseverance"],
  },
  {
    title: "Touch the Sky",
    artist: "Hillsong UNITED",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]What fortune lies beyond the stars
[B]Those dazzling heights too vast to see
[C#m]Oh I got lost in [A]empty living
[E]Oh I found my life in [B]bleeding love
[C#m]Poured out, pouring [A]in

{Verse 2}
[E]What treasure waits within Your scars
[B]This gift of freedom, gold can't buy
[C#m]I bought the world and [A]sold my heart
[E]You traded heaven [B]to have me again
[C#m]My God, my [A]friend

{Chorus}
[E]My heart beating, my soul breathing
[B]I found my life when I laid it down
[C#m]Upward falling, [A]spirit soaring
[E]I touch the sky when my knees hit the [B]ground`,
    notes: "Anthemic with a big chorus. Full band energy.",
    bpm: 140,
    tags: ["praise","surrender","anthem"],
  },
  {
    title: "Alive",
    artist: "Hillsong UNITED",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]I was lost with a [Eb]broken heart
[F]You picked me up, [Bb]now I'm standing tall
[Bb]I was dead in the [Eb]dark
[F]Now I'm alive in [Bb]Your love

{Verse 2}
[Bb]You cut through all the [Eb]lies and shame
[F]You rose to call me [Bb]by my name
[Bb]The price was paid, [Eb]chains fall away
[F]I'm not the [Bb]same

{Chorus}
[Bb]I'm alive, I'm a[Eb]live, I'm alive, I'm a[F]live
[Bb]You make me come a[Eb]live, alive, a[F]live
[Bb]My dead bones [Eb]rose, my eyes are [F]open wide
[Bb]I'm alive, I'm a[Eb]live, I'm alive, I'm a[F]live`,
    notes: "High energy declaration. Great for youth worship.",
    bpm: 136,
    tags: ["praise","life","celebration"],
  },
  {
    title: "Another in the Fire",
    artist: "Hillsong UNITED",
    originalKey: "Ab",
    format: "chordpro",
    content: `{Verse 1}
[A]There's a grace when the [E]heart is under fire
[F#m]Another way when the [D]walls are closing in
[A]And when I look at the [E]space between
[F#m]Where I used to be and this [D]reckoning

{Chorus}
[A]I know I will never be [E]alone
[F#m]There was another in the [D]fire
[A]Standing next to [E]me
[F#m]There was another in the [D]water
[A]Holding back the [E]sea

{Verse 2}
[A]And I can see the [E]light in the darkness
[F#m]As the darkness [D]bows to Him
[A]I can hear the [E]roar in the heavens
[F#m]As the space between [D]wears thin`,
    notes: "Based on Daniel 3. Powerful declaration of God's presence.",
    bpm: 69,
    tags: ["worship","faith","presence"],
  },
  {
    title: "Relentless",
    artist: "Hillsong UNITED",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]I will trust in You alone
[B]My hope and my strength
[C#m]When the storms of life [A]surround me
[E]You remain the [B]same

{Chorus}
[E]You are relentless [B]in Your love
[C#m]You don't give [A]up
[E]Your love is relentless [B]toward me
[C#m]You won't let [A]go`,
    notes: "Build intensity through the chorus, electric guitar driven",
    bpm: 76,
    tags: ["worship","declaration","trust"],
  },
  {
    title: "Empires",
    artist: "Hillsong UNITED",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]In the shadow of the [D]cross
[Em]Let the whole world [C]see
[G]The wonder of Your [D]name
[Em]That lives in [C]me

{Chorus}
[G]Oh Your love is like a [D]fire
[Em]Burns through the [C]empires
[G]Let Your kingdom [D]come
[Em]Your will be [C]done`,
    notes: "Anthemic feel, build with full band on chorus",
    bpm: 68,
    tags: ["worship","anthem","kingdom"],
  },
  {
    title: "Not Today",
    artist: "Hillsong UNITED",
    originalKey: "B",
    format: "chordpro",
    content: `{Verse 1}
[B]The enemy has no [E]hold on me
[G#m]I am free from [F#]his chains
[B]He thought he had me [E]in his grip
[G#m]But I will rise [F#]again

{Chorus}
[B]Not today, [E]not today
[G#m]Fear you have no [F#]hold on me
[B]Not today, [E]not today
[G#m]I am walking [F#]free`,
    notes: "Driving rhythm, strong declaration song for spiritual warfare",
    bpm: 140,
    tags: ["worship","spiritual warfare","freedom"],
  },
  {
    title: "Love Is War",
    artist: "Hillsong UNITED",
    originalKey: "Em",
    format: "chordpro",
    content: `{Verse 1}
[Em]What fear has [C]held us now
[G]That love has [D]not set free
[Em]Through battle [C]scars You showed
[G]Your victory [D]complete

{Chorus}
[Em]Love is war, love is [C]war
[G]You fought for me with [D]arms nailed wide
[Em]Love is war, love is [C]war
[G]Death could not hold [D]You down`,
    notes: "Intense and passionate, keep the energy building throughout",
    bpm: 132,
    tags: ["worship","cross","victory"],
  },
  {
    title: "Here Now (Madness)",
    artist: "Hillsong UNITED",
    originalKey: "Ab",
    format: "chordpro",
    content: `{Verse 1}
[Ab]Spirit of the living [Eb]God
[Fm]Come fall afresh on [Db]me
[Ab]Come wake me from the [Eb]dead
[Fm]Lead me in a [Db]way I've never been

{Chorus}
[Ab]You are here now [Eb]here now
[Fm]Oh this is holy [Db]ground
[Ab]You are here now [Eb]here now
[Fm]Oh this is [Db]madness`,
    notes: "Ethereal intro building to explosive chorus, keys-driven",
    bpm: 70,
    tags: ["worship","Holy Spirit","presence"],
  },
  {
    title: "Captain",
    artist: "Hillsong UNITED",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Through the calm and [D]through the storm
[Em]Through the loss and [C]through the war
[G]Through it all You are [D]faithful
[Em]And I will trust in [C]You

{Chorus}
[G]Oh my Captain, [D]my Captain
[Em]My eyes are on [C]You
[G]Oh my Captain, [D]my Captain
[Em]Lead me [C]through`,
    notes: "Steady tempo, builds confidence, great for congregational singing",
    bpm: 74,
    tags: ["worship","trust","faithfulness"],
  },
  {
    title: "Echoes",
    artist: "Hillsong UNITED",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]From the deepest [E]ocean
[F#m]To the highest [D]mountain
[A]Your voice resounds [E]through the heavens
[F#m]And the earth [D]trembles

{Chorus}
[A]Echoes of Your [E]glory
[F#m]Echoes of Your [D]mercy
[A]All creation [E]singing
[F#m]Echoes of [D]You`,
    notes: "Spacious arrangement, big reverb on vocals, U2-inspired guitars",
    bpm: 128,
    tags: ["worship","creation","glory"],
  },
  {
    title: "Say the Word",
    artist: "Hillsong UNITED",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]Impossible is [G]just a word
[Am]Thrown around by [F]those who've never dared
[C]But You have never [G]failed to come through
[Am]Every promise [F]kept and proved

{Chorus}
[C]Say the word, [G]say the word
[Am]And it is [F]done
[C]Say the word, [G]say the word
[Am]And mountains [F]move`,
    notes: "Faith-building anthem, simple progression, great call-and-response",
    bpm: 72,
    tags: ["worship","faith","declaration"],
  },
  {
    title: "Never Alone",
    artist: "Hillsong UNITED",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]You call me out [A]upon the waters
[Bm]Where feet may [G]fail
[D]But through the flood [A]You are faithful
[Bm]Closer than the [G]air I breathe

{Chorus}
[D]I am never [A]alone
[Bm]You are with me, [G]You are with me
[D]I am never [A]alone
[Bm]You will never [G]leave`,
    notes: "Intimate verse building to confident chorus, acoustic-led",
    bpm: 66,
    tags: ["worship","comfort","presence"],
  },
  {
    title: "Hosanna (UNITED)",
    artist: "Hillsong UNITED",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]I see the King of [B]Glory
[C#m]Coming on the clouds with [A]fire
[E]The whole earth shakes, the [B]whole earth shakes
[C#m]I see His love and [A]mercy

{Chorus}
[E]Hosanna, [B]hosanna
[C#m]Hosanna in the [A]highest
[E]Hosanna, [B]hosanna
[C#m]Hosanna in the [A]highest

{Verse 2}
[E]I see a generation [B]rising up to take their place
[C#m]With selfless faith, [A]selfless faith
[E]Heal my heart and [B]make it clean
[C#m]Open up my eyes to the [A]things unseen`,
    notes: "UNITED's live arrangement with extended electric guitar outro.",
    bpm: 134,
    tags: ["praise","anthem","declaration"],
  },
  {
    title: "From the Inside Out (UNITED)",
    artist: "Hillsong UNITED",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]A thousand times I've [D]failed
[Em]Still Your mercy re[C]mains
[G]And should I stumble [D]again
[Em]I'm caught in Your [C]grace

{Chorus}
[G]Everlasting, [D]Your light will shine when
[Em]All else [C]fades
[G]Never ending, [D]Your glory goes be[Em]yond all [C]fame

{Bridge}
[G]In my heart, in my [D]soul, Lord I give You con[Em]trol
[C]Consume me from the [G]inside out Lord
[D]Let justice and [Em]praise become my em[C]brace
To love You from the [G]inside out`,
    notes: "UNITED live staple. Extended bridge builds with electric guitar.",
    bpm: 75,
    tags: ["worship","grace","devotion"],
  },
  {
    title: "Like an Avalanche",
    artist: "Hillsong UNITED",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]With the fury of the [F]skies
[Gm]So is the force of Your [Eb]love
[Bb]With the beauty of the [F]sunrise
[Gm]So is the wonder of Your [Eb]grace

{Chorus}
[Bb]Like an ava[F]lanche, like an avalanche
[Gm]Coming after [Eb]me
[Bb]Like an ava[F]lanche of Your glory
[Gm]Consuming every[Eb]thing

{Bridge}
[Bb]Nothing can stop Your [F]love
[Gm]Nothing can stop Your [Eb]love for me
[Bb]Nothing can stop Your [F]love
[Gm]You are relentless [Eb]in Your pursuit of me`,
    notes: "Big atmospheric build, layers of synths and guitars.",
    bpm: 72,
    tags: ["worship","love","pursuit"],
  },
  {
    title: "Desert Song (UNITED)",
    artist: "Hillsong UNITED",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[Bb]This is my prayer in the [F]desert
[Gm]When all that's within me feels [Eb]dry
[Bb]This is my prayer in the [F]hunger in me
[Gm]My God is the God who pro[Eb]vides

{Verse 2}
[Bb]This is my prayer in the [F]fire
[Gm]In weakness or trial or [Eb]pain
[Bb]There is a faith proved of [F]more worth than gold
[Gm]So refine me Lord through the [Eb]flame

{Chorus}
[Bb]I will bring [F]praise, I will bring [Gm]praise
[Eb]No weapon formed against me shall [Bb]remain
[F]I will rejoice, I will de[Gm]clare
[Eb]God is my victory and He is [Bb]here`,
    notes: "Season-of-testing anthem. Builds from intimate to triumphant.",
    bpm: 66,
    tags: ["worship","perseverance","faith","lament"],
  },
  {
    title: "Scandal of Grace",
    artist: "Hillsong UNITED",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[E]Grace, what have You [B]done
[C#m]Murdered for me on that [A]cross
[E]Accused in absence of [B]wrong
[C#m]My sin washed away in Your [A]blood

{Verse 2}
[E]Too much to make [B]sense of it all
[C#m]I know that Your love breaks my [A]fall
[E]The scandal of [B]grace
[C#m]You died in my [A]place so my soul will live

{Bridge}
[E]Oh to be like [B]You, give all I have just to [C#m]know You
[A]Jesus, there's no one be[E]side You
[B]Forever the hope in my [C#m]heart[A]`,
    notes: "Joel Houston lyric. Reflective verse, explosive chorus.",
    bpm: 68,
    tags: ["worship","grace","cross","salvation"],
  },
  {
    title: "Take Heart",
    artist: "Hillsong UNITED",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]What can make the [F]blind to see
[Gm]Open up the [Eb]door of dawn
[Bb]What can raise the [F]dead to life
[Gm]Speak the word and [Eb]it is done

{Chorus}
[Bb]Take heart, [F]let His love lead us through the [Gm]night
[Eb]Hold on to hope and take [Bb]courage again
[F]Take heart, [Gm]take heart
[Eb]In the kindness of our [Bb]God

{Verse 2}
[Bb]Beyond the shadow of a [F]doubt
[Gm]His love will not run [Eb]out
[Bb]From the ashes we can [F]rise
[Gm]In this broken [Eb]beautiful life`,
    notes: "Encouraging anthem for difficult seasons. Orchestral swells.",
    bpm: 70,
    tags: ["worship","encouragement","hope"],
  },
  {
    title: "Prince of Peace",
    artist: "Hillsong UNITED",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]My heart a storm, [G]clouds raging deep within
[Am]The Prince of Peace [F]came bursting through the wind
[C]The violent sky held [G]its breath
[Am]And in Your light I [F]find rest

{Chorus}
[C]You are the [G]Prince of Peace
[Am]And I will [F]live for You alone
[C]You are the [G]Prince of Peace
[Am]And I will [F]follow You back home

{Verse 2}
[Am]It is well, [G]it is well
[F]With my [C]soul
[Am]It is well, [G]it is well
[F]With my [C]soul`,
    notes: "Beautiful peace anthem, ethereal production, Hillsong UNITED Live.",
    bpm: 64,
    tags: ["worship","peace","rest","trust"],
  },
  {
    title: "Good Grace",
    artist: "Hillsong UNITED",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[G]People, what a [D]beautiful name
[Em]Children of the [C]Great I Am
[G]How sweet the [D]sound of saving grace
[Em]How sweet the [C]sound

{Verse 2}
[G]God's great dance [D]floor, I was dead in my sin
[Em]You called me [C]out, called me into life again
[G]How great the [D]kindness of our God

{Chorus}
[G]Oh good grace, [D]oh I feel it
[Em]Oh good grace, [C]I don't deserve it
[G]Oh good grace, [D]You took my place
[Em]Good God, good [C]grace`,
    notes: "Upbeat and joyful. Great energy for opening worship. Festival feel.",
    bpm: 142,
    tags: ["worship","grace","joy","celebration"],
  },
  {
    title: "As You Find Me",
    artist: "Hillsong UNITED",
    originalKey: "Eb",
    format: "chordpro",
    content: `{Verse 1}
[Eb]Lord, I come to [Bb]You as You find me
[Cm]Not as I should [Ab]be but as I am
[Eb]Cover me in [Bb]grace and love
[Cm]Undeserving [Ab]as I am

{Chorus}
[Eb]All these broken [Bb]pieces, You pick them up
[Cm]Don't let go, don't let [Ab]go of me
[Eb]All these empty [Bb]spaces, Your love fills up
[Cm]Don't let go, don't let [Ab]go

{Bridge}
[Eb]And I will praise [Bb]You as You find me
[Cm]I will worship [Ab]You as You find me
[Eb]Not of my own [Bb]merit
[Cm]But Yours a[Ab]lone`,
    notes: "Written with Ben Fielding. Vulnerable and raw.",
    bpm: 68,
    tags: ["worship","grace","vulnerability","acceptance"],
  },
  {
    title: "Aftermath",
    artist: "Hillsong UNITED",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]Here in the after[E]math of mercy
[F#m]Here in the throes of [D]enemy lines
[A]Here in the thick of [E]Your redemption
[F#m]Love is our battle [D]cry

{Chorus}
[A]You spread Your arms wide, [E]and took the world on
[F#m]What love is [D]this
[A]The aftermath of [E]what You've done for me
[F#m]Is life and [D]liberty

{Bridge}
[A]We shout Your [E]name
[F#m]We shout Your [D]name
[A]All the heavens [E]roar the aftermath
[F#m]Of Your great [D]love`,
    notes: "Zion album track. Bold and cinematic. Electric guitar-driven.",
    bpm: 136,
    tags: ["worship","victory","love","declaration"],
  },
  {
    title: "Heart Like Heaven",
    artist: "Hillsong UNITED",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]Oh God, give me a [A]heart like heaven
[Bm]Give me a heart, [G]a heart like Yours
[D]Oh God, give me a [A]hope undying
[Bm]The kind that never [G]fades away

{Chorus}
[D]Here to eternity, [A]I'll sing of all You are
[Bm]Here to eternity, [G]be glorified
[D]Open up wide, [A]heart like heaven
[Bm]Open up wide, [G]heart like Yours

{Bridge}
[D]Every hallelu[A]jah, every heart[Bm]beat
[G]Breathing out Your [D]praise forever`,
    notes: "Empires album. Dreamy atmosphere, layered synths. Mid-set worship.",
    bpm: 130,
    tags: ["worship","heart","devotion","eternity"],
  },
  {
    title: "Know You Will",
    artist: "Hillsong UNITED",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]When the ground beneath my [G]feet gives way
[Am]And I hear the sound of [F]crashing waves
[C]All I know is that You [G]never let go
[Am]Though the skies may [F]fall

{Chorus}
[C]I know You will, [G]I know You will
[Am]I know that You will [F]make a way
[C]I know You will, [G]I know You will
[Am]Carry me through the [F]storm

{Bridge}
[Am]Greater is He that is [G]in me
[F]Greater is He than the [C]world
[Am]Greater is He that is [G]in me
[F]I know You [C]will`,
    notes: "Faith declaration over fear. Builds with each chorus.",
    bpm: 72,
    tags: ["worship","faith","trust","hope"],
  },
  {
    title: "Of Dirt and Grace",
    artist: "Hillsong UNITED",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]We are the people of [F]dirt and grace
[Gm]Called from the ashes to [Eb]walk in light
[Bb]Named by the God of [F]second chances
[Gm]Held in the arms of [Eb]love tonight

{Chorus}
[Bb]Of dirt and [F]grace
[Gm]Of wind and [Eb]flame
[Bb]Marked by Your [F]love
[Gm]Saved by Your [Eb]name

{Bridge}
[Bb]From the dust You [F]raised us
[Gm]From the ashes You have [Eb]called
[Bb]All Your children [F]running
[Gm]To the arms of a [Eb]faithful God`,
    notes: "Title track from live album filmed in Israel. Earthy and raw.",
    bpm: 68,
    tags: ["worship","grace","redemption","identity"],
  },
  {
    title: "People",
    artist: "Hillsong UNITED",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]We are Your [B]church
[C#m]We are the hope on [A]earth
[E]Built on the promise of [B]the cross
[C#m]Standing to[A]gether

{Verse 2}
[E]This is a call to [B]the people of God
[C#m]Look at what's in [A]front of us
[E]Mountains and valleys, [B]highways and byways
[C#m]Your love has no [A]borders

{Chorus}
[E]We are [B]people of the [C#m]great I Am
[A]Church awake, church [E]alive
[B]People of the great [C#m]I Am
[A]We will not be silent`,
    notes: "Title track. Missional anthem. Congregational energy.",
    bpm: 140,
    tags: ["worship","church","unity","missions"],
  },
  {
    title: "Whole Heart (Hold Me Now)",
    artist: "Hillsong UNITED",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Hold me now in the [D]hands that created
[Em]The heavens [C]above
[G]Hold me now in the [D]hands that were nailed
[Em]To the cross for my [C]love

{Chorus}
[G]I can feel You [D]here, hold me now
[Em]Hold me [C]now
[G]With my whole [D]heart
[Em]With my whole [C]heart

{Bridge}
[Em]I will [D]serve You, Lord, with all I am
[C]With my whole [G]heart
[Em]You have [D]my whole heart
[C]You have [G]my whole heart`,
    notes: "Tender commitment song. Acoustic simplicity with emotional build.",
    bpm: 66,
    tags: ["worship","commitment","devotion","surrender"],
  },
  {
    title: "King of Majesty",
    artist: "Hillsong UNITED",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]Your throne forever [B]shall endure
[C#m]Your crown a flame of [A]purity
[E]Your splendour outshines [B]all the stars
[C#m]Oh King of [A]Majesty

{Chorus}
[E]O God of [B]light and Lord of [C#m]love
[A]Enthroned upon the [E]heavens above
[B]With all I am I [C#m]worship You
[A]King of Majesty

{Bridge}
[E]And I will stand, [B]and I will sing
[C#m]Of Your great love, [A]my offering
[E]Forever and a [B]day
[C#m]You reign in [A]Majesty`,
    notes: "Reuben Morgan classic from the UNITED catalogue. Majestic opener.",
    bpm: 76,
    tags: ["worship","kingship","praise","majesty"],
  },
  {
    title: "Closer",
    artist: "Hillsong UNITED",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]I am reaching for the [G]deep end
[Am]I am closer to the [F]edge of who I am
[C]Wide awake upon the [G]water
[Am]On a sea of glass and [F]fire

{Chorus}
[C]Closer, I want to be [G]closer
[Am]To everything You [F]are
[C]Closer, I want to be [G]closer
[Am]Take me further than [F]before

{Bridge}
[Am]Here I am at the [G]altar
[F]Laying down every[C]thing
[Am]Here I am at the [G]altar
[F]Wanting more of [C]You`,
    notes: "Dynamic worship moment, layers build through the bridge.",
    bpm: 70,
    tags: ["worship","intimacy","pursuit","surrender"],
  },
  {
    title: "Search My Heart",
    artist: "Hillsong UNITED",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]Search my heart and [A]search my soul
[Bm]There is nothing [G]else I want but more of You
[D]Light the fire in [A]me again
[Bm]Burn away what [G]doesn't look like You

{Chorus}
[D]Lord I give my [A]life to You
[Bm]Here in this [G]moment
[D]Lord I give my [A]life to You
[Bm]All that I [G]am

{Bridge}
[D]You search the [A]depths of every heart
[Bm]You know the way through [G]every dark
[D]Lead me Lord in[A]to Your light
[Bm]Lead me, Lord, to [G]life`,
    notes: "Prayer of surrender. Slow build, congregational simplicity.",
    bpm: 64,
    tags: ["worship","surrender","prayer","purification"],
  },
  {
    title: "Bones",
    artist: "Hillsong UNITED",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]Here I am at the [F]end of me
[Gm]At the end of me, [Eb]at the start of You
[Bb]Breathe Your life into [F]these dry bones
[Gm]From the ashes a [Eb]fire is waking up

{Chorus}
[Bb]Can these bones [F]live, can these bones [Gm]live
[Eb]Speak the word and I'll come a[Bb]live
[F]Breathe on me, [Gm]breathe on me
[Eb]Raise this valley of dry [Bb]bones

{Verse 2}
[Bb]Feel the wind of [F]heaven blow
[Gm]Spirit come and [Eb]fill this place
[Bb]You can make these [F]dead bones walk
[Gm]Open up the [Eb]grave`,
    notes: "Ezekiel 37 inspired. Builds from whisper to roar. Festival anthem.",
    bpm: 138,
    tags: ["worship","resurrection","Holy Spirit","revival"],
  },
  {
    title: "Welcome to the Fire",
    artist: "Hillsong UNITED",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Step into the [D]blaze with me
[Em]Feel the heat that [C]sets us free
[G]All consuming, [D]all refining
[Em]Burn away what's [C]left of me

{Chorus}
[G]Welcome to the fire, [D]welcome to the fire
[Em]This is where the [C]real begins
[G]Welcome to the fire, [D]welcome to the fire
[Em]Lose your life and [C]find it here

{Bridge}
[Em]We are not a[D]fraid of the flames
[C]Purify our [G]hearts, Lord
[Em]In the furnace [D]of Your love
[C]We come a[G]live`,
    notes: "Bold and aggressive worship. Driving rhythm, full production.",
    bpm: 144,
    tags: ["worship","fire","purification","boldness"],
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
