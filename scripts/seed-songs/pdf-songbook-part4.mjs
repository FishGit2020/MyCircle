#!/usr/bin/env node
/**
 * Seed PDF songbook worship songs (Part 4: B–J) into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/pdf-songbook-part4.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Bless God",
    artist: "Brandon Lake/Brooke Ligertwood/Cody Carnes",
    originalKey: "D",
    format: "chordpro",
    content: `{Intro}
|[D] / [Dsus/E] / | [Gmaj7] / / / |
|[Bm7] / [A(add4)] / | [G2] / [D] / / |

{Verse 1}
[D]Blessed are those who run to Him
[Dsus/E]Who place their hope and confidence
[G]In [D]Jesus
[Bm7]He won't for[Asus]sake them

{Verse 2}
[D]Blessed are those who seek His face
[Dsus/E]Who bend their knee and fix their gaze
[G]On [D]Jesus
[Bm7]They won't be [Asus]shaken

{Half-Chorus}
[D]Come on and [Dsus/E]praise the [Gmaj7]Lord with me
[Bm7]Sing if you [G]love His [A(add4)]name
[D]Come on and [Dsus/E]lift your [Gmaj7]voice with me
[Bm7]He's worthy of [A(add4)]all our [D]praise

{Turnaround}
|[Dsus] / [D] / | [Dsus] / [D] / |

{Verse 3}
[D]Blessed are those who walk with Him
[Dsus/E]Whose hearts are set on pilgrimage
[G]With [D]Jesus
[Bm7]They'll see His [A(add4)]glory

{Verse 4}
[D]Blessed are those who die to live
[Dsus/E]Whose joy it is to give it all for
[Bm7]Jesus, [A(add4)]and for [G]Him [D]only
[Bm7]Oh Je[A(add4)]sus
All for Your glory

{Chorus}
[D]Come on and [Dsus/E]praise the [Gmaj7]Lord with me
[Bm7]Sing if you [G]love His [A(add4)]name
[D]Come on and [Dsus/E]lift your [Gmaj7]voice with me
[Bm7]He's worthy of [A(add4)]all our [D]praise
[D]Come on and [Dsus/E]bring your [Gmaj7]offering
[Bm7]Sing if you've [G]known His [A(add4)]grace
[D]Come on and [Dsus/E]lift up your [Gmaj7]holy hands
[Bm7]He's worthy of [A(add4)]all our [D]praise

{Bridge}
[D/F#]Bless God in the sanctuary
[Em7]Bless God in the fields of plenty
[G2]Bless God in the darkest valley
[Bm7]Every chance I [A]get, I bless Your name

Bless God when my hands are empty
Bless God with a praise that costs me
Bless God when nobody's watching
Every chance I get I'll bless Your name

Bless God when the weapon's forming
Bless God when the walls are falling
Bless God 'cause He goes before me
Every chance I [Bm7]get, I [A]bless Your name

Bless God for He holds the victory
Bless God for He's always with me
Bless God for He's always worthy
Every chance I [Bm7]get, I [A]bless Your name

{Tag}
|[D/F#] / [G2] / |
[Bm7]Every chance I [A]get, I bless Your name
|[D/F#] / [G2] / | [Bm7] / [A] / |

{Ending}
|[D] / [Em7] [D/F#] |
[Bm7]He's worthy of [A(add4)]all our praise
|[D/F#] / [Em7] [D] |
[Bm7]He's worthy of [A(add4)]all our praise
|[G] [D/F#] [Em7] / | [D]`,
    notes: "Key of D, 72.5 BPM. Extended praise anthem. Bridge builds with each 'Bless God' section.",
    bpm: 72,
    tags: ["worship", "praise", "blessing"],
  },
  {
    title: "Better Is One Day",
    artist: "Matt Redman",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E5]How lovely is Your [A2]dwelling place
[E5]O Lord Al[Bsus]mighty
[E5]For my soul longs and [A2]even faints for [Bsus]You
[E5]For here my heart is [A2]satisfied
[E5]Within Your [Bsus]presence
[E5]I sing beneath the [Bsus]shadow of Your wings

{Chorus}
[A2]Better is one day in Your courts
[Bsus]Better is one day in Your house
[A2]Better is one day in Your courts than [A/C#]thou[Bsus]sands elsewhere
[E/G#]Better is [A2]one day in Your courts
[Bsus]Better is one day in Your house
[A2]Better is one day in Your courts than [Bsus]thou[A2]sands elsewhere (last time)
[E5]Than thousands elsewhere

{Verse 2}
[E5]One thing I ask and [A2]I would seek [Bsus]to see Your beauty
[E5]To find You in the [Bsus]place Your glory dwells
[E5]One thing I ask and [A2]I would seek [Bsus]to see Your beauty
[E5]To find You in the [Bsus]place Your glory dwells

{Bridge 1}
[C#m7]My heart and flesh cry [B]out [A2]for You the [Bsus]living God
[C#m7]Your Spirit's water [B]to my [A2]soul [Bsus]
[C#m7]I've tasted and I've [B]seen, [A2]come once again to me
[E/G#]I will draw near to You
[F#m7]I will draw [Bsus]near to [A2]You [Bsus] [A2] [Bsus]

{Bridge 2}
[A2]Better is one day, [Bsus]better is one day
[E/G#]Better is [A2]one day than [A/C#]thou[Bsus]sands elsewhere
[A2]Better is one day, [Bsus]better is one day
[A2]Better is one day than [Bsus]thou[A2]sands elsewhere`,
    notes: "Key of E. Passionate presence song. Bridge 1 is the emotional peak.",
    bpm: 110,
    tags: ["worship", "presence", "longing"],
  },
  {
    title: "Did You Feel The Mountains Tremble",
    artist: "Martin Smith",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]Did you feel the mountains tremble
[G/D]Did you hear the oceans roar
[Em7]When the people rose to sing of
[Dsus]Jesus Christ [A7sus]the risen [D]One

{Verse 2}
[D]Did you feel the people tremble
[G/D]Did you hear the singers roar
[Em7]When the lost began to sing of
[Dsus]Jesus Christ [A7sus]the saving [D]One

{Pre-Chorus}
[G]And we can see that [D]God You're moving
[G]A mighty river [D]through the nations
[G]And young and old will [D]turn to Jesus
[Em7]Fling wide you heavenly gates
[G]Prepare the [Asus]way of the [D]risen Lord (To TA 1)

{Chorus}
[D]Open up the doors and [G/B]let the music play
[Em7]Let the streets re[D]sound with [A7sus]singing
[D]Songs that bring Your [G/B]hope, songs that bring Your joy
[Em7]Dancers who dance upon in[D]justice

{Turnaround}
| [D] | [A7sus] | [D] | [A7sus] |

{Verse 3}
[D]Do you feel the darkness tremble
[G/D]When all the saints join in one song
[Em7]And all the streams flow as one river
[Dsus]To wash away [A7sus]our broken[D]ness`,
    notes: "Key of D, Tempo 102. Revival anthem. Energetic and building.",
    bpm: 102,
    tags: ["worship", "revival", "praise"],
  },
  {
    title: "God You're So Good",
    artist: "Brooke Ligertwood/Scott Ligertwood/Kristian Stanfill/Brett Younker",
    originalKey: "G",
    format: "chordpro",
    content: `{Pad}
| [G] | [C/G] | [G] | [Dsus] / [D] / |

{Verse 1}
[G]Amazing love, that [G/C]welcomes me
[G]The kindness of [Dsus]mercy [D]
[G]That bought with blood, [G/C]wholeheartedly
[Em]My soul un[Dsus]deserving [D]

{Chorus}
[G]God, You're so [D]good, [D/F#]God, [G] [G/F#]You're so good
[Em]God, You're so [C/G]good, [G/D]You're so [D]good to [G]me

{Verse 2}
[G]Behold the [C/G]cross, age to age
[G]And hour by [Dsus]hour [D]
[G]The dead are [C/G]raised, the sinner saved
[Em]The work of [Dsus]Your [D]power

{Bridge}
[D]I am blessed, I am called
[Em]I am healed, I am whole
[C]I am saved in [G]Jesus' [D]name
Highly favored, anointed
[Em]Filled with Your power
[C]For the glory of [G]Jesus' [D]name
[1st time x2, 2nd time x1]

{Verse 3}
[G]And should this [C/G]life bring suffering
[G]Lord, I will [Dsus]remember [D]
[Em]What Calvary has [C]bought for me
[G]Both now and [Dsus]forever [D]`,
    notes: "Key of G. Testimony of God's goodness. Build through declaration section.",
    bpm: 72,
    tags: ["worship", "goodness", "praise"],
  },
  {
    title: "Great Are You Lord",
    artist: "Jason Ingram/Leslie Jordan/David Leonard",
    originalKey: "C",
    format: "chordpro",
    content: `{Intro}
[C] | [Em7] | [Dadd4] | [D] | [D]

{Verse}
[C]You give life, You [Em7]are love, You bring [D5(D)]light to the darkness
[C]You give hope, You re[Em7]store every [D5(D)]heart that is broken
[C]And [Em7]great are [D]You Lord

{Chorus}
[C]It's Your [Em7]breath in our lungs
[Dadd4]So we pour out our praise, we pour out our praise
[C]It's Your [Em7]breath in our lungs
[Dadd4]So we pour out our praise to You only
[2nd & 4th time] [repeat]

{Interlude 1}
[C] | [Em7] | [Dadd4] | [D]

{Bridge}
[G]All the earth will shout Your praise
[Gsus(C/E)]Our hearts will cry, these bones will sing
[C]Great are You [G]Lord
[x3]

{Ending}
[C] | [Em7] | [Dadd4] | [D] | [C] | [Em7] | [D]`,
    notes: "Key of C. Powerful declaration. Bridge is the worship climax.",
    bpm: 72,
    tags: ["worship", "praise", "breath"],
  },
  {
    title: "Holy Forever",
    artist: "Chris Tomlin/Phil Wickham/Brian Johnson/Jenn Johnson/Jason Ingram",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro}
| [C] . . [Em] | [Dsus] | [G/B] | [Em] [Dsus] |

{Verse 1}
[G]A thousand [C2]genera[G]tions falling down in worship
[Em7]To sing the [Dsus]song of ages [C2]to the Lamb
[G]And all who've [C2]gone be[G]fore us and all who will believe
[Em7]Will sing the [Dsus]song of [C2]ages to the Lamb

{Pre-Chorus}
[C2](Jesus) Your name is the [Em7]highest
[D]Your name is the greatest
[Em7]Your name stands a[Am7]bove them all
[C2]All thrones and [Em7]dominions
[D]All powers and positions
[Em7]Your name stands a[Am7]bove them all

{Chorus 1}
[C2]And the [Em7]angels cry [D]Holy
[G/B]All creation [Em7]cries Holy
[Am7]You are [D]lifted high, Ho[G]ly
[G]Ho[Gsus]ly for[G]ever

{Verse 2}
[G]If you've been for[C2]given and if you've been re[G]deemed
[Em7]Sing the [Dsus]song for[C2]ever to the Lamb
[G]If you walk in [C2]freedom and if you bear His [G]name
[Em7]Sing the [Dsus]song for[C2]ever to the Lamb
[Em7]We'll sing the [Dsus]song for[C2]ever and amen

{Chorus 2}
[G/B]Hear Your [C2]people [Em7]sing Ho[D]ly
To the King of [Em7]Kings Ho[Am7]ly
[Am7]You will [D]always be Ho[G]ly
Holy forever

{Tag}
[Am7]You will [D]always be Ho[G]ly
[G]Ho[Gsus]ly for[G]ever`,
    notes: "Key of G, 72 BPM. Eternal worship anthem. Pre-chorus builds to chorus declarations.",
    bpm: 72,
    tags: ["worship", "holiness", "eternal"],
  },
  {
    title: "Holy Water",
    artist: "We The Kingdom",
    originalKey: "D",
    format: "chordpro",
    content: `{Intro}
[D] [C] [G]

{Verse 1}
[D]God, I'm on my knees again
[C]God, I'm begging please again
[G]I need You, oh, I need You
[D]Walking down these desert roads
[C]Water for my thirsty soul
[G]I need You, oh, I need You

{Chorus 1}
N.C.
Your forgiveness
N.C.
Is like sweet, sweet honey on my lips
N.C.
Like the sound of a symphony to my ears
N.C.
Like holy water on my skin

{Interlude}
[D] [C] [G]

{Verse 2}
[D]Dead man walking, slave to sin
[C]I wanna know about being born again
[G]I need You, oh, God, I need You
[D]So, take me to the riverside
[C]Take me under, baptize
[G]I need You, oh, God, I need You

{Chorus 2}
[D]Your forgiveness
[C]Is like sweet, sweet [G]honey on my [D]lips
[C]Like the sound of a [G]sym[D]phony to my ears
[C]Like holy [G]water on my [D]skin
[D](on my [G]skin)

{Bridge} * 4
[D]I don't wanna abuse Your grace
[G]God, I need it every day
[D]It's the only thing that ever really
[G]Makes me wanna change`,
    notes: "Key of D. Baptism/grace anthem. Bridge builds with conviction.",
    bpm: 80,
    tags: ["worship", "grace", "forgiveness"],
  },
  {
    title: "How He Loves",
    artist: "John Mark McMillan",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]He is jealous for me, loves [Am]like a hurricane
[C/G]I am a tree bending beneath the weight of His [F]wind and mercy
[C]And all of a sudden I am unaware of
[Am]These afflictions eclipsed by glory
[C/G]And I realize just how beautiful You are
[F]And how great Your affections are for me

{Chorus}
[C(Am)]And oh, how He [Am]loves us oh
[C/G]Oh, how He loves us, [F]how He loves us [C]all [Am] [C/G] [F]

(Yeah) [C]He loves us
[Am]Oh how He loves us, Oh how He [C/G]loves us
[FM7]Oh how He loves

{Verse 2}
[C]And we are His portion, and He is our prize
[Am]Drawn to redemption by the grace in His eyes
[C/G]If His grace is an ocean we're all [F]sinking
[C]And Heaven meets earth like an unforseen kiss
[Am]And my heart turns violently inside of my chest
[C/G]I don't have time to maintain these regrets
[F]When I think about the way that`,
    notes: "Key of C. Intimate love song. Let dynamics breathe through the verses.",
    bpm: 69,
    tags: ["worship", "love", "grace"],
  },
  {
    title: "Holy",
    artist: "Jesus Culture",
    originalKey: "Am",
    format: "chordpro",
    content: `{Verse}
[Am] [Dm] [C] [Em]

[Am]And only one word [Dm]comes to mind. [C]There's only one word to [Em]describe

{Chorus}
[Am]Holy, [Dm]Holy! Lord, [C]God, Al[Em]mighty!
[Am]Holy, [Dm]Holy! Lord, [C]God, Al[Em]mighty!

{Bridge}
[Am]There is no one [Dm]like You, [C]You are holy, [Em]holy`,
    notes: "Key of Am. Simple, powerful holiness declaration. 69 BPM. Let the simplicity carry weight.",
    bpm: 69,
    tags: ["worship", "holiness", "awe"],
  },
  {
    title: "Here In Your Presence",
    artist: "New Life Worship",
    originalKey: "C",
    format: "chordpro",
    content: `{Intro}
[C] | [Dm] | [F] | [C] || x2

{Verse}
[C]Found in Your hands, fullness of joy
[Dm]Every fear suddenly [F]wiped away here in Your [C]presence
[C]All of my gains now fade away
[Dm]Every crown no longer on [F]display, here in Your [C]presence

{Pre-Chorus}
[Am]Heaven is [G]trembling in awe of Your [F]wonders
[Am]The kings and their [G]kingdoms are standing a[F]mazed

{Chorus}
[C]Here in Your presence, [G]we are undone
[Am]Here in Your presence, [G]Heaven and Earth become [F]one
[C]Here in Your presence, [G]all things are new
[Am]Here in Your presence, [G]everything bows before [F]You

{Bridge}
[Am]Wonderful, [G]beautiful, [F]glorious, [C]matchless in every way
[Am]Wonderful, [G]beautiful, [F]glorious, [C]matchless in every way
x3
[F]Way [G]...`,
    notes: "Key of C, Capo 2. Presence anthem. Bridge builds with repeating declarations.",
    bpm: 80,
    tags: ["worship", "presence", "awe"],
  },
  {
    title: "Hosanna (Praise Is Rising)",
    artist: "Brenton Brown/Paul Baloche",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G5]Praise is rising, [C2]eyes are [G5]turning to You
[G5]Hope is stirring, [C2]hearts are yearning for You
[G5]We long for You

{Pre-Chorus}
[D(4)]'Cause when we see [C]You
[C]We find strength to [G5]face the day
[D(4)]In Your [C]presence
[G5]All our fears are washed away (To Pre-Chorus)
[D]Washed away

{Chorus}
[Gsus]Ho[G]san[Em7]na, ho[C2]san-na
[G5]You are the [Dsus]God who saves us
[Em7]Worthy of [C2]all our praises
[Gsus]Ho[G]san[Em7]na, ho[C2]san-na
[G5]Come have Your [Dsus]way among us
[Em7]We welcome You [C2]here Lord Jesus

{Verse 2}
[G5]Hear the sound of [C2]hearts re[G5]turning to You
[G5]We turn to You
[G5]In Your Kingdom [C2]broken lives are made [G5]new
You make us new

{Instrumental}
||: [Gsus] | [G] | [Em7] | [C2] |
| [G5] | [Dsus] | [Em7] | [C2] :||

{Ending}
| [Gsus] | [G] | [Gsus] | [G] |
[Gsus]Ho[G]san[Gsus]na, ho[G]san-na`,
    notes: "Key of G, Tempo 114. Upbeat praise anthem. Build through pre-chorus to explosive chorus.",
    bpm: 114,
    tags: ["worship", "praise", "coming of god"],
  },
  {
    title: "Here For You",
    artist: "Tim Hughes/Jesse Reeves/Matt Redman/Chris Tomlin",
    originalKey: "C",
    format: "chordpro",
    content: `{Intro}
[C]

{Verse 1}
[C]Let our praise be Your welcome,
Let our songs be a [F]sign
[F]We are here for [C]You, we are here for You
[C]Let Your breath come from heaven,
Fill our hearts with Your [F]life
[F]We are here for [C]You, we are here for You

{Chorus}
[F]To You our [G]hearts are open
[C]Nothing here is [F]hidden [Dm]
[C]You are our one de[F]sire, You alone are holy
[G]Only You are [C]worthy
[G]God, let Your fire [F]fall down
[2nd time]
[F]Let it [F]fall [3x]

{Verse 2}
[C]Let our shout be Your anthem,
Your renown fill the [F]sky
[F]We are here for [C]You, we are here for You
[C]Let Your Word move in power,
let what's dead come to [F]life
[F]We are here for [C]You, we are here for You

{Ending}
[C]We welcome You with praise, we welcome You with praise
[Am]Almighty God of [F]love, be welcome in this place [2x]
[C]Let every heart adore, let every soul awake
[Am]Almighty God of [F]love, Be welcome in this place
[F]Be welcome in Your [C]house, Lord, be welcome in Your house [C] [end]`,
    notes: "Key of C, 4/4 meter 85 BPM. Prayer-style worship. Let the ending build as a declaration.",
    bpm: 85,
    tags: ["worship", "prayer", "surrender"],
  },
  {
    title: "I Surrender All",
    artist: "J.W. VanDeVenter (SDA Hymnal #309)",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]All to [C]Je[G]sus I sur[D7]render,
[G]All to [C]Him I [G]free[D7]ly [G]give;
[G]I will [C]ev[G]er love and [D7]trust [Bm]Him,
[G]In His [C]pres[G]ence [D7]daily [G]live.

{Refrain}
[G]I sur[C]ren[G]der [D7]all,
I surrender all,
[G]I [D7]sur[G]render all;
I surrender all,
[G]All to [C]Thee, my [G]blessed [D7]Sav[C]-ior,
[G]I sur[D7]ren[G]der all.

{Verse 2}
[G]All to [C]Je[G]sus I sur[D7]render,
[G]Humbly [C]at [G]His [D7]feet I [G]bow,
[G]Worldly [C]pleas[G]ures all for[D7]saken; [Bm]
[G]Take me, [C]Je[G]sus, [D7]take me [G]now;

{Verse 3}
[G]All to [C]Je[G]sus I sur[D7]render,
[G]Make me, [C]Sav[G]ior, [D7]wholly [G]Thine;
[G]Let me [C]feel [G]the [D7]Holy [Bm]Spirit,
[G]Truly [C]know [G]that [D7]Thou art [G]mine;

{Verse 4}
[G]All to [C]Je[G]sus I sur[D7]render;
[G]Now I [C]feel [G]the [D7]sacred [G]flame.
[G]O the [C]joy [G]of [D7]full sal[Bm]vation!
[G]Glory, [C]Glo[G]ry [D7]to His [G]name!`,
    notes: "Classic hymn. Key of G. SDA Hymnal #309. Solemn surrender. Each verse builds commitment.",
    bpm: 84,
    tags: ["hymn", "surrender", "classic"],
  },
  {
    title: "I Will Offer Up My Life",
    artist: "Matt Redman",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]I will [C/E]offer up my [F]life
[G]In spirit and [C]truth,
[C/E]Pouring out the [F]oil of love
[G]As my worship to [C]You
[C/E]In surrender I [F]must [G]give my [C]every part;
[C/E]Lord, receive the [F]sacrifice
[G]Of a [C]broken heart

{Chorus}
[F]Jesus, what can I [G]give, what can I [C]bring
[F]To so faithful a [G]friend, to so loving a [C]King?
[F]Savior, what can be [G]said, what can be [C]sung
[F]As a praise of Your name
[G]For the [C]things You have done?
[Dm]Oh my words could not [C/E]tell, not even in [F]part
[Dm]Of the debt of [C/E]love that is [F]owed
[G]By this thankful [C]heart

{Verse 2}
[C]You de[C/E]serve my every [F]breath
[G]For You've paid the [C]great cost;
[C]Giving up Your [C/E]life to [F]death,
[G]Even death on a [C]cross
[C/E]You took all my [F]shame away,
[G]There defeated my [C]sin
[C/E]Opened up the [F]gates of heaven
[G]And have beckoned me [C]in`,
    notes: "Key of C. Classic surrender song. Keep dynamics reflective and building.",
    bpm: 72,
    tags: ["worship", "surrender", "devotion"],
  },
  {
    title: "I Need You More",
    artist: "Kim Walker-Smith",
    originalKey: "C",
    format: "chordpro",
    content: `{Intro}
[G] [C] [G] [C] x2

{Chorus}
[G]I need You [Am]more, more than yesterday
[D]I need You [C]more, more than [G]words can say.
[Em]I need You more, [C]than [G]ever [Am]before
[G]I need You, [D]Lord, I [G]need You, Lord.

{Verse}
[C]More than the air [D]I breathe, [Em]more than the song I sing
[C]More than the [Am]next heart[G]beat, more than anything.
[C]And lord, as [D]time goes by, [Em]I'll be by Your side
[Am]Cause I never [G]want to go [D]back to my old life.

{Bridge}
[C]We give You the highest praise,
[G]We give You the highest praise,
[Am]We give You the [D]highest praise

(C G Am D) - Repeat

[C]More than the air I breathe
[G]More than the songs I sing
[Am]More than anything
[D](I need You [G]more)

{Outro}
[C] [G] [Am] [D]`,
    notes: "Key of C. Intimate need/longing song. Let the simplicity speak.",
    bpm: 76,
    tags: ["worship", "longing", "need"],
  },
  {
    title: "Jesus We Love You",
    artist: "Bethel Music",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[C]Old things have passed away
[G]Your love has stayed the same
[C]Your constant grace remains the [G]cornerstone
[C]Things that we thought were dead
[G]Are breathing in life again
[C]You cause Your Son to shine on
[G]Darkest nights

{Pre-Chorus}
[D]For all that You've done we will
[Em]Pour out our love
[C]This will be our [D]anthem song

{Chorus}
[C]Jesus we love You
[G]Oh how we love You
[C]You are the one our [G]hearts adore

{Interlude}
[Em] [D/F#] [C] |[G]|
Our hearts adore

{Bridge}
[C]Our affection, our devotion
[G]Poured out on the feet of Jesus
[C]Our affection, our devotion
[G]Poured out on the feet of Jesus
[Am]Our affection, our devotion
[G/B]Poured out on the feet of Jesus
[C]Our affection, our devotion
[D]Poured out on the feet of Jesus`,
    notes: "Key of A, BPM 116, Capo 2. Adoration song. Bridge builds with mounting devotion.",
    bpm: 116,
    tags: ["worship", "love", "adoration"],
  },
  {
    title: "Jesus Messiah",
    artist: "Chris Tomlin/Daniel Carson/Ed Cash/Jesse Reeves",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]He became sin [Am7]who knew no sin
[G/B]That we might [C2(no3)]become His righteousness
[G]He humbled Himself and [Am7]carried the cross
[G/D]Love so a[C2(no3)]mazing, [G/D]love so a[C2(no3)]mazing

{Chorus}
[G]Jesus Mes[C2(no3)]siah, Name above all names
[G]Blessed Re[Dsus]deemer, Emman[G]uel
[G]The Rescue for [C2(no3)]sinners, the Ransom from heaven
[G/B]Jesus [Dsus]Mes-siah, [G]Lord of all

{Verse 2}
[G]His body the bread, [Am7]His blood the wine
[G/B]Broken and [C2(no3)]poured out all for love
[G]The whole earth [Am7]trembled and the veil was torn
[G/D]Love so a[C2(no3)]mazing, [G/D]love so a[C2(no3)]mazing

{Bridge}
[Am11]All our hope [G/B]is in You
[C2(no3)]All our hope [Dsus]is in You
[Am11]All the glory [G/B]to You God
[C2(no3)]The Light of [Dsus]the world`,
    notes: "Key of G, Tempo 86. Christological anthem. Bridge is reverent declaration.",
    bpm: 86,
    tags: ["worship", "messiah", "cross"],
  },
  {
    title: "Joy To The World",
    artist: "Traditional Christmas",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Joy to the world, the [D]Lord is [G]come!
[C]Let [D]earth receive her [G]King;
[G]Let every heart prepare Him room,

And Heaven and [D]nature sing,
And [D]Heaven and nature sing,
[G]And [C]Heaven, and [G]Heaven, and [D]na[G]ture sing.

{Verse 2}
[G]Joy to the earth, the [D]Savior [G]reigns!
[C]Let [D]men their songs em[G]ploy;
[G]While fields and floods, rocks, hills and plains

Repeat the sounding joy,
[D]Repeat the sounding joy,
[G]Re[C]peat, re[G]peat, the [D]sound[G]ing joy.

{Verse 3}
[G]No more let sins and [D]sorrows [G]grow,
[C]Nor [D]thorns infest the [G]ground
[G]He comes to make His blessings flow

Far as the curse is found,
[D]Far as the curse is found,
[G]Far [C]as, far [G]as, the [D]curse [G]is found

{Verse 4}
[G]He rules the world with [D]truth and [G]grace,
[C]And makes the [D]nations [G]prove
[G]The glories of His righteousness,

And wonders of His love,
[D]And wonders of His love,
[G]And [C]wonders, [G]wonders, of [D]His [G]love.`,
    notes: "Classic Christmas hymn. Key of G. Joyful and majestic.",
    bpm: 120,
    tags: ["hymn", "christmas", "joy"],
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
