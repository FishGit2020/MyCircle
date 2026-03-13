#!/usr/bin/env node
/**
 * Seed Chris Tomlin worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/chris-tomlin.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "How Great Is Our God",
    artist: "Chris Tomlin",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]The splendor of the King, [Am]clothed in majesty
[F]Let all the earth rejoice, [C]all the earth rejoice
[C]He wraps Himself in light, [Am]and darkness tries to hide
[F]And trembles at His voice, [C]trembles at His voice

{Chorus}
[C]How great is our God, [Am]sing with me
[F]How great is our God, [G]and all will see
[C]How great, [Am]how great [F]is our [C]God

{Verse 2}
[C]Age to age He stands, [Am]and time is in His hands
[F]Beginning and the end, [C]beginning and the end
[C]The Godhead three in one, [Am]Father Spirit Son
[F]The Lion and the Lamb, [C]the Lion and the Lamb

{Bridge}
[Am]Name above all [G]names
[F]Worthy of all [C]praise
[Am]My heart will sing, how [G]great [F]is our God`,
    notes: "One of the most sung worship songs ever. Simple and singable.",
    bpm: 78,
    tags: ["praise","worship","classic"],
  },
  {
    title: "Amazing Grace (My Chains Are Gone)",
    artist: "Chris Tomlin",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Amazing grace how [G/B]sweet the [C]sound
[G]That saved a [C]wretch like [G]me
[G]I once was lost but [G/B]now I'm [C]found
[G]Was blind but [D]now I [G]see

{Chorus}
[G]My chains are [D]gone, I've been set [Em]free
[C]My God, my [G]Savior has [D]ransomed me
[G]And like a [D]flood His mercy [Em]reigns
[C]Unending [G]love, a[D]mazing [G]grace

{Verse 2}
[G]'Twas grace that [G/B]taught my [C]heart to fear
[G]And grace my [C]fears re[G]lieved
[G]How precious [G/B]did that [C]grace appear
[G]The hour I [D]first be[G]lieved`,
    notes: "Modern classic. Hymn verses with the powerful \"My Chains Are Gone\" chorus.",
    bpm: 64,
    tags: ["hymn","grace","congregational"],
  },
  {
    title: "Good Good Father",
    artist: "Chris Tomlin",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]Oh, I've heard a thousand [E]stories of what they think You're [F#m]like
But I've heard the tender [D]whisper of love in the dead of night
[A]And You tell me that You're [E]pleased and that I'm never [F#m]alone

{Chorus}
[A]You're a good, good [E]Father
[F#m]It's who You are, [D]it's who You are, [A]it's who You are
[A]And I'm loved by [E]You
[F#m]It's who I am, [D]it's who I am, [A]it's who I am

{Verse 2}
[A]Oh, and I've seen many [E]searching for answers far and [F#m]wide
But I know we're all [D]searching for answers only You provide
[A]'Cause You know just what we [E]need before we say a [F#m]word`,
    notes: "Tender, personal worship. Great for intimate settings.",
    bpm: 72,
    tags: ["worship","father","identity"],
  },
  {
    title: "Holy Is the Lord",
    artist: "Chris Tomlin",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]We stand and lift up our [D]hands
[Em]For the joy of the Lord [C]is our strength
[G]We bow down and wor[D]ship Him now
[Em]How great, [C]how awesome is He

{Pre-Chorus}
[G]And together we [D]sing
[Em]Everyone [C]sing

{Chorus}
[G]Holy is the [D]Lord God Al[Em]mighty
[C]The earth is filled with His [G]glory
[G]Holy is the [D]Lord God Al[Em]mighty
[C]The earth is filled with His [G]glory
[C]The earth is filled with His [G]glory`,
    notes: "High energy praise. Great opener.",
    bpm: 126,
    tags: ["praise","holiness","congregational"],
  },
  {
    title: "Our God",
    artist: "Chris Tomlin",
    originalKey: "Em",
    format: "chordpro",
    content: `{Verse 1}
[Em]Water You turned into [C]wine
[G]Opened the eyes of the [D]blind
[Em]There's no one like [C]You
[G]None like [D]You

{Verse 2}
[Em]Into the darkness You [C]shine
[G]Out of the ashes we [D]rise
[Em]There's no one like [C]You
[G]None like [D]You

{Pre-Chorus}
[Am]Into all the world You [C]sent Your only Son

{Chorus}
[C]Our God is greater, [D]our God is stronger
[Em]God You are higher than [C]any other
[C]Our God is Healer, [D]awesome in power
Our [Em]God, our [C]God

{Bridge}
[Em]And if Our God is for [C]us
[G]Then who could ever [D]stop us
[Em]And if our God is with [C]us
[G]Then what could stand a[D]gainst`,
    notes: "Anthemic. Full band, big dynamics on the chorus.",
    bpm: 105,
    tags: ["praise","anthem","power"],
  },
  {
    title: "Is He Worthy",
    artist: "Chris Tomlin",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[A]Do you feel the [E]world is broken?
[F#m]We do [D]
[A]Do you feel the [E]shadows deepen?
[F#m]We do [D]
[A]But do you know that [E]all the dark won't
[F#m]Stop the light from [D]getting through?
[A]We do [E]
[A]Do you wish that [E]you could see it
[F#m]All made [D]new?
[A]We do [E]

{Verse 2}
[A]Is all cre[E]ation groaning?
[F#m]It is [D]
[A]Is a new cre[E]ation coming?
[F#m]It is [D]
[A]Is the glory [E]of the Lord to be the
[F#m]Light within our [D]midst?
[A]It is [E]
[A]Is it good that [E]we remind our[F#m]selves of [D]this?
[A]It is [E]`,
    notes: "Call and response format. Powerful in congregational settings.",
    bpm: 68,
    tags: ["worship","declaration","hope"],
  },
  {
    title: "Whom Shall I Fear",
    artist: "Chris Tomlin",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]You hear me when I [E]call
[F#m]You are my morning [D]song
[A]Though darkness fills the [E]night
[F#m]It cannot hide the [D]light

{Pre-Chorus}
[A]Whom shall I [E]fear
[F#m]Whom shall I [D]fear

{Chorus}
[A]I know who goes be[E]fore me
[F#m]I know who stands be[D]hind
[A]The God of angel [E]armies
[F#m]Is always by my [D]side
[A]The One who reigns for[E]ever
[F#m]He is a friend of [D]mine
[A]The God of angel [E]armies
[F#m]Is always by my [D]side

{Bridge}
[A]And nothing formed a[E]gainst me shall stand
[F#m]You hold the whole world [D]in Your hands
[A]I'm holding on to [E]Your promises
[F#m]You are [D]faithful`,
    notes: "Powerful declaration of God as protector. Great opener.",
    bpm: 78,
    tags: ["worship","courage","protection"],
  },
  {
    title: "Jesus Messiah",
    artist: "Chris Tomlin",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]He became sin, who [G]knew no sin
[Bm]That we might be[A]come His righ[D]teousness
[D]He humbled Himself and [G]carried the cross
[Bm]Love so a[A]mazing, love so a[D]mazing

{Chorus}
[D]Jesus Mes[G]siah, Name above all [Bm]names
[A]Blessed Re[D]deemer, Emman[G]uel
[Bm]The rescue for [A]sinners, the ransom from [D]heaven
[G]Jesus Mes[A]siah, Lord of [D]all`,
    notes: "Christological anthem. Reverent and majestic. Full band on chorus.",
    bpm: 74,
    tags: ["worship","Jesus","salvation","atonement"],
  },
  {
    title: "Even So Come",
    artist: "Chris Tomlin",
    originalKey: "B",
    format: "chordpro",
    content: `{Verse 1}
[B]All of crea[E]tion, all of the [G#m]earth
[F#]Make straight a highway, a [E]path for the Lord
[B]Jesus is [E]coming [G#m]soon[F#]

{Chorus}
[B]Even so come, [E]Lord Jesus come
[G#m]Even so come, [F#]Lord Jesus come
[B]Take Your [E]bride, take Your [G#m]bride
[F#]Even so come, Lord Jesus come`,
    notes: "Second coming theme. Builds urgency and anticipation through repetition.",
    bpm: 72,
    tags: ["worship","second coming","hope","prayer"],
  },
  {
    title: "At the Cross (Love Ran Red)",
    artist: "Chris Tomlin",
    originalKey: "Ab",
    format: "chordpro",
    content: `{Verse 1}
[A]There's a place where [E]mercy reigns
[F#m]And never dies
[D]There's a place where [A]streams of grace
[E]Flow deep and wide

{Chorus}
[A]At the cross, at the [E]cross
[F#m]I surrender my [D]life
[A]I'm in awe of [E]You
[F#m]I'm in awe of [D]You
[A]Where Your love ran [E]red
[F#m]And my sin washed [D]white`,
    notes: "Powerful cross-focused anthem. Simple progression, deep lyrics.",
    bpm: 73,
    tags: ["worship","cross","surrender","grace"],
  },
  {
    title: "Indescribable",
    artist: "Chris Tomlin",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]From the highest of [F]heights
[Gm]To the depths of the [Eb]sea
[Bb]Creation's revealing Your [F]majesty
[Gm]From the colors of [Eb]fall
[Bb]To the fragrance of [F]spring

{Chorus}
[Bb]Indescribable, [F]uncontainable
[Gm]You placed the stars in the [Eb]sky
[Bb]And You know them by [F]name
[Gm]You are a[Eb]mazing God`,
    notes: "Laura Story co-write. Creation praise, soaring melody on chorus.",
    bpm: 82,
    tags: ["worship","creation","majesty","awe"],
  },
  {
    title: "I Will Follow",
    artist: "Chris Tomlin",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]Where You go, I'll [B]go
[C#m]Where You stay, I'll [A]stay
[E]When You move, I'll [B]move
[C#m]I will fol[A]low

{Chorus}
[E]All Your ways are [B]good
[C#m]All Your ways are [A]sure
[E]I will trust in [B]You alone
[C#m]Higher than my [A]sight
[E]I will fol[B]low [C#m]You[A]`,
    notes: "Commitment anthem. Driving pop-rock feel, great singalong.",
    bpm: 136,
    tags: ["worship","commitment","following"],
  },
  {
    title: "Nobody Loves Me Like You",
    artist: "Chris Tomlin",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Morning light, a [D]brand new mercy
[Em]Reaching in, [C]reaching out
[G]Gently lifting [D]every burden
[Em]Oh You remove [C]my doubt

{Chorus}
[G]Nobody loves me like [D]You love me, Jesus
[Em]Nobody turns my [C]heart like You do
[G]Nobody loves me like [D]You love me
[Em]Nobody, [C]nobody`,
    notes: "Simple and joyful. Light acoustic feel, easy for congregations.",
    bpm: 120,
    tags: ["worship","love","joy"],
  },
  {
    title: "Resurrection Power",
    artist: "Chris Tomlin",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]You called me from the [G]grave by name
[Am]You called me out of [F]all my shame
[C]I see the old has [G]passed away
[Am]The new has [F]come

{Chorus}
[C]Now I have resurrection [G]power
[Am]Living on the [F]inside
[C]Resurrection [G]power
[Am]I feel it [F]come alive
[C]Jesus, You have [G]given us freedom
[Am]No longer [F]bound, I'm walking in power`,
    notes: "Energetic and bold, Easter-ready anthem. Builds to big finish.",
    bpm: 140,
    tags: ["worship","resurrection","power","Easter"],
  },
  {
    title: "Sovereign",
    artist: "Chris Tomlin",
    originalKey: "B",
    format: "chordpro",
    content: `{Verse 1}
[B]Sovereign over [E]us
[G#m]Sovereign over [F#]all
[B]Where You are is [E]where I want to be
[G#m]In Your arms I [F#]fall

{Chorus}
[B]You are sov[E]ereign
[G#m]You are sov[F#]ereign
[B]And there's no one [E]like You [F#]Lord`,
    notes: "From the Burning Lights album. Reverent and grand.",
    bpm: 72,
    tags: ["worship","sovereignty","trust"],
  },
  {
    title: "Awake My Soul (Tomlin)",
    artist: "Chris Tomlin",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]Awake my soul, [B]awake my soul
[C#m]And sing, sing a [A]new song
[E]Let all that is with[B]in me
[C#m]Cry holy, holy, [A]holy

{Chorus}
[E]God of mercy, [B]God of grace
[C#m]Awake my soul and [A]sing
[E]Awake my [B]soul [A]`,
    notes: "Psalm 57:8. Call to worship energy.",
    bpm: 126,
    tags: ["worship","awakening","praise"],
  },
  {
    title: "Home",
    artist: "Chris Tomlin",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]This world is not my [D]home
[Em]I'm just passing [C]through
[G]Where You are is [D]where I belong
[Em]I'm coming [C]home to You

{Chorus}
[G]Home, where the [D]heart is
[Em]Home, where Your [C]love is
[G]Heaven is my [D]home [C]`,
    notes: "Eternal perspective song. Bittersweet hope.",
    bpm: 68,
    tags: ["worship","heaven","hope"],
  },
  {
    title: "Praise Is the Highway",
    artist: "Chris Tomlin",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]Praise is the [E]highway
[F#m]Into Your [D]presence
[A]Praise is the [E]pathway
[F#m]To Your [D]throne

{Chorus}
[A]We ride on the [E]highway of praise
[F#m]Lifting our voices [D]to the King
[A]Praise is the [E]highway [D]Lord`,
    notes: "Uptempo praise. Great for opening a worship set.",
    bpm: 134,
    tags: ["worship","praise","celebration"],
  },
  {
    title: "Faithful",
    artist: "Chris Tomlin",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]Faithful, for[A]ever You are faithful
[Bm]Father to the [G]fatherless
[D]You uphold the [A]one who feels forsaken
[Bm]You are [G]faithful God

{Verse 2}
[D]Faithful, [A]faithful
[Bm]Through every [G]season You are faithful
[D]Through every [A]storm You are [G]faithful`,
    notes: "From the And If Our God Is for Us album. Reassuring.",
    bpm: 70,
    tags: ["worship","faithfulness","comfort"],
  },
  {
    title: "God of This City",
    artist: "Chris Tomlin",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]You're the God of this [F]city
[Gm]You're the King of these [Eb]people
[Bb]You're the Lord of this [F]nation
[Gm]You [Eb]are

{Chorus}
[Bb]Greater things have yet to [F]come
[Gm]And greater things are still to be [Eb]done
[Bb]In this [F]city [Eb]`,
    notes: "Originally by Bluetree, popularized by Tomlin. City-wide vision.",
    bpm: 78,
    tags: ["worship","city","mission"],
  },
  {
    title: "Everlasting God",
    artist: "Chris Tomlin",
    originalKey: "B",
    format: "chordpro",
    content: `{Verse 1}
[B]Strength will rise as we [E]wait upon the Lord
[B]Wait upon the Lord, we will [E]wait upon the Lord

{Pre-Chorus}
[B]Our God, You reign for[E]ever
[G#m]Our hope, our strong de[F#]liverer

{Chorus}
[B]You are the ever[E]lasting God
[G#m]The everlasting [F#]God
[B]You do not faint, You [E]won't grow weary
[B]You're the defender [E]of the weak
[G#m]You comfort those in [F#]need
[B]You lift us up on [E]wings like eagles`,
    notes: "Isaiah 40:28-31 anthem. Brenton Brown co-write.",
    bpm: 124,
    tags: ["worship","strength","waiting"],
  },
  {
    title: "We Fall Down (Tomlin)",
    artist: "Chris Tomlin",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[E]We fall down, we [B]lay our crowns
[C#m]At the feet of [A]Jesus
[E]The greatness of [B]mercy and love
[C#m]At the feet of [A]Jesus

{Chorus}
[E]And we cry holy, holy, [B]holy
[C#m]And we cry holy, holy, [A]holy
[E]And we cry holy, holy, [B]holy is the [A]Lamb`,
    notes: "Tomlin's early classic. Key of E version for guitar-led worship.",
    bpm: 64,
    tags: ["worship","reverence","classic"],
  },
  {
    title: "Not to Us",
    artist: "Chris Tomlin",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]Not to us, but to [A]Your name
[Bm]Be the glory, be the [G]praise
[D]Not to us, but to [A]Your name
[Bm]Be the glory, be the [G]praise

{Chorus}
[D]The cross before me, the [A]world behind
[Bm]No turning back, raise the [G]banner high
[D]It's not for [A]us, it's all for [G]You`,
    notes: "Psalm 115:1. Humble adoration song.",
    bpm: 76,
    tags: ["worship","humility","glory"],
  },
  {
    title: "Forever (Chris Tomlin)",
    artist: "Chris Tomlin",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Give thanks to the [C]Lord
[Em]Our God and [D]King
[G]His love endures for[C]ever [D]

{Chorus}
[G]Forever God is [C]faithful
[Em]Forever God is [D]strong
[G]Forever God is [C]with us
[Em]Forever [D]forever`,
    notes: "Psalm 136. Early Tomlin anthem that shaped modern worship.",
    bpm: 122,
    tags: ["worship","eternal","classic"],
  },
  {
    title: "Unfailing Love",
    artist: "Chris Tomlin",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]You have my [E]heart
[F#m]And I am [D]Yours forever
[A]You are my [E]strength
[F#m]God of grace and [D]power

{Chorus}
[A]And everything You [E]hold in Your hand
[F#m]Still You make time for [D]me
[A]I can't under[E]stand
[F#m]Your unfailing [D]love for [A]me`,
    notes: "Classic Tomlin. Warm and personal.",
    bpm: 70,
    tags: ["worship","love","devotion"],
  },
  {
    title: "Made to Worship",
    artist: "Chris Tomlin",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]Before the day, before the [B]light
[C#m]Before the world revolved a[A]round the sun
[E]God on high stepped [B]down into time
[C#m]And wrote the story of His [A]love for everyone

{Chorus}
[E]We were made to [B]worship
[C#m]We were made to [A]love
[E]We were made for [B]so much more than [A]we could ever dream`,
    notes: "Purpose declaration. Strong melody, singable chorus.",
    bpm: 126,
    tags: ["worship","purpose","creation"],
  },
  {
    title: "I Lift My Hands",
    artist: "Chris Tomlin",
    originalKey: "Ab",
    format: "chordpro",
    content: `{Verse 1}
[Ab]Be still, there is a [Eb]healer
[Fm]His love is deeper than the [Db]sea
[Ab]His mercy is un[Eb]failing
[Fm]His arms a fortress for the [Db]weak

{Chorus}
[Ab]I lift my hands to be[Eb]lieve again
[Fm]You are my refuge, You are my [Db]strength
[Ab]As I pour out my [Eb]heart
[Fm]These things I re[Db]member
[Ab]You are faithful [Eb]God for[Db]ever`,
    notes: "Matt Maher co-write. Deep well of comfort.",
    bpm: 66,
    tags: ["worship","faith","comfort"],
  },
  {
    title: "Love",
    artist: "Chris Tomlin",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]Love put a face on the [A]God that we were searching for
[Bm]Love hung on a tree and [G]bled
[D]Love opened the door that [A]we could never open
[Bm]Love made a way for the [G]dead to live again

{Chorus}
[D]Love, [A]love, [Bm]love
[G]Nothing can separate us from the [D]love of God`,
    notes: "Romans 8:38. Story of the gospel through the lens of love.",
    bpm: 72,
    tags: ["worship","love","gospel"],
  },
  {
    title: "Crown Him (Majesty)",
    artist: "Chris Tomlin",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Crown Him with many [D]crowns
[Em]The Lamb upon His [C]throne
[G]Hark how the heavenly [D]anthem drowns
[Em]All music but its [C]own

{Chorus}
[G]Majesty, [D]majesty
[Em]Crown Him Lord of [C]all
[G]Majesty, [D]Lord of all`,
    notes: "Classic hymn reimagined by Tomlin. Grand and majestic.",
    bpm: 76,
    tags: ["worship","majesty","hymn","classic"],
  },
  {
    title: "Burning Lights",
    artist: "Chris Tomlin",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]We are the burning [B]lights
[C#m]We are the city on a [A]hill
[E]We are the burning [B]lights
[C#m]Light of the world we [A]shine

{Chorus}
[E]Come alive, come a[B]live
[C#m]Let your glory [A]fall
[E]We lift our eyes, we [B]lift our eyes
[C#m]You are Lord of [A]all`,
    notes: "Title track from 2013 album. High energy anthem with driving beat.",
    bpm: 130,
    tags: ["worship","light","anthem"],
  },
  {
    title: "Lay Me Down",
    artist: "Chris Tomlin",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]With this heart [A]open wide
[Bm]From the depths, from the [G]heights
[D]I will bring a [A]sacrifice
[Bm]Oh [G]Lord

{Chorus}
[D]I lay me [A]down
[Bm]I'm not my [G]own
[D]I belong to [A]You alone
[Bm]Lay me down, [G]lay me down`,
    notes: "Matt Redman co-write. Song of surrender, builds with each verse.",
    bpm: 72,
    tags: ["worship","surrender","devotion"],
  },
  {
    title: "Waterfall",
    artist: "Chris Tomlin",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]O God my God I [B]seek You
[C#m]I wanna find You [A]in this place
[E]O God my God I [B]need You
[C#m]You're everything my [A]heart desires

{Chorus}
[E]Your love is like a [B]waterfall, waterfall
[C#m]Running wild and [A]free
[E]You hear my heart when [B]I call, when I call
[C#m]Deep calls to [A]deep`,
    notes: "From Love Ran Red album. Joyful, flowing worship.",
    bpm: 128,
    tags: ["worship","love","joy"],
  },
  {
    title: "Jesus",
    artist: "Chris Tomlin",
    originalKey: "B",
    format: "chordpro",
    content: `{Verse 1}
[B]There is a [E]truth older than the [G#m]ages
[F#]There is a [E]promise of things yet to [B]come
[B]There is One [E]born for our sal[G#m]vation
[F#]Jesus [E]

{Chorus}
[B]Jesus, [E]bring the rain
[G#m]Bring the wind and [F#]waves
[B]Only You can [E]save
[G#m]Jesus [F#]Jesus`,
    notes: "From the Never Lose Sight album. Powerful declaration of the name.",
    bpm: 74,
    tags: ["worship","Jesus","salvation"],
  },
  {
    title: "Good to Be Alive (Today)",
    artist: "Chris Tomlin",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]I know a God who [B]can
[C#m]I know a God who [A]can
[E]He rolled the stone a[B]way
[C#m]He has made a way [A]for us

{Chorus}
[E]It's a good day to be a[B]live
[C#m]It's a good day to be a[A]live
[E]Oh what a day, [B]what a day
[C#m]It's a good good day to be a[A]live`,
    notes: "Celebratory anthem. High energy, great for opening sets.",
    bpm: 138,
    tags: ["worship","celebration","joy","life"],
  },
  {
    title: "Greater",
    artist: "Chris Tomlin",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Bring your tired [D]and bring your shame
[Em]Bring your guilt [C]and bring your pain
[G]Don't you know that's [D]not your name
[Em]You will always [C]be much more to me

{Chorus}
[G]Greater is the [D]One living inside of me
[Em]Greater is the [C]love, greater is His name
[G]Greater, [D]greater [C]`,
    notes: "1 John 4:4. Driving pop worship anthem.",
    bpm: 130,
    tags: ["worship","identity","victory"],
  },
  {
    title: "All Bow Down",
    artist: "Chris Tomlin",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]All bow down, [A]all bow down
[Bm]Before the King of [G]kings
[D]All bow down, [A]all bow down
[Bm]Let heaven and [G]earth proclaim

{Chorus}
[D]You are [A]worthy
[Bm]You are [G]worthy of it all
[D]Every knee will [A]bow, every tongue con[G]fess`,
    notes: "Philippians 2:10-11 theme. Majestic and reverent.",
    bpm: 74,
    tags: ["worship","reverence","lordship"],
  },
  {
    title: "God Almighty",
    artist: "Chris Tomlin",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]There is no one like [E]our God
[F#m]Mighty in strength and [D]power
[A]There is no one like [E]our God
[F#m]Faithful for[D]ever

{Chorus}
[A]God Almighty, [E]You are holy
[F#m]God Almighty, [D]You alone
[A]There's no one like [E]You, no one like [D]You`,
    notes: "Big anthem. Full band arrangement on the chorus.",
    bpm: 76,
    tags: ["worship","power","holiness"],
  },
  {
    title: "Emmanuel (Hallowed Manger Ground)",
    artist: "Chris Tomlin",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]What hope we hold this [D]starlit night
[Em]A King is born in [C]Bethlehem
[G]Our journey long, we [D]seek the light
[Em]That leads to the [C]hallowed manger ground

{Chorus}
[G]Emmanuel, [D]Emmanuel
[Em]God with us, [C]God with us
[G]We bow our hearts, we [D]bend our knees
[Em]O Spirit [C]come`,
    notes: "Advent/Christmas. Intimate and reverent, acoustic-friendly.",
    bpm: 68,
    tags: ["worship","Christmas","incarnation","advent"],
  },
  {
    title: "Jesus Loves Me (Tomlin)",
    artist: "Chris Tomlin",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]Jesus loves me, [B]this I know
[C#m]For the Bible [A]tells me so
[E]Little ones to [B]Him belong
[C#m]They are weak but [A]He is strong

{Chorus}
[E]Yes, Jesus loves me, [B]yes, Jesus loves me
[C#m]Yes, Jesus loves me, the [A]Bible tells me so
[E]I was lost but [B]He came and found me
[C#m]He wrapped His arms a[A]round me`,
    notes: "Classic hymn with Tomlin bridge. Full band singalong.",
    bpm: 76,
    tags: ["worship","hymn","love","classic"],
  },
  {
    title: "How Sweet the Sound",
    artist: "Chris Tomlin",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]Oh how sweet the [A]sound of mercy
[Bm]Calling out to [G]me
[D]Oh how sweet the [A]grace of Jesus
[Bm]Covering every[G]thing

{Chorus}
[D]How sweet the [A]sound
[Bm]That saved a [G]wretch like me
[D]I once was [A]lost but now I'm [G]found`,
    notes: "Grace-centered anthem with hymn echoes. Tender and powerful.",
    bpm: 70,
    tags: ["worship","grace","mercy"],
  },
  {
    title: "Boundless",
    artist: "Chris Tomlin",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]Your love goes [F]further than I can see
[Gm]Higher than the [Eb]heavens can reach
[Bb]Deeper than the [F]deepest sea
[Gm]Your love is [Eb]boundless

{Chorus}
[Bb]Boundless, [F]boundless
[Gm]Your love is bound[Eb]less
[Bb]From here to for[F]ever
[Gm]Your love is bound[Eb]less`,
    notes: "From Holy Roar album. Spacious and expansive sound.",
    bpm: 72,
    tags: ["worship","love","infinity"],
  },
  {
    title: "Always",
    artist: "Chris Tomlin",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]My foes are many, [D]they rise against me
[Em]But I will hold my [C]ground
[G]I will not fear the [D]war, I will not fear the [Em]storm
[C]My help is on the way

{Chorus}
[G]God You are always, [D]always, always [Em]there
[C]You go before me, You're [G]behind me
[D]You're all a[Em]round me, [C]always`,
    notes: "Assurance anthem. Great for building confidence in worship.",
    bpm: 76,
    tags: ["worship","assurance","protection"],
  },
  {
    title: "O Come All Ye Faithful (Tomlin)",
    artist: "Chris Tomlin",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]O come all ye [D]faithful
[Em]Joyful and tri[C]umphant
[G]O come ye, o [D]come ye to [G]Bethlehem
[G]Come and be[D]hold Him
[Em]Born the King of [C]angels

{Chorus}
[G]O come let us a[D]dore Him
[Em]O come let us a[C]dore Him
[G]O come let us a[D]dore Him
[C]Christ [D]the [G]Lord`,
    notes: "Classic Christmas hymn in Tomlin style. Congregational singalong.",
    bpm: 118,
    tags: ["worship","Christmas","hymn","classic"],
  },
  {
    title: "Joy to the World (Unspeakable Joy)",
    artist: "Chris Tomlin",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]Joy to the world the [A]Lord is come
[Bm]Let earth re[G]ceive her King
[D]Let every heart [A]prepare Him room
[Bm]And heaven and nature [G]sing

{Chorus}
[D]Joy unspeakable [A]joy
[Bm]An overflowing [G]well
[D]No tongue can tell, [A]joy unspeakable [G]joy
[D]It rises in my [A]soul, never lets me [G]go`,
    notes: "Christmas classic reimagined with the Unspeakable Joy chorus.",
    bpm: 124,
    tags: ["worship","Christmas","joy","hymn"],
  },
  {
    title: "Noel (Tomlin)",
    artist: "Chris Tomlin",
    originalKey: "Db",
    format: "chordpro",
    content: `{Verse 1}
[D]Love incarnate, [A]love divine
[Bm]Star and angels [G]gave the sign
[D]Bow to babe on [A]bended knee
[Bm]The Savior of hu[G]manity

{Chorus}
[D]Noel, [A]noel
[Bm]Come and see what [G]God has done
[D]Noel, [A]noel
[Bm]The story of a[G]mazing love
[D]The light of the [A]world given for [G]us
[D]No[A]el`,
    notes: "Lauren Daigle duet. Tender, modern Christmas anthem.",
    bpm: 66,
    tags: ["worship","Christmas","incarnation"],
  },
  {
    title: "Famous One",
    artist: "Chris Tomlin",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[A]You are the [E]Lord, the famous [F#m]One, famous [D]One
[A]Great is Your [E]name in all the [F#m]earth [D]
[A]The heavens de[E]clare You're glori[F#m]ous, glori[D]ous
[A]Great is Your [E]fame beyond the [D]earth

{Chorus}
[A]And for all You've [E]done and yet to do
[F#m]With every [D]breath I'm praising You
[A]Desire of [E]nations and every [D]heart
[A]You alone are [E]God, You alone are [D]God`,
    notes: "Jesse Reeves co-write. Early Tomlin classic, singable anthem.",
    bpm: 124,
    tags: ["worship","praise","fame","classic"],
  },
  {
    title: "Enough",
    artist: "Chris Tomlin",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]All of You is [G]more than enough for
[Am]All of me, for [F]every thirst and every need
[C]You satisfy me [G]with Your love
[Am]And all I have in [F]You is more than enough

{Chorus}
[C]You are my [G]supply, my breath of [Am]life
[F]Still more awesome [C]than I know
[C]You are my [G]reward, worth living [Am]for
[F]Still more awesome [C]than I know`,
    notes: "Louie Giglio co-write. Simple sufficiency anthem.",
    bpm: 76,
    tags: ["worship","sufficiency","devotion","classic"],
  },
  {
    title: "Unchanging",
    artist: "Chris Tomlin",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]Great is Your [E]faithfulness
[F#m]Great is Your [D]faithfulness
[A]You never [E]change, You never [F#m]fail, O [D]God

{Verse 2}
[A]True are Your [E]promises
[F#m]True are Your [D]promises
[A]You never [E]change, You never [F#m]fail, O [D]God

{Chorus}
[A]So we raise up [E]holy hands
[F#m]To praise the Holy [D]One
[A]Who was and is and [E]is to [D]come`,
    notes: "Early career anthem. Lamentations 3:23 theme.",
    bpm: 78,
    tags: ["worship","faithfulness","classic"],
  },
  {
    title: "God's Great Dance Floor",
    artist: "Chris Tomlin",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]I feel alive, I come a[B]live
[C#m]I am alive on [A]God's great dance floor
[E]I feel alive, I come a[B]live
[C#m]I am alive on [A]God's great dance floor

{Chorus}
[E]I found my place, [B]I found my way
[C#m]I found amazing [A]grace
[E]You picked me up, [B]You turned me around
[C#m]And placed my feet on [A]higher ground`,
    notes: "Martin Smith co-write. High energy, celebratory anthem.",
    bpm: 132,
    tags: ["worship","celebration","joy","dance"],
  },
  {
    title: "He Shall Reign Forevermore",
    artist: "Chris Tomlin",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]In the bleak mid[D]winter, all crea[Em]tion groans
[C]For a world in [G]darkness, frozen [D]like a stone
[G]Light is breaking [D]in a stable [Em]for a throne

{Chorus}
[G]He shall reign for[D]evermore, for[Em]evermore
[C]And He shall reign for[G]evermore, for[D]evermore
[Em]He shall reign for[C]evermore`,
    notes: "Christmas anthem. Builds from quiet verse to triumphant chorus.",
    bpm: 76,
    tags: ["worship","Christmas","reign","advent"],
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
