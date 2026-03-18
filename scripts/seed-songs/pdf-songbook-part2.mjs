#!/usr/bin/env node
/**
 * Seed PDF Songbook Part 2 (E-L) worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/pdf-songbook-part2.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Ever Be",
    artist: "Chris Greely/Kalley Heiligenthal/Bobby Strand/Gabriel Wilson",
    originalKey: "C",
    format: "chordpro",
    content: `{Intro}
[C] | [Am9] | [Em] | [Fmaj7] | [C] | [Am9] | [Em] | [Fmaj7] |

[C]Your love is de[Dm]voted like a ring of [F]solid gold
[Em]Like a vow that is [G]tested like a [C]covenant of old
[Dm]Your love is en[F]during through the winter rain
[Em]And beyond the [G]horizon with [F]mercy for today

[C]Faithful You have [G]been and faithful You will be
[Dm7]You pledge Yourself to me and [C]it's why I sing

[F(Fmaj7)]Your praise will ever be on my [C]lips, ever be on my lips
[Am]Your praise will ever be on my [G]lips, ever be on my lips
[2nd, 3rd time repeat chorus]

[C]You Father the [Dm]orphan, Your kindness [F]makes us whole
[Em]You shoulder our [G]weakness, and Your [C]strength becomes our own
[Dm]You're making me [F(maj7)]like You, clothing me in white
[Em]Bringing beauty from [G]ashes, for You will have [F]Your bride

[C]Free of all her [G]guilt and rid of all her shame
[Dm7]And known by her true name and it's [C]why I sing

[C]You will be [G(Dm)]praised, You will be praised
[Am]With angels and [F]saints we sing [C]worthy are You Lord [x4]

[F] | [C] | [Am7] | [G] | [F] | [C] | [Am7] | [G] |`,
    notes: "Key of C. Lyrical devotion song. Build through bridges.",
    bpm: 72,
    tags: ["worship", "devotion", "love"],
  },
  {
    title: "Evidence",
    artist: "Josh Baldwin",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro}
|[G] / / /|

{Verse 1}
[Em]All throughout my [D]histo[G]ry
[Am]Your faithfulness has [G]walked beside [D]me
[Em]The winter storms [D]made way for [G]spring
[Am]In every [Em]season, from where I'm [D]standing

{Chorus}
[G]I see the evidence of [D]Your goodness
[Em]All over my [D]life, all [C]over my life
[G]I see Your promises in [D]fulfillment
[Em]All over my [D]life, all [C]over my life

{Verse 2}
[Em]Help me re[D]member [G]when I'm weak
[Am]Fear may [G]come but fear will [D]leave
[Em]You lead my [D]heart to vic[G]tory
[Am]You are my [Em]strength and You [D]always will be

{Bridge}
[C]See the cross, the [D]empty grave
[Em]The evidence is [D]end[G]less
[C]All my sin [D]rolled away
[Em]Because of [D]You, oh [G]Jesus

Oh

{Outro}
[G]So why should I [D]fear? The evidence is [Em]here
[G]Why should I [D]fear? Oh, the evidence is [Em] [C]here`,
    notes: "Key of G. Testimony song. Great for building congregational confidence.",
    bpm: 78,
    tags: ["worship", "faithfulness", "testimony"],
  },
  {
    title: "Everlasting God",
    artist: "Brenton Brown/Ken Riley",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse}
[G]Strength will rise as we [Gsus]wait upon the [G]Lord
[Gsus]We will wait upon the [G]Lord
[Gsus]We will wait upon the [G]Lord
[Gsus]Strength will rise as we [G]wait upon the Lord
[Gsus]We will wait upon the [G]Lord
[Gsus]We will wait upon the [G]Lord

{Pre-Chorus}
[G/B]Our [C]God You [G/B]reign for[C]ever [D] [Em] [D]
[G/B]Our [C]Hope our [G/B]strong De[C]liver[D] [Em] [D]er

{Chorus}
[G]You are the everlast[G/B]ing [C]God
[Em]The everlasting God
[C]You do not faint You won't grow weary
[G]You're the defender [G/B]of the [C]weak
[Em]You comfort those in need
[C]You lift us up on wings like eagles (last time: [G])

{Instrumental}
| [G] | | | [G/B] [C] | |`,
    notes: "Key of G. Upbeat praise anthem. Strong rhythm section. Build through pre-chorus to powerful chorus.",
    bpm: 120,
    tags: ["worship", "strength", "praise"],
  },
  {
    title: "Egypt",
    artist: "Bethel Music",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro}
[G]

{Verse 1}
[Em]I won't for[C]get the wonder of [G]how
[D]You brought
[Em]Deliverance, the [C]exodus of my [G]heart [D]
[Em]You found me, [C]You freed me
[G]Held back the [D]waters for my [Em]release
[C]Oh [D]Yahweh

{Chorus}
[Em]You're the God who fights for me
[C]Lord of every victory
[G]Hallelujah, [D]hallelujah
[Em]You have torn apart the sea
[C]You have led me through the deep
[G]Hallelujah, [D]hallelujah

{Instrumental}
[Em] [C] [G] [D]

{Verse 2}
[Em]A cloud by [C]day, a sign that [G]You are with me
[D]
[Em]The fire by [C]night, a guiding [G]light to my feet
[D]
[Em]You found me, [C]You freed me
[G]Held back the [D]waters for my [Em]release
[C]Oh [D]Yahweh

{Chorus} 2x

{Interlude}
[C] [D] [Em] [G]

{Bridge} * 2
[C]You stepped into my [D]Egypt, You took me by the hand
[Em]You marched me out in [G]freedom into the promised land
[C]Now I will not for[D]get You, I'll sing of all You've done
[Em]Death is swallowed up forever by the fury of Your [G]love

{Outro}
[C] [D] [Em] [Bm]`,
    notes: "Key of G. Powerful deliverance anthem. Bridge is the climax - drive it with energy.",
    bpm: 76,
    tags: ["worship", "deliverance", "praise"],
  },
  {
    title: "Enter The Gates",
    artist: "Bryan & Katie Torwalt",
    originalKey: "C",
    format: "chordpro",
    content: `{Intro}
[C] [Dm] [Am] [F]

{Verse 1}
[C]My eyes on Your faithfulness
[Am]O God let me not forget
[F]To sing in the valley
[C]To look toward Your goodness
[C]My heart set on who You are
[Am]You're the light that
[Am]Consumes the dark
[F]The joy and the strength
[C]To lift up my hands and sing

{Chorus}
[C]I enter the [Dm7]gates with nothing but thanks
[Am7]I want to magnify Your worth
[F]I want to bring You more than words
[C]I enter the [Dm7]gates, come reckless with praise
[Am7]I'll bring a heart that wants You first
[F]All for Your glory

{Verse 2}
[C]My feet on the battle ground
[Am]My weapon will be my sound
[F]I will not be silent
[C]My song is my triumph

{Bridge} * 4
[Am7]Sing, my soul [F]will sing
[C/E]My soul will make
[C/E]This place an alter
[G]Make this place an alter`,
    notes: "Key of C. Energetic praise opener. Let the bridge repeat build intensity.",
    bpm: 110,
    tags: ["worship", "praise", "gates"],
  },
  {
    title: "Fall Afresh",
    artist: "Jeremy Riddle",
    originalKey: "C",
    format: "chordpro",
    content: `{Intro}
[C] [F]

{Verse}
[C]Awaken my [F]soul, come [C]awake [F]
[C]To hunger, to [F]seek, to [Am]thirst [F]
[C]Awaken first [F]love, come [C]awake [F]
[C]And do as You [F]did at [Am]first [F]

{Chorus}
[C]Spirit of the [F]Living God come [C]fall afresh on [G]me
[Am]Come wake me from my [F]sleep
[Am]Blow through the [F]caverns of my [C]soul
[G]Pour in me to [Am]over[F]flow, [C] [G]
[C]to overflow

{Bridge} x2
[F]Come and fill this [C]place
[F]Let Your glory now in[C]vade
[F]Spirit come and [Am]fill this place
[F]Let Your glory now in[G]vade`,
    notes: "Capo 4, original key E. Prayerful invocation of the Holy Spirit. Keep gentle and building.",
    bpm: 72,
    tags: ["worship", "holy spirit", "prayer"],
  },
  {
    title: "Forever",
    artist: "Chris Tomlin",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]Give thanks to the Lord our God and King
[A]His love endures forever
[D]For He is good, He is above all things
[D]His love endures for[A]ever
[E]Sing [D2/F#]praise, sing praise

{Verse 2}
[A]With a mighty hand and outstretched arm
[A]His love endures forever
[D]For the life that's been reborn
[D]His love endures for[A]ever
[E]Sing [D2/F#]praise, sing praise

{Pre-Chorus}
[E]Sing [D2/F#]praise, sing praise

{Chorus}
[A]Forever God is [F#m7]faithful
[E]Forever God is [D]strong [A]
Forever God is with us, for[E]ever, for[A]ever

{Verse 3}
[A]From the rising to the setting sun
[A]His love endures forever
[D]And by the grace of God we will carry on
[D]His love endures for[A]ever
[E]Sing [D2/F#]praise, sing praise`,
    notes: "Key of A, Tempo 120. Upbeat praise. Driving rhythm. Also commonly played in G with capo 2.",
    bpm: 120,
    tags: ["worship", "praise", "faithfulness"],
  },
  {
    title: "Forever (Kari Jobe)",
    artist: "Kari Jobe/Brian Johnson/Christa Black Gifford/Joel Taylor/Gabriel Wilson",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]The moon and stars they [D]wept
[Em7]The morning sun was dead
[C]The Savior of the world was fallen
[G]His body on the [D]cross
[Em7]His blood poured out for us
[C]The weight of every curse upon Him

{Verse 2}
[G]One final breath He [D]gave
[Em7]As heaven looked away
[C]The Son of God was laid in darkness

{Pre-Chorus}
[G]The ground began to [D]shake
[Em7]The stone was rolled away
[C]His perfect love could not be overcome
[G/B]Now death where is [D]your sting
[Em7]Our resurrected King
[C]has rendered you defeated

{Chorus 1}
[G]Forever He is [D]glorified
[Em7]Forever He is [C]lifted high
[G]Forever He is [D]risen
[Em7]He is alive, He is [C]alive

{Bridge 1}
[G]We sing halle[D]lujah
[Em7]We sing halle[C]lujah
[G]We sing halle[D]lujah
[C]The Lamb has over[G]come`,
    notes: "Key of G, 72 BPM. Easter/resurrection anthem. Start gentle, build through pre-chorus to powerful chorus.",
    bpm: 72,
    tags: ["worship", "resurrection", "praise"],
  },
  {
    title: "For The One",
    artist: "Brian & Jenn Johnson",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]Let me be filled
[F]With kindness and com[G]passion for the [C]one
[F]The one for whom You [G]loved and gave Your [Am]son
[F]For humanity in[G]crease my [C]love

{Chorus}
[F]Help me to love with [G]open arms like You [C]do
[F]A love that erases [G]all the lines and sees the [C]truth
[F]Oh that when they [G]look in my eyes they would [Am]see You
[F]Even in just a [G]smile they would feel the [C]Father's love

{Verse 2}
[C]Oh how You love us
[F]From the homeless [G]to the famous and [C]in-between
[F]You formed us, You [G]made us care[Am]fully
[C]'Cause in [F]the end, we're [G]all Your [C]children

{Bridge}
[G]Let all my [C]life tell of [F]who You are
[G]And the wonder of Your [C]never-ending [F]love
[G]Let all my [C]life tell of [F]who You are
[G]You're wonderful and [C]such a good [F]Father.`,
    notes: "Key of C. Heart for the lost/marginalized. Gentle and building.",
    bpm: 72,
    tags: ["worship", "love", "compassion"],
  },
  {
    title: "Give Me Faith",
    artist: "Elevation Worship",
    originalKey: "C",
    format: "chordpro",
    content: `{Intro}
[C] [G] [D] [Em]

{Verse}
[G]I need You to [D]soften my [Em]heart
[C]And break me apart
[G]I need You to [D]open my eyes
[Em]To see that You're [C]shaping my life

{Pre-Chorus}
[Em]All I [C] [D]am,
[Em]I [C] [D]surrender

{Chorus}
[C]Give me faith to [G]trust what You [D]say [Em]
[C]That You're [G]good and Your [Em]love is [D]great
[Am]
[C]I'm broken in[G]side, I [D]give You my [C]life [D]

{Instrumental}
[C] [G] [Em] [D] x4

{Bridge}
[C]I may be [G]weak
[D]But Your spirit [Em]strong in me
[C]My flesh may [G]fail
[Em]My God You [D]never will (repeat)`,
    notes: "Key of C with Capo 2. Intimate surrender song. Let bridge build with confidence.",
    bpm: 72,
    tags: ["worship", "faith", "surrender"],
  },
  {
    title: "God I Look To You",
    artist: "Bethel Music",
    originalKey: "B",
    format: "chordpro",
    content: `{Verse}
[C]God I look to [G]You, I won't be overwhelmed
[F]Give me [Am]vision to [G]see things like You do
[C]God I look to [G]You, You're where my help comes from
[F]Give me wis[Am]dom; You know just [G]what to do

{Chorus (version 1)}
[F]I will love You [Dm]Lord my [G]strength
[F]I will love You [Dm]Lord my [G]shield
[F]I will love You [Dm]Lord my [G]rock for[C]ever
[F]All my days I [G]will love You [C]God

{Bridge}
[F]Hallelujah our [Am]God [G]reigns
[F]Hallelujah our [Am]God [G]reigns
[F]Hallelujah our [Am]God reigns for[G]ever [C]
[F]All my days [G]Halle[C]lujah`,
    notes: "Original key B. Commonly played C or D with capo. Simple and powerful trust declaration.",
    bpm: 72,
    tags: ["worship", "trust", "strength"],
  },
  {
    title: "Good Good Father",
    artist: "Anthony Brown/Pat Barrett",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]I've heard a [Gsus]thousand [G5]stories
[G]Of what they [Gsus]think You're [G5]like
[G]But I've heard the [Gsus]tender [G5]whisper
[G]Of love in the [Gsus]dead [G5]of night
[C2(no3)]You tell me [G/B]that You're pleased
[Am7]And that I'm [D(4)]never alone

{Chorus}
[C2]You're a good, good [G]Father
[Am7]It's who You are, [D(4)]it's who You are
[C2]And I'm loved by [G]You; it's who I am
[Am7]It's who I am, [D(4)]it's who I am

{Verse 2}
[G]I've seen many [Gsus]searching [G5]
[G]For answers far [Gsus]and [G5]wide
[G]But I know we're [Gsus]all [G5]searching
[G]For answers only [Gsus]You pro[G5]vide
[C2(no3)]Because You [G/B]know just what we need
[Am7]Before we [D(4)]say a word

{Verse 3}
[G]Love so unde[Gsus]niable [G5]
[G]I can hardly [Gsus]speak [G5]
[G]Peace so unex[Gsus]plainable [G5]
[G]I can hardly [Gsus]think [G5]
[C2(no3)]As You call me [G/B]deeper still
[Am7]As You call me [G/B]deeper still
[C2(no3)]As You call me [G/B]deeper still
[Am7]Into love, [D(4)]love, love

{Bridge}
[C2]You are perfect in [Em7]all of Your ways
[Am7]You are perfect in [G]all of Your ways
[C2]You are perfect in [Em7]all of Your [D(4)]ways to us

{Instrumental}
||: [G] | [Gsus] [G5] | [G] | [Gsus] [G5] :||`,
    notes: "Key of G, Tempo 48, Time 6/8. Gentle identity song. Let the 6/8 feel carry the warmth.",
    bpm: 48,
    tags: ["worship", "identity", "father"],
  },
  {
    title: "Goodness Of God",
    artist: "Ed Cash/Ben Fielding/Jason Ingram/Brian Johnson/Jenn Johnson",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro}
[G] / / [Gsus] | [G] | [G] / / [Gsus] | [G] |

[G]I love You, Lord, [C]for Your mercy [G]never fails me
[Em]All my [C]days, I've been [Dsus]held in Your [D]hands
[Em]From the [C]moment that I [G]wake up, until I [D/F#]lay my [Em]head
[C]Oh, I will [Dsus]sing of the [G]good[Gsus]ness of God

[C]And all my life You have been [G]faithful
[C]And all my life You have been [G]so, so [D]good
[C]With every [G]breath that I am [D/F#]able [Em]
[C]Oh, I will [D]sing of the [G]good(Em)ness of God

[G]I love Your [C]voice, You have [G]led me through the fire
[Em]And in [C]darkest night You are [Dsus]close like no [D]other
[Em]I've known You as a [C]Father, I've known You as a [G]Friend
[C]And I have lived in the [Dsus]goodness of [G]God

{Bridge}
[G/B]'Cause Your goodness is [C]running after, it's [D]running after [G]me
[G/B]Your goodness is [C]running after, it's [D]running after [G]me
[G/B]With my life laid [C]down, I'm surren[D]dered now, I give You every[Em]thing
[G/B]'Cause Your goodness is [C]running after, it's [D]running after me [G] ([C] [G])
[x2]

[C]Oh, I'm gonna [D]sing of the [G]goodness of God`,
    notes: "Key of G, 72 BPM. Powerful testimony anthem. Bridge is the peak - drive it with energy.",
    bpm: 72,
    tags: ["worship", "faithfulness", "testimony"],
  },
  {
    title: "Gratitude",
    artist: "Brandon Lake/Dante Bowe/Benjamin Hastings",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[G]All my words fall short
[Em]I got nothing new
[D]How could I express
[C]All my gratitude?

{Verse 2}
[G]I could sing these songs
[Em]As I often do
[D]But every song must end
[C]And You never do

{Chorus}
[G]So I throw up my hands
[D]And praise You again and again
[D]'Cause all that I have is a
[C]Hallelujah, [Em]halle[D]lujah
[G]And I know it's not much
[D]But I've nothing else fit for a King
[D]Except for a heart singing
[C]Hallelujah, hallelu[Em]-[D]jah

{Verse 3}
[G]I've got one response
[Em]I've got just one move
[D]With my arms stretched wide
[C]I will worship You

{Bridge} x3
[G]Oh, come on my soul,
[D]oh, don't you get shy on me
[C]Lift up your song, 'cause you've got a lion
inside of those lungs
[G]Get up and praise the [Em]Lo[D]rd

{Interlude}
| [C] | [C] | [Em] | [D] |`,
    notes: "Key of D, original B. Tempo 52, 6/8 feel. Joyful gratitude anthem. Bridge is high-energy - let the band drive it.",
    bpm: 52,
    tags: ["worship", "gratitude", "praise"],
  },
  {
    title: "Graves Into Gardens",
    artist: "Elevation Worship/The Worship Initiative",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro}
[G] [C/G]
[G]

{Verse 1}
[C/G]I searched the [G]world
[C/G]But it couldn't [G]fill me
[Em]Man's empty praise
[D]And treasures that [C]fade
(are) never enough

{Verse 2}
[C/G]Then You came a[G]long
[C/G]And put me back to[G]gether
[Em]And every de[D]sire is now satisfied
[C]Here in Your love

{Chorus}
[G]Oh there's nothing better than [Em]You
There's nothing better than [C]You
Lord there's nothing
[G]Nothing is better than You

{Verse 3}
[C/G]I'm not a[G]fraid
[C/G]To show You my [G]weakness
[Em]My failures and [D]flaws
Lord You've seen them all
[C]And You still call me friend

{Verse 4}
[G]'Cause the God of the mountain
[C/G]Is the God of the [G]valley
[Em]There's not a place
[D]Your mercy and grace
[C]Won't find me again

{Chorus} * 2

{Bridge} * 2
[G]You turn mourn[C]ing to [G]dancing
[C]You give beauty for [G]ashes
[C]You turn shame into glory
[Em]You're the [C]only one who [G]can`,
    notes: "Key of G, Capo 3. Powerful transformation anthem. Bridge builds to highest point of the song.",
    bpm: 80,
    tags: ["worship", "transformation", "praise"],
  },
  {
    title: "Great Is Thy Faithfulness",
    artist: "Traditional Hymn",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[G]Great is Thy [C]faith[D]fulness, O God my [G]Father,
[C]There is no [G]shadow of [A]turning with [D]Thee;
[D]Thou changest [G]not, Thy compassions they [Am]fail not
[C]As Thou hast [G]been [D]Thou for[G]ever wilt be.

{Chorus}
[D]Great is Thy [G]faithfulness!
[E]Great is Thy [Am]faithfulness!
[D]Morning by [G]morning new [D]mercies I [A] [D]see.
[D]All I have [G]needed Thy [Am]hand hath provided
[C]Great is Thy [G]faith[D]fulness, Lord [G]unto me.

{Verse 2}
[G]Summer and [C]winter, and [D]springtime and [G]harvest,
[C]Sun, moon, and [G]stars in their [A]courses above
[D]Join with all [G]nature in [Am]manifold witness
[C]To Thy great [G]faithful[D]ness, mercy and [G]love.

{Verse 3}
[G]Pardon for [C]sin and a [D]peace that en[G]dureth,
[C]Thy own dear [G]presence to [A]cheer and to [D]guide.
[D]Strength for [G]today and bright hope for [Am]tomorrow
[C]Blessings all [G]mine, with ten [D]thousand [G]beside.`,
    notes: "Classic hymn. Key of D. Stately and reverent. Full congregational singing.",
    bpm: 84,
    tags: ["hymn", "faithfulness", "classic"],
  },
  {
    title: "Holy Spirit",
    artist: "Bryan Torwalt/Katie Torwalt",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro}
[D] | [D] | [GM7] | [G] | [x2]

[D]There's nothing worth more that will [G]ever come close
[D]No thing can compare, You're our [D]living hope
[G]Your Presence

[D]I've tasted and seen, of the [G]sweetest of Loves
[D]Where my heart becomes free, and my shame is undone
[G]In Your Presence Lord

[D]Holy Spirit You are welcome here
[G]Come flood this place and [Em]fill the atmosphere
[D]Your Glory, God is what our hearts long for
[G]To be overcome by [Em]Your Presence Lord

[D]Your Pres[Dsus]ence [D]Lord [GM9] [Em]

{Bridge}
[G]Let us become more [D/F#]aware of Your [Em]Presence
[G]Let us experience the [D/F#]Glory of Your [Em]Goodness [D/F#] [repeat]
[last time] [GM7] | [GM7] |`,
    notes: "Key of D originally, also played G with capo 2. Intimate worship invocation. Let moments breathe.",
    bpm: 72,
    tags: ["worship", "holy spirit", "presence"],
  },
  {
    title: "Hosanna",
    artist: "Hillsong United",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro}
[Em] [G] [Am] [Bm]
[Em] [G] [Am] [Bm]

{Verse 1}
[G]I see the king of glory
[Em]Coming on the clouds with fire
[Am]The whole earth [D]shakes, [Em]the whole earth shakes
[G]I see His love and mercy
[Em]Washing over all our sin
[Am]The people [D]sing, the people sing

{Chorus}
[G]Hosanna, [C]hosanna [D] [Em]
[C]Hosanna in the [Em]highest [D]
[G]Hosanna, [C]hosanna [D] [Em]
[C]Hosanna in the [Em]highest [G]

{Verse 2}
[G]I see a generation
[Em]Rising up to take the place
[Am]With selfless [D]faith, with selfless faith
[G]I see a new revival
[Em]Stirring as we pray and seek
[Am]We're on our [D]knees, we're on our knees

{Instrumental}
[Em] [G] [Am] [Bm]

{Bridge}
[C]Heal my heart and [D]make it clean
[G]Open up my [Em]eyes to the things unseen
[C]Show me how to [D]love like You have loved me
[C]Break my heart for what [D]is yours
[G]Everything I [Em]am for your kingdom's cause
[C]As I walk from [D]earth into [Em]eternity`,
    notes: "Key of G, Capo 4 for original key B. Revival anthem. Build through verses to bridge climax.",
    bpm: 105,
    tags: ["worship", "praise", "revival"],
  },
  {
    title: "House Of The Lord",
    artist: "Phil Wickham/Jonathan Smith",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro x2}
[G] [G2] [G] [Dsus] [C] [C6] [C] [Dsus]

{Verse 1}
[G]We worship the God who was, we worship the God who is
[Em]We worship the God who ever[Dsus]more will [C]be
[G]He opened the prison doors, He parted the raging sea
[G]My [Em]God, He holds the vic[Dsus]to[C]ry

{Chorus 1}
[G]There's joy in the house of the Lord
[Dsus]There's [C2]joy in the house of the Lord today
[C]And we won't be quiet, we shout out Your praise
[G]There's joy in the house of the Lord
[C]Our God is [F]surely in this place
[F]And we won't be quiet, we shout out Your [C]praise

{Verse 2}
[G]We sing to the God who heals, we sing to the God who saves
[Em]We sing to the God who always [Dsus]makes a [D]way
[C]'Cause He hung upon that Cross, [Dm]then He rose up from that grave
[Am]My God's still [G]rolling stones a[F]way

{Bridge}
[Am7]Cause He hung upon that cross then
[Em]He rose up from that [D]grave
[Am7]My God's still [C]rolling stones away
[G]There's joy in the house of the Lord
[Dsus]There's [C2]joy in the house of the Lord today`,
    notes: "Key of G, Capo 3. High-energy joy anthem. Don't hold back on the chorus energy.",
    bpm: 130,
    tags: ["worship", "joy", "praise"],
  },
  {
    title: "Here I Am To Worship",
    artist: "Tim Hughes",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]Light of the [Gsus]world You stepped [Dm]down into darkness
[C]Opened my [Gsus]eyes let me [F2(no3)]see
[C]Beauty that [Gsus]made this [Dm]heart adore You
[C]Hope of a [Gsus]life spent [F2(no3)]with You

{Chorus}
[G7sus]So here I am to [C]worship
[G/B]Here I am to bow down
[C/E]Here I am to [F]say that You're my God
[C]And You're altogether lovely
[G/B]Altogether worthy
[C/E]Altogether [F]wonderful to [F2(no3)]me (To Verse)
[F] (To Bridge)

{Verse 2}
[C]King of all [Gsus]days oh so [Dm]highly exalted
[C]Glorious in [Gsus]heaven [F2(no3)]above
[C]Humbly You [Gsus]came to the [Dm]earth You created
[C]All for love's [Gsus]sake be[F2(no3)]came poor

{Bridge}
[G/B]And I'll [C/E]never know how [F]much it cost
[G/B]To see my [C/E]sin upon that [F]cross`,
    notes: "Key of C, Tempo 65. Classic worship song. Also played in D. Simple and reverent.",
    bpm: 65,
    tags: ["worship", "adoration", "classic"],
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
