#!/usr/bin/env node
/**
 * Seed CCLI Top 100 worship songs (Part 3: songs 61-88) into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/ccli-top-100-part3.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  // 61. The Heart Of Worship - Matt Redman (Key: D)
  {
    title: "The Heart Of Worship",
    artist: "Matt Redman",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]When the music [A]fades
[Em]All is stripped a[A]way and I simply come
[D]Longing just to [A]bring
[Em]Something that's of [A]worth that will bless Your heart

{Pre-Chorus}
[Em]I'll bring You more than a [D/F#]song
For a [A]song in itself is not what You have re[Em]quired
You [D/F#]search much deeper with[A]in
Through the way things ap[Em]pear You're looking [D/F#]into my [A]heart

{Chorus}
[D]I'm coming back to the heart of [A]worship
And it's [Em]all about You, [G]all about [A]You Jesus
[D]I'm sorry Lord for the thing I've [A]made it
When it's [Em]all about You, [G]all about [A]You Jesus

{Verse 2}
[D]King of endless [A]worth
[Em]No one could ex[A]press how much You deserve
[D]Though I'm weak and [A]poor
[Em]All I have is [A]Yours every single breath`,
    notes: "Key of D. Classic worship song of surrender. Simple, intimate feel.",
    bpm: 74,
    tags: ["worship", "surrender", "heart", "ccli-top-100"],
  },

  // 62. The Blood - Bethel Music / Jenn Johnson
  // Moved to ccli-top-100-part4.mjs (was previously skipped; now included with verified chords)

  // 63. Open The Eyes Of My Heart - Paul Baloche (Key: E)
  {
    title: "Open The Eyes Of My Heart",
    artist: "Paul Baloche",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse}
[E]Open the eyes of my heart Lord
[B/D#]Open the eyes of my heart
[A]I want to [E]see You
[E]I want to [B/D#]see You

{Chorus}
[B]To see You [C#m]high and lifted [A]up
[B]Shining in the light of Your [C#m]glory
[F#m7]Pour out Your power and [B]love
As we sing [E]holy holy holy

{Bridge}
[E]Holy holy [B/D#]holy
[A]Holy holy [E]holy
[E]Holy holy [B/D#]holy
[A]I want to [B]see You`,
    notes: "Key of E. High-energy worship anthem. Build dynamics through repetition.",
    bpm: 112,
    tags: ["worship", "praise", "prayer", "ccli-top-100"],
  },

  // 64. Take You At Your Word - Cody Carnes (Key: D)
  {
    title: "Take You At Your Word",
    artist: "Cody Carnes",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]Your word is a lamp unto my [A]feet
[G]Your way is the only way for [Bm]me
It's a [A]narrow road that leads to [G]life
But I want to be on it
It's a [Bm]narrow road but the mercy's [A]wide
'Cause You're [G]good on Your promise

{Pre-Chorus}
[Bm]All of Your [A]words have come [G]true
So I will [Bm]put my [A]trust in [G]You

{Chorus}
[D]I'll take You at Your [A]word
If You [G]said it I'll be[Bm]lieve it
[D]I've seen how good it [A]works
If You [G]start it You'll com[Bm]plete it
[D]I know that what You [A]said about Yourself is [G]true
I'll take You at Your [D]word

{Verse 2}
[D]You said that You'll never leave or for[A]sake
[G]You said that You'll lead us through the [Bm]flame
You said that the [A]ones who come to [G]You
Would never be turned away
You said there is [Bm]nothing in this [A]world
That can [G]take us from Your love

{Bridge}
[Bm]I'm standing on every [A]promise You ever [G]made
[Bm]I'm standing on every [A]promise You ever [G]made`,
    notes: "Key of D. Upbeat declaration of trust. 172 BPM, driving rhythm.",
    bpm: 172,
    tags: ["worship", "faith", "trust", "declaration", "ccli-top-100"],
  },

  // 65. How Deep The Father's Love For Us - Stuart Townend (Key: D)
  {
    title: "How Deep The Father's Love For Us",
    artist: "Stuart Townend",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]How deep the [Em7]Father's [D/F#]love for [G]us
How [D/F#]vast beyond all [Bm7]mea[A]sure
That [D]He should [Em7]give His [D/F#]only [G]Son
To [D]make a wretch His [A]trea[D]sure

{Verse 2}
[D]How great the [Em7]pain of [D/F#]searing [G]loss
The [D/F#]Father turns His [Bm7]face a[A]way
As [D]wounds which [Em7]mar the [D/F#]Chosen [G]One
Bring [D]many sons to [A]glo[D]ry

{Verse 3}
[D]Behold the [Em7]Man up[D/F#]on a [G]cross
My [D/F#]sin upon His [Bm7]shoul[A]ders
A[D]shamed I [Em7]hear my [D/F#]mocking [G]voice
Call [D]out among the [A]scof[D]fers

{Verse 4}
[D]I will not [Em7]boast in [D/F#]any[G]thing
No [D/F#]gifts no power no [Bm7]wis[A]dom
But [D]I will [Em7]boast in [D/F#]Jesus [G]Christ
His [D]death and resur[A]rec[D]tion`,
    notes: "Key of D. Hymn-like, reflective. Often played in 3/4 or 6/8 time.",
    bpm: 68,
    tags: ["worship", "hymn", "cross", "redemption", "ccli-top-100"],
  },

  // 66. Angels (Glory To God) - Phil Wickham (Key: A)
  {
    title: "Angels (Glory To God)",
    artist: "Phil Wickham",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]Angels we have heard on high
Sweetly singing o'er the plains
And the mountains in reply
[F#m]Echoing their [E]joyous [D]strains

{Chorus}
[F#m]Glo[D]ria [A] [E]
[A/C#]In ex[D]celsis [E]De[A]o
[F#m]Glo[D]ria [A] [E]
[A/C#]In ex[D]celsis [E]De[A]o

{Verse 2}
[A]Shepherds why this jubilee
Why your joyous strains prolong
What the gladsome tidings be
[F#m]Which inspire your [E]heav'nly [D]song

{Verse 3}
[A]Come to Bethlehem and see
Him whose birth the angels sing
[A/C#]Come adore on [D]bended knee
[F#m]Christ the Lord the [E]newborn [D]King

{Bridge}
[F#m]Glory to God [D]glory to God
[A]Glory to God in the [E]highest forever
[F#m]For all He has done [D]His unfailing love
[A]Glory to God in the [E]highest forever`,
    notes: "Key of A. Christmas worship anthem with modern arrangement of the classic hymn.",
    bpm: 120,
    tags: ["worship", "Christmas", "praise", "angels", "ccli-top-100"],
  },

  // 67. This Is Our God - Phil Wickham (Key: C)
  {
    title: "This Is Our God",
    artist: "Phil Wickham",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]Remember those walls that we called sin and [G]shame
They came crumbling [Am]down, crumbling [F]down
Remember those giants we [C]called loneliness and [G]pain
They came tumbling [Am]down, tumbling [F]down

{Chorus}
[C/E]This is our [F]God, [C]this is who He [G]is, He loves us
[C/E]This is our [F]God, [C]this is what He [G]does, He saves us
[Am]He bore the [F]cross, [C]beat the [G]grave
[Am]Let heaven and [F]earth pro[C]claim
[G]This is our God

{Verse 2}
[C]Remember that satisfying [G]sound
When lost came to [Am]found, lost came to [F]found
[C]How sweet the [G]song
When chains hit the [Am]ground, chains hit the [F]ground

{Bridge}
[Am]Who pulled me out of that [F]pit? He did, He did
[C]Who rescued me from that [G]grave? He did, He did
[Am]Who tore the veil so [F]I could come in?
[C]He did, He did, [G]He did, He always does`,
    notes: "Key of C. Celebratory, mid-tempo worship anthem. Great for congregational singing.",
    bpm: 140,
    tags: ["worship", "praise", "salvation", "testimony", "ccli-top-100"],
  },

  // 68. Blessed Be Your Name - Matt Redman (Key: A)
  {
    title: "Blessed Be Your Name",
    artist: "Matt Redman",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]Blessed be Your [E]name
In the [F#m7]land that is [D]plentiful
Where Your [A]streams of a[E]bundance flow
Blessed be Your [D]name

{Verse 2}
[A]Blessed be Your [E]name
When I'm [F#m7]found in the [D]desert place
Though I [A]walk through the [E]wilderness
Blessed be Your [D]name

{Pre-Chorus}
[A]Every [E]blessing [F#m7]You pour out I'll [D]turn back to praise
[A]When the [E]darkness [F#m7]closes in Lord [D]still I will say

{Chorus}
[A]Blessed be the [E]name of the [F#m7]Lord
Blessed be Your [D]name
[A]Blessed be the [E]name of the [F#m7]Lord
Blessed be Your [D]glorious name

{Verse 3}
[A]Blessed be Your [E]name
When the [F#m7]sun's shining [D]down on me
When the [A]world's all as [E]it should be
Blessed be Your [D]name

{Bridge}
[A]You give and take a[E]way
You [F#m7]give and take a[D]way
My [A]heart will choose to [E]say
Lord [F#m7]blessed be Your [D]name`,
    notes: "Key of A. 116 BPM. Classic modern worship song about praising in all seasons.",
    bpm: 116,
    tags: ["worship", "praise", "faithfulness", "declaration", "ccli-top-100"],
  },

  // 69. The Lion And The Lamb - Bethel Music (Key: G)
  {
    title: "The Lion And The Lamb",
    artist: "Bethel Music",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]He's coming on the [Am]clouds
[C]Kings and kingdoms will bow down
[Em]Every chain will [D]break
As [C]broken hearts declare His praise
[D]Who can stop the Lord Almighty

{Chorus}
[G]Our God is the [D/F#]Lion
The [Em]Lion of [G/B]Judah
He's [C]roaring with [D]power and fighting our battles
[G]And every [D/F#]knee will [Em]bow before [G/B]Him
[C]Our God is the [D]Lamb
The [Em]Lamb that was [G/B]slain
For the [C]sins of the [D]world
His [Em]blood breaks the [G/B]chains
[C]Every [D]knee will bow before the [G]Lion and the Lamb
[C]Every [D]knee will bow before [G]Him

{Verse 2}
[G]So open up the [Am]gates
[C]Make way before the King of kings
[Em]Our God who comes to [D]save
Is [C]here to set the captives free
[D]Who can stop the Lord Almighty

{Bridge}
[Em]Who can stop the [C]Lord Al[G]mighty
[Em]Who can stop the [C]Lord Al[D]mighty
[Em]Who can stop the [C]Lord Al[G]mighty
[Em]Who can stop the [C]Lord [D]Almighty`,
    notes: "Key of G. Powerful worship anthem. Build energy through the bridge.",
    bpm: 96,
    tags: ["worship", "praise", "power", "Jesus", "ccli-top-100"],
  },

  // 70. His Mercy Is More - Matt Boswell / Matt Papa (Key: G)
  {
    title: "His Mercy Is More",
    artist: "Matt Boswell / Matt Papa",
    originalKey: "G",
    format: "chordpro",
    content: `{Chorus}
[G]Praise the Lord His [C]mercy is [G]more
Stronger than [Em]darkness [D]new every [C]morn
Our [G]sins they are [D/F#]many His [Em7]mercy is more
[C] [G] [D] [G]

{Verse 1}
[G]What love could re[C]member no [G]wrongs we have done
Om[D]nipotent [Em]Saviour our [C]ran[D]som has come
[G]Oh how rich the [Am]treasure be[G/B]neath the [C]waters
The [G/B]guilty made [C2]righteous for[G/D]ever [D]stands [G]He

{Verse 2}
[G]What patience would [C]wait as we [G]constantly roam
What [D]Father so [Em]tender is [C]calling us [D]home
[G]He welcomes the [Am]weakest the [G/B]vilest the [C]poor
Our [G/B]sins they are [C2]many His [G/D]mercy is [D]more [G]

{Verse 3}
[G]What riches of [C]kindness He [G]lavished on us
His [D]blood was the [Em]payment His [C]life was the [D]cost
[G]We stood 'neath a [Am]debt we could [G/B]never af[C]ford
Our [G/B]sins they are [C2]many His [G/D]mercy is [D]more [G]`,
    notes: "Key of G. Hymn-style. 127 BPM. Chorus first then verse structure.",
    bpm: 127,
    tags: ["worship", "hymn", "mercy", "grace", "ccli-top-100"],
  },

  // 71. King Of My Heart - John Mark McMillan (Key: G)
  {
    title: "King Of My Heart",
    artist: "John Mark McMillan / Sarah McMillan",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Let the King of my heart be the [C]mountain where I run
The [G]fountain I drink from oh [Em]He is my [D]song
[G]Let the King of my heart be the [C]shadow where I hide
The [G]ransom for my life oh [Em]He is my [D]song

{Chorus}
[G]You are [C]good good [G]oh
[Em] [D]
[G]You are [C]good good [G]oh
[Em] [D]

{Verse 2}
[G]Let the King of my heart be the [C]wind inside my sails
The [G]anchor in the waves oh [Em]He is my [D]song
[G]Let the King of my heart be the [C]fire inside my veins
The [G]echo of my days oh [Em]He is my [D]song

{Bridge}
[G]You're never gonna let [C]never gonna let me down
[G]You're never gonna let [Em]never gonna let me [D]down
[G]You're never gonna let [C]never gonna let me down
[G]You're never gonna let [Em]never gonna let me [D]down`,
    notes: "Key of G (original Bb, capo 3 for G). 68 BPM. Intimate worship song with building dynamics.",
    bpm: 68,
    tags: ["worship", "devotion", "trust", "surrender", "ccli-top-100"],
  },

  // 72. Jesus Paid It All - Hymn (Key: G)
  {
    title: "Jesus Paid It All",
    artist: "Elvina M. Hall",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]I hear the Savior say
[D]Thy strength indeed is [G]small
[Em]Child of weakness [C]watch and pray
[G]Find in [D]Me thine [G]all in all

{Chorus}
[G]Jesus paid it [Em]all
[G]All to Him I [D]owe
[G]Sin had left a [C]crimson stain
[G]He washed it [D]white as [G]snow

{Verse 2}
[G]Lord now indeed I find
[D]Thy power and Thine a[G]lone
[Em]Can change the [C]leper's spots
[G]And melt the [D]heart of [G]stone

{Verse 3}
[G]And when before the throne
[D]I stand in Him com[G]plete
[Em]Jesus died my [C]soul to save
[G]My lips shall [D]still re[G]peat

{Bridge}
[G]O praise the [C]One who paid my debt
[Am]And raised this [C]life up from the dead
[G]O praise the [C]One who paid my debt
[Am]And raised this [C]life up from the [G]dead`,
    notes: "Key of G. Classic hymn with modern bridge (Passion/Kristian Stanfill arrangement).",
    bpm: 68,
    tags: ["worship", "hymn", "cross", "redemption", "salvation", "ccli-top-100"],
  },

  // 73. Give Me Jesus - Traditional/Fernando Ortega
  {
    title: "Give Me Jesus",
    artist: "Fernando Ortega",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]In the [Em]morning when I [C]rise
In the [G]morning when I [D]rise
[G]In the [Em]morning when I [C]rise
Give me [G]Je[D]sus [G]

{Chorus}
[Bm]Give me [Em]Jesus
[C]Give me [G]Jesus
[Em]You can have all this [C]world
But give me [G]Je[D]sus [G]

{Verse 2}
[G]When I [Em]am a[C]lone
When I [G]am a[D]lone
Oh [G]when I [Em]am a[C]lone
Give me [G]Je[D]sus [G]

{Verse 3}
[G]When I [Em]come to [C]die
When I [G]come to [D]die
Oh [G]when I [Em]come to [C]die
Give me [G]Je[D]sus [G]`,
    notes: "Key of G. Traditional spiritual, intimate and reflective. Beautiful for communion.",
    bpm: 60,
    tags: ["worship", "hymn", "prayer", "devotion", "ccli-top-100"],
  },

  // 74. Give Thanks - Henry Smith (Key: G)
  {
    title: "Give Thanks",
    artist: "Henry Smith",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse}
[G]Give thanks with a [D/F#]grateful heart
[Em]Give thanks unto the [Bm7]Holy One
[C]Give thanks be[G/B]cause He's [Em7]given
Je[F]sus Christ His [Dsus]Son [D]

[G]Give thanks with a [D/F#]grateful heart
[Em]Give thanks unto the [Bm7]Holy One
[C]Give thanks be[G/B]cause He's [Em7]given
Je[F]sus Christ His [Dsus]Son [D]

{Chorus}
And [Bm7]now let the [Em7]weak say I am strong
Let the [Am7]poor say I am [D7]rich
Because of [Gmaj7]what the Lord has [Em]done for [F]us [D7]

And [Bm7]now let the [Em7]weak say I am strong
Let the [Am7]poor say I am [D7]rich
Because of [Gmaj7]what the Lord has [Em]done for [F]us [D]

{Tag}
[G]Give thanks [D/F#]
[Em]Give [D]thanks [G]`,
    notes: "Key of G. Classic thanksgiving hymn by Don Moen arrangement. Gentle, flowing feel.",
    bpm: 76,
    tags: ["worship", "thanksgiving", "gratitude", "praise", "ccli-top-100"],
  },

  // 75. Run To The Father - Cody Carnes (Key: G)
  {
    title: "Run To The Father",
    artist: "Cody Carnes",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]I've carried a burden for [Am]too long on my own
[Em]I wasn't created to [C]bear it alone
[G]I hear Your invitation to [Am]let it all go
[Em]I see it now I'm laying it [C]down
And I know that I need You

{Chorus}
[G]I run to the [Am]Father
I [Em]fall into [C]grace
[G]I'm done with the [Am]hiding
No [Em]reason to [C]wait
[G]My heart needs a [Am]surgeon
My [Em]soul needs a [C]friend
So I'll [G]run to the [Am]Father a[Em]gain and a[C]gain
And a[G]gain and again

{Verse 2}
[G]You saw my condition had [Am]a plan from the start
[Em]Your Son for redemption the [C]price for my heart
[G]I don't have a context for [Am]that kind of love
[Em]I don't understand I [C]can't comprehend
All I know is I need You

{Bridge}
[G]My heart has been in Your [Am]sights
Long before my [Em]first breath
[G]Running into Your [Am]arms
Is running to [C]life from death`,
    notes: "Key of G. 68 BPM in 6/8 time. Vulnerable, emotional worship song.",
    bpm: 68,
    tags: ["worship", "grace", "Father", "surrender", "ccli-top-100"],
  },

  // 76. Bless God - Brooke Ligertwood (Key: D)
  {
    title: "Bless God",
    artist: "Brooke Ligertwood",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]Blessed are those who run to [A/C#]Him
[Bm7]He is a shield for [G]all who look to Him

{Verse 2}
[D]Blessed are those who mourn and [A/C#]grieve
[Bm7]He can restore the [G]joy they need to see

{Pre-Chorus}
[Bm7]Oh bless God [A]all that is with[G]in me
[Bm7]Oh bless [A]God and never for[G]get

{Chorus}
[D]Bless God oh my [A]soul
[Bm7]Oh bless [G]God
[D]Bless God oh my [A]soul
[Bm7]Oh bless [G]God

{Verse 3}
[D]Blessed are those who dream and [A/C#]pray
[Bm7]He fills the hungry [G]soul along the way

{Bridge}
[Bm7]As far as east from [A]west
He's [G]taken our trans[D]gressions
[Bm7]As a father shows com[A]passion
To his [G]children so He [D]loves us`,
    notes: "Key of D. From the album 'EIGHT'. Written by Brandon Lake, Brooke Ligertwood, and Cody Carnes.",
    bpm: 130,
    tags: ["worship", "praise", "blessing", "Psalms", "ccli-top-100"],
  },

  // 77. Mighty Name Of Jesus - Hope Darst / The Belonging Co (Key: Ab)
  {
    title: "Mighty Name Of Jesus",
    artist: "The Belonging Co / Hope Darst",
    originalKey: "Eb",
    format: "chordpro",
    content: `{Verse 1}
[Ab]I pray into the atmos[Cm]phere [Bb]
[Eb/G]Spirit of God You're [Bb]here [Ab]
[Ab]Make the ground that I'm stand[Cm]ing on [Bb]holy
[Eb/G]Holy ground I know You're [Bb]here [Ab]

{Verse 2}
[Ab]I draw a permanent boun[Cm]dary [Bb]line
[Eb/G]All that belongs to You is [Bb]mine [Ab]
[Ab]I take it back from the [Cm]hand of the [Bb]enemy
[Eb/G]Every promise left be[Bb]hind [Ab]

{Chorus}
In the [Ab]mighty name of [Cm]Jesus [Bb]I pray
[Eb/G]Calling on the power of [Bb]heaven I pro[Ab]claim
In the [Ab]mighty name of [Cm]Jesus [Bb]I know
[Eb/G]All the power of fear and [Bb]darkness must [Ab]go

{Bridge}
[Ab]There is power in the [Cm]name [Bb]
There is power in the [Eb/G]name [Bb]
The mighty [Ab]name of Jesus`,
    notes: "Key of Ab. Declarative worship anthem. Spiritual warfare theme.",
    bpm: 76,
    tags: ["worship", "prayer", "declaration", "power", "ccli-top-100"],
  },

  // 78. Because He Lives - Bill & Gloria Gaither (Key: G)
  {
    title: "Because He Lives",
    artist: "Bill & Gloria Gaither",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]God sent His Son they [G7]called Him [C]Jesus
[G]He came to love [D]heal and for[D7]give
[G]He lived and [G7]died to [C]buy my [Cm]pardon
[G]An empty [Em]grave is [Am]there to [D7]prove my Savior [G]lives

{Chorus}
[G]Because He [G7]lives [C]I can face to[G]morrow
[G]Because He [Em]lives [Am]all fear is [D7]gone
Be[G]cause I [G7]know [C]He holds the [Cm]future
[G]And life is [Em]worth the [Am]living
[D7]Just because He [G]lives

{Verse 2}
[G]How sweet to hold a [G7]newborn [C]baby
[G]And feel the pride and [D]joy he [D7]gives
[G]But greater [G7]still the [C]calm as[Cm]surance
[G]This child can [Em]face un[Am]certain [D7]days because He [G]lives

{Verse 3}
[G]And then one day I'll [G7]cross the [C]river
[G]I'll fight life's final [D]war with [D7]pain
[G]And then as [G7]death gives [C]way to [Cm]vict'ry
[G]I'll see the [Em]lights of [Am]glory
[D7]And I'll know He [G]lives`,
    notes: "Key of G. Classic Gaither hymn. Triumphant resurrection anthem.",
    bpm: 92,
    tags: ["worship", "hymn", "resurrection", "hope", "Easter", "ccli-top-100"],
  },

  // 79. Victory In Jesus - Traditional (Key: G)
  {
    title: "Victory In Jesus",
    artist: "Eugene Monroe Bartlett",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]I heard an old old [C]story how a [G]Savior came from [Em]glory
How He [A]gave His life on [D]Calvary to save a wretch like me
[G]I heard about His [C]groaning of His [G]precious blood's a[Em]toning
Then I [G]repented [C]of my sins and [D]won the vic[G]tory

{Chorus}
O [G]victory in [C]Jesus my [G]Savior for[Em]ever
He [A]sought me and [D]bought me with His redeeming blood
[G]He loved me ere I [C]knew Him and [G]all my love is [Em]due Him
He [G]plunged me to [C]victory be[D]neath the cleansing [G]flood

{Verse 2}
[G]I heard about His [C]healing of His [G]cleansing pow'r re[Em]vealing
How He [A]made the lame to [D]walk again and caused the blind to see
[G]And then I cried dear [C]Jesus come and [G]heal my broken [Em]spirit
And [G]somehow Jesus [C]came and brought to [D]me the vic[G]tory

{Verse 3}
[G]I heard about a [C]mansion He has [G]built for me in [Em]glory
And I [A]heard about the [D]streets of gold beyond the crystal sea
[G]About the angels [C]singing and the [G]old redemption [Em]story
And [G]some sweet day I'll [C]sing up there the [D]song of vic[G]tory`,
    notes: "Key of G. Classic hymn written in 1939. Jubilant, celebratory feel.",
    bpm: 108,
    tags: ["worship", "hymn", "victory", "salvation", "testimony", "ccli-top-100"],
  },

  // 80. Is He Worthy - Andrew Peterson (Key: C)
  {
    title: "Is He Worthy",
    artist: "Andrew Peterson",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]Do you feel the world is broken? [Am](We do)
[C]Do you feel the shadows deepen? [Am](We do)
[F]But do you know that all the dark won't
[C]Stop the light from getting through? (We [G]do)

{Verse 2}
[C]Do you wish that you could see it all made new? [Am](We do)
[F]Is all creation groaning? [Am](It is)
[F]Is a new creation coming? [Am](It is)
[F]Is the glory of the Lord to be
The [C]light within our midst? (It [G]is)

{Chorus}
[F]Is any[G]one worthy? [Am]Is any[G]one [F]whole?
[F]Is any[G]one able to [Am]break the seal and [G]open the [F]scroll?
The [F]Lion of [G]Judah who [Am]conquered the [G]grave
[F]He is David's Root and the [Am]Lamb who [G]died to [F]ransom the slave
[Am]Is He [G]wor[Em]thy? Is He [F]worthy
[Am]Of all [G]blessing and [C/E]honor and [F]glory?
[Am]Is He [G]worthy of [F]this? He [C]is

{Bridge}
[Am]He is [G] [F]
[Am]He is [G] [C/E] [F]
[Am]He is [G] [F] [C]`,
    notes: "Key of C. Call-and-response format. Builds to powerful declaration.",
    bpm: 72,
    tags: ["worship", "declaration", "Revelation", "worthy", "ccli-top-100"],
  },

  // 81. Shout To The Lord - Darlene Zschech (Key: A)
  {
    title: "Shout To The Lord",
    artist: "Darlene Zschech",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]My Jesus [E/G#]my Savior
[F#m]Lord there is [E]none like [D]You
[A/C#]All of my [D]days [A]I want to [E]praise
The [F#m]wonders of Your [G]mighty [D/F#]love [Esus4] [E]

{Verse 2}
[A]My comfort [E/G#]my shelter
[F#m]Tower of [E]refuge and [D]strength
[A/C#]Let every [D]breath [A]all that I [E]am
[F#m]Never cease to [G]worship [D/F#]You [Esus4] [E]

{Chorus}
[A]Shout to the Lord [F#m]all the earth let us [D]sing
[Esus4]Power and [E]majesty [A]praise to the [F#m]King
[D]Mountains bow [Esus4]down and the [E]seas will [F#m]roar
At the [E/G#]sound [E]of Your [B]name
[A]I sing for joy [F#m7]at the work of Your [D]hands
For[Esus4]ever I'll [E]love You for[A]ever I'll [F#m7]stand
[D]Nothing com[Esus4]pares to the [E]promise I [F#m]have
In [E/G#] [E] [A]You`,
    notes: "Key of A. 76 BPM. One of the most sung worship songs in history.",
    bpm: 76,
    tags: ["worship", "praise", "classic", "declaration", "ccli-top-100"],
  },

  // 82. Jesus We Love You - Bethel Music (Key: G)
  {
    title: "Jesus We Love You",
    artist: "Bethel Music",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Old things have passed away
[D]Your love has stayed the same
[G]Your constant grace re[D]mains the cornerstone

{Verse 2}
[G]Things that we thought were dead
[D]Are breathing in again
[G]Your constant grace re[D]mains the cornerstone

{Pre-Chorus}
[Em]For all that You've [C]done
We will [G]pour out our love
[D]This will be our anthem song

{Chorus}
[G]Jesus we [D]love You
[Em]Oh how we [C]love You
[G]You are the [D]one our
[Em]Hearts a[C]dore

{Verse 3}
[G]Walls that we thought were strong
[D]Came falling down again
[G]Your constant grace re[D]mains the cornerstone

{Bridge}
[Em]Our affec[C]tion our de[G]votion
Poured out on the [D]feet of Jesus
[Em]Our affec[C]tion our de[G]votion
Poured out on the [D]feet of Jesus`,
    notes: "Key of G (original B, capo 4). 58 BPM in 6/8 time. Intimate devotional worship.",
    bpm: 58,
    tags: ["worship", "devotion", "love", "Jesus", "ccli-top-100"],
  },

  // 83. How He Loves - John Mark McMillan (Key: C)
  {
    title: "How He Loves",
    artist: "John Mark McMillan",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]He is jealous for me
[Am]Loves like a hurricane I am a tree
[G]Bending beneath the weight of His wind and [F]mercy

{Verse 2}
[C]When all of a sudden I am unaware of these
[Am]Afflictions eclipsed by glory and I realize
[G]Just how beautiful You are and how [F]great Your affections are for me

{Pre-Chorus}
[C]And oh how He loves us [Am]oh
Oh how He [G]loves us how He [F]loves us all

{Chorus}
[C]He loves us oh how He [Am]loves us
Oh how He [G]loves us oh how He [F]loves us

{Bridge}
[Am]And we are His por[G]tion and He is our [F]prize
[Am]Drawn to re[G]demption by the grace in His [F]eyes
[Am]If His grace is an [G]ocean we're all sink[F]ing

[C]So heaven meets earth like an unforeseen [Am]kiss
And my heart turns violently in[G]side of my chest
I don't have time to main[F]tain these regrets
When I think about His love`,
    notes: "Key of C. 49 BPM in 6/8 time. Deeply emotional, passionate worship.",
    bpm: 49,
    tags: ["worship", "love", "grace", "devotion", "ccli-top-100"],
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
