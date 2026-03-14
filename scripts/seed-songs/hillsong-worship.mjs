#!/usr/bin/env node
/**
 * Seed Hillsong Worship worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/hillsong-worship.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "What a Beautiful Name",
    artist: "Hillsong Worship",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]You were the Word at the [A]beginning
[Bm]One with God the Lord Most [G]High
[D]Your hidden glory in [A]creation
[Bm]Now revealed in You our [G]Christ

{Chorus}
[D]What a beautiful [A]Name it is
[Bm]What a beautiful [G]Name it is
[D]The Name of [A]Jesus Christ my [Bm]King
[G]What a beautiful [D]Name it is
[A]Nothing com[Bm]pares to this
[G]What a beautiful [D]Name it is
The Name of [A]Jesus

{Verse 2}
[D]You didn't want heaven with[A]out us
[Bm]So Jesus, You brought heaven [G]down
[D]My sin was great, Your love was [A]greater
[Bm]What could separate us [G]now`,
    notes: "Signature Hillsong song. Let it breathe. Big dynamics on the bridge.",
    bpm: 68,
    tags: ["worship","Jesus","name"],
  },
  {
    title: "Who You Say I Am",
    artist: "Hillsong Worship",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Who am I that the [D]highest King
[Em]Would welcome [C]me
[G]I was lost but He [D]brought me in
[Em]Oh His love for [C]me
[Em]Oh His [D]love for [C]me

{Chorus 1}
[G]Who the Son sets free
[D]Oh is free indeed
[Em]I'm a child of [C]God, yes I am

{Chorus 2}
[G]In my Father's house
[D]There's a place for me
[Em]I'm a child of [C]God, yes I am

{Verse 2}
[G]Free at last, He has [D]ransomed me
[Em]His grace runs [C]deep
[G]While I was a slave to [D]sin
[Em]Jesus died for [C]me
[Em]Yes He [D]died for [C]me

{Bridge}
[Em]I am [D]chosen, not for[C]saken
[Em]I am [D]who You say I [C]am
[Em]You are [D]for me, not a[C]gainst me
[Em]I am [D]who You say I [C]am`,
    notes: "Strong identity anthem. Great for youth and congregational worship.",
    bpm: 136,
    tags: ["worship","identity","freedom"],
  },
  {
    title: "Cornerstone",
    artist: "Hillsong Worship",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]My hope is built on nothing less
Than [Am]Jesus' blood and [F]righteousness
[C]I dare not trust the sweetest frame
But [Am]wholly trust in [G]Jesus' name

{Chorus}
[F]Christ alone, [Am]Cornerstone
[G]Weak made strong, in the [F]Savior's love
Through the [Am]storm, He is [G]Lord
Lord of [C]all

{Verse 2}
[C]When darkness seems to hide His face
I [Am]rest on His un[F]changing grace
[C]In every high and stormy gale
My [Am]anchor holds with[G]in the veil

{Verse 3}
[C]When He shall come with trumpet sound
Oh [Am]may I then in [F]Him be found
[C]Dressed in His righteousness alone
[Am]Faultless, stand be[G]fore the throne`,
    notes: "Classic hymn adaptation. Simple and powerful.",
    bpm: 73,
    tags: ["hymn","worship","foundation"],
  },
  {
    title: "Hosanna",
    artist: "Hillsong Worship",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]I see the King of Glory
[C]Coming on the clouds with fire
[Em]The whole earth shakes, [C]the whole earth shakes
[G]I see His love and mercy
[C]Washing over all our sin
[Em]The people sing, [C]the people sing

{Chorus}
[G]Hosanna, [D]hosanna
[Em]Hosanna in the [C]highest
[G]Hosanna, [D]hosanna
[Em]Hosanna in the [C]highest

{Verse 2}
[G]I see a generation
[C]Rising up to take their place
[Em]With selfless faith, [C]selfless faith
[G]I see a near revival
[C]Stirring as we pray and seek
[Em]We're on our knees, [C]we're on our knees

{Bridge}
[Em]Heal my heart and [C]make it clean
[G]Open up my [D]eyes to the things unseen
[Em]Show me how to [C]love like You have loved me
[G]Break my heart for [D]what breaks Yours`,
    notes: "Classic Hillsong anthem. Big, bold, and declarative.",
    bpm: 132,
    tags: ["praise","anthem","declaration"],
  },
  {
    title: "Mighty to Save",
    artist: "Hillsong Worship",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]Everyone needs compas[E]sion
[F#m]A love that's never [D]failing
[A]Let mercy [E]fall on [D]me
[A]Everyone needs for[E]giveness
[F#m]The kindness of a [D]Savior
[A]The hope of [E]na[D]tions

{Chorus}
[A]Savior, He can move the [E]mountains
[F#m]My God is mighty to [D]save
[A]He is mighty to [E]save
[A]Forever, Author of [E]salvation
[F#m]He rose and conquered the [D]grave
[A]Jesus conquered the [E]grave

{Verse 2}
[A]So take me as You [E]find me
[F#m]All my fears and [D]failures
[A]Fill my life [E]a[D]gain
[A]I give my life to [E]follow
[F#m]Everything I be[D]lieve in
[A]Now I sur[E]ren[D]der`,
    notes: "One of the most popular worship songs worldwide. Easy to lead.",
    bpm: 69,
    tags: ["worship","salvation","congregational"],
  },
  {
    title: "Shout to the Lord",
    artist: "Hillsong Worship",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]My Jesus, my [Dm]Savior
[Eb]Lord there is none [Bb]like You
[Gm]All of my days [Dm]I want to praise
[Eb]The wonders of Your [F]mighty love

{Verse 2}
[Bb]My comfort, my [Dm]shelter
[Eb]Tower of refuge and [Bb]strength
[Gm]Let every breath, [Dm]all that I am
[Eb]Never cease to [F]worship You

{Chorus}
[Bb]Shout to the Lord, [Dm]all the earth, let us sing
[Eb]Power and majesty, [Bb]praise to the King
[Gm]Mountains bow down [Dm]and the seas will roar
[Eb]At the sound of Your [F]name
[Bb]I sing for joy at the [Dm]work of Your hands
[Eb]Forever I'll love You, [Bb]forever I'll stand
[Gm]Nothing compares to the [Dm]promise I have
[Eb]In [F]You`,
    notes: "Timeless classic by Darlene Zschech. Great opener or closer.",
    bpm: 76,
    tags: ["worship","classic","praise"],
  },
  {
    title: "King of Kings",
    artist: "Hillsong Worship",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]In the darkness we were [A]waiting
[Bm]Without hope, without [G]light
[D]Till from heaven You [A]came running
[Bm]There was mercy in Your [G]eyes

{Verse 2}
[D]To fulfil the law and [A]prophets
[Bm]To a virgin came the [G]Word
[D]From a throne of endless [A]glory
[Bm]To a cradle in the [G]dirt

{Chorus}
[D]Praise the Father, [A]praise the Son
[Bm]Praise the Spirit, [G]three in one
[D]God of glory, [A]majesty
[Bm]Praise forever to the [G]King of Kings

{Verse 3}
[D]To reveal the kingdom [A]coming
[Bm]And to reconcile the [G]lost
[D]To redeem the whole [A]creation
[Bm]You did not despise the [G]cross`,
    notes: "Majestic hymn. Builds with each verse. Great for communion.",
    bpm: 66,
    tags: ["worship","hymn","Jesus"],
  },
  {
    title: "Broken Vessels (Amazing Grace)",
    artist: "Hillsong Worship",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]All these pieces, [D]broken and scattered
[Em]In mercy [C]gathered, mended and whole
[G]Empty-handed [D]but not forsaken
[Em]I've been set [C]free, I've been set free

{Chorus}
[G]Amazing grace, how [D]sweet the sound
[Em]That saved a [C]wretch like me
[G]Oh I once was [D]lost but now I'm found
[Em]Was blind but [C]now I see

{Bridge}
[G]Oh I can see You [D]now, oh I can see the [Em]love in Your eyes
[C]Laying Yourself down, [G]raising up the broken to [D]life`,
    notes: "Modern hymn arrangement with a powerful bridge.",
    bpm: 74,
    tags: ["worship","grace","restoration"],
  },
  {
    title: "O Praise the Name (Anastasis)",
    artist: "Hillsong Worship",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]I cast my mind to [A]Calvary
[Bm]Where Jesus bled and [G]died for me
[D]I see His wounds, His [A]hands, His feet
[Bm]My Savior on that [G]cursed tree

{Verse 2}
[D]His body bound and [A]drenched in tears
[Bm]They laid Him down in [G]Joseph's tomb
[D]The entrance sealed by [A]heavy stone
[Bm]Messiah still and [G]all alone

{Chorus}
[D]O praise the Name of the [A]Lord our God
[Bm]O praise His Name for[G]evermore
[D]For endless days we will [A]sing Your praise
[Bm]Oh Lord, oh Lord our [G]God`,
    notes: "Hymn-like. Simple melody, builds with each verse. Great for communion.",
    bpm: 73,
    tags: ["hymn","worship","resurrection"],
  },
  {
    title: "Open Heaven/River Wild",
    artist: "Hillsong Worship",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]Your love is like a [B]river wild
[C#m]Breaking through at [A]every wall
[E]Your love is like the [B]wind in my sails
[C#m]Carry me [A]through

{Chorus}
[E]Open heaven over [B]me
[C#m]Your love raining [A]down
[E]Open heaven over [B]me
[C#m]Let Your glory [A]come down`,
    notes: "Big Hillsong anthem feel, full band from chorus",
    bpm: 138,
    tags: ["worship","revival","Holy Spirit"],
  },
  {
    title: "Let There Be Light",
    artist: "Hillsong Worship",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]In the beginning [E]You spoke
[F#m]And chaos turned to [D]order
[A]In the darkness [E]Your word
[F#m]Brought life and [D]hope forever

{Chorus}
[A]Let there be light, [E]let there be light
[F#m]In every [D]corner of my soul
[A]Let there be light, [E]let there be light
[F#m]Your glory [D]shining through`,
    notes: "Majestic opening, build dynamically through each section",
    bpm: 72,
    tags: ["worship","light","creation"],
  },
  {
    title: "I Surrender",
    artist: "Hillsong Worship",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]I surrender [A]all to You
[Bm]All I am and [G]all I do
[D]Every dream I [A]lay it down
[Bm]At the cross where [G]mercy found me

{Chorus}
[D]I surrender, [A]I surrender
[Bm]I want to know [G]You more
[D]I surrender, [A]I surrender
[Bm]I open every [G]door`,
    notes: "Tender and intimate, acoustic guitar-led with gentle build",
    bpm: 68,
    tags: ["worship","surrender","devotion"],
  },
  {
    title: "New Wine",
    artist: "Hillsong Worship",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]In the crushing, [F]in the pressing
[Gm]You are making [Eb]new wine
[Bb]In the soil I [F]now surrender
[Gm]You are breaking [Eb]new ground

{Chorus}
[Bb]So I yield to [F]You and to Your
[Gm]Careful hand, [Eb]make me new
[Bb]Make me Your [F]vessel
[Gm]Make me new [Eb]wine`,
    notes: "Prayerful and reflective, crescendo on the bridge",
    bpm: 64,
    tags: ["worship","surrender","transformation"],
  },
  {
    title: "Awake My Soul",
    artist: "Hillsong Worship",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]God of mercy [D]sweet the sound
[Em]Of my Savior's [C]name
[G]In my darkest [D]hour You found me
[Em]Lifted me [C]again

{Chorus}
[G]Awake my soul, [D]awake my soul
[Em]And sing, [C]sing
[G]His love is all [D]I need
[Em]Awake my [C]soul and sing`,
    notes: "Uplifting and energetic, great congregational opener",
    bpm: 140,
    tags: ["worship","praise","joy"],
  },
  {
    title: "This I Believe (The Creed)",
    artist: "Hillsong Worship",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Our Father ever[D]lasting
[Em]The all creating [C]One
[G]God Almighty [D]through Your
[Em]Holy Spirit con[C]ceiving

{Chorus}
[G]This I believe, [D]in God the Father
[Em]I believe in [C]Christ the Son
[G]I believe in the [D]Holy Spirit
[Em]Our God is [C]three in one`,
    notes: "Declaration of faith, strong and steady, based on the Apostles Creed",
    bpm: 74,
    tags: ["worship","creed","declaration"],
  },
  {
    title: "Thank You Jesus For the Blood",
    artist: "Hillsong Worship",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]I was a wretch, [G]I remember who I was
[Am]I was lost, I was [F]blind, I was running out of time
[C]Sin separated, [G]the breach was far too wide
[Am]But from the far side [F]of the chasm You held me in Your sight

{Chorus}
[C]Thank You Jesus [G]for the blood applied
[Am]Thank You Jesus, [F]it has washed me white
[C]Thank You Jesus, [G]You have saved my life
[Am]Brought me from the [F]darkness into glorious light`,
    notes: "Testimony song, reflective verses build to exuberant chorus",
    bpm: 78,
    tags: ["worship","blood","salvation","testimony"],
  },
  {
    title: "From the Inside Out",
    artist: "Hillsong Worship",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]A thousand times I've [A]failed
[Bm]Still Your mercy re[G]mains
[D]And should I stumble a[A]gain
[Bm]I'm caught in Your [G]grace

{Chorus}
[D]Everlasting, [A]Your light will shine when
[Bm]All else [G]fades
[D]Never ending, [A]Your glory goes be[Bm]yond all [G]fame`,
    notes: "Classic Hillsong anthem, builds from quiet acoustic to full band",
    bpm: 73,
    tags: ["worship","grace","devotion"],
  },
  {
    title: "The Power of the Cross",
    artist: "Hillsong Worship",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]Oh to see the [G]dawn of the [D]darkest [A]day
[D]Christ on the [G]road to [A]Calva[D]ry
[D]Tried by sinful [G]men, [D]torn and [A]beaten then
[D]Nailed to a [G]cross of [A]wood[D]

{Chorus}
[D]This the power [G]of the [D]cross
[Bm]Christ became sin [G]for [A]us
[D]Took the blame, [G]bore the [D]wrath
[Bm]We stand for[G]given [A]at the [D]cross`,
    notes: "Hymn-like, reverent, Keith Getty co-write. Good for communion.",
    bpm: 66,
    tags: ["worship","cross","communion","hymn"],
  },
  {
    title: "Forever Reign",
    artist: "Hillsong Worship",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]You are good, [D]You are good
[Em]When there's nothing [C]good in me
[G]You are love, [D]You are love
[Em]On display for [C]all to see

{Chorus}
[G]Oh I'm running to Your [D]arms
[Em]I'm running to Your [C]arms
[G]The riches of Your [D]love
[Em]Will always be e[C]nough
[G]Nothing compares to Your em[D]brace
[Em]Light of the [C]world forever reign`,
    notes: "Joyful and triumphant, great energy for opening worship",
    bpm: 144,
    tags: ["worship","praise","joy","declaration"],
  },
  {
    title: "Tell the World",
    artist: "Hillsong Worship",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]When the sun is [B]shining down on me
[C#m]And the world's all [A]as it should be
[E]Bless Your name [B]I'll sing
[C#m]Oh when the dark[A]ness closes in

{Chorus}
[E]Tell the world that [B]Jesus lives
[C#m]Tell the world that [A]He died for us
[E]Tell the world that [B]He lives again
[C#m]Oh tell the [A]world`,
    notes: "Energetic missions anthem, driving beat, great for closing",
    bpm: 138,
    tags: ["worship","missions","evangelism"],
  },
  {
    title: "Beneath the Waters",
    artist: "Hillsong Worship",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]Beneath the waters [E]I will go
[F#m]Where Your love has [D]called me
[A]Buried in this [E]living flood
[F#m]Raised to life with [D]You my God

{Chorus}
[A]All to You, I'm [E]leaving behind
[F#m]Stepping into [D]faith
[A]Beneath the [E]waters
[F#m]Dead to this [D]world, alive in Christ`,
    notes: "Baptism anthem, reverent verse building to declarative chorus",
    bpm: 72,
    tags: ["worship","baptism","new life"],
  },
  {
    title: "Transfiguration",
    artist: "Hillsong Worship",
    originalKey: "B",
    format: "chordpro",
    content: `{Verse 1}
[B]You outshine the [E]sun
[G#m]You outlast the [F#]stars
[B]Brighter than the [E]brightest morning
[G#m]Glorious, You [F#]are

{Chorus}
[B]Transfiguration, [E]full revelation
[G#m]We can see You [F#]face to face
[B]You are the wonder, [E]pulling us under
[G#m]Waves of Your [F#]glory and grace`,
    notes: "Ethereal atmosphere, builds to a powerful climax. Keys-driven.",
    bpm: 72,
    tags: ["worship","glory","revelation"],
  },
  {
    title: "You Said",
    artist: "Hillsong Worship",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]You said, ask and you'll re[D]ceive
[Em]Anything in [C]My name
[G]You said, seek and you'll [D]find
[Em]Knock and the door [C]will open wide

{Chorus}
[G]So I come before You [D]now
[Em]With a humble [C]heart
[G]I reach my hands to [D]heaven
[Em]You said I could [C]come`,
    notes: "Simple prayer-based song, good for intimate worship moments.",
    bpm: 70,
    tags: ["worship","prayer","promises"],
  },
  {
    title: "Anchor",
    artist: "Hillsong Worship",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]I have this [Am]hope
[F]As an anchor for my [G]soul
[C]Through every [Am]storm
[F]I will hold to [G]You

{Pre-Chorus}
[Am]With every breath [F]I'll praise You
[C]In every cir[G]cumstance
[Am]I'll lift my eyes and [F]see beyond
[C]My anchor [G]holds

{Chorus}
[C]I will not be [Am]shaken
[F]My anchor holds for[G]ever
[C]Built on a firm foun[Am]dation
[F]You will not be [G]moved`,
    notes: "Steady and confident, builds with layered vocals on chorus.",
    bpm: 74,
    tags: ["worship","hope","anchor","trust"],
  },
  {
    title: "What a Beautiful Name (Death Was Arrested Bridge)",
    artist: "Hillsong Worship",
    originalKey: "D",
    format: "chordpro",
    content: `{Bridge}
[D]Death could not hold You, the [A]veil tore before You
[Bm]You silence the boast [G]of sin and grave
[D]The heavens are roaring the [A]praise of Your glory
[Bm]For You are raised to [G]life again

{Verse 2}
[D]You have no rival, You [A]have no equal
[Bm]Now and forever God [G]You reign
[D]Yours is the kingdom, [A]Yours is the glory
[Bm]Yours is the Name a[G]bove all names

{Chorus}
[D]What a powerful [A]Name it is
[Bm]What a powerful [G]Name it is
[D]The Name of [A]Jesus Christ my [Bm]King
[G]What a powerful [D]Name it is
[A]Nothing can stand a[Bm]gainst
[G]What a powerful [D]Name it is
The Name of [A]Jesus`,
    notes: "Extended bridge arrangement of What a Beautiful Name. High energy declaration.",
    bpm: 68,
    tags: ["worship","Jesus","name","victory"],
  },
  {
    title: "Seasons",
    artist: "Hillsong Worship",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]Though the seasons [F]change
[Gm]Your love re[Eb]mains
[Bb]Though I walk through [F]the valley
[Gm]You are with [Eb]me still

{Verse 2}
[Bb]Like the winter turns to [F]spring
[Gm]Like the dawn replaces [Eb]night
[Bb]Even when I cannot [F]see
[Gm]I will trust Your [Eb]faithfulness

{Chorus}
[Bb]For everything there [F]is a season
[Gm]A time for joy, a [Eb]time for tears
[Bb]In every season [F]I will praise You
[Gm]Your love endures through [Eb]all my years`,
    notes: "Reflective and tender, piano-driven. Good for seasons of transition.",
    bpm: 66,
    tags: ["worship","seasons","trust","faithfulness"],
  },
  {
    title: "Here I Am to Worship",
    artist: "Hillsong Worship",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]Light of the world
[A]You stepped down into darkness
[Em]Opened my eyes [G]let me see
[D]Beauty that made
[A]This heart adore You
[Em]Hope of a life [G]spent with You

{Chorus}
[D]Here I am to [A]worship
[D]Here I am to [G]bow down
[D]Here I am to [A]say that You're my [G]God
[D]You're altogether [A]lovely
[D]Altogether [G]worthy
[D]Altogether [A]wonderful to [G]me`,
    notes: "Tim Hughes classic covered by Hillsong. Simple and congregational.",
    bpm: 76,
    tags: ["worship","adoration","classic"],
  },
  {
    title: "More Than Anything",
    artist: "Hillsong Worship",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]More than the air I [D]breathe
[Em]More than the song I [C]sing
[G]More than the next heart[D]beat
[Em]More than any[C]thing

{Chorus}
[G]And Lord I want to [D]be more like You
[Em]Take this heart and [C]make it new
[G]More than [D]anything
[Em]I desire [C]You

{Bridge}
[Em]There is nothing [D]on this earth
[C]I desire beside [G]You
[Em]You are my strength, [D]my shield
[C]My portion, for[G]ever`,
    notes: "Devotional and heartfelt, gentle build, acoustic guitar focus.",
    bpm: 70,
    tags: ["worship","devotion","desire"],
  },
  {
    title: "Highlands (Song of Ascent)",
    artist: "Hillsong Worship",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]O how far from [G]home have my footsteps [Am]taken me
[F]Running from the [C]arms that are [G]wide enough
[C]How far from [G]home has my restless [Am]heart taken me
[F]Far from where my [C]home and rest [G]is found

{Chorus}
[C]I will go [G]to the highlands
[Am]Where the mountains [F]cry
[C]The water and the [G]wind
[Am]As they pass me [F]by still I will sing
[C]Oh come what [G]may
[Am]In the [F]highlands

{Verse 2}
[C]Whatever I walk [G]through wherever [Am]I am
[F]Your love has a [C]reach that I [G]cannot outrun
[C]So in the shadow of [G]the valley I will [Am]not fear
[F]I belong to [C]the highlands [G]now`,
    notes: "Long-form worship journey. Spacious arrangement, builds gradually.",
    bpm: 62,
    tags: ["worship","journey","trust","psalm"],
  },
  {
    title: "Upper Room",
    artist: "Hillsong Worship",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]In the upper [E]room with You
[F#m]Poured out like [D]wine
[A]I just want to [E]be with You
[F#m]Here in this [D]moment

{Chorus}
[A]Send Your fire, [E]send Your rain
[F#m]Fill this place with [D]heaven's sound
[A]Upper room, [E]upper room
[F#m]Let Your Spirit [D]come down

{Bridge}
[A]Set this heart a[E]blaze again
[F#m]Like the day of [D]Pentecost
[A]Tongues of fire and [E]rushing wind
[F#m]Fill us with Your [D]holy love`,
    notes: "Pentecost theme, prayer-focused, builds with intensity.",
    bpm: 68,
    tags: ["worship","Holy Spirit","prayer","fire"],
  },
  {
    title: "Lead Me to the Cross",
    artist: "Hillsong Worship",
    originalKey: "F",
    format: "chordpro",
    content: `{Verse 1}
[F]Savior I come, [C]quiet my soul
[Dm]Remem[Bb]ber redemption's hill
[F]Where Your blood was [C]spilled
[Dm]For my [Bb]ransom

{Chorus}
[F]Lead me to the [C]cross
[Dm]Where Your love poured [Bb]out
[F]Bring me to my [C]knees
[Dm]Lord I lay me [Bb]down
[F]Rid me of my[C]self, I belong to [Dm]You
[Bb]Lead me, lead me to the [F]cross

{Verse 2}
[F]You were as I, [C]tempted and tried
[Dm]Hu[Bb]man
[F]The word became [C]flesh
[Dm]Bore my sin and [Bb]death
Now You're ri[F]sen`,
    notes: "Brooke Fraser classic. Quiet devotion, beautiful for communion.",
    bpm: 72,
    tags: ["worship","cross","surrender","communion"],
  },
  {
    title: "None Other",
    artist: "Hillsong Worship",
    originalKey: "Eb",
    format: "chordpro",
    content: `{Verse 1}
[Eb]There is none other [Bb]God but You
[Cm]None who can do what [Ab]You can do
[Eb]From the rising sun [Bb]to the setting same
[Cm]There is none [Ab]like You

{Chorus}
[Eb]None other, [Bb]none other
[Cm]Worthy of all my [Ab]praise
[Eb]None other, [Bb]none other
[Cm]Glorious in all Your [Ab]ways

{Bridge}
[Eb]Mountains bow at Your [Bb]name
[Cm]Oceans roar Your [Ab]fame
[Eb]Every knee will bow [Bb]every tongue confess
[Cm]Jesus, You are [Ab]Lord`,
    notes: "Declarative anthem, full band from chorus. Strong opener.",
    bpm: 76,
    tags: ["worship","declaration","sovereignty"],
  },
  {
    title: "Glorious Ruins",
    artist: "Hillsong Worship",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]Oh Your cross, it [E]changes everything
[F#m]There You showed me [D]I am loved
[A]In the midst of [E]pain and suffering
[F#m]I believe there [D]is still hope

{Chorus}
[A]We have seen [E]glorious ruins
[F#m]Where You tore the [D]veil in two
[A]We have seen [E]glorious ruins
[F#m]Breathing life where [D]life was through

{Bridge}
[A]All these broken [E]pieces fit together
[F#m]To tell a story [D]I could never write myself
[A]Beauty from [E]ashes
[F#m]Glory from this [D]pain`,
    notes: "Redemptive theme, builds from reflective verse to anthemic chorus.",
    bpm: 130,
    tags: ["worship","restoration","cross","hope"],
  },
  {
    title: "Still",
    artist: "Hillsong Worship",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]Hide me now [Am]under Your wings
[F]Cover me [G]within Your mighty hand
[C]When the oceans [Am]rise and thunders storm
[F]I will soar with [G]You above the storm

{Chorus}
[C]Father You are [Am]King over the flood
[F]I will be still and [G]know You are God

{Verse 2}
[C]Find rest my soul [Am]in Christ alone
[F]Know His power [G]in quietness and trust
[C]When the oceans [Am]rise and thunders storm
[F]I will soar with [G]You above the storm`,
    notes: "Reuben Morgan classic. Peaceful and meditative. Great for prayer.",
    bpm: 63,
    tags: ["worship","peace","trust","psalm"],
  },
  {
    title: "Running to You",
    artist: "Hillsong Worship",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]In the morning [D]light I see You
[Em]In the shadow [C]You are there
[G]Every moment [D]every heartbeat
[Em]You are closer [C]than the air

{Chorus}
[G]I'm running to You, [D]running to You
[Em]No place I'd rather [C]be
[G]I'm running to You, [D]running to You
[Em]Your arms are all [C]I need

{Bridge}
[Em]When the world grows [D]cold and dark
[C]Your love is my [G]compass
[Em]Through the valleys [D]through the night
[C]I will run to [G]You`,
    notes: "Energetic pursuit anthem, driving beat, good for opening worship.",
    bpm: 138,
    tags: ["worship","pursuit","devotion","joy"],
  },
  {
    title: "Christ Is Enough",
    artist: "Hillsong Worship",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]Christ is my [E]reward and all of my [F#m]devotion
[D]Now there's nothing in this [A]world that could ever [E]satisfy
[F#m]Through every [D]trial my soul will sing
[A]No turning [E]back I've been set [F#m]free[D]

{Chorus}
[A]Christ is e[E]nough for me
[F#m]Christ is e[D]nough for me
[A]Everything I [E]need is in [F#m]You
[D]Everything I [A]need

{Bridge}
[A]I have de[E]cided to follow [F#m]Jesus[D]
[A]No turning [E]back, no turning [F#m]back[D]`,
    notes: "Declaration of sufficiency in Christ. Rend Collective co-write feel.",
    bpm: 72,
    tags: ["worship","contentment","devotion","declaration"],
  },
  {
    title: "Man of Sorrows",
    artist: "Hillsong Worship",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]Man of Sorrows, [G]Lamb of God
[Bm]By His own be[A]trayed
[D]The sin of man and [G]wrath of God
[Bm]Has been on Jesus [A]laid

{Verse 2}
[D]Silent as He [G]stood accused
[Bm]Beaten, mocked and [A]scorned
[D]Bowing His head [G]to death on a cross
[Bm]As helpless ones looked [A]on

{Chorus}
[D]Oh that rugged [G]cross, my salvation
[Bm]Where Your love poured [A]out over me
[D]Now my soul cries [G]out hallelujah
[Bm]Praise and honor [A]unto Thee`,
    notes: "Good Friday hymn. Reverent, builds to triumphant final chorus.",
    bpm: 64,
    tags: ["worship","cross","atonement","hymn"],
  },
  {
    title: "With All I Am",
    artist: "Hillsong Worship",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Into Your [D]hand I commit again
[Em]With all I [C]am for You Lord
[G]You hold my [D]world in the palm of Your hand
[Em]And I am [C]Yours forever

{Chorus}
[G]Jesus I be[D]lieve in You
[Em]Jesus I be[C]long to You
[G]You're the reason that I [D]live
[Em]The reason that I [C]sing
[G]With all I [D]am

{Bridge}
[Em]I'll walk with [D]You wherever You [C]lead
[Em]Through it all [D]I'll cling to [C]You`,
    notes: "Heartfelt commitment song. Acoustic-driven, intimate worship.",
    bpm: 68,
    tags: ["worship","commitment","devotion"],
  },
  {
    title: "Light of the World",
    artist: "Hillsong Worship",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]The world waits for a [E]miracle
[F#m]The heart longs for a [D]little bit of hope
[A]O come, O come Em[E]manuel
[F#m]A child, a son, [D]given to us all

{Chorus}
[A]Light of the world, [E]You stepped down into darkness
[F#m]Opened my eyes [D]let me see
[A]Glory above, [E]revealed in a manger
[F#m]Here in Your [D]presence

{Bridge}
[A]Joy to the world, [E]the Lord has come
[F#m]Hope for the weary, [D]peace for the broken
[A]Light of the world, [E]shine on us
[F#m]You are the Light [D]of the world`,
    notes: "Advent/Christmas theme, warm and inviting, orchestral arrangement.",
    bpm: 72,
    tags: ["worship","advent","light","Christmas"],
  },
  {
    title: "Saviour King",
    artist: "Hillsong Worship",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]Let now the [A]weak say I have strength
[Bm]By the Spirit of [G]power that raised Christ from the dead
[D]Let now the [A]poor stand and confess
[Bm]That my portion is [G]Him and I'm more than blessed

{Verse 2}
[D]Let now our [A]hearts burn with a flame
[Bm]A fire consuming [G]all for Your Son's holy name
[D]And with the [A]heavens we declare
[Bm]You are our [G]King

{Chorus}
[D]We love You Lord, [A]we worship You
[Bm]You are our God, [G]You alone are good
[D]You asked Your Son to [A]carry this
[Bm]The heavy cross our [G]weight of sin
[D]Saviour [A]King`,
    notes: "Marty Sampson classic. Strong declaration, great for full worship set.",
    bpm: 76,
    tags: ["worship","declaration","kingship"],
  },
  {
    title: "Spirit Lead Me",
    artist: "Hillsong Worship",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]Breathe on me [G]breath of God
[Am]Fill me with [F]life anew
[C]That I may love the [G]things You love
[Am]And do what [F]You would do

{Chorus}
[C]Spirit lead me [G]where my trust is without borders
[Am]Let me walk upon the [F]waters
[C]Wherever You would [G]call me
[Am]Take me deeper than my [F]feet could ever wander

{Verse 2}
[C]Spirit lead me, [G]Spirit lead me
[Am]Spirit lead me to the [F]place where I belong
[C]Where Your power meets my [G]weakness
[Am]I find my [F]strength in You alone`,
    notes: "Prayer for Holy Spirit guidance, gentle build, atmospheric pads.",
    bpm: 66,
    tags: ["worship","Holy Spirit","guidance","prayer"],
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
