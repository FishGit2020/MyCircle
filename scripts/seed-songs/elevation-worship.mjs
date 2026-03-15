#!/usr/bin/env node
/**
 * Seed Elevation Worship worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/elevation-worship.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Graves into Gardens",
    artist: "Elevation Worship",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]I searched the world but it couldn't [Am]fill me
[F]Man's empty praise and [C]treasures that fade
[C]Are never enough
[C]Then You came along and put me [Am]back together
[F]And every desire is [C]now satisfied here in Your love

{Pre-Chorus}
[Am]Oh there's [F]nothing better than You
[C]There's nothing [G]better than You
[Am]Lord there's [F]nothing
[C]Nothing is better than [G]You

{Chorus}
[C]You turn mourning to [Am]dancing
[F]You give beauty for [C]ashes
[C]You turn shame into [Am]glory
[F]You're the only one who [G]can
[C]You turn graves into [Am]gardens
[F]You turn bones into [C]armies
[C]You turn seas into [Am]highways
[F]You're the only one who [G]can`,
    notes: "Great build song. Start soft, build through the chorus.",
    bpm: 72,
    tags: ["worship","testimony","transformation"],
  },
  {
    title: "Jireh [INCOMPLETE - needs Bridge]",
    artist: "Elevation Worship",
    originalKey: "B",
    format: "chordpro",
    content: `{Verse 1}
[B]I'll never be more [G#m]loved than I am right now
[E]Wasn't holding You up
So there's nothing I can do to [B]let You down
[B]It doesn't take a [G#m]trophy to make You proud
[E]I'll never be more [F#]loved than I am right [B]now

{Chorus}
[B]Jireh, You are e[G#m]nough
[E]Jireh, You are e[F#]nough
[B]And I will be con[G#m]tent in every circum[E]stance
[F#]You are [B]Jireh, You are enough

{Verse 2}
[B]I wasn't holding [G#m]You up
So there's nothing I can do to [E]let You down
[B]It doesn't take a [G#m]trophy to make You proud
[E]I'll never be more [F#]loved than I am right [B]now`,
    notes: "Peaceful, reflective song. Keep dynamics gentle.",
    bpm: 69,
    tags: ["worship","provision","peace"],
  },
  {
    title: "O Come to the Altar [INCOMPLETE - needs Bridge]",
    artist: "Elevation Worship",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]Are you hurting and [E]broken within
[F#m]Overwhelmed by the [D]weight of your sin
[A]Jesus is [E]calling
[A]Have you come to the [E]end of yourself
[F#m]Do you thirst for a [D]drink from the well
[A]Jesus is [E]calling

{Chorus}
[A]O come to the [E]altar
[F#m]The Father's arms are open [D]wide
[A]Forgiveness was [E]bought with
[F#m]The precious blood of [D]Jesus Christ

{Verse 2}
[A]Leave behind your [E]regrets and mistakes
[F#m]Come today there's no [D]reason to wait
[A]Jesus is [E]calling
[A]Bring your sorrows and [E]trade them for joy
[F#m]From the ashes a [D]new life is born
[A]Jesus is [E]calling`,
    notes: "Altar call song. Use for invitation moments.",
    bpm: 67,
    tags: ["worship","altar call","invitation"],
  },
  {
    title: "Do It Again",
    artist: "Elevation Worship",
    originalKey: "B",
    format: "chordpro",
    content: `{Verse 1}
[B]Walking around these walls
[G#m]I thought by now they'd fall
[E]But You have never failed me yet
[F#]Waiting for change to come
[B]Knowing the battle's won
[G#m]For You have never failed me yet

{Pre-Chorus}
[E]Your promise still [F#]stands
[G#m]Great is Your faith[B]fulness
[E]Faithfulness
[F#]I'm still in Your [B]hands

{Chorus}
[B]This is my confidence
[G#m]You've never failed me yet
[B]I've seen You move, You [E]move the mountains
And I believe, I'll see You [F#]do it again
[B]You made a way, where there was [G#m]no way
And I believe, I'll see You [E]do it again`,
    notes: "Testimony song. Good for building faith. Play with conviction.",
    bpm: 72,
    tags: ["praise","faith","testimony"],
  },
  {
    title: "RATTLE! [INCOMPLETE - needs Bridge]",
    artist: "Elevation Worship",
    originalKey: "F",
    format: "chordpro",
    content: `{Verse 1}
[F]Saturday was si[Am]lent
[Bb]Surely it was [F]through
[F]But since when has [Am]impossible
[Bb]Ever stopped [C]You

{Chorus}
[F]This is the sound of [Am]dry bones rattling
[Bb]This is the praise make a [F]dead man walk again
[F]Open the grave, I'm [Am]coming out
[Bb]I'm gonna live, gonna [C]live again

{Verse 2}
[F]On the third day, [Am]heaven threw a party
[Bb]The stone was rolled a[C]way
[F]On the third day, [Am]those walking dead
[Bb]Became the [C]living
[F]You blew the [Am]trumpet and the [Bb]walls came down
[F]Death couldn't [Am]hold You down [Bb]  [C]`,
    notes: "High energy! Full band arrangement. Great for opening.",
    bpm: 140,
    tags: ["praise","anthem","resurrection"],
  },
  {
    title: "See A Victory [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]The weapon formed against me [B]won't prosper
[C#m]Every chain the [A]enemy tries to use
[E]God has given me [B]authority
[C#m]What the devil meant for [A]evil
God will turn it for my [E]good

{Chorus}
[E]I'm gonna see a [B]victory
[C#m]I'm gonna see a [A]victory
[E]For the battle be[B]longs to You, Lord
[C#m]I'm gonna see a [A]victory
[E]I'm gonna see a [B]victory
[C#m]For the battle be[A]longs to You, Lord`,
    notes: "Warfare anthem. Declare with confidence!",
    bpm: 80,
    tags: ["praise","victory","warfare"],
  },
  {
    title: "Resurrecting",
    artist: "Elevation Worship",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]The head that once was [D]crowned with thorns
[Em]Is crowned with glory [C]now
[G]The Savior knelt to [D]wash our feet
[Em]Now at His feet we [C]bow

{Verse 2}
[G]The One who wore our [D]sin and shame
[Em]Now robed in majes[C]ty
[G]The radiance of [D]perfect love
[Em]Now shines for all to [C]see

{Chorus}
[G]Your name, [D]Your name is victo[Em]ry
[C]All praise will rise to [G]Christ our King

{Verse 3}
[G]The fear that held us [D]now gives way
[Em]To Him who is our [C]peace
[G]His final breath [D]upon the cross
[Em]Is now alive in [C]me`,
    notes: "Majestic resurrection hymn. Perfect for Easter.",
    bpm: 66,
    tags: ["worship","resurrection","majesty"],
  },
  {
    title: "Won't Stop Now [INCOMPLETE - needs Bridge]",
    artist: "Elevation Worship",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]Whatever it looks like, [Am]whatever may come
[F]I will praise through the fire, [G]I will praise through the storm
[C]I trust Your plan and [Am]purpose, Lord
[F]You've never let me [G]down

{Chorus}
[C]You didn't bring me [Am]out this far
[F]To leave me in the [G]desert
[C]You didn't fill me [Am]up to empty me
[F]So I know You [G]won't stop now

{Tag}
[C]You won't stop [Am]now, You won't stop [F]now
[G]You won't stop [C]now`,
    notes: "Faith declaration. Medium energy, build on the chorus.",
    bpm: 76,
    tags: ["worship","faith","perseverance"],
  },
  {
    title: "Praise",
    artist: "Elevation Worship",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]I'll praise in the [F]pain, I'll praise in the [Gm]valley
[Eb]I'll praise when it all falls apart
[Bb]I'll praise when the [F]walls start closing [Gm]in
[Eb]Your name is my battle cry

{Chorus}
[Bb]I'll praise my way [F]out, I'll praise 'til it [Gm]turns around
[Eb]I'll praise the impossible

{Bridge}
[Bb]Let it rise [F]up, let it [Gm]overflow
[Eb]Let it reach what seems impossible
[Bb]Let it break [F]through every [Gm]barricade
[Eb]I can see You moving mountains
[Bb]Praise, [F]praise, [Gm]praise
[Eb]Praise His name`,
    notes: "High energy anthem of praise through trials. Full band.",
    bpm: 140,
    tags: ["praise","anthem","breakthrough"],
  },
  {
    title: "Same God [INCOMPLETE - needs Bridge]",
    artist: "Elevation Worship",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]I'm calling on the [E]God of Jacob
[F#m]Whose power is the [D]same
[A]If He opened up the [E]Red Sea
[F#m]He can make a [D]way

{Verse 2}
[A]I'm calling on the [E]God of mercy
[F#m]Whose promise still re[D]mains
[A]He's the same God, [E]same God
[F#m]He's the same [D]God

{Chorus}
[A]The God who was, the [E]God who is
[F#m]The God who is to [D]come
[A]The God who was, the [E]God who is
[F#m]The God who is to [D]come
[A]He's the same [E]God, [F#m]He's the same [D]God`,
    notes: "Declaration of God's unchanging nature. Good for building faith.",
    bpm: 71,
    tags: ["worship","faithfulness","declaration"],
  },
  {
    title: "Blessed Assurance [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]Blessed assur[F]ance, Jesus is [Gm]mine
[Eb]Oh what a fore[Bb]taste of glo[F]ry divine
[Bb]Heir of sal[F]vation, pur[Gm]chase of God
[Eb]Born of His Spir[Bb]it, washed [F]in His blood

{Chorus}
[Bb]This is my [F]story, this is my [Gm]song
[Eb]Praising my [Bb]Savior all [F]the day long
[Bb]This is my [F]story, this is my [Gm]song
[Eb]Praising my [Bb]Savior all [F]the day long`,
    notes: "Modern arrangement of Fanny Crosby hymn, fresh feel with full band.",
    bpm: 76,
    tags: ["worship","hymn","assurance"],
  },
  {
    title: "Trust in God [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]I don't know what [F]tomorrow holds
[Gm]But I know who [Eb]holds tomorrow
[Bb]And I may not [F]know the way to go
[Gm]But I know that [Eb]I am not alone

{Chorus}
[Bb]I will trust in [F]God
[Gm]I will trust in [Eb]God
[Bb]My hope is found in [F]nothing less
[Gm]I will trust in [Eb]God`,
    notes: "Chris Brown lead. Contemplative verse, anthemic chorus.",
    bpm: 72,
    tags: ["worship","trust","faith"],
  },
  {
    title: "Water Is Wild [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]If You said it, [G]I believe it
[Am]God of the im[F]possible
[C]Even when my [G]eyes can't see it
[Am]Your love is un[F]stoppable

{Chorus}
[C]The water is [G]wild but Your love is wilder
[Am]The storm is [F]strong but the Father is stronger
[C]The water is [G]wild but I'm not going under
[Am]I know You're [F]leading me through`,
    notes: "Tiffany Hudson lead. Energetic and faith-building, waves motion feel.",
    bpm: 128,
    tags: ["worship","faith","trust"],
  },
  {
    title: "I Believe [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "F",
    format: "chordpro",
    content: `{Verse 1}
[F]I believe in the re[C]surrected King
[Dm]I believe there is a [Bb]crown for me
[F]I believe in the God [C]who fights for me
[Dm]I believe, [Bb]I believe

{Chorus}
[F]I believe what You [C]say of me
[Dm]I believe the un[Bb]seen
[F]And when doubt comes [C]against me
[Dm]I believe, [Bb]I believe`,
    notes: "Bold declaration of faith. Strong and steady, builds conviction.",
    bpm: 74,
    tags: ["worship","faith","declaration"],
  },
  {
    title: "With You [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]Oh the depth of [G]mercy
[Am]Oh the height of [F]grace
[C]When I'm standing [G]in Your presence
[Am]Nothing out of [F]place

{Chorus}
[C]I just wanna [G]be with You
[Am]Lord I love to [F]be with You
[C]There's no better [G]place to be
[Am]Than right here with [F]You`,
    notes: "Intimate and devotional, acoustic-led, great for prayer time.",
    bpm: 64,
    tags: ["worship","intimacy","presence"],
  },
  {
    title: "Here Again [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]Can't go back to the [F]beginning
[Gm]Can't control what to[Eb]morrow will bring
[Bb]But I know here in [F]the middle
[Gm]Is the place where [Eb]You promise to be

{Chorus}
[Bb]I'm not afraid, [F]I'm not afraid
[Gm]Because I know, [Eb]I know
[Bb]You've never failed, [F]You won't start now
[Gm]Here a[Eb]gain, here again`,
    notes: "Beautiful testimony song. Reflective with building confidence.",
    bpm: 70,
    tags: ["worship","faithfulness","trust"],
  },
  {
    title: "Rhythm [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]When the beat of my [D]heart keeps changing
[Em]You remain the [C]same
[G]When the rhythm of [D]life gets crazy
[Em]Your love is un[C]changed

{Chorus}
[G]I found my rhythm in [D]You
[Em]I found my rhythm in [C]You
[G]Nothing else can [D]satisfy
[Em]You are the rhythm of [C]my life`,
    notes: "Groove-based worship, funky bass line, modern worship-pop feel.",
    bpm: 108,
    tags: ["worship","joy","devotion"],
  },
  {
    title: "Only King Forever [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]Our God, a con[E]suming fire
[F#m]A burning [D]holy flame with glory and freedom
[A]Our God is the [E]only King forever
[F#m]Almighty [D]God

{Chorus}
[A]Only King for[E]ever
[F#m]Almighty [D]God
[A]Only King for[E]ever
[F#m]Almighty [D]God`,
    notes: "Chris Brown lead. Driving anthem, builds through repetition.",
    bpm: 138,
    tags: ["worship","declaration","sovereignty"],
  },
  {
    title: "Graves to Gardens (Elevation Live)",
    artist: "Elevation Worship",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]I searched the world but it [G]couldn't fill me
[Am]Man's empty praise and [F]treasures that fade
[C]Are never enough

{Verse 2}
[C]Then You came along and [G]put me back together
[Am]And every part of me [F]cries out for more

{Chorus}
[C]You turn mourning to [G]dancing
[Am]You give beauty for [F]ashes
[C]You turn graves into [G]gardens
[Am]You turn bones into [F]armies
[C]You turn seas into [G]highways
[Am]You're the only one [F]who can

{Tag}
[C]You turn graves into [G]gardens
[Am]You turn bones into [F]armies
[C]You turn seas into [G]highways
[Am]And You're the only [F]one who can`,
    notes: "Elevation Worship live arrangement with extended worship section",
    bpm: 74,
    tags: ["worship","transformation","live"],
  },
  {
    title: "The Blessing (Elevation version) [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]The Lord bless you and [A]keep you
[Bm]Make His face shine up[G]on you
[D]And be gracious [A]to you
[Bm]The Lord turn His face toward [G]you

{Chorus}
[D]And give you [A]peace
[Bm]Amen, amen [G]amen
[D]May His favor be up[A]on you
[Bm]A thousand gener[G]ations`,
    notes: "Numbers 6:24-26. Build layers through repetition.",
    bpm: 68,
    tags: ["worship","blessing","scripture"],
  },
  {
    title: "Give Me Faith [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "B",
    format: "chordpro",
    content: `{Verse 1}
[B]I need You to [E]soften my heart
[G#m]And break me a[F#]part
[B]I need You to [E]open my eyes
[G#m]To see that You're [F#]shaping my life

{Chorus}
[B]Give me faith to [E]trust what You say
[G#m]That You're good and Your [F#]love is great
[B]Give me faith to be[E]lieve`,
    notes: "Prayer-style song. Start soft and build to the bridge.",
    bpm: 66,
    tags: ["worship","faith","prayer"],
  },
  {
    title: "Angel Armies [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]Hear the sound of [B]angel armies
[C#m]Marching to the [A]beat of heaven
[E]Nothing stands a[B]gainst the power
[C#m]Of the Lord Al[A]mighty

{Chorus}
[E]There's no weapon that can [B]stop the hand of God
[C#m]Angel armies [A]fighting on my [E]behalf`,
    notes: "Triumphant atmosphere. Great for building faith moments.",
    bpm: 130,
    tags: ["worship","victory","anthem"],
  },
  {
    title: "Hallelujah Here Below [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "Ab",
    format: "chordpro",
    content: `{Verse 1}
[Ab]Hallelujah [Eb]here below
[Fm]In the valley [Db]of my soul
[Ab]I will sing it [Eb]even so
[Fm]Hallelujah [Db]here below

{Chorus}
[Ab]Even when the [Eb]shadows fall
[Fm]Even when I can't see [Db]it all
[Ab]I will praise You [Eb]through it [Db]all`,
    notes: "Vulnerable tone. Allow room for congregation to sing.",
    bpm: 70,
    tags: ["worship","valley","praise"],
  },
  {
    title: "Hold On to Me [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]When I feel like [G]I'm letting go
[Am]Hold on to [F]me
[C]When my faith is [G]running low
[Am]Hold on to [F]me

{Chorus}
[C]You won't let me [G]fall apart
[Am]You hold every [F]piece of my heart
[C]Hold on to [G]me [Am] [F]`,
    notes: "Tender ballad. Sparse arrangement works best.",
    bpm: 64,
    tags: ["worship","comfort","trust"],
  },
  {
    title: "Evidence [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "D",
    format: "chordpro",
    content: `{Chorus}
[D]I see the [A]evidence of [Bm]Your goodness
[G]All over my [D]life
[A]All over my [Bm]life
[G]I see Your [D]promises in ful[A]fillment
[Bm]All over my [G]life

{Tag}
[D]Faithful for[A]ever You are [Bm]faithful for[G]ever
[D]You never have [A]failed me [Bm]yet [G]`,
    notes: "Testimony song. Lead with personal conviction.",
    bpm: 72,
    tags: ["worship","testimony","faithfulness"],
  },
  {
    title: "Never Lost (Elevation) [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "Eb",
    format: "chordpro",
    content: `{Verse 1}
[Eb]You never lost a [Bb]battle
[Cm]And I know, I [Ab]know
[Eb]You never will [Bb]fail me
[Cm]And I know, I [Ab]know

{Chorus}
[Eb]Yes and amen [Bb]every promise fulfilled
[Cm]You never lost [Ab]and You never [Eb]will`,
    notes: "Bold declaration. Tauren Wells collab. Drive hard on chorus.",
    bpm: 84,
    tags: ["worship","victory","declaration"],
  },
  {
    title: "God of the Promise [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "F",
    format: "chordpro",
    content: `{Verse 1}
[F]God of the [C]promise
[Dm]You don't speak in [Bb]vain
[F]No syllable [C]empty or void
[Dm]Your word is [Bb]faithful

{Chorus}
[F]I'm standing on the [C]promises of God
[Dm]Even when I [Bb]can't see past the [F]storm`,
    notes: "Mid-tempo. Emphasize the promises in the lyric.",
    bpm: 72,
    tags: ["worship","promises","faith"],
  },
  {
    title: "The Father [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]I've heard about a [F]Father
[Gm]Who holds it all to[Eb]gether
[Bb]His name is above [F]every name
[Gm]And mighty in [Eb]power

{Chorus}
[Bb]You are my [F]Father
[Gm]I'm in Your [Eb]arms forever
[Bb]Safe in Your [F]hands [Gm]now [Eb]`,
    notes: "Focuses on the Father heart of God. Tender arrangement.",
    bpm: 70,
    tags: ["worship","father","identity"],
  },
  {
    title: "Wide as the Sky [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Your love is [D]wide as the sky
[Em]Deep as the [C]ocean
[G]High as the [D]heavens above
[Em]Endless de[C]votion

{Chorus}
[G]Your grace reaches [D]further
[Em]Further than I [C]could fall
[G]Your love is [D]wide as the [C]sky`,
    notes: "Expansive feel. Let the arrangement breathe and grow.",
    bpm: 68,
    tags: ["worship","love","grace"],
  },
  {
    title: "Start Right Here [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]I don't need to [E]go far
[F#m]I don't need to [D]search wide
[A]You're as close as [E]my next breath
[F#m]Right here by [D]my side

{Chorus}
[A]So let revival [E]start right here
[F#m]In my heart and [D]in this place
[A]Lord start right [E]here`,
    notes: "Intimate yet faith-filled. Great altar call song.",
    bpm: 74,
    tags: ["worship","revival","nearness"],
  },
  {
    title: "Speak to Me [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]Speak to me [G]Lord
[Am]I'm listening for [F]Your voice
[C]In the noise and [G]chaos
[Am]You're the only [F]sound I want

{Chorus}
[C]Speak to me [G]like You always have
[Am]Still small [F]voice, gentle [C]hand`,
    notes: "Quiet, prayerful. Reduce instrumentation to minimum.",
    bpm: 62,
    tags: ["worship","prayer","listening"],
  },
  {
    title: "Already Won [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]The battle is al[F]ready won
[Gm]We know how this [Eb]story ends
[Bb]We sing hallelu[F]jah
[Gm]We sing halle[Eb]lujah

{Chorus}
[Bb]The chains have al[F]ready been undone
[Gm]Death has lost and [Eb]love has already [Bb]won`,
    notes: "Victorious song. Full energy from the top.",
    bpm: 136,
    tags: ["worship","victory","celebration"],
  },
  {
    title: "Wait on You (Elevation) [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]I will wait on [D]You Lord
[Em]You're the author of my [C]story
[G]You see the end from [D]the beginning
[Em]My hope is in [C]You alone

{Chorus}
[G]Waiting, still [D]believing
[Em]You never stopped [C]working
[G]I will wait on [D]You`,
    notes: "Patience and trust theme. Allow space for reflection.",
    bpm: 66,
    tags: ["worship","patience","trust"],
  },
  {
    title: "Greater Things [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]There are greater [B]things in store
[C#m]Greater things are [A]yet to come
[E]Open up the [B]heavens pour it out
[C#m]Let it rain down [A]on us

{Chorus}
[E]We believe in [B]greater things
[C#m]Hope beyond what [A]we can see
[E]Greater things are [B]coming [A]now`,
    notes: "Expectant and hopeful. Let it crescendo to the end.",
    bpm: 128,
    tags: ["worship","hope","expectation"],
  },
  {
    title: "Worthy [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]Worthy is the [F]Lamb who was slain
[Gm]Holy, holy [Eb]is He
[Bb]Sing a new song [F]to Him who sits on
[Gm]Heaven's mercy [Eb]seat

{Chorus}
[Bb]Worthy is the [F]Lamb
[Gm]Worthy is the [Eb]Lamb
[Bb]You are holy, [F]holy
[Gm]Are You Lord God Al[Eb]mighty`,
    notes: "Powerful coronation anthem. Majestic and reverent.",
    bpm: 72,
    tags: ["worship","holiness","adoration"],
  },
  {
    title: "Open Up Our Eyes [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]We've been standing on the [D]sidelines
[Em]Watching people pass us [C]by
[G]We've been walking with our [D]eyes closed
[Em]Not seeing what's a[C]live

{Chorus}
[G]Open up our [D]eyes, open up our [Em]eyes
[C]Lord we want to [G]see You
[G]Open up our [D]eyes, give us hearts to [Em]find
[C]Every soul that's hurting`,
    notes: "Missions-focused anthem. Energetic and purposeful.",
    bpm: 130,
    tags: ["worship","missions","compassion"],
  },
  {
    title: "Fullness [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]Christ in me, the [B]hope of glory
[C#m]Taste and see the [A]living Word
[E]Holy Spirit [B]breathe upon me
[C#m]Fill me with the [A]fullness Lord

{Chorus}
[E]I want the fullness of [B]Your presence
[C#m]I want it all, [A]I want it all
[E]Every piece of [B]my existence
[C#m]Filled with You and [A]nothing else`,
    notes: "Prayerful and yearning. Build from quiet start to full sound.",
    bpm: 66,
    tags: ["worship","holy spirit","fullness"],
  },
  {
    title: "At Midnight [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]When the darkness [G]closes in
[Am]And the walls are [F]pressing tight
[C]I will choose to [G]worship Him
[Am]I will praise at [F]midnight

{Chorus}
[C]At midnight, [G]at midnight
[Am]My praise will still be [F]on my lips
[C]Chains are falling, [G]prison shaking
[Am]When we praise at [F]midnight`,
    notes: "Acts 16 theme - Paul & Silas. Build intensity through repetition.",
    bpm: 76,
    tags: ["worship","faith","breakthrough"],
  },
  {
    title: "Faithful (Elevation Worship) [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]From beginning [A]to the end
[Bm]You have always [G]been faithful
[D]And You will be [A]again
[Bm]You have always [G]been faithful

{Chorus}
[D]Faithful, [A]faithful
[Bm]This is who You [G]are
[D]Faithful, [A]faithful
[Bm]From the start You [G]were`,
    notes: "Chris Brown lead. Steady, reassuring rhythm. Testimony feel.",
    bpm: 70,
    tags: ["worship","faithfulness","testimony"],
  },
  {
    title: "Might Get Loud [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]I was gonna keep it [E]down
[F#m]I was gonna keep it [D]quiet
[A]But Your love is just [E]too good
[F#m]I'm sorry but it [D]might get loud

{Chorus}
[A]It might get [E]loud in here
[F#m]It might get [D]loud
[A]When I think about Your [E]goodness
[F#m]I can't keep it to my[D]self`,
    notes: "High-energy celebration. Chris Brown lead. Clap along feel.",
    bpm: 144,
    tags: ["praise","celebration","joy"],
  },
  {
    title: "Make Room [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]I find space to [F]face the One
[Gm]Who made it all and [Eb]makes it new
[Bb]Shake up my [F]priorities
[Gm]Clear the way for [Eb]what is true

{Chorus}
[Bb]Here I am, [F]make room
[Gm]Lord I'm running [Eb]to You
[Bb]Here I am, [F]make room
[Gm]I need more of [Eb]You`,
    notes: "Jonathan McReynolds / Elevation collab. Intimate and sincere.",
    bpm: 68,
    tags: ["worship","prayer","surrender"],
  },
  {
    title: "Million Little Miracles [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]Looking back now [G]it all connects
[Am]God has been good and [F]He ain't done yet
[C]Standing here now [G]there's no more doubt
[Am]There's a million little [F]reasons to shout

{Chorus}
[C]A million little [G]miracles
[Am]A million little [F]miracles
[C]He's done a million [G]little miracles
[Am]A million little miracles [F]for me`,
    notes: "Maverick City crossover. Joyful testimony. Let the band groove.",
    bpm: 132,
    tags: ["praise","testimony","gratitude"],
  },
  {
    title: "This Is the Kingdom [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]This is the [D]kingdom
[Em]This is the [C]kingdom of our God
[G]Where the broken are [D]mended
[Em]The lost ones are [C]found

{Chorus}
[G]This is the [D]kingdom, this is the [Em]kingdom
[C]Where love reigns [G]forever
[G]And mercy is [D]free
[Em]This is the [C]kingdom`,
    notes: "Pat Barrett / Elevation worship. Kingdom-focused, warm and inclusive.",
    bpm: 74,
    tags: ["worship","kingdom","love"],
  },
  {
    title: "Be Lifted High [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]Sing it out [B]let the redeemed
[C#m]Of the Lord say [A]so
[E]Sing it out and [B]lift His name up
[C#m]Let the whole world [A]know

{Chorus}
[E]Be lifted [B]high, be lifted [C#m]high
[A]Your name be lifted [E]high
[E]Be lifted [B]high, be lifted [C#m]high
[A]Jesus be lifted [E]high`,
    notes: "Classic Elevation anthem. Full energy from the start.",
    bpm: 136,
    tags: ["praise","exaltation","anthem"],
  },
  {
    title: "Name Above All Names [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]Name above all [E]names
[F#m]Worthy of all [D]praise
[A]My heart will sing how [E]great is our God
[F#m]Name above all [D]names

{Chorus}
[A]You deserve the [E]glory
[F#m]And the honor [D]Lord
[A]At the name of [E]Jesus
[F#m]Every knee will [D]bow`,
    notes: "Tiffany Hudson lead. Exalting the name of Jesus.",
    bpm: 72,
    tags: ["worship","name of Jesus","adoration"],
  },
  {
    title: "More Than Able [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]Who am I to [F]deny what the Lord has said
[Gm]Who am I to say [Eb]that He can't do it again
[Bb]You're the God of [F]miracles
[Gm]Nothing is im[Eb]possible

{Chorus}
[Bb]You are more than [F]able
[Gm]You are more than [Eb]able
[Bb]Abundantly above [F]all we could ask or think
[Gm]You're more than [Eb]able`,
    notes: "Elevation x Maverick City. Anthemic bridge builds to peak.",
    bpm: 78,
    tags: ["worship","faith","declaration"],
  },
  {
    title: "Here As in Heaven [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]The atmosphere is [D]changing now
[Em]For the Spirit of [C]the Lord is here
[G]The evidence is [D]all around
[Em]That the Spirit of [C]the Lord is here

{Chorus}
[G]Here as in [D]heaven
[Em]Let it be [C]here as in heaven
[G]Here as in [D]heaven
[Em]Your kingdom [C]come
[G]On earth as in [D]heaven`,
    notes: "Kingdom-minded, atmospheric. Let the room fill with praise.",
    bpm: 68,
    tags: ["worship","presence","kingdom"],
  },
  {
    title: "First Things First [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]Before I bring my [E]need
[F#m]I will bring my [D]heart
[A]Before I lift my [E]cares
[F#m]I will lift my [D]arms to You

{Chorus}
[A]First things [E]first
[F#m]I seek Your [D]face
[A]First things [E]first
[F#m]I give You [D]praise`,
    notes: "Priority of worship before petition. Intimate, acoustic feel.",
    bpm: 66,
    tags: ["worship","devotion","priority"],
  },
  {
    title: "What I See [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]I don't see what [G]everyone else sees
[Am]Where they see a [F]dead end I see the Red Sea
[C]I don't see what [G]everyone else sees
[Am]Where they see [F]impossible I see You

{Chorus}
[C]What I see is a [G]God who won't give up
[Am]What I see is a [F]love that never stops
[C]What I see is [G]victory ahead
[Am]My God is [F]not done yet`,
    notes: "Chris Brown lead. Faith over sight. Upbeat and hopeful.",
    bpm: 126,
    tags: ["worship","faith","perspective"],
  },
  {
    title: "Then He Rose [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "F",
    format: "chordpro",
    content: `{Verse 1}
[F]They laid Him in [C]the ground
[Dm]They thought it was [Bb]over now
[F]The stone was sealed, the [C]guards were set
[Dm]Hope was gone, or [Bb]so they said

{Chorus}
[F]Then He rose, [C]then He rose
[Dm]Up from the grave in [Bb]power
[F]Then He rose, [C]then He rose
[Dm]Death could not hold [Bb]Him down`,
    notes: "Easter celebration. Build dramatically to the chorus.",
    bpm: 80,
    tags: ["worship","resurrection","Easter"],
  },
  {
    title: "Known [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]You have searched me [A]and You know me
[Bm]You know when I [G]sit and when I rise
[D]You see my thoughts [A]from afar
[Bm]And every word [G]before it starts

{Chorus}
[D]I am known, [A]I am known
[Bm]Fully known and [G]fully loved
[D]I am known, [A]I am known
[Bm]Nothing hidden [G]from Your love`,
    notes: "Psalm 139 inspired. Jonsal Barrientes. Warm and comforting.",
    bpm: 70,
    tags: ["worship","identity","intimacy"],
  },
  {
    title: "Available [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]I just want to [D]be available
[Em]I just want to [C]be where You are
[G]Not my own a[D]genda
[Em]But whatever [C]You have for me

{Chorus}
[G]Here I am, [D]available
[Em]Use me Lord, [C]I'm available
[G]Every part of [D]me surrendered
[Em]I am [C]available`,
    notes: "Surrender posture. Simple and singable. Great for response time.",
    bpm: 72,
    tags: ["worship","surrender","service"],
  },
  {
    title: "Paradoxology [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]The more I seek [F]the more I find
[Gm]The more I find [Eb]the more I seek You
[Bb]I lose my life [F]to find it in You
[Gm]In weakness I [Eb]am strong

{Chorus}
[Bb]This is the [F]paradox of grace
[Gm]Losing every[Eb]thing to gain
[Bb]You give and [F]take away
[Gm]And still I [Eb]choose to praise`,
    notes: "Deep theological lyrics. Medium build with contemplative feel.",
    bpm: 74,
    tags: ["worship","theology","grace"],
  },
  {
    title: "Got What I Got [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]I could be anywhere [B]doing anything
[C#m]But I got what I [A]got and that's everything
[E]Every door You [B]opened or closed
[C#m]Every yes and [A]no brought me here

{Chorus}
[E]I got what I [B]got because of You
[C#m]I am what I [A]am because of grace
[E]Got what I got and [B]I'm grateful
[C#m]Wouldn't change a [A]thing`,
    notes: "Gratitude anthem. Chris Brown lead. Feel-good energy.",
    bpm: 120,
    tags: ["praise","gratitude","testimony"],
  },
  {
    title: "My Testimony [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]The enemy tried to [E]take me out
[F#m]Tried to write [D]my story
[A]But this is my [E]testimony
[F#m]Greater is the [D]One in me

{Chorus}
[A]I've got a testi[E]mony
[F#m]I've got a testi[D]mony
[A]Look what the Lord has [E]done
[F#m]Look what the Lord [D]has done for me`,
    notes: "Tiffany Hudson lead. Soulful testimony, let it build to celebration.",
    bpm: 82,
    tags: ["worship","testimony","victory"],
  },
  {
    title: "Bow Down [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Every idol, [D]every lie
[Em]Every weight that [C]holds me down
[G]I lay them at Your [D]feet right now
[Em]Lord I bow [C]down

{Chorus}
[G]I bow down, [D]I bow down
[Em]At the feet of [C]Jesus
[G]I bow down, [D]I bow down
[Em]You alone are [C]worthy`,
    notes: "Reverent, posture of humility. Strip back instrumentation.",
    bpm: 62,
    tags: ["worship","surrender","humility"],
  },
  {
    title: "Breakthrough [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]I hear the sound of [B]a breakthrough coming
[C#m]I hear the sound of [A]a breakthrough now
[E]Chains are breaking, [B]walls are shaking
[C#m]Heaven's door is [A]opening wide

{Chorus}
[E]Breakthrough, break[B]through
[C#m]Let the praise break [A]through
[E]Breakthrough, break[B]through
[C#m]You're the God of [A]breakthroughs`,
    notes: "High-energy declaration. Big drums, full band. Great opener.",
    bpm: 140,
    tags: ["praise","breakthrough","declaration"],
  },
  {
    title: "Talking to Jesus [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]I've been talking to [D]Jesus
[Em]He said everything's gonna [C]be alright
[G]I've been walking with [D]Jesus
[Em]He dried the tears [C]from my eyes

{Chorus}
[G]There's nothing like [D]talking to Jesus
[Em]There's nobody [C]like Him
[G]In the morning, in the [D]evening
[Em]He's the friend that [C]sticks closer than a brother`,
    notes: "Maverick City crossover. Intimate, conversational. Acoustic-led.",
    bpm: 68,
    tags: ["worship","prayer","intimacy"],
  },
  {
    title: "Bye Bye Babylon [INCOMPLETE - needs V2+Bridge]",
    artist: "Elevation Worship",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]Bye bye Baby[B]lon
[C#m]I'm leaving you [A]now
[E]I'm letting go of [B]everything
[C#m]That's been weighing [A]me down

{Chorus}
[E]Bye bye Baby[B]lon
[C#m]There's a better [A]land
[E]I'm walking out of [B]captivity
[C#m]Into the promised [A]land`,
    notes: "Maverick City crossover. Freedom anthem. Clap-along energy.",
    bpm: 134,
    tags: ["praise","freedom","deliverance"],
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
