#!/usr/bin/env node
/**
 * Seed PDF songbook worship songs (Part 6: T–Y, Psalms) into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/pdf-songbook-part6.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "The Wonderful Cross",
    artist: "Chris Tomlin/Jesse Reeves/Isaac Watts/J.D. Walt",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]When I survey the wondrous cross
[C]On which the [F]Prince of [C]glory [G]died,
[C]My richest gain I [F]count but [C]loss,
[C]And pour [G]contempt on [C]all my pride.

{Verse 2}
See from His head, His hands, His feet,
Sorrow and love flow mingled down:
Did e'er such love and sorrow meet,
Or thorns compose so rich a crown?

{Chorus}
[F]Oh the [C/E]wonderful [F]Cross, [C/E]oh the wonderful Cross
[F]Bids me come and [C/E]die and find that [Gsus]I may truly live
[F]Oh the [C/E]wonderful [F]Cross, [C/E]oh the wonderful Cross
[F]All who gather [C/E]here by grace draw near
[Gsus]And bless Your name

{Verse 3}
Were the whole realm of Nature mine,
That were an offering far too small;
Love so amazing, so divine,
Demands my soul, my life, my all!`,
    notes: "Key of C, Capo 2 for original D. Classic hymn with modern chorus.",
    bpm: 72,
    tags: ["hymn", "cross", "worship"],
  },
  {
    title: "There Is None Like You",
    artist: "Lenny LeBlanc",
    originalKey: "G",
    format: "chordpro",
    content: `{Chorus}
[G]There is none [D/F#]like [C/E]You [G/D]
[C]No one [G/B]else can touch [Am7]my heart like [Am7/D]You [D]do
[G]I could [D/F#]search for all [C/E]eternity [Dm/E]long
[G/D]And find there is [C/D]none [D]like [G]You

{Turnaround}
| [Em] [C2] | [G/D] . [Dsus] [D] |

{Verse}
[Cmaj7]Your mercy [C/D]flows like a river [G]wide [Em7]
[Am7]And healing [D7/F#]comes from Your [G]hands [G2/B]
[Cmaj7]Suffering [C/D]children are safe in Your [Em7]arms
[Am]There is [C/G]none [D/F#]like [G]You`,
    notes: "Key of G, Tempo 69. Classic intimate worship. Simple and powerful.",
    bpm: 69,
    tags: ["worship", "devotion", "classic"],
  },
  {
    title: "Victory Is Yours",
    artist: "Matt Crocker/Ben Fielding/Brian Johnson/Reuben Morgan",
    originalKey: "G",
    format: "chordpro",
    content: `[pad] G5

[G]Our fight is with weapons unseen
[Em]Your enemies crash to their knees
[C]As we rise up in worship
[Em]When trials unleash like a flood
[D/F#]The battle belongs to our God
[C]As we cry out in worship [Am]

[Em]The victory is Yours
[C]
[G]You're riding on the storm
[D]Your name is unfailing
[Em]Though kingdoms rise and [C]fall
[G(G/D)]Your throne withstands it all
[D](Your name is [C]unshaken)

[G]What hell meant to break me has failed
[Em]Now nothing will silence my praise
[C]I will cry out in worship
[Em]The walls of the prison will [D/F#]shake
[G]The chain-breaking King will rise to save
[C]As we cry out in worship [Am]

[C]You roar like [D]thunder, nothing can tame God
[Em]All powerful all [G/B]powerful
[C]We pull down [D]Heaven, with shouts of praise
[Em]Oh God all [G/B]powerful all [D]powerful
[1st time x2][2nd time x1]`,
    notes: "Key of G. Worship warfare anthem. Build through bridge declarations.",
    bpm: 80,
    tags: ["worship", "victory", "warfare"],
  },
  {
    title: "When You Walk Into The Room",
    artist: "Bryan & Katie Torwalt",
    originalKey: "C",
    format: "chordpro",
    content: `{Intro}
[C] [F] [Am] [F]

{Verse 1}
[C]When You walk into the [F]room, everything changes
[Am]Darkness starts to [F]tremble at the light that You bring
[C]When You walk into the [F]room, every heart starts burning
[Am]And nothing matters more than [F]just to sit here at Your feet and worship You

{Chorus}
[C]We Love You, [F]and we'll never stop
[Am]We can't live with[F]out You, Jesus

[C]We Love You, [F]We can't get enough
[Am]All this is for [F]You, Jesus

{Verse 2}
[C]When You walk into the [F]room, sickness starts to vanish
[Am]Every hopeless [F]situation, ceases to exist
[C]When You walk into the [F]room, The dead begin to rise
[Am]Cause there is resurrection [G]life in all You do

{Bridge} (Quietly) (x2) (Loudly) (x2)
[F]Come and consume God, all we are
[Am]We give You permission, our hearts are Yours
[C]We want You, [G]We want You`,
    notes: "Key of C. Presence/power song. Bridge builds from quiet to explosive.",
    bpm: 72,
    tags: ["worship", "presence", "power"],
  },
  {
    title: "Worthy Of It All",
    artist: "David Brymer/Ryan Hall",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse}
[C]All the saints and angels
[C]They bow before Your throne [D/C]
[C]All the elders cast their [D/C]crowns
[C]Before the [D]Lamb of [Em]God and [G] [A]sing

{Chorus}
[G]You are worthy of it [A]all, You are worthy of it all
[C]For from You are all [D]things, [Dadd4]and to [E]You are all things
[G]You de[A]serve the glory

[2nd time] [repeat]
[4th time] [x3]
[6th time] [repeat as desired]

{Interlude 1}
[C] [D/C] [E/D] [C] [D/C] [E/D]
(Singing) Oh-oh-oh-oh-oh, Oh-oh-oh-oh-oh
[C] [D/C] [E/D] [C] [D] [G] [A]
Oh-oh-oh-oh-oh, Oh-oh, Oh-oh, Oh-oh

{Bridge}
[G]Day and [A]night, night and day, let incense arise
[Bm]Day and [C#m]night, night and day, let incense arise
[D]Day and [A/E]night, night and day, let [Dadd4]incense [E]arise
[Am]Day and [Bm]night, night and day, let [C]incense [D]arise
[1st time] [repeat]`,
    notes: "Key of C. Harp and bowl worship. Bridge builds with escalating key changes.",
    bpm: 72,
    tags: ["worship", "adoration", "devotion"],
  },
  {
    title: "Wonderful",
    artist: "Sam Yoder",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro}
[G] | [C2] / [C] / | [D] | [Gsus] / [G] / |
[C] | [Dsus] / [D] / | [C] / [D] / | [G] |

{Verse 1}
[G]Father, You're [C2]holy [C]
[D]Jesus, You're [Gsus]wor[G]thy
[C]Spirit, You're [Dsus]love[D]ly
[C]God, You're [D]wonderful [G] [Gsus]

{Verse 2}
[G]Father, we [C2]need [C]You
[D]Jesus, we [Gsus]love [G]You
[C]Spirit, You're [Dsus]welcome [D]here
[C]God, You're [D]wonderful [G] [Gsus]

{Chorus}
[C]Father, You are [G]heavenly
[Dsus]You are kindness [D]and goodness without [C]end
[G]Jesus, You are royalty
[Dsus]You are honored, You're [D]worthy of all our [C]days
[G]Spirit, You are a holy wind
[Dsus]Would You breathe [D]and move and fall on [C]us

{Verse 3}
[G]Father in [C]heaven
[D]Jesus [Gsus]among [G]us
[C]Spirit [Dsus]within [D]us
[C]God, You're [D]wonderful [G] [Gsus]

{Verse 4}
[G]God, You're our [C]father
[D]Jesus, our [Gsus]bro[G]ther
[C]Spirit, our [Dsus]hel[D]per
[C]God, You're [D]wonderful [G]

{Bridge}
[C]Wonderful, [G]yes You are, [G/D]yes You [Bm/D]are
[D]You are great and [C]wonderful [G]
[Dsus]Yes You [D]are, yes You are`,
    notes: "Key of G, Capo 2. Trinitarian praise. Simple and beautiful.",
    bpm: 80,
    tags: ["worship", "praise", "trinity"],
  },
  {
    title: "Yes I Will",
    artist: "Mia Fieldes/Eddie Hoagland/Jonathan Smith",
    originalKey: "C",
    format: "chordpro",
    content: `[F]I count on one [C]thing, the same God that [G]never [Am]fails
[F]Will not fail [C]me now, You won't fail [G]me [Am]now
[F]In the waiting, the [C]same God who's [G]never [Am]late
[F]Is working all [C]things out, is [G]working all [Am]things out

[F]Yes I [C]will, lift You high in the [G]lowest [Am]valley
[F]Yes I [C]will, bless Your name
[F]Oh yes I [C]will, sing for [G]joy when my [Am]heart is heavy
[F]For all my [C]days, oh [G]yes I [Am]will

[F]For all my [C]days, oh [G]yes I [Am]will

[F]And I choose to [C]praise, to glorify, [G]glorify
[F]The Name of all [C]names that nothing can [G]stand against [x4]

[F]For all my [C]days, [G]yes, I [C]will`,
    notes: "Key of C. Commitment anthem. Bridge builds with bold declaration.",
    bpm: 80,
    tags: ["worship", "faithfulness", "perseverance"],
  },
  {
    title: "You Are Good",
    artist: "Brian Johnson",
    originalKey: "C",
    format: "chordpro",
    content: `{Intro}
[C] | [G] | [F] | | [x4]

{Verse 1}
[C]I want to scream it out from every mountain top
[F]Your goodness knows no bounds, Your goodness never stops
[Am]Your mercy follows me, Your kindness fills my life
[C]Your love [G]amazes me [repeat]

{Chorus 1}
[C](And I/I'll) sing because You are [C]good
[C]And I'll dance because You are [C]good
[F]And I'll shout because You are good, You are good to me

{Interlude 1}
[C] | [G] | [F] | | [x2]

{Verse 2}
[C]Nothing and no one comes anywhere close to You
[F]The earth and oceans deep only reflect this truth
[Am]And in my darkest night You shine as bright as day
[C]Your love [G]amazes me [repeat]

{Bridge}
[Dm]With a cry of praise my [F]heart will proclaim
[C]You are good, [G]You are good
[Dm]In the Sun or rain my [F]life celebrates
[C]You are good, [G]You are good [repeat]`,
    notes: "Key of C. Joyful praise. Bridge builds with declarations.",
    bpm: 72,
    tags: ["worship", "goodness", "joy"],
  },
  {
    title: "You Are My King (Amazing Love)",
    artist: "Billy Foote",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse}
[D/F#]I'm for[G2]given be[Asus]cause You were for[A]saken
[D/F#]I'm ac[G2]cepted, [Asus]You were con[A]demned
[D/F#]I'm a[G2]live and well, Your [Asus]Spirit is with[A]in me
[G2]Because You [A]died and rose a[D]gain

{Chorus}
[D]Amazing love, how [G]can it be
[D]That You my [Asus]King would die for [A] [G/A]me (To Verse / Chorus)
[A]Amazing love, I [G]know it's true
[A]It's my joy to [D]honor You
In all I do, I honor You

{Bridge}
[D]You are my King
[D]You are my King
[D]Jesus, You are my King
[D]Jesus, You are my King`,
    notes: "Key of D, 65 BPM. Simple cross anthem. Bridge is quiet declaration.",
    bpm: 65,
    tags: ["worship", "love", "cross"],
  },
  {
    title: "Yet Not I But Through Christ In Me",
    artist: "Jonny Robinson/Rich Thompson/Michael Farren",
    originalKey: "D",
    format: "chordpro",
    content: `{Intro/Turnaround}
| [D] | [G6/B] | [D/A] | [G6/B] |

{Verse}
[A]The Lord bless you and keep you
[D2]and be [A]gracious to you
[F#m]Make His face shine upon you
[F#m]and be [D2]gracious to you
[A]The Lord turn His face toward you
[A]and give you [D]peace (2x)

{Chorus}
[Am]A[F]men [C]Amen [G]Amen

{Bridge 1}
[F#m]May His favor be upon you
[D2]And a thousand generations
[A]And your family and your children
[E]And their children and their children
[1st time, x4][2nd and 3rd time, x1]

{Verse 2}
[D]What gift of grace is Jesus, my Re[G]deemer
[D]There is no more for [Bm]heaven [A]now to give
[D]He is my joy, my righteous[G]ness, and freedom
[D]My steadfast [Asus]love, my [D]deep and boundless peace
[D/F#]To this I hold: my [G]hope is only [D]Jesus
[D]For my life is wholly [Em7]bound to His
[D]Oh how strange and [D/F#]divine, I can sing: [G]all is mine!
[D/A]Yet not I, but through [Asus]Christ in [D]me

{Verse 3}
[D]No fate I dread, I know I am for[G]given
[D]The future sure, the [Bm]price it [A]has been paid
[D]For Jesus bled and suffered [G]for my pardon
[D/F#]And He was [D]raised to over[G]throw the [D]grave
[D]To this I hold: my sin has been de[Em7]feated
[D]Jesus now and [D/F#]ever is my [G]plea
[D]Oh the chains are re[D/F#]leased, I can [G]sing: I am free!
[D/A]Yet not I, but through [Asus]Christ in [D]me

{Bridge 2}
[F#m]I am [E]chosen, not for[A]saken
[A]I am who You [D]say I am
[F#m]You are for [E]me, not a[A]gainst me
[A]I am who You [D]say I am

{Verse 4}
[D]With every breath I long to follow [G]Jesus
[D]For He has [Bm]said that [A]He will bring me home
[D]And day by day I know He will [G]renew me
[D]Until I stand [Asus]with [D]joy be[G]fore the throne
[D]When the race is com[D/F#]plete,
[D/F#]Still my lips shall re[G]peat:
[D/A]Yet not I, but through [Asus]Christ in [D]me

{Ending}
[A] [D] [Em7] |
[D/A]Yet not I, but through [Asus]Christ in [D]me`,
    notes: "Key of D, Tempo 75. Identity anthem. Poetic narrative through verses.",
    bpm: 75,
    tags: ["worship", "identity", "christ"],
  },
  {
    title: "On Repeat",
    artist: "Worship Together (Aodhan King/Ben Fielding/Benjamin Hastings/Joel Houston)",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]Every time I come running
[Am7]I find grace on [C]repeat
[C]You welcome me with open arms
[F]No matter where I have been
[C]Every time I sur[C/D]render [C]
[C]Every time I fall
[G]I find [Am]grace more [C]precious [F]did before
[G]I'm gonna lay my [Am]world [G]down

{Chorus}
[C/E]So I'm gonna lay my [F]world down
[G]Here at Your [Am]feet
[F]Every time I come [C/E]running
[F]I find grace on [C]repeat
[G]Grace upon [Am]grace
[C/E]Morning by [F]morning
[C]God be ex[Am7]alted
[F]Over and over a[Gsus]gain [G]

{Tag}
[G]'Cause You're the God
[Am]Who's never [F]given up on [C]me

{Bridge 1}
[C]Grace upon [F]grace
[Am7]Morning by [F]morning
[C]Day after [Gsus]day will I [G]sing
[C]Praise upon [F]praise
[Am7]God be exalted
[Gsus]Over and over a[G]gain

{Bridge 2}
[Am7]Grace upon [F]grace
Morning by [C/E]morning
[Gsus]Day after day [G]will I sing
[Am7]Praise upon [F]praise
[C/E]God be exalted
[Gsus]Over and over a[G]gain`,
    notes: "Key of C, 68 BPM. Grace anthem. Bridge builds with repetition.",
    bpm: 68,
    tags: ["worship", "grace", "praise"],
  },
  {
    title: "Clean Heart",
    artist: "Bryan & Katie Torwalt",
    originalKey: "C",
    format: "chordpro",
    content: `{Intro}
[C] [F] [Am7] [G]

{Verse 1}
[C]For the times that I've misused Your name
[C]And leveraged it for my own fame
[Am7]For the kingdoms I've been [Gsus]building on my [G]own
[C]For the times I chose to play it safe
[C]When You said give it all away
[Am7]For the idols that I've [G(add4)]let into my home
Well, I'm looking now

{Chorus}
[F]Create in [C]me a clean [G(add4)]heart, God
[Am7]And renew a [F]right spirit
[C]Create in [Am7]me a [G(add4)]clean heart, God
[Am7]Renew a right spirit within me

{Verse 2}
[C]For the times I chose the [Csus]counterfeit [C]
[C]Dismissed Your voice like [Csus]Jonah [C]did
[Am7]When I leaned into fear [Gsus]instead of [G]faith
[C]For the narrow path I [Csus]didn't [C]take
[C]When I fell short in my [Csus]own strength [C]
[Am7]You said look and I [G(add4)]just looked away

{Turnaround}
[C] [C]

{Bridge}
[C/E]The kindness of [F]God, it
[G]leads to re[Am7]pentance
[C/E]The arms of the [F]Father
[G]Are full of for[Am7]giveness
[C/E]You gave me a [F]clean heart
[G]A place where Your [Am7]glory can rest
[C/E]You made me a [F]temple
[G]A place where Your [Am7]presence can live`,
    notes: "Key of C. Repentance/renewal song. Bridge builds with gratitude.",
    bpm: 72,
    tags: ["worship", "repentance", "renewal"],
  },
  {
    title: "Scandal Of Grace",
    artist: "Joel Houston/Matt Crocker",
    originalKey: "C",
    format: "chordpro",
    content: `{Intro}
| [C] | [C2] |

{Verse 1}
[C]Grace what have You done
[Am]Murdered for me on that [F]cross
[C]Accused in absence of wrong
[Am]My sin washed a[F]way in Your blood

{Pre-Chorus 1}
[Em]Too much to make [F]sense of it all
[Em]I know that Your [F]love breaks my fall
[G]The scandal of [Am]grace You died in my place
[F]So my soul will live

{Chorus}
[C]Oh to be like You
[G6]Give all I have just to know You
[F]Jesus there's no-one be[Am]side You
Forever the [C]hope in my heart

{Verse 2}
[C]Death where is your sting
[Am]Your pow'r is as dead as my [F]sin
[C]The cross has taught me to live
[Am]And mercy my [F]heart now to sing

{Pre-Chorus 2}
[Em]The day and its [F]troubles shall come
[Em]I know that Your [F]strength is enough
[G]The scandal of [Am]grace You died in my place
[F]So my soul will live

{Bridge}
[F]And it's all because of You Jesus
[G]It's all because of You Jesus
[Am]It's all because of Your love
[F]That my soul will live`,
    notes: "Key of C, Tempo 42, 6/8 time. Grace anthem. Beautiful and intimate.",
    bpm: 42,
    tags: ["worship", "grace", "cross"],
  },
  {
    title: "Ancient Gates",
    artist: "Worship Together (Brooke Ligertwood/Jason Ingram/Scott Ligertwood)",
    originalKey: "D",
    format: "chordpro",
    content: `{Intro}
|[D] / / / | [D] / / / | [Em7(4)] / / / |
| [Em7(4)] / / / |
|[G2] / / / | [G2] / / / | [D] / / / / |
/ / / |

{Verse 1}
[D]There is singing at the ancient [D]gates
[D]There's a melody of ceaseless [D]praise
[G]Age to age the sound is [G]only growing [D]stronger [D]

{Verse 2}
[D]There's a throne beneath the Name of [D]names
[D]There seated on it One who [D]reigns
[G]And His kingdom now
[G]Is here and getting [D]closer [D]

{Pre-Chorus 1}
[D]Praise Him like we're [D]there in glory
[Em7(4)]Here and now He's [Em7(4)]just as holy
[G]Jesus, He's so [G]worthy of it [D]all [D]

{Chorus}
[D]Worship Him with [D]joyful sound [Em7]
[G]Sing until your voice gives out
[Em7(4)]No matter where or [D]who's [D]around
Release your worship

{Pre-Chorus 2}
[D]Praise Him like we're [D]there in glory
[Em7(4)]Here and now He's [Em7(4)]just as holy
[G]Jesus, He's so [G]worthy of it [D]all [D]
[D]Bring your song: He [D]loves to hear it
[Em7(4)]Bring Him every [Em7(4)]prayer-soaked lyric
[G]Jesus, He's so [G]worthy of it [D]all [D]

{Bridge 1}
[D]The One who was, the [Em7(4)]One who is
[D/F#]The One who is to [Em7(4)]come`,
    notes: "Key of D. Eternal worship anthem. Build through pre-chorus sections.",
    bpm: 72,
    tags: ["worship", "praise", "eternity"],
  },
  {
    title: "Oh Come Oh Come Emmanuel",
    artist: "John Mason Neale (Traditional)",
    originalKey: "Am",
    format: "chordpro",
    content: `{Intro}
[Am] [G] [Dm](2x)

{Verse}
[Am]O come, o come, [G]Emman[Am]uel
[Am]And ransom [G]captive [Am]Israel
[Dm]That mourns in [C]lonely [G]exile here
[Am]Until the [G]Son of [Am]God appear

{Refrain}
[G]Rejoice, [Am]rejoice! [Dm]Emman[C]uel
[Am]Shall come to [G]thee, O [Am]Israel

{Turnaround}
[Am] [G] [Dm]

{Verse 2}
[Am]O come, Thou wisdom [G]from on [Am]high
[Am]Who orderest [G]all things [Am]mightily
[Dm]To us the [C]path of [G]knowledge show
[Am]And teach us in [G]her ways to [Am]go`,
    notes: "Key of Am, Capo 3 for original Cm. Advent/Christmas hymn. Solemn and beautiful.",
    bpm: 80,
    tags: ["hymn", "advent", "christmas"],
  },
  {
    title: "Yahweh The Lord (Psalm 145)",
    artist: "Unknown",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro}
[G] [G] [C] [C]

{Verse 1}
[G]Beautiful and kind, [G]beautiful and kind
[C]I'm forever satisfied, the [D]fountain of my life
[G]Beautiful and kind

{Verse 2}
[G]Abounding in grace, [G]abounding in grace
[C]Forgiving all my sin, You [D]heal me from within
[G]Abounding in grace

{Chorus}
[C]Yahweh the Lord
[G]Slow to anger and rich in love
[D]Your mercies are [G]new, steadfast and true
[C]Yahweh the Lord
[Em]Oh, Your faithfulness covers thousands
[C]Age to age the same, how great is Your [G]name
Yahweh the Lord

{Verse 3}
[G]Goodness and love, [G]goodness and love
[C]Your hands are open wide, ful[D]filling my desires
[G]Goodness and love

{Verse 4}
[G]Righteous and just, [G]righteous and just
[C]You care for the oppressed
[D]You're the lifter of their head
[G]Righteous and just

{Bridge}
[C/E]I'll bless the name of the Lord
[G]I'll bless the name of the Lord
[C/E]I'll bless the name of the Lord
[G]I'll bless the name of the Lord`,
    notes: "Key of G. Psalm 145 paraphrase. Builds through verses to joyful bridge.",
    bpm: 80,
    tags: ["worship", "psalm", "praise"],
  },
  {
    title: "Psalm 100",
    artist: "Chris Tomlin",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[G]Enter in through the [D]gates
[G]Enter in here and [D]praise
[G]Come before him, come bring your [Bm]song
[G]We are His [A]people, He is our God

{Chorus}
[G]For the Lord is [Bm]good and His love [D]endures
[A]His love endures
[G]For the Lord is [Bm]good and His love [D]endures
[A]His love endures [G] [Bm]forevermore
[D]His faithfulness, [A]it has no end
[G]For the Lord is [Bm]good and His love [D]endures
[A]His love endures

{Verse 2}
[G]Enter into His [D]courts
[G]Enter in with grateful [D]hearts
[G]Come before him, come bring your [Bm]song
[G]We are His [A]people, He is our God

{Bridge}
[D]Raise Your [G]voice
[D]Shout for joy [A]all the earth
[Bm]We sing a [G]new song now
[D]We sing a [A]new song now [x2]`,
    notes: "Key of D. Joyful praise psalm. Bridge is high-energy celebration.",
    bpm: 100,
    tags: ["worship", "praise", "psalm"],
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
