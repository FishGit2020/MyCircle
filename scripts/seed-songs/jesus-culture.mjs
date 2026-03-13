#!/usr/bin/env node
/**
 * Seed Jesus Culture worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/jesus-culture.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Your Love Never Fails",
    artist: "Jesus Culture",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Nothing can sepa[C]rate
[Em]Even if I ran [D]away
[G]Your love never [C]fails
[Em]I know I still [D]make mistakes but

{Chorus}
[G]You are my [C]hiding place
[Em]Your love never [D]fails
[G]Your love never [C]fails
[Em]Your love never [D]fails`,
    notes: "Anthemic, call-and-response friendly. Great for youth and conferences.",
    bpm: 136,
    tags: ["worship","love","faithfulness"],
  },
  {
    title: "Break Every Chain",
    artist: "Jesus Culture",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]There is power [F]in the name of Jesus
[Gm]There is power [Eb]in the name of Jesus
[Bb]There is power [F]in the name of Jesus
[Gm]To break every [Eb]chain, break every chain

{Chorus}
[Bb]Break every [F]chain
[Gm]Break every [Eb]chain
[Bb]Break every [F]chain
[Gm]Break every [Eb]chain`,
    notes: "Will Reagan. Powerful prayer and warfare song. Repeat chorus as led.",
    bpm: 80,
    tags: ["worship","spiritual warfare","freedom","prayer"],
  },
  {
    title: "Rooftops",
    artist: "Jesus Culture",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]Here I am be[B]fore You
[C#m]Falling at Your [A]feet
[E]All I want is [B]to be with You
[C#m]Lost in Your [A]glory

{Chorus}
[E]And I will shout it from the [B]rooftops
[C#m]Singing Your [A]name
[E]You're everything to me, [B]Jesus
[C#m]I'll shout Your [A]name`,
    notes: "Kim Walker-Smith classic. Passionate and emotive, powerful live song.",
    bpm: 130,
    tags: ["worship","praise","declaration"],
  },
  {
    title: "In the River",
    artist: "Jesus Culture",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]There's a river that [D]flows
[Em]From the mercy [C]seat of God
[G]And it brings life to the [D]nations
[Em]Healing to our [C]land

{Chorus}
[G]In the river, [D]in the river
[Em]Come alive, come a[C]live
[G]In the river, [D]in the river
[Em]We find [C]life`,
    notes: "Holy Spirit-focused, great for ministry time. Builds gradually.",
    bpm: 75,
    tags: ["worship","Holy Spirit","revival"],
  },
  {
    title: "Fierce",
    artist: "Jesus Culture",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Nothing could hold [D]back the rising
[Em]Nothing could hold [C]You down
[G]The grave couldn't keep [D]You from rising
[Em]You tore through the [C]veil

{Chorus}
[G]Your love is fierce, [D]Your love is wild
[Em]Your love is fierce, [C]Your love is wild
[G]It chases me down, [D]fights till I'm found
[Em]Leaves the ninety-[C]nine`,
    notes: "Driving and passionate, builds to explosive worship moments.",
    bpm: 132,
    tags: ["worship","love","pursuit"],
  },
  {
    title: "Show Me Your Glory",
    artist: "Jesus Culture",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]I see the cloud, [B]I step in
[C#m]I want to see Your [A]glory
[E]As Moses did, [B]and I am undone
[C#m]I want to know [A]Your presence

{Chorus}
[E]Show me Your glory, [B]show me Your face
[C#m]Show me Your glo[A]ry, Lord
[E]I can't live with[B]out You
[C#m]Show me Your [A]glory`,
    notes: "Kim Walker-Smith. Deep intercession, extended worship moment.",
    bpm: 70,
    tags: ["worship","glory","presence","prayer"],
  },
  {
    title: "Never Gonna Stop Singing",
    artist: "Jesus Culture",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]When You opened [E]up the heavens
[F#m]And stepped down from [D]the throne
[A]You laid aside [E]Your crown
[F#m]To make a way [D]back home

{Chorus}
[A]I'm never gonna [E]stop singing
[F#m]I'm never gonna [D]stop praising
[A]I'm never gonna [E]stop
[F#m]I love You, [D]Lord`,
    notes: "High energy, singable chorus, great for extended praise sets.",
    bpm: 144,
    tags: ["worship","praise","joy"],
  },
  {
    title: "Let It Echo",
    artist: "Jesus Culture",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]A fire burning [D]in our hearts tonight
[Em]A holy flame [C]that will not die
[G]A song within our [D]souls to sing
[Em]Let it echo [C]through everything

{Chorus}
[G]Let it echo, [D]let it echo
[Em]Oh let it echo [C]through the halls of heaven
[G]Let it echo, [D]let it echo
[Em]We won't be [C]silent`,
    notes: "Anthemic and driving, great for youth gatherings and conferences.",
    bpm: 138,
    tags: ["worship","declaration","fire"],
  },
  {
    title: "Miracles",
    artist: "Jesus Culture",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]God of the [E]impossible
[F#m]Healer of the [D]broken
[A]You are the [E]God of miracles
[F#m]Nothing is be[D]yond You

{Chorus}
[A]Miracles happen when [E]You are near
[F#m]Miracles happen when [D]You are here
[A]Nowhere else I'd [E]rather be
[F#m]Than here in [D]Your presence`,
    notes: "Chris Quilala. Powerful faith declaration, good for healing services.",
    bpm: 76,
    tags: ["worship","miracles","faith","healing"],
  },
  {
    title: "Freedom",
    artist: "Jesus Culture",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]Where the Spirit of the [B]Lord is
[C#m]There is free[A]dom
[E]Where the Spirit of the [B]Lord is
[C#m]There is free[A]dom

{Chorus}
[E]I am free, I am [B]free
[C#m]In the name of [A]Jesus I am free
[E]For the Spirit of the [B]Lord is [C#m]here [A]`,
    notes: "2 Corinthians 3:17. Build layers as the song progresses.",
    bpm: 80,
    tags: ["worship","freedom","spirit"],
  },
  {
    title: "Love Has a Name",
    artist: "Jesus Culture",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]Love has a [E]name
[F#m]He wore my sin and [D]bore my shame
[A]Love has a [E]name
[F#m]Jesus, [D]Jesus

{Chorus}
[A]The God of the [E]universe came down
[F#m]And wrapped Himself in [D]flesh and bone
[A]Love has a [E]name, and it's [D]Jesus`,
    notes: "Kim Walker-Smith vocal. Big dynamic range.",
    bpm: 72,
    tags: ["worship","love","Jesus"],
  },
  {
    title: "Alive",
    artist: "Jesus Culture",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]You called me from the [A]grave by name
[Bm]You called me out of [G]all my shame
[D]I see the old has [A]passed away
[Bm]The new has come and [G]I'm alive

{Chorus}
[D]I'm alive, I'm a[A]live
[Bm]You brought me back to [G]life
[D]Dead to sin, a[A]live in [G]Christ`,
    notes: "Resurrection power theme. Energetic from verse one.",
    bpm: 132,
    tags: ["worship","resurrection","life"],
  },
  {
    title: "Still in Control",
    artist: "Jesus Culture",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]When I can't see [D]Your hand
[Em]I know You're [C]still in control
[G]When the road is [D]long
[Em]You are [C]still in control

{Chorus}
[G]Nothing takes You by sur[D]prise
[Em]You are working [C]all things out
[G]You are still in [D]con[C]trol`,
    notes: "Song of trust in hard seasons. Steady, reassuring feel.",
    bpm: 70,
    tags: ["worship","trust","sovereignty"],
  },
  {
    title: "This Is Jesus",
    artist: "Jesus Culture",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]This is Jesus, [G]friend of sinners
[Am]This is Jesus, [F]healer of all
[C]This is Jesus, [G]the Redeemer
[Am]King of kings and [F]Lord of lords

{Chorus}
[C]He is the way, the [G]truth, the life
[Am]No one comes to the [F]Father but through [C]Him`,
    notes: "Declarative worship. Great for introducing Jesus to seekers.",
    bpm: 76,
    tags: ["worship","Jesus","declaration"],
  },
  {
    title: "Everything",
    artist: "Jesus Culture",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]You are every[B]thing I need
[C#m]You are every[A]thing I want
[E]More than all I [B]see
[C#m]You're my every[A]thing

{Chorus}
[E]In the morning [B]when I rise
[C#m]In the middle of [A]the night
[E]You are every[B]thing [A]Lord`,
    notes: "Simple and singable. Congregational-friendly melody.",
    bpm: 72,
    tags: ["worship","devotion","adoration"],
  },
  {
    title: "Revival",
    artist: "Jesus Culture",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]I hear the sound of a [B]new day dawning
[C#m]A generation crying [A]out for You
[E]Send Your rain, send Your [B]fire
[C#m]Let revival [A]start in me

{Chorus}
[E]Revival, [B]revival
[C#m]Let it start [A]right here
[E]Revival, [B]revival
[C#m]Like a holy [A]fire`,
    notes: "Explosive energy. Classic JC anthem feel.",
    bpm: 140,
    tags: ["worship","revival","anthem"],
  },
  {
    title: "Set Me Ablaze",
    artist: "Jesus Culture",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]Set me ablaze with [E]holy fire
[F#m]I want to burn for [D]You alone
[A]Light the flame that [E]won't expire
[F#m]Let Your presence [D]be my home

{Chorus}
[A]I'm consumed by [E]Your fire
[F#m]Every part of [D]me desires
[A]More of You and [E]less of [D]me`,
    notes: "Passionate worship. Great for extended worship sets.",
    bpm: 78,
    tags: ["worship","fire","passion"],
  },
  {
    title: "Fill Me Up (JC)",
    artist: "Jesus Culture",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Fill me up, [D]God
[Em]I want more of [C]You
[G]Every part of [D]my heart
[Em]Cries out for [C]You

{Chorus}
[G]Like a well that [D]never runs dry
[Em]Let Your living [C]water rise
[G]Fill me up, fill me [D]up [C]Lord`,
    notes: "Simple prayer song. Can be used for soaking worship.",
    bpm: 68,
    tags: ["worship","prayer","hunger"],
  },
  {
    title: "Where You Go I Go",
    artist: "Jesus Culture",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]Where You go I'll [A]go
[Bm]Where You stay I'll [G]stay
[D]When You move I'll [A]move
[Bm]I will follow [G]You

{Chorus}
[D]Who You love I'll [A]love
[Bm]How You serve I'll [G]serve
[D]If this life I lose [A]I will follow [G]You`,
    notes: "Kim Walker-Smith lead. Commitment declaration song.",
    bpm: 76,
    tags: ["worship","commitment","following"],
  },
  {
    title: "Walk with Me",
    artist: "Jesus Culture",
    originalKey: "F",
    format: "chordpro",
    content: `{Verse 1}
[F]Walk with me, [C]Lord
[Dm]Through the darkest [Bb]valleys
[F]Walk with me, [C]Lord
[Dm]By the still [Bb]waters

{Chorus}
[F]You are my [C]shepherd
[Dm]I have every[Bb]thing I need
[F]Walk with me [C]all my [Bb]days`,
    notes: "Psalm 23 theme. Gentle and pastoral feel.",
    bpm: 64,
    tags: ["worship","psalm","guidance"],
  },
  {
    title: "Kingdom Come",
    artist: "Jesus Culture",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]Your Kingdom [E]come, Your will be [F#m]done
[D]On earth as it [A]is in heaven
[A]We cry out for [E]Your glory
[F#m]Let Your Kingdom [D]come

{Chorus}
[A]Heaven invade this [E]moment now
[F#m]We welcome Your [D]presence here
[A]Let Your Kingdom [E]come`,
    notes: "Lord's Prayer inspired. Builds to declaration.",
    bpm: 78,
    tags: ["worship","kingdom","prayer"],
  },
  {
    title: "More Than Enough",
    artist: "Jesus Culture",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]You are more than e[D]nough
[Em]More than I could [C]ask or dream of
[G]You are more than e[D]nough
[Em]Everything I [C]need and more

{Chorus}
[G]In the place of [D]plenty
[Em]In the place of [C]need
[G]You are more than e[D]nough for [C]me`,
    notes: "Song of sufficiency. Rest in the message.",
    bpm: 72,
    tags: ["worship","sufficiency","contentment"],
  },
  {
    title: "Forevermore",
    artist: "Jesus Culture",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]Your love will [F]last forever[Gm]more
[Eb]Through every season [Bb]of my soul
[F]You remain the [Gm]same
[Eb]Yesterday, today, for[Bb]evermore

{Chorus}
[Bb]Forevermore, [F]forevermore
[Gm]Your faithfulness en[Eb]dures for[Bb]evermore`,
    notes: "Eternal love theme. Hymn-like quality in the melody.",
    bpm: 68,
    tags: ["worship","eternal","faithfulness"],
  },
  {
    title: "Come Away",
    artist: "Jesus Culture",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]Come away with [B]me
[C#m]Come away with [A]me
[E]It's never too [B]late, it's not too [C#m]late
[A]It's not too late for [E]you

{Chorus}
[E]I have a plan for [B]you
[C#m]I have a plan for [A]you
[E]It's gonna be [B]wild, it's gonna be [C#m]great
[A]It's gonna be full of [E]Me`,
    notes: "Joyful invitation. Uptempo with a sense of adventure.",
    bpm: 134,
    tags: ["worship","invitation","joy"],
  },
  {
    title: "Consume Me",
    artist: "Jesus Culture",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]Like a fire, [E]like a rushing wind
[F#m]Come breathe on [D]me again
[A]Holy Spirit, [E]come and fill this place
[F#m]Consume [D]me

{Chorus}
[A]Consume me, [E]consume me
[F#m]Like a fire, [D]holy fire
[A]Burn in me, [E]burn in me
[F#m]Come consume [D]me, Lord`,
    notes: "Passionate Holy Spirit song. Extended worship and ministry time.",
    bpm: 76,
    tags: ["worship","Holy Spirit","fire","surrender"],
  },
  {
    title: "Beautiful",
    artist: "Jesus Culture",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]I see Your [D]face in every sunrise
[Em]The colors of the [C]morning are inside Your eyes
[G]The world a[D]wakes in the light of the [Em]day
[C]I look up to the sky and say

{Chorus}
[G]You're beautiful, [D]You're beautiful
[Em]God of the heavens, [C]beautiful
[G]You're beautiful, [D]Lord, You are [C]beautiful`,
    notes: "Kim Walker-Smith lead. Worshipful adoration, acoustic feel.",
    bpm: 72,
    tags: ["worship","beauty","adoration"],
  },
  {
    title: "My Soul Longs for You",
    artist: "Jesus Culture",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]My soul longs for [A]You
[Bm]My soul longs for [G]You
[D]Nothing else will [A]do
[Bm]Nothing else will [G]do

{Chorus}
[D]I will lift my [A]eyes
[Bm]To the maker of the [G]heavens
[D]Where my help comes [A]from
[Bm]My soul longs for [G]You`,
    notes: "Deep longing worship. Great for intimate prayer settings.",
    bpm: 66,
    tags: ["worship","longing","prayer","hunger"],
  },
  {
    title: "Holding Nothing Back",
    artist: "Jesus Culture",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]I'm not holding nothing [B]back
[C#m]I surrender [A]all to You
[E]I lay it down for [B]You alone
[C#m]Every fear, every [A]doubt

{Chorus}
[E]Holding nothing [B]back
[C#m]Holding nothing [A]back
[E]I give You every[B]thing I have
[C#m]I'm holding nothing [A]back`,
    notes: "Full surrender anthem. Builds to passionate declaration.",
    bpm: 78,
    tags: ["worship","surrender","commitment"],
  },
  {
    title: "One Thing Remains (JC)",
    artist: "Jesus Culture",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Higher than the [D]mountains that I face
[Em]Stronger than the [C]power of the grave
[G]Constant in the [D]trial and the change
[Em]One thing re[C]mains

{Chorus}
[G]Your love never [D]fails, it never gives [Em]up
[C]It never runs out on [G]me
[G]Your love never [D]fails, it never gives [Em]up
[C]It never runs out on [G]me`,
    notes: "Brian Johnson, Jeremy Riddle, Christa Black. Conference staple.",
    bpm: 130,
    tags: ["worship","love","faithfulness","anthem"],
  },
  {
    title: "How He Loves (JC)",
    artist: "Jesus Culture",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]He is jealous for [Am]me
[F]Loves like a hurricane, [G]I am a tree
[C]Bending beneath the [Am]weight of His wind
[F]And [G]mercy

{Chorus}
[C]Oh how He loves us [Am]oh
[F]Oh how He loves [G]us
[C]How He loves [Am]us oh
[F]So how He [G]loves us`,
    notes: "John Mark McMillan cover. Kim Walker-Smith's arrangement is iconic.",
    bpm: 72,
    tags: ["worship","love","grace","classic"],
  },
  {
    title: "Spirit Move",
    artist: "Jesus Culture",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]We are calling [E]out to You
[F#m]Spirit of God, [D]breathe in this room
[A]Come like a wind, [E]come like a fire
[F#m]Have Your way, have [D]Your way

{Chorus}
[A]Spirit move, [E]Spirit move
[F#m]Fall on us [D]now
[A]Spirit move, [E]Spirit move
[F#m]We need Your [D]power now`,
    notes: "Invocation of the Holy Spirit. Great for ministry time.",
    bpm: 74,
    tags: ["worship","Holy Spirit","prayer","revival"],
  },
  {
    title: "Praise the Invisible",
    artist: "Jesus Culture",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]We will praise the [F]invisible
[Gm]We will worship the [Eb]untouchable
[Bb]We will trust in what [F]we cannot see
[Gm]For His kingdom is [Eb]unshakeable

{Chorus}
[Bb]We praise You, [F]we praise You
[Gm]The unseen [Eb]God who reigns
[Bb]We praise You, [F]we praise the in[Eb]visible`,
    notes: "Faith declaration. Hebrews 11 theme. Bold and anthemic.",
    bpm: 80,
    tags: ["worship","faith","declaration"],
  },
  {
    title: "Arms Open Wide",
    artist: "Jesus Culture",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]I stretch my hands [A]out to the sky
[Bm]I cry Your name, [G]Abba Father
[D]You are the one that [A]I rely on
[Bm]Arms open [G]wide

{Chorus}
[D]With arms open [A]wide, I receive Your love
[Bm]With arms open [G]wide, I give You everything
[D]Arms open [A]wide, Lord I'm [G]Yours`,
    notes: "Posture of receiving God's love. Quiet to building dynamic.",
    bpm: 70,
    tags: ["worship","surrender","love","openness"],
  },
  {
    title: "Worship You Forever",
    artist: "Jesus Culture",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]I will worship [D]You forever
[Em]I will worship [C]You forever more
[G]Not just for what [D]You've done
[Em]But for who [C]You are

{Chorus}
[G]You are worthy of [D]all my praise
[Em]All my days I will [C]worship You
[G]I will worship [D]You for[C]ever`,
    notes: "Kim Walker-Smith. Simple, repeatable declaration of devotion.",
    bpm: 74,
    tags: ["worship","devotion","eternal"],
  },
  {
    title: "Running",
    artist: "Jesus Culture",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]I'm running to [B]Your arms
[C#m]I'm running to [A]Your arms
[E]The riches of Your [B]love
[C#m]Will always be e[A]nough

{Chorus}
[E]Nothing compares to [B]Your embrace
[C#m]Light of the world for[A]ever reign
[E]I'm running, [B]I'm running
[C#m]Into Your [A]arms`,
    notes: "Joyful pursuit of God. Upbeat and full of expectation.",
    bpm: 132,
    tags: ["worship","pursuit","joy"],
  },
  {
    title: "Dance",
    artist: "Jesus Culture",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]I come to [E]dance before the King
[F#m]I come to [D]offer everything
[A]Nothing is too [E]much to give
[F#m]Everything belongs to [D]Him

{Chorus}
[A]I will dance, [E]I will sing
[F#m]To be loved by [D]You is everything
[A]I will dance, [E]I will dance
[F#m]In the presence of [D]the King`,
    notes: "Joyful celebration. David-like abandon in worship.",
    bpm: 126,
    tags: ["worship","joy","celebration","dance"],
  },
  {
    title: "When You Walk in the Room",
    artist: "Jesus Culture",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]When You walk in the [D]room
[Em]Everything [C]changes
[G]Darkness starts to [D]tremble
[Em]At the sound of [C]Your great name

{Chorus}
[G]When You walk in the [D]room
[Em]Sickness starts to [C]flee
[G]Every hopeless [D]situation
[Em]Ceases to [C]exist`,
    notes: "Bryan and Katie Torwalt. Powerful testimony of God's presence.",
    bpm: 78,
    tags: ["worship","presence","power","healing"],
  },
  {
    title: "Oh How I Love You",
    artist: "Jesus Culture",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]Oh how I love [A]You
[Bm]Oh how I love [G]You Lord
[D]With all of my [A]heart
[Bm]With all of my [G]soul

{Chorus}
[D]You have my [A]heart, You have my [Bm]song
[G]I will love You for[D]ever
[D]Oh how I [A]love You, oh how I [G]love You Lord`,
    notes: "Kim Walker-Smith. Deep and simple love song to God.",
    bpm: 68,
    tags: ["worship","love","devotion","adoration"],
  },
  {
    title: "Victorious",
    artist: "Jesus Culture",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]You have con[B]quered death and the grave
[C#m]You have opened [A]up the way
[E]We are victori[B]ous through Your name
[C#m]Nothing can stand a[A]gainst

{Chorus}
[E]Victorious, [B]victorious
[C#m]You make us [A]victorious
[E]We overcome by [B]the blood of the Lamb
[C#m]And the word of our tes[A]timony`,
    notes: "Revelation 12:11. Bold declaration of victory through Christ.",
    bpm: 134,
    tags: ["worship","victory","declaration","spiritual warfare"],
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
