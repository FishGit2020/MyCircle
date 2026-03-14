#!/usr/bin/env node
/**
 * Seed CCLI Top 100 worship songs (Part 4: missing songs) into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/ccli-top-100-part4.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  // 21. Jesus Be The Name - Elevation Worship (Key: Db)
  {
    title: "Jesus Be The Name",
    artist: "Elevation Worship / Tiffany Hudson",
    originalKey: "Db",
    format: "chordpro",
    content: `{Verse 1}
[Db]There's a name that si[Ab/C]lences fear
[Gb]There's a name that [Bbm]dries every tear
There's a [Db]name above every [Ab/C]other name
[Gb]Jesus [Bbm]Jesus

{Verse 2}
[Db]There's a name that [Ab/C]conquers the grave
[Gb]There's a name that [Bbm]always makes way
There's a [Db]name above every [Ab/C]other name
[Gb]Jesus [Bbm]Jesus

{Pre-Chorus}
[Ebm]All that I know is [Gb]You are worthy
[Db]All that I know is [Ab]You are good

{Chorus}
[Db]Jesus be the name [Ab]above all my fears
[Bbm]Jesus be the name [Gb]above all I feel
[Db]Jesus be the name that [Ab]silences shame
[Bbm]Jesus Jesus [Gb]be the name

{Bridge}
[Ebm]You are the [Gb]way maker
[Db]You are the [Ab]promise keeper
[Ebm]You are the [Gb]light in the [Db]darkness [Ab]
[Ebm]My God [Gb]that is who You [Db]are [Ab]`,
    notes: "Key of Db. Songwriters: Davide Mutendji, Mitch Wong, Steven Furtick, Tiffany Hudson.",
    bpm: 72,
    tags: ["worship", "declaration", "Jesus", "ccli-top-100"],
  },

  // 36. Washed - ELEVATION RHYTHM (Key: B)
  {
    title: "Washed",
    artist: "ELEVATION RHYTHM",
    originalKey: "B",
    format: "chordpro",
    content: `{Intro}
[B/D#] [E] [F#] [G#m]

{Verse 1}
[B]I was lost and a[E]lone
[G#m]Drowning under the [F#]weight of it all
[B]Then You came and You [E]showed
[G#m]There's a grace that can [F#]cover it all

{Pre-Chorus}
[E]Every sin every [F#]stain
[G#m]You have taken a[E]way

{Chorus}
[B]Washed in the blood of the [E]Lamb
[G#m]I'm not who I [F#]was I know who I am
[B]Washed You have made me [E]new
[G#m]Nothing I did it was [F#]all because of You
[E]Washed [F#]washed

{Verse 2}
[B]No more running in [E]shame
[G#m]No more hiding my [F#]face
[B]Now I'm standing in [E]grace
[G#m]And the old is [F#]washed away

{Bridge}
[G#m]Clean hands [E]pure heart
[B]That's what You gave me from the [F#]start
[G#m]All my sin [E]all my shame
[B]Washed away in Jesus' [F#]name`,
    notes: "Key of B. 139 BPM. Songwriters: Joe L Barnes, Joshua Holiday, Mitch Wong, Steven Furtick.",
    bpm: 139,
    tags: ["worship", "salvation", "grace", "baptism", "ccli-top-100"],
  },

  // 54. God I'm Just Grateful - Elevation Worship (Key: D)
  {
    title: "God I'm Just Grateful",
    artist: "Elevation Worship / Chandler Moore",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[Bm]I didn't earn it [G]I don't deserve it
[D]But You gave it anyway
[Bm]You didn't have to [G]love me like You do
[D]But You love me anyway

{Pre-Chorus}
[Bm]And I [G]I don't have the [D]words
But [D/F#]God I'm just

{Chorus}
[G]Grateful [A]grateful [Bm]grateful
[G]God I'm just [A]grateful [D]
[G]Grateful [A]grateful [Bm]grateful
[G]God I'm just [A]grateful [D]

{Verse 2}
[Bm]A million reasons [G]to be afraid
[D]But You brought me through it all
[Bm]You didn't have to [G]save me like You did
[D]But You saved me anyway

{Bridge}
[G]How could I [A]not give You [D/F#]everything
[Bm]How could I [A]not give You [G]praise
[G]After all that [A]You have done for [D/F#]me
[Bm]God I'm just [A]grateful [G]`,
    notes: "Key of D. 72 BPM. Songwriters: Chandler Moore, Pat Barrett, Steven Furtick.",
    bpm: 72,
    tags: ["worship", "gratitude", "thanksgiving", "testimony", "ccli-top-100"],
  },

  // 57. Great Is Thy Faithfulness - Traditional (Key: D)
  {
    title: "Great Is Thy Faithfulness",
    artist: "Thomas Chisholm / William Runyan",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]Great is Thy [G]faithfulness [A7]O God my [D]Father
[G]There is no [D]shadow of [E7]turning with [A]Thee
[D]Thou changest [G]not Thy com[A7]passions they [D]fail not
[G]As Thou hast [D]been Thou for[A7]ever wilt [D]be

{Chorus}
[D]Great is Thy [G]faithfulness [D]great is Thy faithfulness
[Bm]Morning by [Em]morning new [A]mercies I [D]see
[D7]All I have [G]needed Thy [D]hand hath pro[Bm]vided
[D]Great is Thy [G]faithful[A7]ness Lord unto [D]me

{Verse 2}
[D]Summer and [G]winter and [A7]springtime and [D]harvest
[G]Sun moon and [D]stars in their [E7]courses a[A]bove
[D]Join with all [G]nature in [A7]manifold [D]witness
[G]To Thy great [D]faithfulness [A7]mercy and [D]love

{Verse 3}
[D]Pardon for [G]sin and a [A7]peace that en[D]dureth
[G]Thine own dear [D]presence to [E7]cheer and to [A]guide
[D]Strength for to[G]day and bright [A7]hope for to[D]morrow
[G]Blessings all [D]mine with ten [A7]thousand be[D]side`,
    notes: "Key of D. Classic hymn written in 1923. 3/4 time, 74 BPM. Public Domain.",
    bpm: 74,
    tags: ["worship", "hymn", "faithfulness", "classic", "ccli-top-100"],
  },

  // 61. Oceans (Where Feet May Fail) - Hillsong United (Key: D)
  {
    title: "Oceans (Where Feet May Fail)",
    artist: "Hillsong United",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[Bm]You call me out up[A/C#]on the waters
The [D]great unknown where [A]feet may fail
[Bm]And there I find You [A/C#]in the mystery
In [D]oceans deep my [A]faith will stand

{Pre-Chorus}
[G]And I will call up[D]on Your name
[A]And keep my eyes a[Bm]bove the waves
When [G]oceans rise my [D]soul will rest
In [A]Your embrace for I am Yours
And [G]You are [A]mine

{Chorus}
[Bm] [A/C#] [D]
Your [G]grace a[D]bounds in deepest [A]waters
Your [G]sovereign [D]hand will be my [A]guide
Where [G]feet may [D]fail and fear sur[A]rounds me
You've never [Bm]failed and You won't [A]start now

{Bridge}
[Bm]Spirit lead me where my [A]trust is without borders
Let me [D]walk upon the [A]waters
Wher[G]ever You would [D]call me
[A]Take me deeper than my [Bm]feet could ever wander
And my [G]faith will be made [D]stronger
In the [A]presence of my Savior`,
    notes: "Key of D (Bm shape). Songwriters: Joel Houston, Matt Crocker, Salomon Ligthelm.",
    bpm: 66,
    tags: ["worship", "faith", "trust", "surrender", "ccli-top-100"],
  },

  // 64. It Is Well With My Soul - Traditional (Key: G)
  {
    title: "It Is Well With My Soul",
    artist: "Horatio Spafford / Philip Bliss",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]When peace like a [C]river at[G]tendeth my way
When [Em]sorrows like [Am]sea billows [D]roll
What[G]ever my [B7]lot Thou hast [Em]taught me to [C]say
It is [G]well it is [D]well with my [G]soul

{Chorus}
[G]It is well [C]with my [G]soul
It is [Em]well it is [D]well with my [G]soul

{Verse 2}
[G]Though Satan should [C]buffet though [G]trials should come
Let this [Em]blest as[Am]surance con[D]trol
That [G]Christ has re[B7]garded my [Em]helpless es[C]tate
And hath [G]shed His own [D]blood for my [G]soul

{Verse 3}
[G]My sin O the [C]bliss of this [G]glorious thought
My [Em]sin not in [Am]part but the [D]whole
Is [G]nailed to the [B7]cross and I [Em]bear it no [C]more
Praise the [G]Lord praise the [D]Lord O my [G]soul

{Verse 4}
[G]And Lord haste the [C]day when my [G]faith shall be sight
The [Em]clouds be rolled [Am]back as a [D]scroll
The [G]trump shall re[B7]sound and the [Em]Lord shall de[C]scend
Even [G]so it is [D]well with my [G]soul`,
    notes: "Key of G. Written in 1873 by Horatio Spafford. Public Domain.",
    bpm: 76,
    tags: ["worship", "hymn", "peace", "faith", "classic", "ccli-top-100"],
  },

  // 66. Nothing But The Blood (Plainfield) - Robert Lowry (Key: G)
  {
    title: "Nothing But The Blood",
    artist: "Robert Lowry",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]What can wash a[C]way my [G]sin
[G]Nothing but the blood of [D]Jesus
[G]What can make me [C]whole a[G]gain
[G]Nothing but the [D]blood of [G]Jesus

{Chorus}
[G]Oh precious [C]is the [G]flow
[G]That makes me white as [D]snow
[G]No other [C]fount I [G]know
[G]Nothing but the [D]blood of [G]Jesus

{Verse 2}
[G]For my pardon [C]this I [G]see
[G]Nothing but the blood of [D]Jesus
[G]For my cleansing [C]this my [G]plea
[G]Nothing but the [D]blood of [G]Jesus

{Verse 3}
[G]Nothing can for [C]sin a[G]tone
[G]Nothing but the blood of [D]Jesus
[G]Naught of good that [C]I have [G]done
[G]Nothing but the [D]blood of [G]Jesus

{Verse 4}
[G]This is all my [C]hope and [G]peace
[G]Nothing but the blood of [D]Jesus
[G]This is all my [C]righteous[G]ness
[G]Nothing but the [D]blood of [G]Jesus`,
    notes: "Key of G. Tune: PLAINFIELD. Written by Robert Lowry, 1876. Public Domain.",
    bpm: 100,
    tags: ["worship", "hymn", "blood", "redemption", "classic", "ccli-top-100"],
  },

  // 69. Blessed Assurance - Fanny Crosby (Key: G)
  {
    title: "Blessed Assurance",
    artist: "Fanny Crosby / Phoebe Knapp",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Blessed as[C]surance [G]Jesus is mine
[G]O what a [Em]foretaste of [A]glory di[D]vine
[G]Heir of sal[C]vation [G]purchase of God
[G]Born of His [Em]Spirit [D]washed in His [G]blood

{Chorus}
[G]This is my [C]story [G]this is my song
[G]Praising my [Em]Savior [A]all the day [D]long
[G]This is my [C]story [G]this is my song
[G]Praising my [Em]Savior [D]all the day [G]long

{Verse 2}
[G]Perfect sub[C]mission [G]perfect delight
[G]Visions of [Em]rapture [A]now burst on my [D]sight
[G]Angels de[C]scending [G]bring from above
[G]Echoes of [Em]mercy [D]whispers of [G]love

{Verse 3}
[G]Perfect sub[C]mission [G]all is at rest
[G]I in my [Em]Savior am [A]happy and [D]blest
[G]Watching and [C]waiting [G]looking above
[G]Filled with His [Em]goodness [D]lost in His [G]love`,
    notes: "Key of G. 3/4 time, 140 BPM. Written by Fanny Crosby, 1873. Public Domain.",
    bpm: 140,
    tags: ["worship", "hymn", "assurance", "joy", "classic", "ccli-top-100"],
  },

  // 73. Mighty To Save - Hillsong Worship (Key: A)
  {
    title: "Mighty To Save",
    artist: "Hillsong Worship",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[D]Everyone needs com[A]passion
A [F#m]love that's never [E]failing
[D]Let mercy [A]fall on [E]me
[D]Everyone needs for[A]giveness
The [F#m]kindness of a [E]Savior
[D]The hope of [A]na[E]tions

{Chorus}
[A]Savior He can move the [F#m]mountains
My [D]God is mighty to [E]save
He is [A]mighty to [F#m]save
For[D]ever Author of sal[E]vation
He [A]rose and conquered the [F#m]grave
[D]Jesus conquered the [E]grave

{Verse 2}
[D]So take me as You [A]find me
[F#m]All my fears and [E]failures
[D]Fill my life [A]a[E]gain
[D]I give my life to [A]follow
[F#m]Everything I be[E]lieve in
[D]Now I [A]surren[E]der

{Bridge}
[D]Shine Your light and [A]let the whole world [F#m]see
We're singing [E]for the glory of the risen [D]King
[A]Jesus [F#m] [E]
[D]Shine Your light and [A]let the whole world [F#m]see
We're singing [E]for the glory of the risen King`,
    notes: "Key of A. Songwriters: Ben Fielding, Reuben Morgan. 69 BPM.",
    bpm: 69,
    tags: ["worship", "salvation", "praise", "declaration", "ccli-top-100"],
  },

  // 74. Death Was Arrested - North Point Worship (Key: B)
  {
    title: "Death Was Arrested",
    artist: "North Point Worship / Seth Condrey",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Alone in my sorrow and [C]dead in my sin
[Em]Lost without hope with no [D]place to begin
Your [G]love made a way to let [C]mercy come in
When [Em]death was arrested and [D]my life began

{Verse 2}
[G]Ash was redeemed only [C]beauty remains
[Em]My orphan heart was given a [D]name
My [G]mourning grew quiet my [C]feet rose to dance
When [Em]death was arrested and [D]my life began

{Chorus}
Oh Your [G]grace so free [C]washes over me
[Em]You have made me [D]new now life begins with You
It's Your [G]endless love [C]pouring down on us
[Em]You have made us [D]new now life begins with You

{Verse 3}
[G]Released from my chains I'm a [C]prisoner no more
[Em]My shame was a ransom He [D]faithfully bore
He [G]cancelled my debt and He [C]called me His friend
When [Em]death was arrested and [D]my life began

{Bridge}
Oh we're [G]free free for[C]ever we're free
[Em]Come join the song of [D]all the redeemed
[G]Yes we're free free for[C]ever amen
When [Em]death was arrested and [D]my life began`,
    notes: "Key of B (capo 4 in G). Songwriters: Adam Kersh, Brandon Coker, Heath Balltzglier, Paul Taylor Smith.",
    bpm: 72,
    tags: ["worship", "resurrection", "freedom", "salvation", "ccli-top-100"],
  },

  // 76. We Fall Down - Chris Tomlin (Key: D)
  {
    title: "We Fall Down",
    artist: "Chris Tomlin",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]We fall down we [A]lay our crowns
At the [Bm]feet of [G]Jesus
The [Em]greatness of [D]mercy and love
At the [A]feet of Jesus

{Chorus}
And we cry [D]holy holy [A]holy
And we cry [G]holy holy [D]holy
And we cry [Em]holy holy [A]holy
Is the [D]Lamb

{Verse 2}
[D]We fall down we [A]lay our crowns
At the [Bm]feet of [G]Jesus
The [Em]greatness of [D]mercy and love
At the [A]feet of Jesus

{Tag}
[D]Holy holy [A]holy
Is the [D]Lamb`,
    notes: "Key of D. Written by Chris Tomlin. Simple, reverent worship song.",
    bpm: 68,
    tags: ["worship", "reverence", "holiness", "Jesus", "ccli-top-100"],
  },

  // 77. I Surrender All - Traditional (Key: G)
  {
    title: "I Surrender All",
    artist: "Judson Van DeVenter / Winfield Weeden",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]All to Jesus [D]I surrender
[G]All to Him I [C]freely give
[G]I will ever [D]love and trust Him
[G]In His [D]presence [G]daily live

{Chorus}
[G]I surrender [C]all
[G]I surrender [D]all
[G]All to Thee my [C]blessed [Em]Savior
[G]I sur[D]render [G]all

{Verse 2}
[G]All to Jesus [D]I surrender
[G]Humbly at His [C]feet I bow
[G]Worldly pleasures [D]all forsaken
[G]Take me [D]Jesus [G]take me now

{Verse 3}
[G]All to Jesus [D]I surrender
[G]Make me Savior [C]wholly Thine
[G]Let me feel the [D]Holy Spirit
[G]Truly [D]know that [G]Thou art mine

{Verse 4}
[G]All to Jesus [D]I surrender
[G]Lord I give my[C]self to Thee
[G]Fill me with Thy [D]love and power
[G]Let Thy [D]blessing [G]fall on me`,
    notes: "Key of G. Written by Judson Van DeVenter, 1896. Public Domain.",
    bpm: 80,
    tags: ["worship", "hymn", "surrender", "devotion", "classic", "ccli-top-100"],
  },

  // 78. No Longer Slaves - Bethel Music (Key: Bb)
  {
    title: "No Longer Slaves",
    artist: "Bethel Music / Jonathan David Helser",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Gm]You unravel me with a [Eb]melody
[Bb]You surround me with a [F]song
[Gm]Of deliverance from my [Eb]enemies
Till [Bb]all my fears are [F]gone

{Chorus}
[Bb]I'm no longer a slave to [Gm]fear
[Eb]I am a child of [F]God
[Bb]I'm no longer a slave to [Gm]fear
[Eb]I am a child of [F]God

{Verse 2}
[Gm]From my mother's womb You have [Eb]chosen me
[Bb]Love has called my [F]name
[Gm]I've been born again into [Eb]Your family
[Bb]Your blood flows through my [F]veins

{Bridge}
[Gm]You split the sea so I could [Eb]walk right through it
[Bb]My fears were drowned in [F]perfect love
[Gm]You rescued me so I could [Eb]stand and sing
[Bb]I am a child of [F]God`,
    notes: "Key of Bb. Songwriters: Brian Johnson, Joel Case, Jonathan David Helser.",
    bpm: 74,
    tags: ["worship", "freedom", "identity", "deliverance", "ccli-top-100"],
  },

  // 79. The Old Rugged Cross - George Bennard (Key: G)
  {
    title: "The Old Rugged Cross",
    artist: "George Bennard",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]On a hill far a[G7]way stood an [C]old rugged cross
The [G]emblem of suffering and [D]shame
And I [G]love that old [G7]cross where the [C]dearest and best
For a [G]world of lost [D]sinners was [G]slain

{Chorus}
So I'll [D]cherish the old rugged [G]cross [G7]
Till my [C]trophies at last I lay [G]down
I will [G]cling to the [G7]old rugged [C]cross
And ex[G]change it some [D]day for a [G]crown

{Verse 2}
[G]Oh that old rugged [G7]cross so de[C]spised by the world
Has a [G]wondrous attraction for [D]me
For the [G]dear Lamb of [G7]God left His [C]glory above
To [G]bear it to [D]dark Cal[G]vary

{Verse 3}
[G]In that old rugged [G7]cross stained with [C]blood so divine
A [G]wondrous beauty I [D]see
For 'twas [G]on that old [G7]cross Jesus [C]suffered and died
To [G]pardon and [D]sanctify [G]me

{Verse 4}
[G]To the old rugged [G7]cross I will [C]ever be true
Its [G]shame and reproach gladly [D]bear
Then He'll [G]call me some [G7]day to my [C]home far away
Where His [G]glory for[D]ever I'll [G]share`,
    notes: "Key of G. Written by George Bennard, 1913. 3/4 time. Public Domain.",
    bpm: 92,
    tags: ["worship", "hymn", "cross", "salvation", "classic", "ccli-top-100"],
  },

  // 84. Holy Holy Holy (Nicaea) - Traditional (Key: D)
  {
    title: "Holy Holy Holy",
    artist: "Reginald Heber / John B. Dykes",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]Holy holy [Bm]holy [A]Lord God Al[D]mighty
[G]Early in the [D]morning our [E]song shall rise to [A]Thee
[D]Holy holy [Bm]holy [A]merciful and [D]mighty
[G]God in three [D]persons [A]blessed Trini[D]ty

{Verse 2}
[D]Holy holy [Bm]holy [A]all the saints a[D]dore Thee
[G]Casting down their [D]golden [E]crowns around the glassy [A]sea
[D]Cherubim and [Bm]seraphim [A]falling down be[D]fore Thee
[G]Who wert and [D]art and [A]evermore shalt [D]be

{Verse 3}
[D]Holy holy [Bm]holy [A]though the darkness [D]hide Thee
[G]Though the eye of [D]sinful [E]man Thy glory may not [A]see
[D]Only Thou art [Bm]holy [A]there is none be[D]side Thee
[G]Perfect in [D]power in [A]love and puri[D]ty

{Verse 4}
[D]Holy holy [Bm]holy [A]Lord God Al[D]mighty
[G]All Thy works shall [D]praise Thy [E]name in earth and sky and [A]sea
[D]Holy holy [Bm]holy [A]merciful and [D]mighty
[G]God in three [D]persons [A]blessed Trini[D]ty`,
    notes: "Key of D. Tune: NICAEA by John B. Dykes, 1861. Text by Reginald Heber, 1826. Public Domain.",
    bpm: 100,
    tags: ["worship", "hymn", "holiness", "Trinity", "classic", "ccli-top-100"],
  },

  // 85. Breathe - Marie Barnett (Key: G)
  {
    title: "Breathe",
    artist: "Marie Barnett",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]This is the air I breathe
[C]This is the air I breathe
[G]Your holy presence [D]living in me

{Verse 2}
[G]This is my daily bread
[C]This is my daily bread
[G]Your very word [D]spoken to me

{Chorus}
And [Em]I I'm desperate [C]for You
And [Em]I I'm lost with[D]out You

{Verse 3}
[G]This is the air I breathe
[C]This is the air I breathe
[G]Your holy presence [D]living in me

{Verse 4}
[G]This is my daily bread
[C]This is my daily bread
[G]Your very word [D]spoken to me

{Outro}
[G]I'm lost without You
[C]I'm lost without You
[G]I'm desperate for [D]You
[G]I'm lost without You`,
    notes: "Key of G. Written by Marie Barnett. Vineyard Worship classic. Intimate prayer song.",
    bpm: 72,
    tags: ["worship", "prayer", "intimacy", "Holy Spirit", "ccli-top-100"],
  },

  // 86. Center - Bethel Music / Abbie Gamboa (Key: A)
  {
    title: "Center",
    artist: "Bethel Music / Abbie Gamboa",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]Christ be the center of [E]everything
[F#m]All that I am and all [D]that I bring
[A]In my surrendered [E]life I will find
[F#m]You are enough You are [D]mine

{Pre-Chorus}
[D]So I will [E]not be moved
[F#m]I will not be [D]shaken

{Chorus}
[A]You are the center of it [E]all
[F#m]You are the center of it [D]all
[A]Everything revolves a[E]round You
[F#m]Everything I am is [D]found in You

{Verse 2}
[A]Christ be the joy that [E]overflows
[F#m]Your peace within me wher[D]ever I go
[A]All that I need is [E]all You are
[F#m]Jesus the center of my [D]heart

{Bridge}
[D]And I have found all I [E]need
[F#m]You're all I need [D]
[D]And I have found all I [E]need
[F#m]You're all I [D]need You're all I need`,
    notes: "Key of A. 67 BPM. Songwriters: Brian Johnson, Abbie Gamboa, Gabriel Gamboa.",
    bpm: 67,
    tags: ["worship", "devotion", "surrender", "Jesus", "ccli-top-100"],
  },

  // 88. You Are My King (Amazing Love) - Billy Foote (Key: D)
  {
    title: "You Are My King (Amazing Love)",
    artist: "Billy Foote",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse}
[D]I'm forgiven be[G]cause You were forsaken
[D]I'm accepted You [G]were condemned
[D]I'm alive and well Your [Asus]Spirit is with[A]in me
Be[G]cause You died and [A]rose again

{Chorus}
[D]Amazing love how [G]can it be
[D]That You my King would [A]die for me
[D]Amazing love I [G]know it's true
[D]It's my joy to [A]honor You

{Bridge}
[G]In all I [A]do I honor [D]You

{Tag}
[D]You are my [G]King
[D]You are my [A]King
[D]Jesus [G]You are my [D]King
[A]Jesus [D]You are my King`,
    notes: "Key of D. 70 BPM. Written by Billy Foote. Classic Passion worship song.",
    bpm: 70,
    tags: ["worship", "love", "cross", "praise", "ccli-top-100"],
  },

  // 89. Come Jesus Come - Stephen McWhirter (Key: G)
  {
    title: "Come Jesus Come",
    artist: "Stephen McWhirter",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]I've been hearing more and more a[C]bout the day
When the [Em]clouds will open up and [D]You will come
[G]Who could be afraid when perfect [C]love arrives
And the [Em]darkness has to run and [D]hide

{Pre-Chorus}
[C]There ain't no grave gonna [Em]hold Your body down
[C]There ain't no power that can [D]keep You in the ground

{Chorus}
[G]Come Jesus come [C]we've been waiting so long
[Em]For the day when You re[D]turn to right every wrong
[G]Come Jesus come [C]our redemption draws nigh
[Em]We're ready for You [D]it's been ready all our lives
[G]Come Jesus come

{Verse 2}
[G]There is power in the [C]blood of the Lamb
Let every [Em]man and woman come and [D]see
[G]Not a sickness or a [C]sorrow or a sin
That He [Em]won't wash away if you be[D]lieve

{Bridge}
[Em]Every knee is gonna [C]bow every tongue confess
[G]You are the Lord of [D]all
[Em]When You finally [C]come back on the clouds
[G]There won't be any [D]doubt You are God`,
    notes: "Key of G. Written by Stephen McWhirter. Maranatha anthem.",
    bpm: 75,
    tags: ["worship", "second-coming", "hope", "declaration", "ccli-top-100"],
  },

  // 90. What An Awesome God - Phil Wickham (Key: A)
  {
    title: "What An Awesome God",
    artist: "Phil Wickham",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[D]Stars light up the [A]night so bright
[F#m]All creation [E]testifies
[D]What an awesome [A]God we [E]serve

{Verse 2}
[D]Morning sun will [A]surely rise
[F#m]Mercies new be[E]fore our eyes
[D]What an awesome [A]God we [E]serve

{Pre-Chorus}
[F#m]From the tallest [D]mountain to the [A]deepest sea
[F#m]There is nothing [D]like the love of [E]God for me

{Chorus}
[A]What an awesome God [F#m]what an awesome God
[D]What an awesome God we [E]serve
[A]What an awesome God [F#m]what an awesome God
[D]What an awesome God we [E]serve

{Bridge}
[F#m]Your love is an [D]ocean I'm swimming in
[A]This is the joy of the [E]Lord
[F#m]Deep calls to [D]deep in the heart of me
[A]What an awesome [E]God we serve`,
    notes: "Key of A. Written by Phil Wickham, Brian Johnson, and others.",
    bpm: 132,
    tags: ["worship", "praise", "creation", "joy", "ccli-top-100"],
  },

  // 91. Hosanna - Brooke Ligertwood / Hillsong (Key: E)
  {
    title: "Hosanna",
    artist: "Hillsong Worship / Brooke Ligertwood",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]I see the King of [C#m]Glory
[A]Coming on the clouds with [B]fire
The [E]whole earth shakes the [C#m]whole earth shakes
[A] [B]

{Verse 2}
[E]I see His love and [C#m]mercy
[A]Washing over all our [B]sin
The [E]people sing the [C#m]people sing
[A] [B]

{Chorus}
Ho[F#m]sanna ho[E/G#]sanna
Ho[A]sanna in the [B]highest
Ho[F#m]sanna ho[E/G#]sanna
Ho[A]sanna in the [B]highest

{Verse 3}
[E]I see a generation [C#m]rising up to take their place
[A]With selfless faith with [B]selfless faith
[E]I see a near re[C#m]vival stirring as we pray and seek
[A]We're on our knees we're [B]on our knees

{Bridge}
[A]Heal my heart and [E/G#]make it clean
[F#m]Open up my [E]eyes to the
[A]Things unseen [E/G#]show me how to [B]love
Like You have loved me`,
    notes: "Key of E. 76 BPM. Written by Brooke Ligertwood. CCLI #4785835.",
    bpm: 76,
    tags: ["worship", "praise", "revival", "prayer", "ccli-top-100"],
  },

  // 92. As The Deer - Martin Nystrom (Key: D)
  {
    title: "As The Deer",
    artist: "Martin Nystrom",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]As the deer [F#m]panteth [Bm]for the [D]water
[G]So my soul [D]longeth [A]after [D]Thee
[D]You alone [F#m]are my [Bm]heart's de[D]sire
[G]And I long to [D]worship [A]Thee [D]

{Chorus}
[D]You alone are my [G]strength my [A]shield
To [Bm]You alone may my [G]spirit [Em]yield
[D]You alone [F#m]are my [Bm]heart's de[D]sire
[G]And I long to [D]worship [A]Thee [D]

{Verse 2}
[D]You're my friend [F#m]and You [Bm]are my [D]brother
[G]Even though [D]You are [A]a [D]King
[D]I love You [F#m]more than [Bm]any [D]other
[G]So much more than [D]any[A]thing [D]

{Verse 3}
[D]I want You [F#m]more than [Bm]gold or [D]silver
[G]Only You [D]can sat[A]isfy [D]
[D]You alone [F#m]are the [Bm]real joy [D]giver
[G]And the apple [D]of [A]my [D]eye`,
    notes: "Key of D. 74 BPM. Based on Psalm 42:1. Written by Martin Nystrom.",
    bpm: 74,
    tags: ["worship", "intimacy", "desire", "Psalms", "ccli-top-100"],
  },

  // 93. It Really Is Amazing Grace - Phil Wickham / Crowder (Key: G)
  {
    title: "It Really Is Amazing Grace",
    artist: "Phil Wickham / Crowder",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]How can I put into words what You [C]did for me
[Em]How could the God of the universe [D]come and rescue me
[G]I was alone in the dark and You [C]opened my eyes
[Em]Now I see everything [D]different in the light

{Pre-Chorus}
[C]I once was blind but [D]now I see
[Em]It really [D]is

{Chorus}
[G]Amazing grace how [C]sweet the sound
[Em]That saved a [D]wretch like me
[G]I once was lost but [C]now I'm found
[Em]Was blind but [D]now I see
[C]It really is a[G]mazing [D]grace

{Verse 2}
[G]How many years I was running a[C]way from the truth
[Em]How many times did You send some[D]body I knew
[G]It wasn't karma or luck that [C]finally pulled me in
[Em]It was the hand of a Savior re[D]aching out again

{Bridge}
[Em]Chains are gone [C]I've been set free
[G]My God my Savior has [D]ransomed me
[Em]And like a flood [C]His mercy reigns
[G]Unending love [D]amazing grace`,
    notes: "Key of G. Songwriters: Phil Wickham, David Crowder, and others.",
    bpm: 80,
    tags: ["worship", "grace", "salvation", "testimony", "ccli-top-100"],
  },

  // 97. At The Cross (Love Ran Red) - Chris Tomlin (Key: G)
  {
    title: "At The Cross (Love Ran Red)",
    artist: "Chris Tomlin",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[C]There's a place where [Em]mercy reigns and [D/F#]never dies
[C]There's a place where [Em]streams of grace flow [D/F#]deep and wide
[C]Where all the love I've [Em]ever found
[D]Comes like a flood comes [G]flowing down

{Chorus}
[C]At the cross at the [G]cross I surrender my life
[D]I'm in awe of You [Am7]I'm in awe of You
[C]Where Your love ran [G]red and my sin washed white
[D]I owe all to You [Am7]I owe all to You
[G]Jesus

{Verse 2}
[C]There's a place where [Em]sin and shame are [D/F#]powerless
[C]Where my heart has [Em]peace with God and [D/F#]forgiveness
[C]Where all the love I've [Em]ever found
[D]Comes like a flood comes [G]flowing down

{Bridge}
[Em]Here my hope is [C]found
[G]Here on holy [D]ground
[Em]Here I bow down [C]here I bow down
[G]Here arms open [D]wide
[Em]Here You saved my [C]life
[G]Here I bow down [D]here I bow [G]down`,
    notes: "Key of G. Songwriters: Chris Tomlin, Ed Cash, Jonas Myrin, Matt Armstrong, Matt Redman.",
    bpm: 68,
    tags: ["worship", "cross", "grace", "surrender", "ccli-top-100"],
  },

  // 98. Our God - Chris Tomlin (Key: B)
  {
    title: "Our God",
    artist: "Chris Tomlin",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[Em]Water You turned into [C]wine
[G]Opened the eyes of the [D]blind
There's no one [Em]like You [C]
[G]None like [D]You

{Verse 2}
[Em]Into the darkness You [C]shine
[G]Out of the ashes we [D]rise
There's no one [Em]like You [C]
[G]None like [D]You

{Chorus}
[G]Our God is greater [D]our God is stronger
[Em]God You are higher than [C]any other
[G]Our God is healer [D]awesome in power
[Em]Our God our [C]God

{Bridge}
And [Am]if our God is for us
Then [C]who could ever stop us
And [Am]if our God is with us
Then [Em]what could stand a[D]gainst
And [Am]if our God is for us
Then [C]who could ever stop us
And [Am]if our God is with us
Then [Em]what could stand a[D]gainst
Then [C]what could stand against`,
    notes: "Key of B (capo 4 in G). Songwriters: Chris Tomlin, Jesse Reeves, Jonas Myrin, Matt Redman.",
    bpm: 105,
    tags: ["worship", "power", "praise", "declaration", "ccli-top-100"],
  },

  // 99. Amazing Grace - Traditional (Key: G)
  {
    title: "Amazing Grace",
    artist: "John Newton",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
A[G]mazing [G7]grace how [C]sweet the [G]sound
That saved a [Em]wretch like [D]me
I [G]once was [G7]lost but [C]now I'm [G]found
Was blind but [D7]now I [G]see

{Verse 2}
'Twas [G]grace that [G7]taught my [C]heart to [G]fear
And grace my [Em]fears re[D]lieved
How [G]precious [G7]did that [C]grace ap[G]pear
The hour I [D7]first be[G]lieved

{Verse 3}
Through [G]many [G7]dangers [C]toils and [G]snares
I have al[Em]ready [D]come
'Tis [G]grace hath [G7]brought me [C]safe thus [G]far
And grace will [D7]lead me [G]home

{Verse 4}
When [G]we've been [G7]there ten [C]thousand [G]years
Bright shining [Em]as the [D]sun
We've [G]no less [G7]days to [C]sing God's [G]praise
Than when we [D7]first be[G]gun`,
    notes: "Key of G. 3/4 time. Written by John Newton, 1779. Public Domain.",
    bpm: 80,
    tags: ["worship", "hymn", "grace", "salvation", "classic", "ccli-top-100"],
  },

  // 32. The Blood - Bethel Music / Jenn Johnson feat. Mitch Wong (Key: G)
  // Chords sourced from Ultimate Guitar / GuitarTuna — key G
  {
    title: "The Blood",
    artist: "Bethel Music / Jenn Johnson",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Everything changed it's getting [D]harder to recognize
[C]Who I was before You [G]opened my eyes
[G]It had to be You standing [D]right in front of me
[C]Washing away everything un[G]clean

{Pre-Chorus}
[Em]I don't deserve it [C]I can't afford it
[G]But Your blood was e[D]nough

{Chorus}
[G]Hallelujah halle[D]lujah
[C]I know it was the blood [G]
[G]Hallelujah halle[D]lujah
[C]Could have only been the blood [G]

{Verse 2}
[G]Grace running down it's getting [D]harder to hold inside
[C]The wonder of what was done [G]the beauty behind the price
[G]I cannot contain what Your [D]love has done for me
[C]Pouring from my heart over[G]flowing endlessly

{Bridge}
[Em]Does anybody want to be [C]holy
[G]Righteous purified and [D]spotless
[Em]Does anybody want to be [C]clean
[G]Come to the fountain [D]come to the blood`,
    notes: "Key of G. 76 BPM. Bethel Music feat. Jenn Johnson & Mitch Wong. Simple G-D-C progression throughout.",
    bpm: 76,
    tags: ["worship", "blood", "redemption", "grace", "ccli-top-100"],
  },

  // 82. Jesus Messiah - Chris Tomlin (Key: G)
  // Chords sourced from Ultimate Guitar / PsalmNote — key G (capo 2 from original B)
  {
    title: "Jesus Messiah",
    artist: "Chris Tomlin",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]He became sin who [Am7]knew no sin
[G/B]That we might be[C2]come His righteousness
[G]He humbled Himself and [Am7]carried the cross
[G/D]Love so amazing [C2]love so amazing

{Chorus}
[G]Jesus Mes[C2]siah Name above all [Dsus]names
[D]Blessed Re[G]deemer Emman[C2]uel
[Dsus]The rescue for [D]sinners the ransom from [Em]heaven
[C2]Jesus Mes[Dsus]siah Lord of [G]all

{Verse 2}
[G]His body the bread His [Am7]blood the wine
[G/B]Broken and poured out [C2]all for love
[G]The whole earth trembled and the [Am7]veil was torn
[G/D]Love so amazing [C2]love so amazing

{Bridge}
[Am7]All our hope is [G/B]in You
[C2]All our hope is [Dsus]in You
[Am7]All the glory to [G/B]You God
[C2]The Light of the [Dsus]world

{Tag}
[G]Jesus Mes[C2]siah
[Dsus]Lord of [G]all
[C2]The Lord of [Dsus]all
The Lord of [G]all`,
    notes: "Key of G (original B, capo 2). 74 BPM. Songwriters: Chris Tomlin, Daniel Carson, Ed Cash, Jesse Reeves.",
    bpm: 74,
    tags: ["worship", "Jesus", "salvation", "atonement", "ccli-top-100"],
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
