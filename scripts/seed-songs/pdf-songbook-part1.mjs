#!/usr/bin/env node
/**
 * Seed PDF songbook worship songs (Part 1: A–D) into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/pdf-songbook-part1.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "10000 Reasons",
    artist: "Rend Collective",
    originalKey: "G",
    format: "chordpro",
    content: `{Chorus}
[C]Bless the [G]Lord, [D]O my [Em]soul,
[D]O [Em]my soul,
[C]Worship [G]His [D]holy [Em]name.
[C]Sing like [G]never be[Em]fore,
[D]O [Em]my soul,
[C]I'll worship [G]Your [D]holy [Em]name.

{Verse 1}
[C]The [G]sun comes [D]up, it's a [Em]new day dawning;
[C]It's [G]time to [D]sing Your [Em]song again.
[C]What[G]ever may [D]pass, and what[Em]ever lies before me,
[C]Let me be [G]singing when the [D]evening comes.

{Verse 2}
[C]You're [G]rich in [D]love, and You're [Em]slow to anger.
[C]Your [G]name is [D]great, and Your [Em]heart is kind.
[C]For [G]all Your [D]goodness, I will [Em]keep on singing;
[C]Ten thousand [G]reasons for my [D]heart to [Em]find.

{Verse 3}
[C]And on [G]that day [D]when my [Em]strength is failing,
[C]The end [G]draws near, and my [D]time has [Em]come;
[C]Still my [G]soul will sing Your [D]praise un[Em]ending:
[C]Ten thousand [G]years and then [D]forever[Em]more!`,
    notes: "Key of G, Capo 2 for original key Bb. Strong congregational song - build dynamics through verses.",
    bpm: 73,
    tags: ["worship", "praise", "thanksgiving"],
  },
  {
    title: "Angels We Have Heard On High",
    artist: "Traditional Christmas",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Angels we have [D7]heard on [G]high
[G]Sweetly singing [D7]o'er the [G]plains
[G]And the mountains [D7]in re[G]ply
[G]Echoing their [D7]joyous [G]strains

{Refrain}
[G]Glo[Am]ria [G]in ex[D]celsis De--o
[G]Glo[Am]ria [G]in ex[D]celsis De--o

{Verse 2}
[G]Shepherds, why this [D7]jubi[G]lee?
[G]Why your joyous [D7]strains pro[G]long?
[G]What the gladsome [D7]tidings [G]be
[G]Which inspire your [D7]heavenly [G]song?

{Verse 3}
[G]Come to Bethle[D7]hem and [G]see
[G]Him whose birth the [D7]angels [G]sing
[G]Come, adore on [D7]bended [G]knee
[G]Christ the Lord, the [D7]newborn [G]King`,
    notes: "Traditional Christmas hymn. Key of G. Gloria section builds with full choir feel.",
    bpm: 120,
    tags: ["hymn", "christmas", "praise"],
  },
  {
    title: "Above All",
    artist: "Michael W. Smith",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[C]Above all [F]powers, [G]Above all [C]Kings
[F]Above all [G]nature, and all [C]created things
[Am]Above all [G]wisdom, and all the [F]ways of [C]man
[Dm]You were [F]here before the [G]world be[C]gan

{Verse 2}
[C]Above all [F]kingdoms, [G]Above all [C]thrones
[F]Above all [G]wonders this world has [C]ever known
[Am]Above all [G]wealth and treasures [F]of the [C]earth
[Dm]There's no [F]way to measure [E7]what You're [E]worth

{Chorus}
[C]Cruci[Dm]fied, [G]laid behind a [C]stone
[C]You lived to [Dm]die, re[G]jected and a[C]lone
[Am]Like a [G]rose, trampled [F]on the [C]ground
[Dm]You took the [Am]fall, and thought of [F]me
[C]Above all

{Coda}
[Am]Like a [G]rose, trampled [F]on the [C]ground
[Dm]You took the [Am]fall, and thought of [F]me
[C]Above all`,
    notes: "Key of Bb, commonly played with Capo 3 in C shapes. Slow, reverent. Build to chorus climax.",
    bpm: 68,
    tags: ["worship", "devotion", "cross"],
  },
  {
    title: "Abandoned",
    artist: "Benjamin William Hastings",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro}
[G]

{Verse 1}
[G]Something isn't adding up
[D]This wild exchange You offer us
[Em]I gave my [D]worst, You gave Your blood
[C]Seems hard to believe

{Verse 2}
[G]You're telling me You chose the cross?
[D]You're telling me I'm worth that much?
[Em]If [D]that's the measure of Your love
[C]How else would I sing but

{Chorus}
[Em]Completely, [D]deeply, sold out
[C]Sincerely [G]abandoned
[Em]I'm completely, [D]freely, hands to the
[C]ceiling en[G]amored
[Em]My one life en[D]deavor, to match Your surrender
[C]To mirror not my will, but [G]Yours
[Em]I'm completely, [D]deeply, don't care
[C]who sees me abandoned

{Refrain}
[G]Oh, I [Em]surrender all
[D]I [C]surrender all
[G]I [Em]sur[D]render [C]all

{Bridge 1}
[G]The whole of my heart
The best of my soul
[D]Each phase of my life
Each breath in my lungs
[Am]Consider it Yours, Lord
[C]Consider it [D]Yours, Lord

{Bridge 2}
[G]The failures I hide
The victories I don't
[D]The battles I fight
Each crown that I hoard
[Am]Consider it Yours, Lord
[C]Consider it [D]Yours, Lord

{Bridge 3}
[Em]All the glory forever
The grave that You won
[D]The praise of the heavens
The kingdom to come
[Am]Consider it Yours, Lord
[C]Consider it [D]Yours, Lord`,
    notes: "Key of G. Intimate worship song that builds through bridges. Let the 'Consider it Yours' sections crescendo.",
    bpm: 76,
    tags: ["worship", "surrender", "devotion"],
  },
  {
    title: "At The Cross",
    artist: "Hillsong Worship",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro}
| [C] [G] [C] | [D] | x4

{Verse 1}
[G]Oh Lord You've [C]searched [D]me
[G]You know my [C]way [D]
[G]Even when I [C]fail [D]You
[C]I know You [D]love me

{Verse 2}
[G]Your holy [C]pres[D]ence [Em]surrounding me
[G]In every [C]sea[D]son
[G]I know You [C]love [D]me
[C]I know You [D]love me

{Chorus}
[G]At the cross I [D]bow my [Em]knee
Where Your [G]blood was [C]shed for me
[D]There's no greater love than this
[G]You have over[D]come the [Em]grave
Your [G]glory fills the [C]highest place
[D]What can separate me now

[Chorus] * 2

[Bridge] * 2
[C]You [D]tore the veil, You [Em]made a way
[C]When You [Em]said that it is [D]done

{Verse 3}
[G]You go be[C]fore [D]me [Em]
[G]You shield my [C]way [D]
[G]Your hand up[C]holds [D]me [Em]
[C]I know You [D]love me

{Verse 4}
[G]And when the [C]earth [D]fades [Em]
[G]Falls from my [C]eyes [D]
[G]And You stand be[C]fore [D]me [Em]
[C]I know You [D]love me
[C]I know You [D]love me

{Outro}
| [C] [G] [C] | [D] (hold)`,
    notes: "Key of G, Capo 2 original key A. Starts intimate, builds to powerful chorus. Let bridge build dynamically.",
    bpm: 70,
    tags: ["worship", "cross", "devotion"],
  },
  {
    title: "Available",
    artist: "Elevation Worship",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]Narrow as the road may [G]seem
[Em]I'll follow where Your [C]spirit leads
[C]Broken as my life may [G]be
[Em]I will give You [C]every piece

{Chorus}
[G]I hear [Em]You call
[D]I am [C]available
[G]I say [Em]yes Lord
[D]I am [C]available

{Verse 2}
[C]Here I am with [G]open hands
[Em]Counting on Your [C]grace again
[C]Less of me and [G]more of You
[Em]I just wanna [C]see You move

{Instrumental}
[G] [Em] [D] [C]

{Bridge}
[G]Here I am, [Em]here I am
[C]You can have it all
[C]You can have it all

{Verse 3}
[C]For the one who gave me [G]life
[Em]Nothing is a [C]sacrifice
[C]Use me how You [G]want to God
[Em]Have Your throne within [C]my heart`,
    notes: "Key of C. Congregational surrender song. Keep dynamics flowing through verse to chorus.",
    bpm: 72,
    tags: ["worship", "surrender", "obedience"],
  },
  {
    title: "Alabare Al Senor",
    artist: "Hillsong en Espanol",
    originalKey: "C",
    format: "chordpro",
    content: `{Intro}
[C] [F] x2

{Verse 1}
[C]Recordare aquella cruz
[G]donde sangro y [Am]murio Jesus
[F]Heridas que por [C]mi sufrio
[G]Crucificado [C]Sal[F]vador.

{Verse 2}
[C]Su cuerpo envuelto en dolor
[G]En el se[Am]pulcro reposo
[F]En soledad [C]El se quedo
[G]Jesus, Mesias, el [C]Se[F]nor

{Chorus}
[C]Alabare al [F]Senor, mi [C]Dios
[Am]Tu nombre yo [G]proclamare
[C]Eternamente te [F]can[Am]tare
[F]Senor, [G]Senor, mi [C]Dios.

{Verse 3}
[C]Pero al tercer amanecer
[G]un gran [Am]estruendo se escucho
[F]Donde esta, [C]muerte, tu aguijon?
[G]Cristo Jesus [C]resucito.

{Verse 4}
[C]Muy pronto El regresara
[G]Su rostro res[Am]plandeckera
[F]En su pre[C]sencia estare
[G]y cara a [C]cara le vere.

{Instrumental}
[C] [F] [C] [Am] [G]
[C] [F] [Am] [F] [G] [C]

{Ending}
[C]Alabare al [F]Senor, mi [C]Dios
[Am]Tu nombre yo [G]proclamare
[C]Eternamente [F]te can[Am]tare
[F]Senor, [G]Senor, mi [C]Dios.
[F]Senor, [G]Senor, mi [C]Dios.`,
    notes: "Spanish worship song. Key of C. Joyful and celebratory. Great for bilingual services.",
    bpm: 120,
    tags: ["worship", "spanish", "praise"],
  },
  {
    title: "Battle Belongs",
    artist: "Phil Wickham",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro/Turnaround}
||: [G] | [G] . [Gsus] [G] :||

{Verse 1}
[G]When all I see is the battle,
[C2]You see my victo[Em7]ry
[Dsus]When all I see is a moun[C2]tain moved
[G]And as I walk through the shadow,
[C2]Your love sur[Em7]rounds me
[Dsus]There's nothing to fear [G]now
For I am safe with You

{Chorus}
[C2]So when I [G]fight, I'll fight on my [D]knees
[Em7]With my hands lifted high
[C2]O [G]God, the battle be[D]longs to [Em7]You
[C2]I'll [G]sing through the night
[C2]O [G]God

{Verse 2}
[G]And if You are for me,
[C2]Who can be a[Em7]gainst me?
[Dsus]For Jesus, there's nothing
Im[C2]possible for You
[G]When all I see are the ashes,
[C2]You see the beau[Em7]ty
[Dsus]When all I see is a [G]cross,
God, You see the emp[C2]ty tomb

{Bridge}
[C]Almighty [G]Fortress, You go be[Dsus]fore us
[Em7]Nothing can stand a[Dsus]gainst the power of our [C]God
[C]You shine in the [G]shadows, You win ev'ry [Dsus]battle
[Em7]Nothing can stand a[Dsus]gainst the power of our God

{Tag}
[C2]O [G]God, the battle be[D]longs to [G]You

{Outro}
| [G] | [G] . [Gsus] [G] | [G] |`,
    notes: "Key of G, Tempo 81. Powerful declaration song. Build through verses to explosive chorus/bridge.",
    bpm: 81,
    tags: ["worship", "spiritual warfare", "faith"],
  },
  {
    title: "Blessed Be Your Name",
    artist: "Matt Redman",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Blessed be Your [D]name
[Em7]In the land that [C]is plentiful
[G]Where Your streams of a[D]bundance flow
[C]Blessed be Your name

{Verse 2}
[G]Blessed be Your [D]name
[Em7]When I'm found in the [C]desert place
[G]Though I walk through the [D]wilderness
[C]Blessed be Your name

{Pre-Chorus}
[G]Every blessing You [D]pour out I'll
[Em7]Turn back to [C]praise
[G]When the darkness [D]closes in, Lord
[Em7]Still I will [C]say

{Chorus}
[G]Blessed be the [D]name of the Lord
[Em7]Blessed be [C]Your name
[G]Blessed be the [D]name of the Lord
[Em7]Blessed be Your [D]glo[C]rious [G]name

{Verse 3}
[G]Blessed be Your [D]name
[Em7]When the sun's shining [C]down on me
[G]When the world's all as it [D]should be
[C]Blessed be Your name

{Verse 4}
[G]Blessed be Your [D]name
[Em7]On the road marked with [C]suffering
[G]Though there's pain in the [D]offering
[C]Blessed be Your name

{Bridge}
[G]You give and take a[D]way
[Em7]You give and take a[C]way
[G]My heart will choose to [D]say
[Em7]Lord blessed be [C]Your name`,
    notes: "Key of G, Tempo 116. Classic congregational anthem. Keep strong rhythm throughout.",
    bpm: 116,
    tags: ["worship", "praise", "faithfulness"],
  },
  {
    title: "Better Word",
    artist: "Leeland",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Your blood is healing every wound
[Em]Your blood is making all things new
[C]Your blood speaks a [G]better word

{Verse 2}
[G]Your blood, the measure of my worth
[Em]Your blood, more than I deserve
[C]Your blood speaks a better word
[D]Speaks a better word

{Chorus}
[G]It's singing out with life
[Em]It's shouting down the lies
[C]It echoes through the night

The precious blood of Christ
[Em]Speaks a [D]better word, speaks a better word

{Chorus 2}
[G]It's singing out with life
[Em]It's shouting down the lies
[C]It echoes through the night

The precious blood of Christ
[Em]Speaks a [D]better word, speaks a better word

{Verse 3}
[G]Your blood a robe of righteousness
[Em]Your blood my hope and my defense
[C]Your blood forever covers me
[D]Forever covers me

{Instrumental}
[C] [Em] [D] [G]

{Bridge}
[C]It's rewriting my history
[Em]It covers me with destiny
[D]It's making all things right
[G]The precious blood of Christ

[C]It's rewriting my history
[Em]It covers me with destiny
[D]It's making all things right
[G]The precious blood of Christ`,
    notes: "Key of G. Powerful declaration about the blood of Christ. Build through bridge sections.",
    bpm: 80,
    tags: ["worship", "blood of christ", "praise"],
  },
  {
    title: "Be Still",
    artist: "Hillsong Worship",
    originalKey: "E",
    format: "chordpro",
    content: `{Intro}
[C] [Dm] [Am] [F]
[C] [Dm] [Am] [F]

{Verse 1}
[C]Be still and [Dm]know
[Am]That the Lord is in [F]control
[C]Be still my [Dm]soul
[Am]Stand and watch as [F]giants fall

{Chorus}
[C]I won't be afraid
[Dm]For You are here
[Am]You silence all my [F]fear
[C]I won't be afraid
[Dm]You don't let go
[Am]Be still my heart and [F]know
[C]I won't be [Dm]a[Am]fraid [F]

{Verse 2}
[C]Be still and [Dm]trust
[Am]What the Lord has [F]said is done
[C]Find rest don't [Dm]strive
[Am]Watch as faith and [F]grace align

{Bridge 1} *4
[C]Surely love and [Dm]mercy
Your peace and [Am]kindness
Will follow [F]me

{Interlude}
[C] [Dm] [Am] [F]

{Bridge 2}
[C]Your love [Dm]sur[Am]rounds me
[F]Your love sur[C]rounds me [Dm]here
[Am]Your love surrounds me
[F]Your love sur[C]rounds me [Dm]here [Am]
[F]Your love surrounds me here

{Breakdown}
[C] [Dm] [Am] [F]

{Outro}
[C] [Dm] [Am] [F]
[C] [Dm] [Am] [F]
[C]`,
    notes: "Key of E originally, commonly played with capo in C shapes. Intimate, building worship moment.",
    bpm: 72,
    tags: ["worship", "trust", "peace"],
  },
  {
    title: "Break Every Chain",
    artist: "Will Reagan",
    originalKey: "Bm",
    format: "chordpro",
    content: `{Intro}
[Em] / [C] / | [G] / [D] / | [Em] / [C] / | [G] / / /

{Chorus 1}
[Em]There is [C]power in the [G]name of [D]Jesus [3x]
[Em]To break every chain, to [C]break every chain,
[G]To break [D]every chain

{Tag}
[Em] / [C] / | [G] / [D] / [repeat]

{Verse}
[Em]All suf[C]ficient [G]sacri[D]fice so [Em]freely [C]given
[G]Such a [D]price [Em]bought our [C]re[G]demp[D]tion
[Em]Heaven's [C]gates swing [G]wide [D]

{Chorus 2}
[Em]There's an [C]army [G]rising [D]up [8x]
[Em]To break every chain, to [C]break every chain,
[G]To break [D]every chain

{Ending}
[Em]There's power in the [C]Name of [G]Je[D]sus`,
    notes: "Key of Bm, commonly played with capo 2 in Em shapes. High-energy declaration. Build through choruses.",
    bpm: 75,
    tags: ["worship", "freedom", "spiritual warfare"],
  },
  {
    title: "Build My Life",
    artist: "Brett Younker/Karl Martin/Kirby Elizabeth Kaple/Matt Redman/Pat Barrett",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro}
[G] [C] [G/B] [C]

{Verse 1}
[G]Worthy of ev'ry [C]song we could ever sing
[G/B]Worthy of all the [C]praise we could ever bring
[G]Worthy of ev'ry [C]breath we could ever breathe
[G/B]We [C]live for You

{Verse 2}
[G]Jesus the name a[C]bove ev'ry other name
[G/B]Jesus the only [C]One who could ever save
[G]Worthy of ev'ry [C]breath we could ever breathe
[G/B]We [C]live for You, we live for You

{Chorus}
[C]Holy, there is no [Am]one like You, there is [G/B]none beside You
[Em]Open up my eyes in wonder
[C]And show me who You [Am]are and fill me with Your heart
[G/B]And lead me in Your [Em]love to those around me

{Bridge}
[A]I will [B]build my [Em]life upon Your love
[G/B]It is a firm foundation
[A]I will [B]put my [Em]trust in You alone
[G/B]And I will not be shaken`,
    notes: "Key of G originally, also played in C with capo. Builds beautifully from intimate to powerful.",
    bpm: 68,
    tags: ["worship", "devotion", "foundation"],
  },
  {
    title: "Christ Be All Around Me",
    artist: "David Leonard/Jack Mooring/Leeland Mooring/Leslie Jordan",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro}
| [G] | [Bm/F#] | [Em] | [C] |

{Verse 1}
[G]As I rise [Bm/F#]strength of God [Em]go before [C]lift me up
[G]As I wake [Bm/F#]eyes of God [Em]look upon [C]be my sight

{Verse 2}
[G]As I wait [Bm/F#]heart of God [Em]satisfy [C]and sustain
[G]As I hear [Bm/F#]voice of God [Em]lead me on [C]be my [D]guide

{Chorus 1}
[C]Above and be[G]low me, be[Em]fore and be[D]hind me
[C]In every eye that [G]sees me, Christ be [D]all a[Em]round me
[C]Above and be[G]low me, be[Em]fore and be[D]hind me
[C]In every eye that [G]sees me, Christ be [D]all a[Em]round [C]me yeah

{Verse 3}
[G]As I go [Bm/F#]hand of God [Em]my defense [C]by my side
[G]As I rest [Bm/F#]breath of God [Em]fall upon [C]bring me [D]peace

{Interlude}
[G]Oh [Em]oh [D]Christ be all around [Em]me [C]yeah

{Bridge}
[D]Your life Your death Your [Em]blood was shed
[C]For every [G]moment ev'ry [D]moment`,
    notes: "Key of G, Tempo 75. Prayerful song for God's presence. Build dynamics through the interlude.",
    bpm: 75,
    tags: ["worship", "presence", "devotion"],
  },
  {
    title: "Christ Is Enough",
    artist: "Jonas Myrin/Reuben Morgan",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro}
| [G] ||: [Em] | [C] | [G] | [Dsus/F#] :||

{Verse 1}
[Em]Christ is my re[C]ward
[G]And all of my de[D/F#]votion
[Em]Now there's nothing in this [C]world
[G]That could ever [D/F#]satisfy
[Bm]Through every [C]trial
[G/B]Through every [C]storm [Em] [D]
No turning back I've been set free

{Chorus}
[G]Christ is e[Gsus]nough for [G]me
[Em7]Christ is e[D]nough for me
[C]Ev'rything I [D]need is in [Em]You
[C]Ev'rything I [D]need

{Verse 2}
[Em]Christ my all in [C]all the joy of my sal[G]vation [D/F#]
[Em]And this hope will [C]never fail
[G]Heaven is our [D/F#]home
[Bm]Through every [C]trial
[G/B]Through every [C]storm [Em] [D]
Jesus is here to God be the glory

{Bridge 1A}
[G]I have de[Gsus]cided to [G2(no3)]follow Je[G]sus
[C]No turning [Cmaj7]back [D]no turning back
[G]I have de[Gsus]cided to [G2(no3)]follow Je[G]sus
[C]No turning [D]back no [G]turning back

{Bridge 2}
[Em]The cross be[C]fore me the [D]world be[Em]hind me
[C]No turning [Em]back [D]no turning back
[Em]The cross be[C]fore me the [D]world be[Em]hind me
[C]No turning [D]back no [G]turning back`,
    notes: "Key of G, Tempo 82. Declaration song. Bridge builds with 'I have decided' anthem feel.",
    bpm: 82,
    tags: ["worship", "contentment", "faith"],
  },
  {
    title: "Champion",
    artist: "Bethel Music",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Intro}
[G] [Em] [G/D] [D] x2

{Verse 1}
[G]I've tried so [Em]hard to see it
[Em]Took me so long to believe it
[G/D]That You'd choose someone like me
[C]To carry Your victory

{Verse 2}
[G]Perfection could never earn it
[Em]You give what we don't deserve and
[G/D]You take the broken things
[C]And raise them to glory

{Chorus 1}
[G]You are my [D]champion
[Em]Giants fall when You [G/B]stand
[C]Undefeated [Em]every [D]battle You've won
[G]I am who You [D]say I am
[Em]You crown me with [G/B]confidence
[C]I am seated in [Em]the heavenly [D]place
[C]Undefeated with the [Em]One who has [D]conquered it all

{Verse 3}
[G]Now I can finally see it
[Em]You're teaching me how to receive it
[G/D]So let all the striving cease
[C]This is my victory

{Link}
[C] [D] [Em] [D/F#] [G] [D] [G/B]

{Bridge} * 2
[C]When I [D]lift my voice and [Em]shout
[D/F#]Every wall comes [G]crashing down
I have the authority
[D]Jesus has [G/B]given me
[C]When I [D]open up my [Em]mouth
[D/F#]Miracles start [G]breaking out
I have the authority
[D]Jesus has [G/B]given me

{Chorus 2}
[G]You are my [D]champion
[Em]Giants fall when You [G/B]stand
[C]Undefeated [Em]every [D]battle You've won
[G]I am who You [D]say I am
[Em]You crown me with [G/B]confidence
[C]I am seated in [Em]the heavenly [D]place
[C]Undefeated by the [Em]power of Your [D]name
[C]I am seated in [Em]the heavenly [D]place
[C]Undefeated with the [Em]One who has [D]conquered it all`,
    notes: "Original key Bb, Capo 3. Powerful identity/victory anthem. Build through bridge dynamically.",
    bpm: 76,
    tags: ["worship", "victory", "identity"],
  },
  {
    title: "Days Of Elijah",
    artist: "Robin Mark",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro}
[G] [C] [G] [C] [D]
[G] [C] [G] [C] [D]

{Verse}
[G]These are the days of [C]Elijah,
[G]Declaring the [D]word of the [G]Lord.
[G]And these are the days of Your [C]servant, Moses,
[G]Righteousness [D]being re[G]stored.
[Bm]And though these are [Em]days of great trials,
[C]Of famine and [D]darkness and sword,
[G]Still, we are the [C]voice in the desert crying,
[Em]"Prepare ye the [D]way of the [G]Lord!"

{Chorus}
[D]Behold he [G]comes, riding on the [C]clouds,
[G]Shining like the [D]sun at the trumpet call.
[D]So lift your [G]voice, it's the year of jubilee,
[G]And out of [D]Zion's hill, sal[G]vation comes.

{Verse 2}
[G]And these are the days of [C]Ezekiel,
[G]The dry bones [D]becoming as [G]flesh.
[G]And these are the days of Your [C]servant, David,
[G]Rebuilding the [D]temple of [G]praise.
[Bm]And these are the [Em]days of the harvest,
[C]The fields are as [D]white in the world.
[G]And we are the [C]laborers in Your vineyard,
[Em]Declaring the [D]word of the [G]Lord!

{Final Chorus}
[G]There is no God like Je[C]hovah,
[G]There is no God like Je[D]hovah.
[G]There is no God like Je[C]hovah,
[G]There is no God like Je[D]hovah.

(repeat 3x, change to A and repeat chorus 2x or more)`,
    notes: "Key of G, Capo 2 for original Bb. High energy praise. Great opener. Build to final 'no God like Jehovah' section.",
    bpm: 130,
    tags: ["worship", "praise", "declaration"],
  },
  {
    title: "Do It Again",
    artist: "Elevation Worship",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro}
[CM7] [G/B] [G/B]

{Verse 1}
[CM7]Walking around these [G/B]walls
[G/B]I thought by now they'd [C6]fall
[C6]But You have never [G]failed me yet

{Verse 2}
[CM7]Waiting for change to [G/B]come
[G/B]Knowing the battle's [C6]won
[C6]For You have never [G]failed me yet

{Chorus}
[C/E]Your promise still [D/F#]stands
[G]Great is Your faithful[C]ness, faithfulness
[C/E]I'm still in Your [D/F#]hands
[G]This is my confidence, You've never [C]failed me yet

{Turnaround}
[G/B] [C] [G/B] [C]

{Verse 3}
[CM7]I know the night won't [G/B]last
[G/B]Your word will come to [C6]pass
[C6]My heart will sing Your [G]praise again

{Bridge} * 3
[G/B]I've seen You [C]move
[G/B]You move the [C]mountains
[D/F#]And I [G]believe
[G/B]I'll see You do it a[C]gain

[G/B]You made a [C]way
[D/F#]When there [G]was no [G/B]way
[C]And I believe
[D/F#]I'll see You do it a[C]gain

{Ending}
[G/B] [C] [G/B] [C]
You've never [G/B]failed me [C]yet
I never will for[G/B]get [C]
You've never [G/B]failed me [C]yet`,
    notes: "Key of G. Testimony of God's faithfulness. Let bridge build with crescendo energy.",
    bpm: 72,
    tags: ["worship", "faithfulness", "declaration"],
  },
  {
    title: "Draw Me Close",
    artist: "Michael W. Smith",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Intro}
[G] [C] (x2)

{Verse 1}
[G]Draw me close to [C]You
[D]Never let me [G]go
[D]I lay it all [C]down again
[Em]To hear You say that [C]I'm Your friend

{Verse 2}
[G]You are my de[C]sire
[D]No one else will [G]do
[D]'Cause nothing else could [C]take Your place
[Em]To feel the warmth of [C]Your embrace
[G]Help me find the [Am]way, [D]bring me back to [G]You

{Chorus}
[G]You're all I [D]want [C]
[G]You're all I [D]ever [C]needed [D]
[G]You're all I [D]want [C]
[Am]Help me know You [D]are [G]near

(ending * 3)`,
    notes: "Key of Bb, Capo 3 plays G shapes. Simple, intimate prayer song. Keep dynamics soft and building.",
    bpm: 68,
    tags: ["worship", "intimacy", "prayer"],
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
