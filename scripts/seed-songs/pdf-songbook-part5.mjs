#!/usr/bin/env node
/**
 * Seed PDF songbook worship songs (Part 5: J–T) into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/pdf-songbook-part5.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Jesus Paid It All",
    artist: "Traditional Hymn",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]I hear the Savior say
[D]Thy strength indeed is [G]small
[Em]Child of weakness, watch and [C]pray
[D]Find in [G]Me thine all in all

{Chorus}
[G]Jesus paid it [Em]all
[G]All to [D]Him I owe
[G]Sin had left a [C]crimson stain
[G]He washed it white as [D]snow

{Verse 2}
[G]Lord, now indeed I find
[D]Thy power and Thine a[G]lone
[Em]Can change the leper's [C]spots
[D]And melt the [G]heart of stone

{Verse 3}
[G]And when before the throne
[D]I stand in Him com[G]plete
[Em]Jesus died my soul to [C]save
[D]My lips shall [G]still repeat

{Bridge}
[G]O praise the [C]one who paid my debt
[Am]And raised this [D]life up from the dead [C]`,
    notes: "Classic hymn. Key of G, 3/4 feel. Powerful cross-centered message.",
    bpm: 72,
    tags: ["hymn", "cross", "salvation"],
  },
  {
    title: "King Of Kings",
    artist: "Hillsong Worship",
    originalKey: "C",
    format: "chordpro",
    content: `{Intro}
[C] [C]

{Verse 1}
[C/E]In the [F]darkness we were waiting
[G]Without [C]hope, without light
[C/E]Till from [F]Heaven You came running
[G]There was [C]mercy in Your eyes
[C/E]To fulfil the [F]law and prophets
[G]To a virgin [C]came the Word
[C/E]From a [F]throne of endless glory
[G]To a cradle in the [C]dirt

{Chorus}
[C]Praise the [F]Father, praise the Son
[Am]Praise the [Gsus]Spirit three in [G]one
[C]God of [F]glory, Majesty
[Am]Praise for[F]ever to the [G]King of [C]Kings

{Verse 2}
[C/E]To reveal the [F]kingdom coming
[G]And to reconcile the [C]lost
[C/E]To redeem the [F]whole creation
[G]You did not despise the [C]Cross
[C/E]For even [F]in your suffering
[G]You saw to the other [C]side
[C/E]Knowing [F]this was our salvation
[G]Jesus for our sake You [C]died

{Verse 3}
[Am]And the [F]morning that You rose
[G]All of heaven held its [C]breath
[Am]Till that [F]stone was moved for good
[G]For the Lamb had conquered [C]death
[Am]And the [F]dead rose from their tombs
[G]And the angels stood in [C]awe
[Am]For the [F]souls of all who'd come
[G]To the Father are re[C]stored

{Verse 4}
[C/E]And the [F]church of Christ was born
[G]Then the Spirit lit the [C]flame
[C/E]Now this [F]gospel truth of old
[G]Shall not kneel, shall not [C]faint
[C/E]By His [F]blood and in His name
[G]In His freedom I am [C]free
[C/E]For the [F]love of Jesus Christ
[G]Who has resurrected [C]me`,
    notes: "Key of C, Capo 2 for original D. Epic resurrection narrative. Build through verses.",
    bpm: 68,
    tags: ["worship", "resurrection", "praise"],
  },
  {
    title: "Know You Will",
    artist: "Hillsong United",
    originalKey: "C",
    format: "chordpro",
    content: `{Intro}
[Am] [F] [C]
[Am] [F] [C]

{Verse 1}
[Am]When the road runs [F]dead, You can see a way I [C]don't
[Am]And it makes no [F]sense, but You say that's what faith is [C]for
[Am]When I see a [F]flood, You see a promise
[C]When I see a grave, You see a door
[Am]And when I'm at my [F]end, You see where the future [C]starts

{Chorus}
[Am]I don't know how You [F]make a way
But I [C]know You will
[Am]I don't know how You [F]make a way
But I [C]know You will
[Am]You've been good on every [G]promise, from [F]Eden to Zion
[Am]Through every dead [F]end and out of that [C]grave
[Am]I don't know how You [F]make a way
But I [C]know You will

{Verse 2}
[Am]When the world's on [F]fire, it's not like You don't have a [C]plan
[Am]And when the earth gives [F]way, on this rock Your Church will [C]stand
[Am]Nothing has ever [F]once surprised You
[C]Nothing has ever made You flinch
[Am]And when it all shakes [F]out, the gates of hell don't stand a [C]chance

{Bridge}
[F]You pulled my heart from [G]Egypt
[Am]You carved a road through [G]sea
[C]From all our chains to endless praise
[Em]The story ends in You`,
    notes: "Key of C. Faith declaration. Bridge builds to triumphant ending.",
    bpm: 72,
    tags: ["worship", "faith", "trust"],
  },
  {
    title: "King Of My Heart",
    artist: "Bethel Music",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse}
[G]Let the king of my heart
[C]Be the mountain where I [G]run
[Em]The fountain I drink [D]from
[C]He is my [G]song
[G]Let the king of my heart
[C]Be the shadow where I [G]hide
[Em]The ransom for my [D]life
[C]He is my [G]song

{Chorus}
[Em]You are good
[D]Good
[C]Oh, [G]oh

{Verse 3}
[G]Let the king of my heart
[C]Be the wind inside my [G]sails
[Em]The anchor in the [D]waves
[C]He is my [G]song

{Bridge 1}
[G]You're never gonna let me down
You're never gonna let
Never gonna let me down

{Bridge 2}
[G]You're never gonna let
[C]Never gonna let me [D]down
[Em]You're never gonna [D]let
[C]Never gonna let me [G]down`,
    notes: "Key of G, BPM 70. Devotion anthem. Bridge builds with 'never gonna let me down' repetition.",
    bpm: 70,
    tags: ["worship", "devotion", "trust"],
  },
  {
    title: "Lord I Lift Your Name On High",
    artist: "Hillsong",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]Lord I [F]lift your name on [G]high [F]
[C]Lord I [F]love to sing Your [G]praises [F]
[C]I'm so [F]glad you're in my [G]life [F]
[C]I'm so [F]glad You came to [G]save [F]us

{Chorus}
[C]You came from [F]heaven to [G]earth to [F]show the [C]way
[C]From the [F]earth to the [G]cross my [F]debt to [C]pay
[C]From the [F]cross to the [G]grave from the [Am]grave to the [Dm]sky
[F]Lord I [G]lift Your name on [C]high`,
    notes: "Key of C. Classic, upbeat praise. Simple congregational song.",
    bpm: 120,
    tags: ["worship", "praise", "gospel"],
  },
  {
    title: "Like Incense / Sometimes By Step",
    artist: "David Strasser/Rich Mullins/Brooke Ligertwood",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]May my prayer like incense rise before You
[Em]The lifting of my hands a sacrifice
[C]Oh Lord Jesus turn Your eyes upon me
[Am]For I know there is [D]mercy in Your sight

{Verse 2}
[G]Your statues are my heritage forever
[Em]My heart is set on keeping Your decrees
[C]Please still my anxious urge toward rebellion
[Am]Let love keep my [D]will upon its knees

{Chorus}
[G]Oh God, You are [D]my God
[Am]And I will [Em]ever praise You
[G]Oh God, You are [D]my God
[Am]And I will [Em]ever praise You

{Verse 3}
[G]To all creation I can see a limit
[Em]But Your commands are boundless and have none
[C]So Your word is my joy and meditation
[Am]From rising to the [D]setting of the sun

{Verse 4}
[G]All Your ways are loving and are faithful
[Em]Your road is narrow but Your burden light
[C]Because You gladly lean to lead the humble
[Am]I shall gladly [D]kneel to leave my pride

{Bridge}
[Em]I will seek You [D]in the morning
[Am]And I will learn to [C]walk in Your ways
[G]And step by step You'll [D]lead me
[Am]And I will follow You [C]all of my days`,
    notes: "Key of G, 80 BPM. Prayer and devotion combined. Bridge is the commitment section.",
    bpm: 80,
    tags: ["worship", "prayer", "devotion"],
  },
  {
    title: "Move",
    artist: "Jesus Culture",
    originalKey: "Db",
    format: "chordpro",
    content: `{Instrumental} * 2
[Am] [F] [C]

{Verse 1}
[Am]When You [F]move, darkness runs for [C]cover
[Am]When You [F]move, no one's turned a[C]way
[Am]Because where You [F]are, fear turns into [C]praises
[Am]And where You [F]are, no heart's left un[C]changed

{Chorus}
[F]So come move, let [C]justice roll on like a river
[Am]Let worship turn into revival
[F]Lord, lead us [G]back to You

{Verse 2}
[Am]When You [F]move, the outcast finds a [C]family
[Am]When You [F]move, the orphan finds a [C]home
[Am]Lord, here we [F]are, oh, teach us to love [C]mercy
[Am]With humble [F]hearts, we bow down at Your [C]throne

{Bridge}
[Am]King of all [C]generations
[F]Let every tongue and [G]nation
[Am]Surrender [C]all to You alone, [F]Jesus [G]
[Am]King of all [C]generations
[F]Let every tongue and [G]nation

{Spontaneous}
[F]Back to You, Jesus
[F]Back to You
[C]Back to our first love
[Am]Back to our first love
[G]Jesus, Jesus`,
    notes: "Key of Db, Capo 1. Revival/justice song. Bridge builds with mounting declaration.",
    bpm: 76,
    tags: ["worship", "revival", "justice"],
  },
  {
    title: "Make Room",
    artist: "The Church Will Sing",
    originalKey: "E",
    format: "chordpro",
    content: `{Intro}
[E] [B] [F#m] [A]
[E] [B] [F#m] [A]

{Verse 1}
[E]Here is where I [B]lay it down
[F#m]Every burden, every crown
[A]This is my surrender
[A]This is my surrender

[E]Here is where I [B]lay it down
[F#m]Every lie and every doubt
[A]This is my surrender

{Chorus} * 2
[E]And I will make room for You
[B]To do whatever You [F#m7]want to
[A]To do whatever You want to

{Bridge} * 4
[E]Shake up the ground
of all my tradition
[B]Break down the walls
of all my religion
[F#m]Your way is better
[A]Oh Your way is better

{Verse 2}
[E]Here is where I [B]lay it down
[F#m]You are all I'm chasing now
[A]This is my surrender
[A]This is my surrender`,
    notes: "Key of E (also Gb with Capo 4). Surrender anthem. Bridge repeats build with energy.",
    bpm: 72,
    tags: ["worship", "surrender", "devotion"],
  },
  {
    title: "More Like Jesus",
    artist: "Brooke Ligertwood/Scott Ligertwood/Kristian Stanfill/Brett Younker",
    originalKey: "A",
    format: "chordpro",
    content: `{Intro}
||: [A] | [A] | [D] | [D] :||

{Verse 1}
[A]You came to the world You created
[Dmaj7]Trading Your crown for a cross
[F#m]You willingly [E(4)]died, Your [D]innocent life paid the cost

{Verse 2}
[A]Counting Your status as nothing
[Dmaj7]The King of all kings came to serve
[F#m]Washing my [E(4)]feet, covering [D]me with Your love

{Chorus 1A}
[A]If more of You means [A/C#]less of me
[D2]Take everything
[A]Yes, all of You is [A/C#]all I need
[D2]Take every[A]thing

{Verse 3}
[A]You are my life and my treasure
[Dmaj7]The One that I can't live without
[F#m]Here at Your [E(4)]feet, my desires and [D]dreams I lay down

{Bridge}
[D]Oh Lord, change me like only You can
[Dmaj7]Here with my [Esus]heart in Your [F#m7]hands
[F#m7]Father, I pray, make me more like [D]Jesus
[Dmaj7]You've shown us the [Esus]way to Your [F#m7]heart
[D]This world is dying to know who You [Dmaj7]are
[Esus]So Father, I pray, make me more like [D]Jesus

[D]More like [D2(#4)]Je[Esus]sus [E]
More like [D]Jesus, Lord`,
    notes: "Key of A, Tempo 48, 6/8 time. Prayerful transformation song. Bridge is the heart cry.",
    bpm: 48,
    tags: ["worship", "transformation", "prayer"],
  },
  {
    title: "Never See The End",
    artist: "Mission House",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro}
[G] [D] [Em] [G]
[C] [D]

{Verse 1}
[C]Where can we [D]run, where can we [G]hide
[Em]That You will not find us, God?
[C]Deepest of [D]depths, highest of [G]heights
[Em]Your love, it chases us
[C]No matter where [D]we've been,
[G]no matter what we've done
[Em]We can't escape Your [C]love, ooh

{Chorus}
[G]We will [D]never see the [Em]end
[G]We will never see the [C]end
[D]We will never see the end of Your [G]goodness
[G]We will [D]never see the [Em]end
[G]We will never see the [C]end
[D]We will never see the end of Your [G]goodness

{Bridge} * 2
[G]In our darkest [D]hours, on our [Em]hardest [G]days [C]
[D]We do not have to be afraid
[G]For You will [D]never leave, [Em]no, You
[G]will not for[C]sake
[D]The promises You have made

{Tag}
[G]And we can [D]say that`,
    notes: "Key of G. Faithfulness anthem. Bridge builds with assurance.",
    bpm: 80,
    tags: ["worship", "faithfulness", "eternity"],
  },
  {
    title: "No Other Name",
    artist: "Joel Houston/Jonas Myrin",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro}
[Pad] [G]
[G] / / [D/F#] | [G] [Am] [G] [D/F#] | [Em] | [Em] / /

{Verse 1}
[G]One name holds [G]weight above them [Em]all
[G]His fame out[G]lasts the earth He [Em]formed
[C]His praise re[C]sounds be[C]yond the [Em]stars
[G]And echoes [C]in our hearts, the [C]greatest One of [Em]all [C]

{Verse 2}
[G]His face shines [G]brighter than the [Em]sun
[G]His grace as [G]boundless as His [Em]love
[C]He reigns with [C]healing in His [Em]wings
[G]The King above [C]all kings, the greatest [C]One of [Em]all [C]

{Chorus}
[G]Lift up our eyes, see the King has come
[Em]Light of the world reaching out for us
[G/B]There is no other [C]Name
[Em]There is no other [C]Name
[Em]Jesus Christ our [C]God
[G]Seated on high, the undefeated One
[Em]Mountains bow down as we lift Him up
[G/B]There is no other [C]Name
[Em]There is no other Name

{Bridge}
[G]The earth will shake and tremble before Him
[Em7]Chains will break as heaven and earth sing
[C(add9)]Holy is the name, [Em7]holy is the [C(add9)]name
of Jesus, Jesus

{Ending}
[Em]There is no other Name
[C]There is no other [G]Name, Jesus
[G] | [Em] | [Em] | [C] | [C] | [Em] | [C] | [G]`,
    notes: "Key of G. Exaltation anthem. Bridge builds to worship climax.",
    bpm: 80,
    tags: ["worship", "name of jesus", "praise"],
  },
  {
    title: "Old Church Basement",
    artist: "Maverick City Music/Elevation Worship",
    originalKey: "C",
    format: "chordpro",
    content: `{Intro}
[F] [C] [Am] [G] 2x

{Verse 1}
[F] [C]I don't see anything wrong with the [Am]lights or stages
[G]
[F]I even [C]love it when the [Am]crowd gets [G]loud
[F]But every [C]now and then it can get a little [Am]compli[G]cated
[F]So I [C]remember when I was [Am]in that old
[G]church basement, singing

{Chorus}
[F]Halle[C]lujah is all I [G]need [Am]
[F]When I think of Your [C]goodness and Your love for [C]me
[F]Oh the joy of my sal[G]vation
[G]Is coming back to [Am]me
[Dm]It's just an old halle[C]lujah with a [G]new melody [C]
[F] [C] [G] [Am]
Oh, oh, oh, oh
[F] [C] [G] [C]
Oh, oh, oh, oh

{Verse 2}
[F]We got to[C]gether every Wednesday [Am]night
[G]About 30 teenagers
[F]My friend [C]Josh bought a cheap guitar and [Am]
[G]barely knew how to play it
[F]He wasn't [C]putting on a show, wasn't well [Am]
[G]known, wasn't trying to be famous
[F]But we [C]sure touched heaven in that [Am]old [G]
church basement

{Bridge}
[F]Great is Thy [C]faithfulness Lord [G]unto [C]me
[Dm]It's just an old halle[C]lujah with a [G]new melody [C]
[F]I once was [C]blind but [G]now I can [Am]see
[Dm]It's just an old halle[C]lujah with a [G]new melody [C]
[F]Over the mountains [C]and the sea [G]Your river
[C]runs with love for me
[Dm]It's just an old halle[C]lujah with a [G]new me[Am]lody
[F]Shout to the [C]Lord all the [G]earth let us sing
[Dm]It's just an old halle[C]lujah with a [G]new me[C]lody`,
    notes: "Key of C. Testimony song. Bridge quotes classic worship songs - beautiful mashup.",
    bpm: 80,
    tags: ["worship", "testimony", "gratitude"],
  },
  {
    title: "O Praise The Name (Anastasis)",
    artist: "Hillsong",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]I cast my mind to Calvary
[D]Where Jesus [Em]bled and died for me
[C]I see His wounds, His [G]hands, His feet
[D]My Savior on that [G]cursed tree

{Verse 2}
[G]His body bound and drenched in tears
[D]They laid Him [Em]down in Joseph's tomb
[C]The entrance sealed by [G]heavy stone
[D]Messiah still and all a[G]lone

{Chorus}
[G]O praise the [C]Name of the [G]Lord our God
[Em]O praise His [Dsus]Name for[D]evermore
[G]For endless [C]days we will [Em]sing Your praise
[C]Oh [D]Lord, oh [G]Lord our God

{Verse 3}
[G]And then on the third at break of dawn
[D]The Son of [Em]Heaven rose again
[C]O trampled death, [G]where is your sting?
[D]The angels roar for [G]Christ the [Gsus]King

{Verse 4}
[G]He shall return in robes of white
[D]The blazing [Em]sun shall pierce the night
[C]And He will rise [G]among the saints
[D]My gaze transfixed on [G]Jesus' face

{Bridge Ending}
[C]Oh Lord, oh [Dsus]Lord our [G]God
[C]Oh Lord, oh [D]Lord our [G]God`,
    notes: "Key of G, Capo 2 for original A. Easter narrative anthem. Each verse tells the story.",
    bpm: 72,
    tags: ["worship", "resurrection", "cross"],
  },
  {
    title: "Saved",
    artist: "Vineyard Songs",
    originalKey: "C",
    format: "chordpro",
    content: `{Intro}
[G/C] | [G/C] | [C/F] | [C/F] | [x2]

{Verse}
[G/C]I have been re[C/F]stored to the love of God
[G/C]I thought it was the [C/F]end, but it's just begun
[G/C]I'm a sinner [C/F]saved by the grace of God
[G/C]Not for what I've [C/F]done or for what I've not

{Chorus}
[G/C]You, my Jesus, my [C/F]strength and fortress
[G/C]My hope and [C/F]purpose, You are all this, (and more)

{Interlude}
[G/C] | [G/C] | [C/F] | [C/F] | [x2]

{Bridge}
[G/C]I love, I love, I love
[C/F]I love You, oh I love You [x4]`,
    notes: "Key of C. Simple grace testimony. Let repetition build intimacy.",
    bpm: 80,
    tags: ["worship", "grace", "love"],
  },
  {
    title: "Set A Fire",
    artist: "Jesus Culture",
    originalKey: "C",
    format: "chordpro",
    content: `{Intro}
[G/C] [C/F] [Em/Am] [C/F]

{Chorus}
[G/C]Set a fire down in my [C/F]soul
That I can't con[Em/Am]tain and I can't control
[C/F]I want more of You God, I want [C]more of You God.

{Verse}
[G/C]There's no place I'd rather be
[C/F]There's no place I'd rather be
[Em/Am]There's no place I'd rather be
[C/F]Than here in Your love, here in Your love`,
    notes: "Key of C, BPM 139, Capo 5 for original. Simple prayer chorus. Let it repeat and build.",
    bpm: 139,
    tags: ["worship", "fire", "prayer"],
  },
  {
    title: "Tremble",
    artist: "Hank Bentley/Mia Fieldes/Andres Figueroa/Mariah McManus",
    originalKey: "C",
    format: "chordpro",
    content: `{Intro}
[Am] | [Fmaj7] | [C] | [G(add4)] |

[Am]Peace, bring it all to [Fmaj7]peace
[C]The storms surrounding [G(add4)]me, let it break at Your name
[Am]Still, call the [Fmaj7]sea to still
[C]The rage in me to [G(add4)]still, every wave at Your name

[F]Jesus, [Am]Jesus, [G(add4)]You make the darkness tremble
[F]Jesus, [Am]Jesus, [G(add4)]You silence fear
[F]Jesus, [Am]Jesus, [G(add4)]You make the darkness tremble
[F]Jesus, [Am] [G(add4)]Jesus

[Am]Breathe, call these [Fmaj7]bones to live
[C]Call these lungs to [Em]sing, once again, I will praise

[F]Your name is a [C]light that the shadows can't deny
[F]Your [G]name cannot be [Am]overcome
[F]Your name is [C]alive, forever lifted [G]high
[F]Your [G]name cannot be [Am]overcome
[1st time x1, 2nd time x2]

[F]Jesus, [C]Jesus, [G]You make the darkness tremble
[F]Jesus, [C]Jesus, [G]You silence fear
[F]Jesus, [C]Jesus, [G]You make the darkness tremble
[F]Jesus, [Am] [G(add4)]Jesus

[Fmaj7] | [Am] / [G] / | [Fmaj7] | [Am] / [G] / |

[F]Jesus, [Am] [G(add4)]Jesus
[F]Jesus, [Am] [G(add4)]Jesus`,
    notes: "Key of C. Authority over fear/darkness. Name section builds powerfully.",
    bpm: 72,
    tags: ["worship", "peace", "authority"],
  },
  {
    title: "That's The Power",
    artist: "Hillsong Worship",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Intro}
[Em7] [Dsus4] [Cadd9] (x2)

{Verse 1}
[Em7]There's a [Dsus4]name that levels [Cadd9]mountains.
[Em7]And carves out [Dsus4]highways through the [Cadd9]sea.
[Em7]And I've seen as [Dsus4]praise unravel [Cadd9]battles,
[Em7]right in[Dsus4]front of [Cadd9]me.

{Chorus 1}
[Em7]'Cause that's the [Dsus4]power of Your name.
[Cadd9]Just a [G]mention makes a way.
[Em7]Giants fall and [Dsus4]strongholds break
[Cadd9]and there is [G]healing.
[Em7]And that's the [Dsus4]power that I claim.
[Cadd9]It's the same that [G]rolled the grave.
[Em7]And there's no [Dsus4]power like the mighty name
[Cadd9]of [G]Jesus.

{Verse 2}
[Em7]Oh, there's a [Dsus4]hope that calls out [Cadd9]courage.
[Em7]And in the [Dsus4]furnace un[Cadd9]afraid.
[Em7]The kind of [Dsus4]daring expec[Cadd9]tation,
[Em7]That every [Dsus4]prayer I make, is on an empty [Cadd9]grave.

{Bridge}
[G]Oh I see You [Gsus4]taking ground. I see You
[G]press ahead.
[G]And Your power is [Gsus4]dangerous to the enemy's camp.
[G]But You still do [Gsus4]miracles.
And You will do what You said.
[Em7]For You're the same God [Dsus4]now as You've [Cadd9]always been. [G]

{Tag/Ending}
[Em7]And there's no [Dsus4]power like the mighty name
[Cadd9]of [G]Jesus.
[Em7]And there's no [Dsus4]power like the mighty name
[Cadd9]of [G]Jesus.`,
    notes: "Key of Bb, Capo 3. Power of the name anthem. Bridge is a powerful declaration moment.",
    bpm: 80,
    tags: ["worship", "power", "name of jesus"],
  },
  {
    title: "This Kingdom",
    artist: "Geoff Bullock",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]Jesus, [G/B]God's righteous[Am7]ness re[C/G]vealed
[F]The Son of Man, the [C/E]Son of God
[Dm7]His kingdom [F/G] [G7]comes
[Am7]Jesus, [C/G]redemption's [F]sacri[Em7]fice [Dm7]
[C/E]Now glori[F]fied, now justi[G]fied
His kingdom comes

{Chorus}
[C]And this kingdom will [G/B]know no end
[Am7]And its glory shall [C/G]know no [Em7]bounds
[F]For the majes[G/F]ty and [C/E]power [Am7]
[D/F#]Of this [G7sus]Kingdom's [G7]King [F/A]has come
[G/B]And this [C]kingdom's [G/B]reign
And this kingdom's rule
[Am7]And this kingdom's [Em/G]power and au[F]thority
[F]Je[C/G]sus [Am7]God's [Dm7]righteous[G7sus]ness re[C]vealed

{Verse 2}
[C]Jesus the [G/B]expression [Am7]of God's [C/G]love
[F]The grace of [C/E]God, the Word of God
[Dm7]Revealed to [F/G] [G7]us
[Am7]Jesus, [C/G]God's holi[F]ness dis[Em7]played [Dm7]
[C/E]Now glori[F]fied, now justi[G]fied
His kingdom comes

{Instrumental}
| [C] | [Fm/C] | [C] | [Fm/C] | (C) (Last x)`,
    notes: "Key of C, Tempo 85. Majestic kingdom anthem. Let the grandeur build through chorus.",
    bpm: 85,
    tags: ["worship", "kingdom", "praise"],
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
