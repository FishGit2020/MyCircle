#!/usr/bin/env node
/**
 * Seed CCLI Top 100 songs (1-30) into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/ccli-top-100-part1.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  // 1. Goodness Of God - Bethel Music / Jenn Johnson (Key: A)
  // Chords sourced from ultimate-guitar.com and worshiptogether.com
  {
    title: "Goodness Of God",
    artist: "Bethel Music / Jenn Johnson",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]I love You, Lord
Oh Your [D]mercy never fails me
[A]All my days, I've been [E/G#]held in Your [F#m]hands
[D]From the moment that I [E]wake up
[A]Until I lay my head
[D]Oh, I will sing of the [E]goodness of [A]God

{Chorus}
[D]All my life You have been [A]faithful
[D]All my life You have been so, so [A]good
With [E]every breath that I am [F#m]able
[D]Oh, I will sing of the [E]goodness of [A]God

{Verse 2}
[A]I love Your voice
You have [D]led me through the fire
[A]And in darkest night You [E/G#]are close like [F#m]no other
[D]I've known You as a [E]Father
[A]I've known You as a Friend
[D]And I have lived in the [E]goodness of [A]God

{Bridge}
Your [F#m]goodness is running after, it's running [D]after me
Your [F#m]goodness is running after, it's running [D]after me
With my [A]life laid down, I'm [E]surrendered now
I [F#m]give You every[D]thing
Your [F#m]goodness is running after, it's running [D]after me`,
    notes: "Key of A. One of the most-sung worship songs worldwide. Let the bridge build dynamically.",
    bpm: 68,
    tags: ["ccli-top-100", "worship", "faithfulness", "goodness", "bethel"],
  },

  // 2. Holy Forever - Chris Tomlin (Key: A)
  // Chords sourced from ultimate-guitar.com and essentialworship.com
  {
    title: "Holy Forever",
    artist: "Chris Tomlin",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]A thousand genera[E]tions
[F#m]Falling down in [D]worship
To [A]sing the song of [E]ages to the [D]Lamb

{Verse 2}
[A]And all who've gone be[E]fore us
[F#m]And all who will be[D]lieve
Will [A]sing the song of [E]ages to the [D]Lamb

{Pre-Chorus}
Your [F#m]Name is the highest, Your [D]Name is the greatest
Your [A]Name stands above them [E]all
All [F#m]thrones and dominions, all [D]powers and positions
Your [A]Name stands above them [E]all

{Chorus}
And the [D]angels cry, Ho[A]ly
All crea[E]tion cries, Ho[F#m]ly
You are [D]lifted high, Ho[A]ly
Holy for[E]ever

{Verse 3}
[A]If you've been for[E]given
[F#m]And if you've been re[D]deemed
[A]Sing the song for[E]ever to the [D]Lamb

{Bridge}
[D]Hear Your people [A]sing, Holy forever
[E]Hear Your people [F#m]sing, Holy forever`,
    notes: "Key of A. Originally in Db, commonly played in A with capo. Powerful anthem for congregational worship.",
    bpm: 72,
    tags: ["ccli-top-100", "worship", "holiness", "praise", "chris-tomlin"],
  },

  // 3. Gratitude - Brandon Lake (Key: C)
  // Chords sourced from ultimate-guitar.com (transposed to C from original B)
  {
    title: "Gratitude",
    artist: "Brandon Lake",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]All my words fall short
I got [Am]nothing new
[G]How could I express
[F]All my gratitude

{Verse 2}
[C]I could sing these songs
As I [Am]often do
[G]But every song must end
[F]And You never do

{Chorus}
So I throw up my [C]hands
And praise You a[G]gain and again
'Cause all that I [Am]have is a hallelujah, halle[F]lujah
And I [C]know it's not much
But I've [G]nothing else fit for a King
Except for a [Am]heart singing halle[F]lujah, hallelujah

{Verse 3}
[C]I've got one response
I've got [Am]just one move
[G]With my arms stretched wide
[F]I will worship You

{Bridge}
[C]Come on my soul, oh don't you get shy on me
[G]Lift up your song 'cause you've got a lion inside of those [Am]lungs
Get up and [F]praise the Lord`,
    notes: "Key of B, commonly played in C (capo down). 6/8 time signature. Great energy builder.",
    bpm: 78,
    tags: ["ccli-top-100", "worship", "praise", "gratitude", "brandon-lake"],
  },

  // 4. Great Are You Lord - All Sons & Daughters (Key: G)
  // Chords sourced from ultimate-guitar.com
  {
    title: "Great Are You Lord",
    artist: "All Sons & Daughters",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]You give life, You are love
You bring [C]light to the darkness
You give [Em]hope, You restore every [D]heart that is broken
[G]Great are You, Lord

{Verse 2}
[G]You give life, You are love
You bring [C]light to the darkness
You give [Em]hope, You restore every [D]heart that is broken
[G]Great are You, Lord

{Chorus}
[C]It's Your breath [Em]in our lungs
So we [G]pour out our praise, we [D]pour out our praise
[C]It's Your breath [Em]in our lungs
So we [G]pour out our praise to [D]You only

{Bridge}
[Em]All the earth will shout Your [C]praise
Our [G]hearts will cry, these [D]bones will sing
[Em]Great are You, [C]Lord`,
    notes: "Key of G. Simple 3-chord song ideal for intimate worship. Very singable for congregations.",
    bpm: 74,
    tags: ["ccli-top-100", "worship", "praise", "intimate", "all-sons-and-daughters"],
  },

  // 5. King Of Kings - Hillsong Worship (Key: D)
  // Chords sourced from ultimate-guitar.com and worshiptogether.com
  {
    title: "King Of Kings",
    artist: "Hillsong Worship",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
In the [D]darkness we were [D/F#]waiting
Without [G]hope, without [A]light
Till from [Bm]Heaven You came [D/F#]running
There was [G]mercy in Your [A]eyes
To ful[Bm]fil the law and [D/F#]prophets
To a [G]virgin came the [A]Word
From a [Bm]throne of endless [D/F#]glory
To a [G]cradle in the [A]dirt

{Chorus}
[D]Praise the Father, [A]praise the Son
[Bm]Praise the Spirit, [G]Three in One
[D]God of glory, [A]Majesty
[Bm]Praise forever [G]to the King of [D]Kings

{Verse 2}
To re[D]veal the kingdom [D/F#]coming
And to [G]reconcile the [A]lost
To re[Bm]deem the whole cre[D/F#]ation
You did [G]not despise the [A]cross
For even [Bm]in Your suffer[D/F#]ing
You [G]saw the other [A]side
Knowing [Bm]this was our sal[D/F#]vation
[G]Jesus for our [A]sake

{Verse 3}
And the [D]morning that You [D/F#]rose
All of [G]heaven held its [A]breath
Till that [Bm]stone was moved for [D/F#]good
For the [G]Lamb had conquered [A]death
And the [Bm]dead rose from their [D/F#]tombs
And the [G]angels stood in [A]awe
For the [Bm]souls of all who'd [D/F#]come
To the [G]Father are re[A]stored`,
    notes: "Key of D. Grand hymn-like song by Brooke Ligertwood. Build dynamics across all 3 verses.",
    bpm: 66,
    tags: ["ccli-top-100", "worship", "hymn", "majesty", "hillsong"],
  },

  // 6. Praise - Elevation Worship (Key: C)
  // Chords sourced from ultimate-guitar.com and worshiptogether.com
  {
    title: "Praise",
    artist: "Elevation Worship",
    originalKey: "C",
    format: "chordpro",
    content: `{Refrain}
Let every[F/C]thing that has [C]breath
Praise the Lord, praise the Lord

{Verse 1}
I'll [F/C]praise in the [C]valley, praise on the [Am]mountain
I'll [F]praise when I'm sure, [C]praise when I'm doubting
I'll [F/C]praise when out[C]numbered, praise when sur[Am]rounded
'Cause [F]praise is the waters my [C]enemies drown in

{Verse 2}
As [F/C]long as I'm [C]breathing, I've got a [Am]reason to
[F]Praise the Lord, oh [C]my soul
I'll [F/C]praise when I [C]feel it, and I'll [Am]praise when I don't
I'll [F]praise 'cause I know You're [C]still in control

{Chorus}
I won't be [F]quiet, my God is a[Am]live
How could I [G]keep it inside
[F]Praise the Lord
Oh [F]praise the Lord, my [Am]soul
[G]Praise the Lord, oh my [C]soul

{Bridge}
[Am]I'll praise 'cause You're sove[G]reign
[F]Praise 'cause You [C]reign
[Am]Praise 'cause You rose and [G]defeated the grave
[F]Praise 'cause You're [C]faithful`,
    notes: "Key of C. High-energy anthem. The refrain can bookend sections. Strong congregational song.",
    bpm: 80,
    tags: ["ccli-top-100", "worship", "praise", "victory", "elevation"],
  },

  // 7. Trust In God - Elevation Worship (Key: G)
  // Chords sourced from ultimate-guitar.com and essentialworship.com
  {
    title: "Trust In God",
    artist: "Elevation Worship",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Blessed assurance, Jesus is [Em7]mine
He's been my [C2]fourth man in the fire, [G]time after time
[G]Born of His Spirit, [Em7]washed in His blood
And [C2]what He did for me on [D]Calvary is enough

{Chorus}
I will [G]trust in God
My [Em7]Savior
The [C2]One who will never [G]fail
He will [G]trust in God
My [Em7]Healer
The [C2]One who will never [D]fail

{Verse 2}
[G]I've got peace in the [Em7]storm
I've got peace through it [C2]all
It might not be what I [G]want
But I know it's what I [D]need
[G]Blessed assurance, [Em7]Jesus is mine
I'm [C2]living and breathing [G]proof

{Bridge}
[Em7]I sought the Lord and [C2]He heard
And He [G]answered
[Em7]I sought the Lord and [C2]He heard
And He [D]answered
[Em7]I sought the Lord and [C2]He heard
And He [G]answered
And [D]delivered me from all my [G]fears`,
    notes: "Key of G. Features Chris Brown and Isaiah Templeton. Classic assurance theme with modern arrangement.",
    bpm: 76,
    tags: ["ccli-top-100", "worship", "trust", "assurance", "elevation"],
  },

  // 8. Build My Life - Pat Barrett / Housefires (Key: G)
  // Chords sourced from ultimate-guitar.com and worshiptogether.com
  {
    title: "Build My Life",
    artist: "Pat Barrett / Housefires",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Worthy of every [C]song we could ever sing
[Em]Worthy of all the [D]praise we could ever bring
[G]Worthy of every [C]breath we could ever breathe
We [Em]live for [D]You

{Verse 2}
[G]Jesus the Name a[C]bove every other name
[Em]Jesus the only [D]One who could ever save
[G]Worthy of every [C]breath we could ever breathe
We [Em]live for [D]You, we live for [G]You

{Chorus}
[G]Holy, there is no one [C]like You
There is none be[Em]side You
Open up my [D]eyes in wonder
And show me who You [G]are and fill me
With Your [C]heart and lead me
In Your love to [Em]those around [D]me

{Bridge}
I will [G]build my life upon Your [C]love, it is a firm foun[Em]dation
I will [D]put my trust in You a[G]lone, and I will not be [C]shaken
I will [G]build my life upon Your [C]love, it is a firm foun[Em]dation
I will [D]put my trust in You a[G]lone, and I will not be [C]shaken`,
    notes: "Key of G. Tempo is slow at 70 BPM. Builds beautifully from verse to bridge. Great for communion or reflective worship.",
    bpm: 70,
    tags: ["ccli-top-100", "worship", "devotion", "surrender", "pat-barrett", "housefires"],
  },

  // 9. What A Beautiful Name - Hillsong Worship (Key: D)
  // Chords sourced from ultimate-guitar.com and worshiptogether.com
  {
    title: "What A Beautiful Name",
    artist: "Hillsong Worship",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
You were the [D]Word at the beginning
One with [G]God the Lord Most [Bm]High
Your hidden [A]glory in creation
Now re[D]vealed in You our [G]Christ

{Chorus 1}
What a [D]beautiful Name it [A]is
What a [Bm]beautiful Name it [G]is
The Name of [D]Jesus Christ my [A]King
What a [Bm]beautiful Name it [G]is
Nothing com[D]pares to this
What a [Bm]beautiful Name it [G]is
The Name of [D]Jesus

{Verse 2}
You didn't [D]want heaven without us
So Jesus [G]You brought heaven [Bm]down
My sin was [A]great, Your love was greater
What could [D]separate us [G]now

{Chorus 2}
What a [D]wonderful Name it [A]is
What a [Bm]wonderful Name it [G]is
The Name of [D]Jesus Christ my [A]King
What a [Bm]wonderful Name it [G]is
Nothing com[D]pares to this
What a [Bm]wonderful Name it [G]is
The Name of [D]Jesus

{Bridge}
[Bm]Death could not hold You, the [A]veil tore before You
You [G]silence the boast of [D]sin and grave
The [Bm]heavens are roaring the [A]praise of Your glory
For [G]You are raised to [D]life again
[Bm]You have no rival, You [A]have no equal
Now and [G]forever God You [D]reign
Yours is the [Bm]kingdom, Yours is the [A]glory
Yours is the [G]Name above all [D]Names`,
    notes: "Key of D. One of the most impactful modern worship songs. Bridge is powerful — build dynamics.",
    bpm: 68,
    tags: ["ccli-top-100", "worship", "jesus", "name", "hillsong"],
  },

  // 10. Worthy Of It All - David Brymer (Key: G)
  // Chords sourced from ultimate-guitar.com
  {
    title: "Worthy Of It All",
    artist: "David Brymer",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[C]All the saints and [D]angels
They [C]bow before Your [D]throne
[C]All the elders [D]cast their crowns
Be[C]fore the Lamb of [D]God and sing

{Chorus}
You are [G]worthy of it [D]all
You are [Em]worthy of it [C]all
For from [G]You are all [D]things
And to [Em]You are all [C]things
You de[G]serve the glory

{Verse 2}
[C]Day and night, night and [D]day
Let in[C]cense a[D]rise
[C]Day and night, night and [D]day
Let in[C]cense a[D]rise

{Bridge}
[G]You are worthy, You are [D]worthy
[Em]You are worthy, You are [C]worthy
Of it [G]all, of it [D]all
[Em]Of it [C]all`,
    notes: "Key of G. A simple and powerful soaking/prayer song. Often sung during extended worship sets.",
    bpm: 70,
    tags: ["ccli-top-100", "worship", "soaking", "prayer", "worthy"],
  },

  // 11. Firm Foundation (He Won't) - Cody Carnes (Key: A)
  // Chords sourced from ultimate-guitar.com and worshiptogether.com
  {
    title: "Firm Foundation (He Won't)",
    artist: "Cody Carnes",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]Christ is my firm foun[E]dation
The [F#m]rock on which I [D]stand
[A]When everything a[E]round me is [F#m]shaken
I've [D]never been more glad
That [A]I put my faith in [E]Jesus
'Cause [F#m]He's never let me [D]down
He's [A]faithful through gene[E]rations
So [F#m]why would He fail [D]now

{Chorus}
He [A]won't, He [E]won't
[F#m]He won't [D]fail
He [A]won't [E]fail
He [F#m]won't [D]fail

{Verse 2}
I've [A]still got joy in [E]chaos
I've got [F#m]peace that makes no [D]sense
[A]I won't be going [E]under
I'm [F#m]not held by my own [D]strength
'Cause [A]I've built my life on [E]Jesus
He's [F#m]never let me [D]down
He's [A]faithful in every [E]season
So [F#m]why would He fail [D]now

{Bridge}
[A]Rain came and wind [E]blew
But my [F#m]house was built on [D]You
[A]I'm safe with [E]You
I'm [F#m]gonna make it [D]through
[A]Yeah, I'm gonna make it [E]through
'Cause [F#m]I'm standing on a [D]firm foundation`,
    notes: "Key of A. Modern anthem of trust. The 'He won't fail' chorus is a powerful declaration.",
    bpm: 75,
    tags: ["ccli-top-100", "worship", "trust", "foundation", "cody-carnes"],
  },

  // 12. I Thank God - Maverick City Music (Key: Ab)
  // Chords sourced from ultimate-guitar.com and essentialworship.com
  {
    title: "I Thank God",
    artist: "Maverick City Music / UPPERROOM",
    originalKey: "Ab",
    format: "chordpro",
    content: `{Verse 1}
[Ab]Amazing, wonderful, [Db]counselor
[Ab]Matchless in every [Db]way
[Ab]Robed in majesty, [Db]covered in grace
[Ab]You made the night, You [Db]bring the day

{Verse 2}
[Ab]Beautiful, one and [Db]only
[Ab]Author of my [Db]faith
[Ab]Former of every [Db]breath I take
[Ab]What can I do but [Db]give You praise

{Pre-Chorus}
And it's not [Bbm7]by my might and it's not [Db]by my power
But it's [Eb]all by Your grace that [Ab]I'm even here
It's not [Bbm7]based on my merit, [Db]not based on my effort
But it's [Eb]all by Your grace that [Ab]I'm even here

{Chorus}
And I [Ab]thank God, I [Db]thank God
I [Bbm7]thank God for it [Eb]all
I [Ab]thank God, I [Db]thank God
I [Bbm7]thank God for it [Eb]all

{Bridge}
[Ab]Oh, I was sinking, [Db]You reached down
[Bbm7]Pulled me out, You [Eb]turned me around
[Ab]You set me free, no [Db]longer bound
I [Bbm7]thank God, I [Eb]thank God`,
    notes: "Key of Ab. Features Dante Bowe, Aaron Moses, Maryanne J. George. High energy and full of joy.",
    bpm: 130,
    tags: ["ccli-top-100", "worship", "thanksgiving", "joy", "maverick-city"],
  },

  // 13. Who Else - Gateway Worship (Key: G)
  // Note: This song is by Gateway Worship (Zac Rowe), commonly listed in CCLI top 100.
  // Chords sourced from ultimate-guitar.com and worshiptogether.com
  {
    title: "Who Else",
    artist: "Gateway Worship",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]I am an instrument of [Em]exaltation
[C]And I was born to lift Your [D]Name above all names
[G]There is no title that could [Em]capture
[C]All You are, all You've [D]done

{Verse 2}
[G]When I was lost, You came and [Em]found me
[C]And I was dead until Your [D]love came rushing in
[G]I'm speechless at the thought of [Em]knowing
[C]All You are, all You've [D]done

{Pre-Chorus}
[Em]So I'll give You every [C]piece of my heart
[G]Give You every [D]reason I'm alive

{Chorus}
[G]Who else is worthy? [Em]Who else is worthy?
[C]There is no one, only [D]You, Jesus
[G]Who else is worthy? [Em]Who else is worthy?
[C]There is no one, only [D]You

{Bridge}
[Em]No one, no [C]one
[G]No one, no [D]one
[Em]Only You, [C]Jesus
[G]Only You, [D]Jesus`,
    notes: "Key of G. Commonly played with Capo 2 from original Ab. Exuberant declaration of worship.",
    bpm: 78,
    tags: ["ccli-top-100", "worship", "declaration", "Jesus", "gateway"],
  },

  // 14. I Speak Jesus - Charity Gayle (Key: E)
  // Chords sourced from ultimate-guitar.com
  {
    title: "I Speak Jesus",
    artist: "Charity Gayle",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
I just want to speak the [E]Name of Jesus
Over every heart and [B]every mind
'Cause I know there is [C#m]peace within Your presence
I speak [A]Jesus

{Verse 2}
I just want to speak the [E]Name of Jesus
'Til every dark ad[B]diction starts to break
Declaring there is [C#m]hope and there is freedom
I speak [A]Jesus

{Chorus}
[E]Your Name is power, [B]Your Name is healing
[C#m]Your Name is life
Break every [A]stronghold, shine through the [E]shadows
Burn like a [B]fire

{Verse 3}
I just want to speak the [E]Name of Jesus
Over fear and all [B]anxiety
To every soul held [C#m]captive by depression
I speak [A]Jesus

{Bridge}
[E]Shout Jesus from the [B]mountains
[C#m]Jesus in the streets
[A]Jesus in the darkness over [E]every enemy
[E]Jesus for my [B]family
I [C#m]speak the holy Name
[A]Jesus`,
    notes: "Key of E. Features Steven Musso. Powerful prayer/declaration song. Build through the bridge.",
    bpm: 72,
    tags: ["ccli-top-100", "worship", "prayer", "declaration", "Jesus", "charity-gayle"],
  },

  // 15. How Great Is Our God - Chris Tomlin (Key: C)
  // Chords sourced from ultimate-guitar.com and worshiptogether.com
  {
    title: "How Great Is Our God",
    artist: "Chris Tomlin",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
The [C]splendor of the King
[Am7]Clothed in majesty
Let all the earth re[F2]joice
All the earth re[C]joice
He [C]wraps Himself in light
And [Am7]darkness tries to hide
And trembles at His [F2]voice
Trembles at His [C]voice

{Chorus}
[C]How great is our God
Sing with me
[Am7]How great is our God
And all will see how [F]great
How great [G]is our [C]God

{Verse 2}
And [C]age to age He stands
And [Am7]time is in His hands
Beginning and the [F2]End
Beginning and the [C]End
The [C]Godhead Three in One
[Am7]Father, Spirit, Son
The Lion and the [F2]Lamb
The Lion and the [C]Lamb

{Bridge}
[C]Name above all names
[Am7]Worthy of all praise
My [F]heart will sing how [G]great
Is our [C]God`,
    notes: "Key of C. A modern classic. Simple chord progression makes it accessible for any worship team.",
    bpm: 80,
    tags: ["ccli-top-100", "worship", "greatness", "majesty", "chris-tomlin"],
  },

  // 16. Living Hope - Phil Wickham (Key: C)
  // Chords sourced from ultimate-guitar.com
  {
    title: "Living Hope",
    artist: "Phil Wickham",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]How great the chasm that [G]lay between us
[C]How high the mountain I [F]could not climb
In [Am]desperation I [G]turned to heaven
And [F]spoke Your Name into the [G]night

{Verse 2}
[C]Then through the darkness Your [G]loving-kindness
[C]Tore through the shadows of [F]my soul
The [Am]work is finished, the [G]end is written
[F]Jesus Christ, my [G]living hope

{Chorus}
[Am]Hallelujah, [G]praise the One who [F]set me free
[Am]Hallelujah, [G]death has lost its [F]grip on me
You have [Am]broken every [G]chain, there's sal[F]vation in Your Name
[Am]Jesus [G]Christ, my [F]living [C]hope

{Verse 3}
[C]Then came the morning that [G]sealed the promise
[C]Your buried body be[F]gan to breathe
Out [Am]of the silence the [G]Roaring Lion
De[F]clared the grave has no [G]claim on me

{Bridge}
[Am]Jesus [G]Yours is the [F]victory, whoa[C]oh`,
    notes: "Key of C. Originally key of A. Resurrection anthem. The bridge is a great worship moment.",
    bpm: 74,
    tags: ["ccli-top-100", "worship", "hope", "resurrection", "phil-wickham"],
  },

  // 17. House Of The Lord - Phil Wickham (Key: E)
  // Chords sourced from ultimate-guitar.com
  {
    title: "House Of The Lord",
    artist: "Phil Wickham",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
We [E]worship the God who [C#m]was
We [B]worship the God who [A]is
We [E]worship the God who [C#m]evermore will be
[B]He opened the prison [A]doors
He [E]parted the raging [C#m]sea
My [B]God He holds the [A]victory

{Chorus}
There's [E]joy in the house of the [C#m]Lord
There's [B]joy in the house of the [A]Lord today
And we [E]won't be quiet, we [C#m]shout out Your praise
There's [B]joy in the house of the [A]Lord
Our [E]God is surely in this [C#m]place
And we [B]won't be quiet, we [A]shout out Your praise

{Verse 2}
We [E]sing to the God who [C#m]heals
We [B]sing to the God who [A]saves
We [E]sing to the God who al[C#m]ways makes a way
'Cause [B]He hung up on that [A]cross
Then [E]He rose up from that [C#m]grave
My [B]God's still rolling [A]stones away

{Bridge}
We were the [E]beggars, now we're [C#m]royalty
We were the [B]prisoners, now we're [A]running free
We are for[E]given, ac[C#m]cepted
Re[B]deemed by His [A]grace
Let the [E]house of the Lord sing [C#m]praise`,
    notes: "Key of E. Also commonly played in G (capo 4). Energetic celebratory song.",
    bpm: 86,
    tags: ["ccli-top-100", "worship", "joy", "celebration", "phil-wickham"],
  },

  // 18. 10,000 Reasons (Bless The Lord) - Matt Redman (Key: G)
  // Chords sourced from ultimate-guitar.com and worshiptogether.com
  {
    title: "10,000 Reasons (Bless The Lord)",
    artist: "Matt Redman",
    originalKey: "G",
    format: "chordpro",
    content: `{Chorus}
[G]Bless the Lord, O my soul
[D/F#]O my [Em]soul, [C]worship His holy [G]Name
Sing like [Em]never before
[C]O my [G/B]soul, I'll [Am]worship Your [C]holy [D]Name

{Verse 1}
The [G]sun comes up, it's a [D/F#]new day [Em]dawning
[C]It's time to sing Your [G]song again
What[G]ever may pass, and [D/F#]whatever [Em]lies before me
[C]Let me be singing when the [D]evening comes

{Verse 2}
You're [G]rich in love and You're [D/F#]slow to [Em]anger
Your [C]Name is great and Your [G]heart is kind
For [G]all Your goodness, I will [D/F#]keep on [Em]singing
[C]Ten thousand reasons for my [D]heart to find

{Verse 3}
And [G]on that day when my [D/F#]strength is [Em]failing
The [C]end draws near, and my [G]time has come
Still [G]my soul will sing Your [D/F#]praise un[Em]ending
[C]Ten thousand years and then for[D]evermore`,
    notes: "Key of G. The chorus is the main hook. Powerful 3-verse structure tells a complete story. No bridge — repeat chorus to close.",
    bpm: 73,
    tags: ["ccli-top-100", "worship", "praise", "blessing", "matt-redman"],
  },

  // 19. Graves Into Gardens - Elevation Worship (Key: C)
  // Chords sourced from ultimate-guitar.com and essentialworship.com
  {
    title: "Graves Into Gardens",
    artist: "Elevation Worship",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[C]I searched the world but it [G]couldn't fill me
[Em]Man's empty praise and [D]treasures that fade
[C]Are never enough
Then [C]You came along and put [G]me back together
And [Em]every desire is [D]now satisfied
Here [C]in Your love

{Chorus}
Oh there's [G]nothing better than You
There's [Em]nothing better than You
[C]Lord there's nothing
Nothing is [D]better than You

{Verse 2}
[C]I'm not afraid to [G]show You my weakness
My [Em]failures and flaws, [D]Lord You've seen them all
And [C]You still call me friend
'Cause the [C]God of the mountain is the [G]God of the valley
And [Em]there's not a place Your [D]mercy and grace
Won't [C]find me again

{Bridge}
You turn [G]graves into gardens
You turn [Em]bones into armies
You turn [C]seas into highways
You're the [D]only one who can
You turn [G]mourning to dancing
You give [Em]beauty for ashes
You turn [C]shame into glory
You're the [D]only one who can`,
    notes: "Key of C (original key B, commonly played in C). Features Brandon Lake. The bridge is the climactic moment.",
    bpm: 140,
    tags: ["ccli-top-100", "worship", "transformation", "victory", "elevation"],
  },

  // 20. How Great Thou Art - Traditional (Key: A)
  // Chords sourced from ultimate-guitar.com and worshiptogether.com
  {
    title: "How Great Thou Art",
    artist: "Traditional",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
O Lord my [A]God, when I in [D]awesome wonder
Consider [A]all the worlds Thy [E]hands have made
I see the [A]stars, I hear the [D]rolling thunder
Thy power through[A]out the [E]universe dis[A]played

{Chorus}
Then sings my [A]soul, my Saviour God to [D]Thee
How great Thou [A]art, how great Thou [E]art
Then sings my [A]soul, my Saviour God to [D]Thee
How great Thou [A]art, how [E]great Thou [A]art

{Verse 2}
When through the [A]woods and forest [D]glades I wander
And hear the [A]birds sing sweetly [E]in the trees
When I look [A]down from lofty [D]mountain grandeur
And hear the [A]brook and [E]feel the gentle [A]breeze

{Verse 3}
And when I [A]think that God, His [D]Son not sparing
Sent Him to [A]die, I scarce can [E]take it in
That on the [A]cross, my burden [D]gladly bearing
He bled and [A]died to [E]take away my [A]sin

{Verse 4}
When Christ shall [A]come with shout of [D]acclamation
And take me [A]home, what joy shall [E]fill my heart
Then I shall [A]bow in humble [D]adoration
And there pro[A]claim, my [E]God how great Thou [A]art`,
    notes: "Key of A. Also commonly played in Bb. Traditional hymn — all 4 verses are important for the full story.",
    bpm: 76,
    tags: ["ccli-top-100", "hymn", "traditional", "worship", "majesty"],
  },

  // 21. Here I Am To Worship - Tim Hughes (Key: D)
  // Chords sourced from ultimate-guitar.com and worshiptogether.com
  {
    title: "Here I Am To Worship",
    artist: "Tim Hughes",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]Light of the world, You stepped [A]down into darkness
[Em]Opened my eyes, let me [G]see
[D]Beauty that made this [A]heart adore You
[Em]Hope of a life spent with [G]You

{Chorus}
[D]Here I am to worship
[A]Here I am to bow down
[Em]Here I am to say that [G]You're my God
[D]You're altogether [A]lovely
[A]Altogether [Em]worthy
[A]Altogether [G]wonderful to [D]me

{Verse 2}
[D]King of all days, oh so [A]highly exalted
[Em]Glorious in heaven a[G]bove
[D]Humbly You came to the [A]earth You created
[Em]All for love's sake became [G]poor

{Bridge}
I'll [D]never know how much it [A]cost
To [Em]see my sin upon that [G]cross
I'll [D]never know how much it [A]cost
To [Em]see my sin upon that [G]cross`,
    notes: "Key of D. Also commonly played in E. A modern worship classic. Simple and singable.",
    bpm: 79,
    tags: ["ccli-top-100", "worship", "adoration", "classic", "tim-hughes"],
  },

  // 22. Way Maker - Sinach (Key: E)
  // Chords sourced from ultimate-guitar.com
  {
    title: "Way Maker",
    artist: "Sinach",
    originalKey: "B",
    format: "chordpro",
    content: `{Verse 1}
You are [E]here, moving in our [B]midst
I worship [F#]You, I worship [G#m]You
You are [E]here, working in this [B]place
I worship [F#]You, I worship [G#m]You

{Chorus}
[E]Way Maker, Miracle [B]Worker
[F#]Promise Keeper, Light in the [G#m]darkness
My God, that is who You [E]are
[E]Way Maker, Miracle [B]Worker
[F#]Promise Keeper, Light in the [G#m]darkness
My God, that is who You [E]are

{Verse 2}
You are [E]here, touching every [B]heart
I worship [F#]You, I worship [G#m]You
You are [E]here, healing every [B]heart
I worship [F#]You, I worship [G#m]You

{Verse 3}
You are [E]here, turning lives a[B]round
I worship [F#]You, I worship [G#m]You
You are [E]here, mending every [B]heart
I worship [F#]You, I worship [G#m]You

{Bridge}
[E]Even when I don't see it, You're [B]working
[F#]Even when I don't feel it, You're [G#m]working
[E]You never stop, You never [B]stop working
[F#]You never stop, You never [G#m]stop working`,
    notes: "Key of E. Also popular in G with capo 4. The bridge is the most iconic section — repeat and build.",
    bpm: 68,
    tags: ["ccli-top-100", "worship", "faith", "miracles", "sinach"],
  },

  // 23. Glorious Day - Passion (Key: G)
  // Chords sourced from ultimate-guitar.com and worshiptogether.com
  {
    title: "Glorious Day",
    artist: "Passion",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
I was [G]buried beneath my [Em7]shame
Who could [C2]carry that kind of [G]weight
It was [G]my tomb 'til I met [Em7]You

{Verse 2}
I was [G]breathing but not a[Em7]live
All my [C2]failures I tried to [G]hide
It was [G]my tomb 'til I met [Em7]You

{Chorus}
You called my [C2]name
And I [Em7]ran out of that grave
Out of the [D]darkness
Into Your [G]glorious day
You called my [C2]name
And I [Em7]ran out of that grave
Out of the [D]darkness
Into Your [G]glorious day

{Verse 3}
Now Your [G]mercy has saved my [Em7]soul
Now Your [C2]freedom is all I [G]know
The old [G]made new, Jesus when I met [Em7]You

{Bridge}
I needed [Em7]rescue, my sin was heavy
But [C2]chains break at the weight of Your [G]glory
I needed [Em7]shelter, I was an orphan
But [C2]You call me a citizen of [D]heaven
When I was [Em7]broken You were my healing
Now [C2]Your love is the air that I'm [G]breathing
I have a [Em7]future, my eyes are open
'Cause [C2]when You called my name I ran [D]out of that grave`,
    notes: "Key of G (original key D). Features Kristian Stanfill. Capo 5 from original. Energetic resurrection song.",
    bpm: 86,
    tags: ["ccli-top-100", "worship", "resurrection", "freedom", "passion"],
  },

  // 24. This Is Amazing Grace - Phil Wickham (Key: G)
  // Chords sourced from ultimate-guitar.com (Capo 3 from original Bb)
  {
    title: "This Is Amazing Grace",
    artist: "Phil Wickham",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Who breaks the power of sin and darkness
[Em]Whose love is mighty and so much stronger
The [C]King of Glory, the [D]King above all kings

{Verse 2}
[G]Who shakes the whole earth with holy thunder
[Em]And leaves us breathless in awe and wonder
The [C]King of Glory, the [D]King above all kings

{Chorus}
[G]This is amazing grace, [Em]this is unfailing love
[C]That You would take my place, [D]that You would bear my cross
[G]You laid down Your life, [Em]that I would be set free
Oh [C]Jesus I sing for [D]all that You've done for me

{Verse 3}
[G]Who brings our chaos back into order
[Em]Who makes the orphan a son and daughter
The [C]King of Glory, the [D]King above all kings

{Bridge}
[Em]Worthy is the Lamb who was [C]slain
[Em]Worthy is the King who con[C]quered the grave
[Em]Worthy is the Lamb who was [C]slain
Worthy, [D]worthy, worthy`,
    notes: "Key of G (original Bb, capo 3). Simple and powerful. Bridge builds to a climactic declaration.",
    bpm: 100,
    tags: ["ccli-top-100", "worship", "grace", "cross", "phil-wickham"],
  },

  // 25. Lord I Need You - Matt Maher (Key: G)
  // Chords sourced from ultimate-guitar.com and worshiptogether.com
  {
    title: "Lord I Need You",
    artist: "Matt Maher",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Lord I come, I con[C]fess
[G]Bowing here, I find my [D]rest
[Em]Without You I fall a[C]part
[G]You're the one that guides my [D]heart

{Chorus}
[G]Lord I need You, [C]oh I need You
[Em]Every hour I [D]need You
My [C]one defense, my [G/B]righteousness
Oh [Am]God how I [C]need [D]You

{Verse 2}
[G]Where sin runs deep, Your [C]grace is more
[G]Where grace is found is [D]where You are
[Em]And where You are, Lord [C]I am free
[G]Holiness is Christ in [D]me

{Bridge}
So [C]teach my song to [Em]rise to You
[D]When temptation [G]comes my way
And [C]when I cannot [Em]stand I'll fall on [D]You
[C]Jesus You're my [Em]hope and [D]stay`,
    notes: "Key of G. Simple and heartfelt cry of dependence. Perfect for reflective or communion moments.",
    bpm: 73,
    tags: ["ccli-top-100", "worship", "dependence", "grace", "matt-maher"],
  },

  // 26. Joy To The World (Unspeakable Joy) - Chris Tomlin (Key: D)
  // Chords sourced from ultimate-guitar.com and worshiptogether.com
  {
    title: "Joy To The World (Unspeakable Joy)",
    artist: "Chris Tomlin",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]Joy to the world, the [G]Lord is [A]come
Let [Bm]earth receive her [G]King [A]
Let [Bm]every heart pre[G]pare Him [D/F#]room
And [G]heaven and nature [A]sing
And [G]heaven and nature [A]sing
And [G]heaven and [D/F#]heaven and [D]nature sing

{Verse 2}
[D]Joy to the world, the [G]Saviour [A]reigns
Let [Bm]men their songs em[G]ploy [A]
While [Bm]fields and floods, [G]rocks hills and [D/F#]plains
Re[G]peat the sounding [A]joy
Re[G]peat the sounding [A]joy
Re[G]peat, re[D/F#]peat the [D]sounding joy

{Chorus}
[D]Joy, unspeakable [G]joy
An [A]overflowing well, [Bm]no tongue can tell
[D]Joy, unspeakable [G]joy
It [A]rises in my soul, [Bm]never lets me go

{Verse 3}
[D]He rules the world with [G]truth and [A]grace
And [Bm]makes the nations [G]prove [A]
The [Bm]glories of His [G]righteous[D/F#]ness
And [G]wonders of His [A]love
And [G]wonders of His [A]love
And [G]wonders, [D/F#]wonders of His [D]love`,
    notes: "Key of D. Chris Tomlin's arrangement adds the 'Unspeakable Joy' chorus to the classic hymn. Great for Christmas season.",
    bpm: 124,
    tags: ["ccli-top-100", "worship", "christmas", "joy", "hymn", "chris-tomlin"],
  },

  // 27. In Christ Alone - Keith & Kristyn Getty (Key: D)
  // Chords sourced from ultimate-guitar.com and worshiptogether.com
  {
    title: "In Christ Alone",
    artist: "Keith & Kristyn Getty",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
In Christ a[D]lone my [G]hope is [D]found
He is my [A]light my [D]strength my [A]song
This Corner[D]stone this [G]solid [D]ground
Firm through the [A]fiercest [G]drought and [D]storm
What heights of [D]love what [A]depths of [Bm]peace
When fears are [G]stilled when [D]strivings [A]cease
My Comfor[D]ter my [G]All in [D]All
Here in the [A]love of [G]Christ I [D]stand

{Verse 2}
In Christ a[D]lone who [G]took on [D]flesh
Fullness of [A]God in [D]helpless [A]babe
This gift of [D]love and [G]righteous[D]ness
Scorned by the [A]ones He [G]came to [D]save
'Til on that [D]cross as [A]Jesus [Bm]died
The wrath of [G]God was [D]satis[A]fied
For every [D]sin on [G]Him was [D]laid
Here in the [A]death of [G]Christ I [D]live

{Verse 3}
There in the [D]ground His [G]body [D]lay
Light of the [A]world by [D]darkness [A]slain
Then bursting [D]forth in [G]glorious [D]day
Up from the [A]grave He [G]rose a[D]gain
And as He [D]stands in [A]victor[Bm]y
Sin's curse has [G]lost its [D]grip on [A]me
For I am [D]His and [G]He is [D]mine
Bought with the [A]precious [G]blood of [D]Christ

{Verse 4}
No guilt in [D]life no [G]fear in [D]death
This is the [A]power of [D]Christ in [A]me
From life's first [D]cry to [G]final [D]breath
Jesus com[A]mands my [G]desti[D]ny
No power of [D]hell no [A]scheme of [Bm]man
Can ever [G]pluck me [D]from His [A]hand
'Til He re[D]turns or [G]calls me [D]home
Here in the [A]power of [G]Christ I'll [D]stand`,
    notes: "Key of D. Modern hymn, all 4 verses tell the complete gospel story. Keith Getty & Stuart Townend.",
    bpm: 74,
    tags: ["ccli-top-100", "hymn", "gospel", "foundation", "getty"],
  },

  // 28. I Know A Name - Elevation Worship (Key: C)
  // Chords sourced from ultimate-guitar.com and worshiptogether.com
  {
    title: "I Know A Name",
    artist: "Elevation Worship",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
I know a [C]Name that can silence [Bb]roaring waves
I know a [F]Name that has power [C]to save
I know a [C]Name that can fill an [Bb]empty grave
Oh, oh, I know a [F]Name

{Verse 2}
I know a [C]Name that unlocks the [Bb]prison chains
I know a [F]Name where the prodigal [C]runs to stay
I know a [C]Name the darkness is [Bb]afraid of
Oh, oh, I know a [F]Name

{Chorus}
I call You [C]Jesus, I call You, I call You [Bb]Healer
Risen and reigning in [F]power
Something comes out of the [C]grave every [Bb]time I call You Jesus
I call You, I call You [F]Savior
Strength of my heart and my [C]refuge

{Bridge}
[C]Every knee shall bow, and [Bb]every tongue confess
[F]Jesus is the Name a[C]bove all the rest
[C]Every knee shall bow, and [Bb]every tongue confess
[F]Jesus is the Name a[C]bove all the rest`,
    notes: "Key of C. Features Chris Brown and Brandon Lake. Powerful declaration song with a strong hook.",
    bpm: 82,
    tags: ["ccli-top-100", "worship", "declaration", "Jesus", "elevation"],
  },

  // 29. O Come To The Altar - Elevation Worship (Key: A)
  // Chords sourced from ultimate-guitar.com
  {
    title: "O Come To The Altar",
    artist: "Elevation Worship",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
Are you [A]hurting and broken with[E]in
Over[F#m]whelmed by the weight of your [D]sin
[A]Jesus is [E]calling
Have you [A]come to the end of your[E]self
Do you [F#m]thirst for a drink from the [D]well
[A]Jesus is [E]calling

{Chorus}
O come to the [A]altar
The [C#m]Father's arms are open [F#m]wide
For[D]giveness was bought with
The [A]precious blood of [E]Jesus [D]Christ

{Verse 2}
Leave be[A]hind your regrets and mis[E]takes
Come [F#m]today there's no reason to [D]wait
[A]Jesus is [E]calling
Bring your [A]sorrows and trade them for [E]joy
From the [F#m]ashes a new life is [D]born
[A]Jesus is [E]calling

{Bridge}
Oh what a [A]Savior, isn't He [E]wonderful
Sing [F#m]hallelujah, Christ is [D]risen
Bow down be[A]fore Him, for He is [E]Lord of all
Sing [F#m]hallelujah, Christ is [D]risen`,
    notes: "Key of A (original B, commonly played in A). Beautiful invitation/altar call song.",
    bpm: 70,
    tags: ["ccli-top-100", "worship", "altar", "invitation", "elevation"],
  },

  // 30. Battle Belongs - Phil Wickham (Key: G)
  // Chords sourced from ultimate-guitar.com (Capo 3 from original Bb)
  {
    title: "Battle Belongs",
    artist: "Phil Wickham",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
When all I [G]see is the battle
[Cadd9]You see my victory
When all I [Em7]see is the mountain
[D]You see a mountain moved
And as I [G]walk through the shadow
[Cadd9]Your love surrounds me
There's nothing [Em7]to fear now
For I am [D]safe with You

{Chorus}
So when I [G]fight I'll fight on my knees
With my [Cadd9]hands lifted high
Oh God the [Em7]battle belongs to [D]You
And every [G]fear I lay at Your feet
I'll [Cadd9]sing through the night
Oh God the [Em7]battle belongs to [D]You

{Verse 2}
And if You [G]are for me
[Cadd9]Who can be against me
For [Em7]Jesus there's nothing
Im[D]possible for You
When all I [G]see are the ashes
[Cadd9]You see the beauty
When all I [Em7]see is a cross
[D]God You see the empty tomb

{Bridge}
[G]An Almighty Fortress
[Cadd9]You go before us
[Em7]Nothing can stand a[D]gainst
The power of our God
[G]No foe can with[Cadd9]stand
For our King is [Em7]mighty
He [D]holds us in His hands`,
    notes: "Key of G (original Bb, capo 3). Anthemic declaration of faith. Strong build through chorus and bridge.",
    bpm: 81,
    tags: ["ccli-top-100", "worship", "warfare", "faith", "victory", "phil-wickham"],
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
