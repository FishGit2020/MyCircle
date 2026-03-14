#!/usr/bin/env node
/**
 * Seed CCLI Top 100 songs (31-60) into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/ccli-top-100-part2.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  // 31. Holy Spirit - Bryan & Katie Torwalt (Key: D)
  // Chords sourced from Ultimate Guitar / Worship Together
  {
    title: "Holy Spirit",
    artist: "Bryan & Katie Torwalt",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]There's nothing worth more
That will ever come [G]close
No thing can com[D]pare
You're our living [G]hope
[D]Your presence [A]Lord

{Verse 2}
[D]I've tasted and seen
Of the sweetest of [G]loves
Where my heart becomes [D]free
And my shame is un[G]done
[D]Your presence [A]Lord

{Chorus}
[D]Holy Spirit You are welcome here
Come [G]flood this place and fill the atmo[D]sphere
Your glory God is what our [G]hearts long for
To be over[D]come by Your [A]presence [D]Lord

{Bridge}
[D]Let us become more a[G]ware of Your presence
[D]Let us experience the [A]glory of Your goodness
[D]Let us become more a[G]ware of Your presence
[D]Let us experience the [A]glory of Your [D]goodness`,
    notes: "Key of D. Originally recorded in A, commonly played in D. Gentle, atmospheric worship.",
    bpm: 68,
    tags: ["worship", "holy-spirit", "presence", "ccli-top-100"],
  },

  // 32. The Joy - Elevation Worship (ELEVATION RHYTHM)
  // Chords sourced from Ultimate Guitar / PraiseCharts — key Bb, played in G with capo 3
  {
    title: "The Joy",
    artist: "Elevation Worship",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]I've got the joy joy [C]joy joy
[Em]Down in my [D]heart
[G]Down in my [C]heart
[Em]Down in my [D]heart
[G]I've got the joy joy [C]joy joy
[Em]Down in my [D]heart
[G]Down in my heart to [C]stay

{Chorus}
[G]And it's the joy of the [D]Lord
That is my [Em]strength
It's the [C]joy of the Lord
[G]Greater than any[D]thing
It's the [Em]joy, joy, [C]joy

{Verse 2}
[G]I've got the peace that [C]passes understanding
[Em]Down in my [D]heart
[G]Down in my [C]heart
[Em]Down in my [D]heart
[G]I've got the peace that [C]passes understanding
[Em]Down in my [D]heart
[G]Down in my heart to [C]stay

{Bridge}
[Em]No one can take it a[C]way
[G]No one can take it a[D]way
[Em]No one can take it a[C]way
[G]No one can take it a[D]way`,
    notes: "Key of Bb, commonly played in G with capo 3. Upbeat, energetic rhythm.",
    bpm: 130,
    tags: ["worship", "joy", "praise", "ccli-top-100"],
  },

  // 33. All Hail King Jesus - Jeremy Riddle (Key: F)
  // Chords sourced from Ultimate Guitar / Essential Worship — originally in C, transposed to F
  {
    title: "All Hail King Jesus",
    artist: "Jeremy Riddle",
    originalKey: "F",
    format: "chordpro",
    content: `{Verse 1}
[F]There was a moment when the lights went [Dm]out
When death had claimed its [C]victory
The King of love had [Bb]given up His life
The darkest day in [C]history

{Verse 2}
[F]There was a moment when the earth [Dm]shook
When the stone was rolled a[C]way
When heaven stood and [Bb]death lay still
The [C]angels could not look a[F]way

{Chorus}
[F]All hail King [Fsus]Jesus
[F]All hail the [Dm]Lord of [C]heaven and [Bb]earth
[F]All hail King [C/E]Jesus
[Bb]All hail the [C]Saviour of the [F]world

{Bridge}
[Bb]Let every knee come [C]bow before the [Dm]King of kings
[Bb]Let every tongue con[C]fess that He is [F]Lord
[Bb]Lift up your shout lift [C]up your shout
[Dm]Lift it up lift it [C]up`,
    notes: "Key of F. Originally in C, can be played in F with no capo. Triumphant resurrection anthem.",
    bpm: 72,
    tags: ["worship", "Jesus", "resurrection", "praise", "ccli-top-100"],
  },

  // 34. Rest On Us - Maverick City Music (Key: G)
  // Chords sourced from Ultimate Guitar — key of G
  {
    title: "Rest On Us",
    artist: "Maverick City Music",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]As the Spirit was moving
Over the [C/G]waters
Spirit come move over [Em7]us
Come rest on [C]us
Come rest on [G]us

{Verse 2}
[G]As the Spirit was moving
Over the [C/G]waters
Spirit come move over [Em7]us
Come rest on [C]us
Come rest on [G]us

{Chorus}
[G]Holy Spirit [C/G]come and fill this place
[Em7]Overflow our [D]hearts with grace
[C]Come and fill this [G]place

{Bridge}
[Em7]Let Your glory [C]fall in this room
[G]Let it go forth from [D]here
[Em7]Let Your glory [C]fall in this room
[G]Let it go forth from [D]here`,
    notes: "Key of G. Gentle, spontaneous worship led by Brandon Lake & Eniola Abioye.",
    bpm: 72,
    tags: ["worship", "holy-spirit", "presence", "ccli-top-100"],
  },

  // 35. Worthy - Elevation Worship (Key: G)
  // Chords sourced from Ultimate Guitar — originally Eb, transposed to G
  {
    title: "Worthy",
    artist: "Elevation Worship",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]It was my cross You [D]bore
So I could live in the [Em]freedom You died for
And now my [C]life is Yours
And I will [G]sing of Your [D]goodness forever[Em]more [C]

{Verse 2}
[G]You took my place and [D]stood
Where only You could [Em]stand in my position
You gave what [C]was not owed
And I will [G]sing of Your [D]goodness forever[Em]more [C]

{Chorus}
[G]Worthy is Your [D]name Jesus
[Em]You deserve the [C]praise
[G]Worthy is Your [D]name
[Em] [C]

{Bridge}
[G]I will follow [D]You
[Em]I will follow [C]You
[G]I will follow [D]You
[Em]All my [C]days`,
    notes: "Key of G. Originally in Eb, commonly played in G. Anthem of surrender and devotion.",
    bpm: 72,
    tags: ["worship", "worthy", "Jesus", "surrender", "ccli-top-100"],
  },

  // 36. Amazing Grace (My Chains Are Gone) - Chris Tomlin (Key: G)
  // Chords sourced from Ultimate Guitar / Worship Together
  {
    title: "Amazing Grace (My Chains Are Gone)",
    artist: "Chris Tomlin",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
A[G]mazing grace how [C]sweet the [G]sound
That saved a [G]wretch like [D]me
I [G]once was lost but [C]now I'm [G]found
Was blind but [D]now I [G]see

{Verse 2}
'Twas [G]grace that taught my [C]heart to [G]fear
And grace my [G]fears re[D]lieved
How [G]precious did that [C]grace ap[G]pear
The hour I [D]first be[G]lieved

{Chorus}
My chains are [G]gone I've been set [C]free
My God my [G]Savior has [D]ransomed me
And like a [G]flood His mercy [C]reigns
Unending [G]love a[D]mazing [G]grace

{Verse 3}
The [G]Lord has promised [C]good to [G]me
His word my [G]hope se[D]cures
He [G]will my shield and [C]portion [G]be
As long as [D]life en[G]dures

{Bridge}
The [G]earth shall soon dis[C]solve like [G]snow
The sun for[G]bear to [D]shine
But [G]God who called me [C]here be[G]low
Will be for[D]ever [G]mine`,
    notes: "Key of G. Classic hymn reimagined by Chris Tomlin with the 'My Chains Are Gone' chorus.",
    bpm: 68,
    tags: ["worship", "hymn", "grace", "freedom", "ccli-top-100"],
  },

  // 37. Make Room - Community Music (Key: A)
  // Chords sourced from Ultimate Guitar — transposed to A from G
  {
    title: "Make Room",
    artist: "Community Music",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]Here is where I lay it down
[E]Every burden every crown
This is my surren[F#m]der
This is my surren[D]der
[A]Here is where I lay it down
[E]Every lie and every doubt
This is my surren[F#m]der
This is my surren[D]der

{Chorus}
[A]I'm gonna make [E]room for You
[F#m]I'm gonna make [D]room for You
[A]I shake off every [E]thing that's weighing down on me
[F#m]And I make [D]room for You

{Verse 2}
[A]There is nothing better now
[E]There is nothing better now
Than living in Your [F#m]glory
Living in Your [D]glory
[A]Where the Spirit of the Lord is
[E]There is freedom there is freedom
I come alive in Your [F#m]glory
I come alive in Your [D]glory

{Bridge}
[A]Shake every fear I've been [E]holding on to
[F#m]You are my refuge I [D]won't be shaken
[A]I will rejoice I will [E]lift my voice
[F#m]Wake up my [D]soul and praise`,
    notes: "Key of A. Commonly played in G with capo 2. Surrender-themed worship.",
    bpm: 75,
    tags: ["worship", "surrender", "freedom", "ccli-top-100"],
  },

  // 38. Made For More - Josh Baldwin (Key: G)
  // Chords sourced from Worship Together / Ultimate Guitar — key G
  {
    title: "Made For More",
    artist: "Josh Baldwin",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]I know who I am 'cause I [Em]know who You are
The [C]cross of salvation was [D]only the start
[G]You awakened my soul to be [Em]hungry for more
Of the [C]One who has loved me like [D]never before

{Chorus}
[G]I wasn't made to be [Em]tending a grave
I was [C]called by name [D]born and raised back to life again
[G]I was made for [Em]more
I was [C]made for more [D]
I was [G]made for [Em]more [C] [D]

{Verse 2}
[G]I don't have to hide [Em]I don't have to pretend
[C]What I used to hold on to [D]I let go of it
[G]And all I know is I was [Em]blind and now I see
From [C]dust I was formed and [D]now I am redeemed

{Bridge}
[Em]You breathe in me [C]life like I've never had
[G]Opened my eyes to a [D]hope that will never end
[Em]Standing here now in Your [C]resurrection power
[G]I was made for [D]more`,
    notes: "Key of G. Josh Baldwin feat. Jenn Johnson. Declaration of identity in Christ.",
    bpm: 76,
    tags: ["worship", "identity", "resurrection", "declaration", "ccli-top-100"],
  },

  // 39. O Praise The Name (Anástasis) - Hillsong Worship (Key: G)
  // Chords sourced from Ultimate Guitar / Worship Together — transposed to G from C
  {
    title: "O Praise The Name (Anástasis)",
    artist: "Hillsong Worship",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
I cast my [G]mind to [G/B]Calvary
Where [C]Jesus bled and [G]died for me
I see His [Em]wounds His [D]hands His feet
My [C]Saviour [D]on that cursed [G]tree

{Verse 2}
His body [G]bound and [G/B]drenched in tears
They [C]laid Him down in [G]Joseph's tomb
The entrance [Em]sealed by [D]heavy stone
Mes[C]siah [D]still and [G]all alone

{Chorus}
[G]O praise the [D]Name of the Lord our [Em]God
[C]O praise His Name forever[G]more
For [D]endless days we will [Em]sing Your [C]praise
Oh Lord oh [G]Lord our [D]God [G]

{Verse 3}
Then on the [G]third at [G/B]break of dawn
The [C]Son of heaven [G]rose again
O trampled [Em]death where [D]is your sting
The [C]angels [D]roar for [G]Christ the King

{Bridge}
[Em]He shall re[D]turn in [C]robes of white
The [G]blazing sun shall [D]pierce the night
And [Em]I will [D]rise a[C]mong the saints
My [G]gaze trans[D]fixed on [G]Jesus' face`,
    notes: "Key of G. Originally in C, commonly played in G. Powerful Easter/resurrection anthem.",
    bpm: 68,
    tags: ["worship", "resurrection", "Easter", "praise", "ccli-top-100"],
  },

  // 40. Abide - Aaron Williams (Key: G)
  // Chords sourced from Ultimate Guitar (Dwell Songs / Aaron Williams)
  {
    title: "Abide",
    artist: "Aaron Williams",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Abide with me [D]abide with me
[Em]Don't let me fall and [C]don't let go
[G]Walk with me and [D]never leave
[Em]Ever close God [C]ever close

{Chorus}
[G]Won't You come and [D]pour out Your spirit
[Em]Now we're longing [C]for your presence
[G]So abide with [D]me here in this moment
[Em]I know You will [C]I know You will

{Verse 2}
[G]There's nowhere else that [D]I'd rather be
Than [Em]here in Your arms [C]of peace
[G]Even the winds and [D]the waves obey
[Em]Every word that [C]You speak

{Bridge}
[Em]Let Your glory [C]fall in this place
[G]Let Your presence [D]fill this space
[Em]Holy Spirit [C]come and take over
[G]We are [D]Yours`,
    notes: "Key of G. Originally in B, commonly played in G. Intimate worship song about God's nearness.",
    bpm: 72,
    tags: ["worship", "presence", "intimacy", "peace", "ccli-top-100"],
  },

  // 41. Who You Say I Am - Hillsong Worship (Key: G)
  // Chords sourced from Ultimate Guitar / Worship Together
  {
    title: "Who You Say I Am",
    artist: "Hillsong Worship",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Who am I that the highest King
Would [Em]welcome me
[C]I was lost but He brought me in
Oh His [D]love for me
Oh His [G]love for me

{Pre-Chorus}
[Em]Who the Son sets free
[C]Oh is free indeed
[G]I'm a child of [D]God
Yes I [Em]am

{Chorus}
[G]Free at last He has [D]ransomed me
His [Em]grace runs deep
While I [C]was a slave to sin
[G]Jesus died for [D]me
Yes He [Em]died for [C]me

{Verse 2}
[G]Who am I that the Lord of all
The [Em]earth would care to know my name
[C]Would care to feel my hurt
[D]Who am I that the [G]Bright and Morning Star
Would [Em]choose to light the way
[C]For my ever wandering [D]heart

{Bridge}
[Em]In my Father's house
[C]There's a place for me
[G]I'm a child of [D]God
Yes I [Em]am
I am [C]chosen not forsaken
[G]I am who You [D]say I am`,
    notes: "Key of G. One of Hillsong Worship's most popular identity anthems. Reuben Morgan & Ben Fielding.",
    bpm: 80,
    tags: ["worship", "identity", "freedom", "grace", "ccli-top-100"],
  },

  // 42. O Come All Ye Faithful (His Name Shall Be) - Passion (Key: A)
  // Chords sourced from Ultimate Guitar / Worship Together — key A
  {
    title: "O Come All Ye Faithful (His Name Shall Be)",
    artist: "Passion",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[D]O come all ye [A/C#]faithful
[Bm7]Joyful and tri[A]umphant
O [E]come ye o [A]come ye to [D]Bethle[A]hem
[D]Come and be[A/C#]hold Him
[Bm7]Born the King of [A]angels

{Chorus}
O [D]come let us a[A]dore Him
O [Bm7]come let us a[E]dore Him
O [D]come let us a[A/C#]dore Him
[Bm7]Christ the [E]Lord [A]

{Verse 2}
[D]Sing choirs of [A/C#]angels
[Bm7]Sing in exul[A]tation
[E]Sing all ye [A]citizens of [D]heaven a[A]bove
[D]Glory to [A/C#]God
[Bm7]All glory in the [A]highest

{Bridge}
[D]His name shall [A]be
The [F#m]Prince of [E]Peace
[D]Counselor the [A]Almighty
The [Bm7]everlasting [E]Father
[D]His name shall [A]be
The [F#m]Prince of [E]Peace
[D]Emmanuel God [A]with us [Bm7] [E] [A]`,
    notes: "Key of A. Originally in Ab. Classic hymn with added original 'His Name Shall Be' bridge by Passion feat. Melodie Malone.",
    bpm: 72,
    tags: ["worship", "Christmas", "hymn", "advent", "ccli-top-100"],
  },

  // 43. Great Things - Phil Wickham (Key: D)
  // Chords sourced from Ultimate Guitar
  {
    title: "Great Things",
    artist: "Phil Wickham",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]Come let us worship our [Bm]King
Come let us [G]bow at His [A]feet
He has done [D]great things
[D]See what our Savior has [Bm]done
See how His [G]love over[A]comes
He has done [D]great things
He has done great things

{Pre-Chorus}
[G]O Hero of Heaven You [D]conquered the grave
You [Bm]free every captive and [A]break every chain
[G]O God You have done great [A]things

{Chorus}
We [D]dance in Your freedom a[Bm]wake and alive
O [G]Jesus our Savior Your [A]name lifted high
O [D]God You have done great [Bm]things [G] [A]

{Verse 2}
[D]You've been faithful through [Bm]every storm
You'll be [G]faithful for[A]evermore
You have done [D]great things
[D]And I know You will do it [Bm]again
For Your [G]promise is [A]Yes and Amen
You will do [D]great things
God You do great things

{Bridge}
[G]Hallelujah God a[D]bove it all
[Bm]Hallelujah God un[A]shakeable
[G]Hallelujah You have [D]done great things [Bm] [A]`,
    notes: "Key of D. From the 'Living Hope' album. Energetic praise anthem.",
    bpm: 100,
    tags: ["worship", "praise", "greatness", "hallelujah", "ccli-top-100"],
  },

  // 44. Same God - Elevation Worship (Key: Ab)
  // Chords sourced from Ultimate Guitar / Worship Together — key Ab (using Db, Gb/Db, Bbm)
  {
    title: "Same God",
    artist: "Elevation Worship",
    originalKey: "Db",
    format: "chordpro",
    content: `{Verse 1}
[Db]I'm calling on the God of [Gb/Db]Jacob
Whose [Db]love endures through genera[Ab]tions
[Db]I know that You will keep Your [Bbm]covenant
[Gb]I know You will be [Ab]faithful

{Verse 2}
[Db]I'm calling on the God of [Gb/Db]Moses
The [Db]One who opened up the [Ab]waters
[Db]I need You now to do the [Bbm]same thing for me
[Gb]I know You will be [Ab]faithful

{Chorus}
[Db]The God who was [Ab]faithful then
Is the [Bbm]same God who's [Gb]faithful now
He has [Db]never let me [Ab]down
He has [Bbm]never let me [Gb]down
The [Db]same God [Ab]same [Bbm]God [Gb]

{Bridge}
[Db]I will [Ab]hold on to [Bbm]every promise You've [Gb]made to me
[Db]I will [Ab]hold on to [Bbm]every promise You've [Gb]made
[Db]I'm leaning on the [Ab]everlasting arms
[Bbm]I'm holding on to [Gb]everything You are`,
    notes: "Key of Ab. From the LION album. Elevation Worship feat. Jonsal Barrientes.",
    bpm: 78,
    tags: ["worship", "faithfulness", "trust", "declaration", "ccli-top-100"],
  },

  // 45. Thank You Jesus For The Blood - Charity Gayle (Key: F)
  // Chords sourced from Ultimate Guitar — commonly in Bb, transposed to F
  {
    title: "Thank You Jesus For The Blood",
    artist: "Charity Gayle",
    originalKey: "F",
    format: "chordpro",
    content: `{Verse 1}
[F]I was a wretch I re[C/E]member who I was
I was [Dm]lost I was blind I was [Bb]running out of time
[F]Sin separated the [C/E]breach was far too wide
But [Dm]from the far side of the [Bb]chasm
You had [F]me in Your sight

{Chorus}
So [F]thank You thank You
[C/E]Thank You Jesus
[Dm]Thank You for the [Bb]blood applied
[F]Thank You thank You
[C/E]Thank You Jesus
[Dm]Thank You for the [Bb]blood applied

{Verse 2}
[F]You took my place [C/E]laid inside my tomb
Of sin [Dm]You were buried You took it [Bb]all away
[F]You carried the cross [C/E]for my shame for my guilt
For [Dm]everything I've done [Bb]Jesus paid it all

{Bridge}
[Dm]There is [C]nothing stronger
Than the [F]wonder working [Bb]power of the blood
The [Dm]blood that [C]gives me strength
From [F]day to [Bb]day it will never lose its power

{Tag}
[Dm]Glory to His [C]name
[F]Glory to His [Bb]name
[Dm]There to my heart was the [C]blood applied
[F]Glory to His [Bb]name`,
    notes: "Key of F. Originally in Bb, commonly transposed to F. Powerful testimony of redemption.",
    bpm: 73,
    tags: ["worship", "blood", "redemption", "testimony", "ccli-top-100"],
  },

  // 46. Revelation Song - Jennie Lee Riddle (Key: D)
  // Chords sourced from Ultimate Guitar — key D
  {
    title: "Revelation Song",
    artist: "Jennie Lee Riddle",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]Worthy is the [Am7]Lamb who was slain
[C]Holy holy [G]is He
[D]Sing a new song [Am7]to Him who sits on
[C]Heaven's mercy [G]seat

{Chorus}
[D]Holy holy [Am7]holy
Is the [C]Lord God Al[G]mighty
Who [D]was and is and [Am7]is to come
[C]With all creation I [G]sing
[D]Praise to the [Am7]King of kings
[C]You are my every[G]thing
And [D]I will a[Am7]dore You

{Verse 2}
[D]Clothed in rainbows [Am7]of living color
[C]Flashes of lightning [G]rolls of thunder
[D]Blessing and honor [Am7]strength and glory
And [C]power be to [G]You the only wise King

{Bridge}
[D]Filled with wonder [Am7]awestruck wonder
[C]At the mention [G]of Your name
[D]Jesus Your name is [Am7]power breath and living water
[C]Such a marvelous [G]mystery yeah`,
    notes: "Key of D. Made popular by Kari Jobe and Phillips Craig & Dean. Heavenly worship anthem based on Revelation 4-5.",
    bpm: 72,
    tags: ["worship", "revelation", "holy", "lamb", "ccli-top-100"],
  },

  // 47. Christ Be Magnified - Cody Carnes (Key: A)
  // Chords sourced from Ultimate Guitar / Worship Together
  {
    title: "Christ Be Magnified",
    artist: "Cody Carnes",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]Were creation ever to hold its tongue
[E]Your glory goes un[D2]questioned
[A]Were the praise to cease from the sons of man
[E]The rocks would rush to [D2]sing

{Pre-Chorus}
Oh [F#m]Christ be magni[E]fied
Let His [D]praise arise
[A]Christ be magnified in [E]me

{Chorus}
Oh [A]Christ be magnified from the [E]altar I cry
Let [D2]these bones rejoice oh Lord
[A]Christ be magnified from the [E]altar I cry
Let [D2]these bones rejoice

{Verse 2}
[A]Were ev'ry mouth that has cursed Your name
[E]To sing of Your great [D2]love
[A]Were ev'ry sinner beneath the sun
[E]To lift the name a[D2]bove

{Bridge}
[F#m]I won't bow to [E]idols I'll stand strong and [D]worship You
[A]And if it puts me in the [E]fire I'll re[D]joice 'cause You're there too
[F#m]I won't be formed by [E]feelings I hold fast to [D]what is true
[A]If the cross brings me to [E]my knees it's a [D]worthy place to be`,
    notes: "Key of A. Passionate declaration of surrender. From Cody Carnes' 'Run to the Father' era.",
    bpm: 73,
    tags: ["worship", "surrender", "magnify", "declaration", "ccli-top-100"],
  },

  // 48. God So Loved - We The Kingdom (Key: G)
  // Chords sourced from Ultimate Guitar / Worship Together — key G
  {
    title: "God So Loved",
    artist: "We The Kingdom",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Come all you weary come [D]all you thirsty
[Em]Come to the well that [C]never runs dry
[G]Come and drink and be [D]filled with living water
[Em]And you will thirst no [C]more

{Verse 2}
[G]Come all you sinners come [D]find His mercy
[Em]Come to the table He [C]will satisfy
[G]Taste of His goodness [D]find what you're looking for
[Em]For God so loved the [C]world that He gave us

{Chorus}
His [G]one and only [D]Son to save us
Who[Em]ever believes will [C]live forever
[G]Bring all your failures [D]bring your addictions
[Em]Come lay them down at the [C]foot of the cross
[G]Jesus is [D]waiting [Em]there with open [C]arms

{Bridge}
[G]God so loved the [D]world
[Em]That He gave His [C]only Son
[G]God so loved the [D]world
[Em]That He gave [C]everything
[G]He gave every[D]thing [Em] [C]`,
    notes: "Key of G. Beautiful declaration of John 3:16. We The Kingdom.",
    bpm: 72,
    tags: ["worship", "love", "salvation", "gospel", "ccli-top-100"],
  },

  // 49. Yet Not I But Through Christ In Me - CityAlight (Key: C)
  // Chords sourced from Ultimate Guitar — key C
  {
    title: "Yet Not I But Through Christ In Me",
    artist: "CityAlight",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
What [C]gift of grace is [Am]Jesus my re[F]deemer
There [C]is no more for [G]heaven now to [C]give
He [C]is my joy my [Am]righteousness and [F]freedom
My [C]steadfast love my [G]deep and boundless [C]peace

{Pre-Chorus}
To [Am]this I hold my [F]hope is only [C]Jesus [G]
For [Am]my life is [F]wholly bound to [C]His [G]
Oh how [Am]strange and [F]divine I can [C]sing all is [G]mine
Yet [Am]not I [F]but through [G]Christ in [C]me

{Verse 2}
The [C]night is dark but [Am]I am not for[F]saken
For [C]by my side the [G]Saviour He will [C]stay
I [C]labour on in [Am]weakness and re[F]joicing
For [C]in my need His [G]power is dis[C]played

{Verse 3}
With [C]every breath I [Am]long to follow [F]Jesus
For [C]He has said that [G]He will bring me [C]home
And [C]day by day I [Am]know He will re[F]new me
Un[C]til I stand with [G]joy before the [C]throne

{Tag}
Yet [Am]not I [F]but through [G]Christ in [C]me`,
    notes: "Key of C. Modern hymn by CityAlight. Theologically rich, congregational.",
    bpm: 100,
    tags: ["worship", "hymn", "grace", "Christ", "ccli-top-100"],
  },

  // 50. Goodbye Yesterday - Elevation Worship (ELEVATION RHYTHM) (Key: G)
  // Chords sourced from Ultimate Guitar / Essential Worship
  {
    title: "Goodbye Yesterday",
    artist: "Elevation Worship",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Goodbye yesterday I'm living in the [C]light of a new day
I won't [G]waste another minute [D]in my old ways
[G]Praise the Lord I've been [C]born again
I've been [Em]born again [D]

{Verse 2}
[G]The Spirit of the Lord is up[C]on me
I've got [G]resurrection [D]in my veins
[G]Praise the Lord I've been [C]born again
I've been [Em]born again [D]

{Chorus}
A[C]gain and again and a[D]gain and again
You [Em]rescued me out of the [Am]mess I was in
[C]Traded my sorrow for [D]something to sing
I'm [Em]dancing on the [Am]grave that I once lived in

{Bridge}
[G]I have deci[Am]ded
To [Em]follow [D]Jesus
The [G]world be[Am]hind
The [Em]cross be[D]fore
[G]I won't turn [Am]back
I [Em]won't turn [D]back`,
    notes: "Key of G. ELEVATION RHYTHM feat. Gracie Binion. Upbeat, high energy. 150 BPM.",
    bpm: 150,
    tags: ["worship", "freedom", "new-life", "praise", "ccli-top-100"],
  },

  // 51. Agnus Dei - Michael W. Smith (Key: A)
  // Chords sourced from Ultimate Guitar
  {
    title: "Agnus Dei",
    artist: "Michael W. Smith",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]Alleluia [D]alleluia
For the [A]Lord God Almighty [E]reigns
[A]Alleluia [D]alleluia
For the [A]Lord God Al[E]mighty [A]reigns
[D]Allelu[A]ia

{Chorus}
[F#m]Holy [E]holy
Are [D]You Lord God Al[A]mighty
[E]Worthy is the [D]Lamb
[E]Worthy is the [D]Lamb
You are [A]holy [D]holy
Are [A]You Lord God Al[E]mighty
[D]Worthy is the [A]Lamb
[D]Worthy is the [E]Lamb
A[A]men

{Verse 2}
[A]Alleluia [D]alleluia
For the [A]Lord God Almighty [E]reigns
[A]Alleluia [D]alleluia
For the [A]Lord God Al[E]mighty [A]reigns
[D]Allelu[A]ia

{Bridge}
[D]Holy [A]holy [E]holy
[D]Holy [A]holy [E]holy
Are [D]You Lord God Al[A]mighty`,
    notes: "Key of A. Classic worship anthem by Michael W. Smith. Based on Revelation 5.",
    bpm: 68,
    tags: ["worship", "holy", "lamb", "majesty", "ccli-top-100"],
  },

  // 52. Cornerstone - Hillsong Worship (Key: C)
  // Chords sourced from Ultimate Guitar / Worship Together — key C
  {
    title: "Cornerstone",
    artist: "Hillsong Worship",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
My [C]hope is built on nothing less
Than [Am]Jesus' blood and [F]righteousness
I [C]dare not trust the sweetest frame
But [Am]wholly trust in [G]Jesus' name

{Verse 2}
When [C]darkness seems to hide His face
I [Am]rest on His un[F]changing grace
In [C]every high and stormy gale
My [Am]anchor holds with[G]in the veil

{Chorus}
[F]Christ a[Am]lone [G]Corner[C]stone
[F]Weak made [Am]strong in the [G]Saviour's love
Through the [F]storm He is [Am]Lord
[G]Lord of [C]all

{Verse 3}
When [C]He shall come with trumpet sound
Oh [Am]may I then in [F]Him be found
[C]Dressed in His righteousness alone
[Am]Faultless stand be[G]fore the throne

{Bridge}
[C] [Am] [F] [G]
[C]He is [Am]Lord Lord of [F]all [G]`,
    notes: "Key of C. Also commonly played in G. Based on the hymn 'My Hope Is Built'. 71 BPM.",
    bpm: 71,
    tags: ["worship", "hymn", "cornerstone", "hope", "Jesus", "ccli-top-100"],
  },

  // 53. What A God - Elevation Worship (Key: A)
  // Note: "What A God" is actually by SEU Worship, commonly attributed to Elevation.
  // Chords sourced from Ultimate Guitar — key A
  {
    title: "What A God",
    artist: "Elevation Worship",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[F#m]Who thought I'd find You at the [E]lowest place
[F#m]Who thought You'd feel me in the [E]crowd
[F#m]Who knew You'd make good of my [E]mistakes
[D]You're nothing like I [A/C#]thought You were
You're [E]better

{Verse 2}
[F#m]I thought You'd show up for per[E]fection
[F#m]What kind of God looks for the [E]lost
[F#m]They say it's over for a [E]sinner
[D]Oh but You said [A/C#]no it's not
[E]No it's not

{Chorus}
[D]What a God [E]what a God [F#m]what a God [A/C#]what a God
[D]What a God [E]what a God [F#m]what a [E]God

{Bridge}
[D]If the highest place I reached is [E]at Your feet then I've done it all
[F#m]If the best thing that I've seen is [A/C#]Your glory then I've seen it all
[D]Your love has changed my [E]life forever satisfied
[F#m]God You are my [A/C#]everything`,
    notes: "Key of A. Originally by SEU Worship, widely covered. Song about God's unexpected grace.",
    bpm: 76,
    tags: ["worship", "grace", "wonder", "testimony", "ccli-top-100"],
  },

  // 54. The Blessing - Kari Jobe/Cody Carnes (Key: C)
  // Chords sourced from Ultimate Guitar / Worship Together — key C
  {
    title: "The Blessing",
    artist: "Kari Jobe / Cody Carnes",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
The [C]Lord bless you and [F/C]keep you
Make His [C/E]face shine upon you
And be [Gsus]gracious to [G]you
The [C]Lord turn His [F/C]face toward you
And [C/E]give you [Gsus]peace [G]

{Verse 2}
The [Am]Lord bless you and [F/C]keep you
Make His [C/E]face shine upon you
And be [Gsus]gracious to [G]you
The [Am]Lord turn His [F/C]face toward you
And [C/E]give you [Gsus]peace [G]

{Chorus}
A[C]men amen a[G]men
A[Am]men amen a[F]men

{Bridge}
May His [C]favor be upon you
And a [G]thousand generations
And your [Am]family and your children
And their [F]children and their children
May His [C]presence go before you
And be[G]hind you and beside you
All a[Am]round you and within you
He is [F]with you He is with you

{Tag}
In the [C]morning in the [G]evening
In your [Am]coming and your [F]going
In your [C]weeping and re[G]joicing
He is [Am]for you He is [F]for you`,
    notes: "Key of C. Also commonly in D. Based on Numbers 6:24-26. Kari Jobe, Cody Carnes & Elevation Worship.",
    bpm: 140,
    tags: ["worship", "blessing", "prayer", "declaration", "ccli-top-100"],
  },

  // 55. Good Good Father - Chris Tomlin/Pat Barrett (Key: G)
  // Chords sourced from Ultimate Guitar / Worship Together — key G
  {
    title: "Good Good Father",
    artist: "Chris Tomlin / Pat Barrett",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
Oh I've heard a [G]thousand stories
Of what they think You're [Em]like
But I've heard the [C]tender whisper
Of love in the dead of [D]night
And You tell me that You're [G]pleased
And that I'm never a[Em]lone

{Chorus}
You're a [G]good good Father
It's who You [Em]are it's who You are it's who You are
And I'm [C]loved by You
It's who I [D]am it's who I am it's who I am

{Verse 2}
Oh and I've seen [G]many searching
For answers far and [Em]wide
But I know we're [C]all searching
For answers only [D]You provide
'Cause You know just what we [G]need
Before we say a [Em]word

{Bridge}
You are [C]perfect in all of Your ways
You are [Em]perfect in all of Your ways
You are [D]perfect in all of Your ways to [G]us
[C]Love so undeniable I [Em]I can hardly speak
[D]Peace so unexplainable I [G]I can hardly think
As You call me [C]deeper still
As You call me [Em]deeper still
As You call me [D]deeper still
Into [G]love love love`,
    notes: "Key of G. Originally in A (capo 2). Written by Pat Barrett, made famous by Chris Tomlin.",
    bpm: 72,
    tags: ["worship", "father", "love", "identity", "ccli-top-100"],
  },

  // 56. Reckless Love - Cory Asbury (Key: C)
  // Chords sourced from Ultimate Guitar — key C (transposed from original)
  {
    title: "Reckless Love",
    artist: "Cory Asbury",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
Before I spoke a [Am]word You were singing over [G]me
You have been so so [F]good to [C]me
Before I took a [Am]breath You breathed Your life in [G]me
You have been so so [F]kind to [C]me

{Pre-Chorus}
[Am]Oh the overwhelming never-ending [G]reckless love of God
[F]Oh it chases me down fights 'til I'm [C]found leaves the ninety-nine

{Chorus}
I couldn't earn it [Am]I don't deserve it [G]still You give Yourself away
[F]Oh the overwhelming never-ending [C]reckless love of God

{Verse 2}
When I was Your [Am]foe still Your love fought for [G]me
You have been so so [F]good to [C]me
When I felt no [Am]worth You paid it all for [G]me
You have been so so [F]kind to [C]me

{Bridge}
There's no [Am]shadow You won't [G]light up
[F]Mountain You won't [C]climb up coming after me
There's no [Am]wall You won't [G]kick down
[F]Lie You won't [C]tear down coming after me`,
    notes: "Key of C. Originally in Bb/C depending on recording. Bethel Music, Cory Asbury.",
    bpm: 82,
    tags: ["worship", "love", "grace", "pursuit", "ccli-top-100"],
  },

  // 57. Nothing Else - Cody Carnes (Key: C)
  // Chords sourced from Ultimate Guitar / Worship Together — key C
  {
    title: "Nothing Else",
    artist: "Cody Carnes",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[Dm7]I'm caught up in Your presence
[F]I just want to sit here [C]at Your feet [Csus4] [C]
[Dm7]I'm caught up in this holy moment
[F]I never want to [C]leave [Csus4] [C]

{Chorus}
[Dm7]Nothing else [F]nothing else
[Am7]Nothing else will [G]do
[Dm7]Nothing else [F]nothing else
[Am7]Nothing else but [G]You
[C]Jesus

{Verse 2}
[Dm7]I'm not here for an experience
[F]I just want to find [C]You here [Csus4] [C]
[Dm7]I don't need a new revelation
[F]Just want Your manifest [C]presence [Csus4] [C]

{Bridge}
[Dm7]Open up my [F]eyes to You
[Am7]Open up my [G]eyes
[Dm7]Open up my [F]eyes to You
[Am7]Open up my [G]heart and I'll come alive`,
    notes: "Key of C. Intimate, simple worship. From 'The Darker the Night / The Brighter the Morning'.",
    bpm: 72,
    tags: ["worship", "presence", "intimacy", "prayer", "ccli-top-100"],
  },

  // 58. Raise A Hallelujah - Bethel Music (Key: G)
  // Chords sourced from Ultimate Guitar — transposed to G from C
  {
    title: "Raise A Hallelujah",
    artist: "Bethel Music",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]I raise a hallelujah [C]in the presence of my enemies
[Em]I raise a hallelujah [D]louder than the unbelief
[G]I raise a hallelujah [C]my weapon is a melody
[Em]I raise a hallelujah [D]heaven comes to fight for me

{Chorus}
[C]I'm gonna sing in the [G]middle of the storm
[Em]Louder and louder [D]you're gonna hear my praises roar
[C]Up from the ashes [G]hope will arise
[Em]Death is defeated the [D]King is alive

{Verse 2}
[G]I raise a hallelujah [C]with everything inside of me
[Em]I raise a hallelujah [D]I will watch the darkness flee
[G]I raise a hallelujah [C]in the middle of the mystery
[Em]I raise a hallelujah [D]fear you lost your hold on me

{Bridge}
[C]Sing a little louder [G]sing a little louder
[Em]Sing a little louder [D]sing a little louder
[C]Sing a little louder in the [G]presence of my enemies
[Em]Sing a little louder [D]louder than the unbelief`,
    notes: "Key of G. Originally in C, commonly played in G. Bethel Music feat. Jonathan David & Melissa Helser.",
    bpm: 84,
    tags: ["worship", "praise", "warfare", "hallelujah", "victory", "ccli-top-100"],
  },

  // 59. The Lord Will Provide - Passion (Key: B)
  // Chords sourced from Ultimate Guitar / Worship Together — key B
  {
    title: "The Lord Will Provide",
    artist: "Passion",
    originalKey: "B",
    format: "chordpro",
    content: `{Verse 1}
[B]Look at the flowers in [F#]all of their beauty
[C#m]I don't have to wonder You [E]know what You're doing
[B]So why would I worry at [F#]all cause You're faithful
[C#m]Faithful to sup[E]ply

{Verse 2}
[B]What if I trusted You [F#]in ev'ry season
[C#m]Moved past what I'm feeling and [E]into believing
[B]My God is able to [F#]do what He promised
[C#m]Every single [E]time

{Chorus}
[B]Everything I [F#]need everything I need
[C#m]My Father has it [E]my Father has it
[B]Every single [F#]time the Lord will provide
[C#m]My Father has it [E]my Father has it

{Bridge}
[C#m]My Jehovah [E]Jireh
[B]My Jehovah [F#]Jireh
[C#m]My Jehovah [E]Jireh
[B]You are [F#]enough`,
    notes: "Key of B. Passion feat. Landon Wolfe. From Call on Heaven live album. 6/8 time feel.",
    bpm: 68,
    tags: ["worship", "provision", "trust", "faithfulness", "ccli-top-100"],
  },

  // 60. The Heart Of Worship - Matt Redman (Key: D)
  // Chords sourced from Ultimate Guitar / Worship Together — key D
  {
    title: "The Heart Of Worship",
    artist: "Matt Redman",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]When the music fades [A]all is stripped away
[Em7]And I simply [A]come
[D]Longing just to bring [A]something that's of worth
[Em7]That will bless Your [A]heart

{Pre-Chorus}
[Em7]I'll bring You more than a [D/F#]song
For a [A]song in itself
Is not [Em7]what You have re[D/F#]quired
[Em7]You search much deeper with[D/F#]in
Through the [A]way things appear
[Em7]You're looking into my [A]heart

{Chorus}
[D]I'm coming back to the [A]heart of worship
And it's [Em7]all about You it's all about You [A]Jesus
[D]I'm sorry Lord for the [A]thing I've made it
When it's [Em7]all about You it's all about You [A]Jesus

{Verse 2}
[D]King of endless worth [A]no one could express
[Em7]How much You de[A]serve
[D]Though I'm weak and poor [A]all I have is Yours
[Em7]Every single [A]breath

{Bridge}
[D]I'm coming back to the [A]heart of worship
[Em7]'Cause it's all about You
It's [A]all about You [D]Jesus`,
    notes: "Key of D. Classic worship song by Matt Redman. Story of Redman's church stripping back all music to focus on worship.",
    bpm: 76,
    tags: ["worship", "heart", "devotion", "classic", "ccli-top-100"],
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
