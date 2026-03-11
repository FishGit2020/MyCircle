#!/usr/bin/env node
/**
 * Seed Bethel Music worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/bethel-music.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Goodness of God",
    artist: "Bethel Music",
    originalKey: "A",
    format: "chordpro",
    content: `[A]I love You, Lord
[D]Oh Your mercy never [A]fails me
[A]All my days, [E]I've been held in Your [D]hands
[A]From the moment that I [D]wake up
[A]Until I lay my [E]head
[A]Oh, I will sing of the [D]goodness of God

[A]All my life You have been [D]faithful
[A]All my life You have been so, [E]so good
[D]With every breath that I am able
[A]Oh, I will sing of the [E]goodness of [A]God

[A]I love Your voice
[D]You have led me through the [A]fire
[A]In the darkest night [E]You are close like no [D]other
[A]I've known You as a [D]Father
[A]I've known You as a [E]Friend
[A]And I have lived in the [D]goodness of God`,
    notes: "Great congregational song. Can use capo 2 and play in G shapes.",
    bpm: 68,
    tags: ["praise","worship","congregational"],
  },
  {
    title: "Reckless Love",
    artist: "Bethel Music",
    originalKey: "C",
    format: "chordpro",
    content: `[Am]Before I spoke a [C]word, You were singing over [G]me
[Am]You have been so, so [C]good to [G]me
[Am]Before I took a [C]breath, You breathed Your life in [G]me
[Am]You have been so, so [C]kind to [G]me

[G]Oh, the overwhelming, [C]never-ending, reckless [Em]love of God
[D]Oh, it chases me down, fights 'til I'm found, [C]leaves the ninety-nine
[G]I couldn't earn it, [C]I don't deserve it, still [Em]You give Yourself away
[D]Oh, the overwhelming, [C]never-ending, reckless [G]love of God`,
    notes: "Build dynamics throughout. Softer on verses, big on chorus.",
    bpm: 86,
    tags: ["worship","love","grace"],
  },
  {
    title: "Raise a Hallelujah",
    artist: "Bethel Music",
    originalKey: "B",
    format: "chordpro",
    content: `[B]I raise a halle[E]lujah, in the presence of my [B]enemies
[B]I raise a halle[F#]lujah, louder than the [E]unbelief
[B]I raise a halle[E]lujah, my weapon is a [B]melody
[B]I raise a halle[F#]lujah, heaven comes to [E]fight for me

[B]I'm gonna sing, in the [E]middle of the storm
[B]Louder and louder, you're gonna hear my [F#]praises roar
[B]Up from the ashes, [E]hope will arise
[B]Death is defeated, the [F#]King is a[E]live`,
    notes: "Powerful anthem. Can play in A with capo 2.",
    bpm: 150,
    tags: ["praise","anthem","warfare"],
  },
  {
    title: "No Longer Slaves",
    artist: "Bethel Music",
    originalKey: "E",
    format: "chordpro",
    content: `[E]You unravel me with a [B]melody
[C#m]You surround me with a [A]song
[E]Of deliverance from my [B]enemies
[C#m]Till all my fears are [A]gone

[E]I'm no longer a slave to [B]fear
[C#m]I am a child of [A]God
[E]I'm no longer a slave to [B]fear
[C#m]I am a child of [A]God

[E]From my mothers womb [B]You have chosen me
[C#m]Love has called my [A]name
[E]I've been born again [B]into Your family
[C#m]Your blood flows through my [A]veins`,
    notes: "Builds dynamically. Great bridge section for extended worship.",
    bpm: 72,
    tags: ["worship","freedom","identity"],
  },
  {
    title: "Holy Forever",
    artist: "Bethel Music",
    originalKey: "G",
    format: "chordpro",
    content: `[G]A thousand genera[Em]tions falling [C]down in worship
[G]To sing the song of [Em]ages to the [D]Lamb
[G]And all who've gone be[Em]fore us and [C]all who will believe
[G]Will sing the song of [Em]ages and the [D]whole earth will sing

[G]Holy, holy, [Em]holy is the Lord
[C]Holy, holy, [D]holy is the Lord
[G]God Almighty, [Em]Who was and is to [C]come
[D]God Almighty, [G]holy forever

[G]Your name is the [Em]highest, Your [C]name is the greatest
[G]Your name stands a[Em]bove them all
[G]All thrones and do[Em]minions, all [C]powers and positions
[G]Your name stands a[Em]bove them [D]all`,
    notes: "Powerful chorus. Let the room ring on \"holy forever.\"",
    bpm: 138,
    tags: ["praise","worship","holiness"],
  },
  {
    title: "King of My Heart",
    artist: "Bethel Music",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Let the King of my heart be the [Em]mountain where I run
[C]The fountain I drink from, oh [D]He is my song
[G]Let the King of my heart be the [Em]shadow where I hide
[C]The ransom for my life, oh [D]He is my song

[G]You are [Em]good, good, [C]oh [D]
[G]You are [Em]good, good, [C]oh [D]

[G]Let the King of my heart be the [Em]wind inside my sails
[C]The anchor in the waves, oh [D]He is my song
[G]Let the King of my heart be the [Em]fire inside my veins
[C]The echo of my days, oh [D]He is my song`,
    notes: "Joyful and intimate. Builds to a beautiful \"You are good\" refrain.",
    bpm: 128,
    tags: ["worship","devotion","joy"],
  },
  {
    title: "Great Are You Lord",
    artist: "Bethel Music",
    originalKey: "D",
    format: "chordpro",
    content: `[D]You give life, You are love
[F#m]You bring light to the darkness
[G]You give hope, You restore
[A]Every heart that is broken
[D]Great are You, [A]Lord

[D]It's Your breath in our lungs
[F#m]So we pour out our praise
[G]We pour out our praise
[D]It's Your breath in our lungs
[F#m]So we pour out our praise to [G]You only

[D]And all the earth will shout Your [F#m]praise
[G]Our hearts will cry, these bones will say
[D]Great are You, [A]Lord`,
    notes: "Simple and singable. Works great with just acoustic guitar.",
    bpm: 78,
    tags: ["worship","praise","breath"],
  },
  {
    title: "Build My Life",
    artist: "Bethel Music",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Worthy of every [C]song we could ever sing
[Em]Worthy of all the [D]praise we could ever bring
[G]Worthy of every [C]breath we could ever breathe
[Em]We live for [D]You

[G]Jesus the Name a[C]bove every other name
[Em]Jesus the only [D]one who could ever save
[G]Worthy of every [C]breath we could ever breathe
[Em]We live for [D]You, we live for [G]You

[G]Holy, there is no [C]one like You
[Em]There is none be[D]side You
[G]Open up my eyes in [C]wonder
[Em]And show me who You [D]are and fill me
[G]With Your heart and lead me
[C]In Your love to those a[Em]round me
[D]I will build my life upon Your love
It is a firm foun[G]dation`,
    notes: "One of the most popular modern worship songs. Simple to lead.",
    bpm: 68,
    tags: ["worship","devotion","foundation"],
  },
  {
    title: "Tremble",
    artist: "Bethel Music",
    originalKey: "A",
    format: "chordpro",
    content: `[A]Jesus, Jesus, [E]You make the darkness tremble
[F#m]Jesus, Jesus, [D]You silence fear
[A]Jesus, Jesus, [E]You make the darkness tremble
[F#m]Jesus, [D]Jesus

[A]Your name is a light that the [E]shadows can't deny
[F#m]Your name is a light that the [D]shadows can't deny
[A]Your name cannot be over[E]come
[F#m]Your name cannot be over[D]come

[A]Peace, bring it all to [E]peace
[F#m]The storms surround[D]ing me
[A]Let it break at Your [E]name`,
    notes: "Spiritual warfare song. Start gentle, build to powerful declaration.",
    bpm: 72,
    tags: ["worship","warfare","name of Jesus"],
  },
  {
    title: "Stand in Your Love",
    artist: "Bethel Music",
    originalKey: "A",
    format: "chordpro",
    content: `[A]When darkness tries to [E]roll over my bones
[F#m]When sorrow comes to [D]steal the joy I own
[A]When brokenness and [E]pain is all I know
[F#m]I won't be [D]shaken, I won't be shaken

[A]My fear doesn't [E]stand a chance
[F#m]When I stand in Your [D]love
[A]My fear doesn't [E]stand a chance
[F#m]When I stand in Your [D]love

[A]Shame no longer [E]has a place to hide
[F#m]I am not a [D]captive to the lies
[A]I'm not afraid to [E]leave my past behind
[F#m]I won't be [D]shaken, I won't be shaken`,
    notes: "Confident declaration. Good for building faith.",
    bpm: 73,
    tags: ["worship","courage","love"],
  },
  {
    title: "Come to Me",
    artist: "Bethel Music",
    originalKey: "D",
    format: "chordpro",
    content: `[D]Are you weary, [A]heavy laden
[Bm]Come and I will [G]give you rest
[D]Come to Me when [A]hope is fading
[Bm]Breathe and trust [G]what's coming next

[D]Come to Me, [A]come to Me
[Bm]All who are [G]weary
[D]Come to Me, [A]come to Me
[Bm]And I will give [G]you rest`,
    notes: "Gentle invitation, start soft and build. Piano-led arrangement.",
    bpm: 64,
    tags: ["worship","rest","invitation"],
  },
  {
    title: "You Make Me Brave",
    artist: "Bethel Music",
    originalKey: "G",
    format: "chordpro",
    content: `[G]You make me brave, [C]You make me brave
[Em]You call me out [D]beyond the shore into the waves
[G]You make me brave, [C]You make me brave
[Em]No fear can hinder [D]now the love that made a way

[G]You make me [C]brave
[Em]You make me [D]brave
[G]You call me out [C]beyond the shore
[Em]Into the [D]waves`,
    notes: "Amanda Cook classic, builds from gentle to anthemic",
    bpm: 70,
    tags: ["worship","courage","faith"],
  },
  {
    title: "It Is Well",
    artist: "Bethel Music",
    originalKey: "B",
    format: "chordpro",
    content: `[B]Grander earth has [E]quaked before
[G#m]Moved by the sound [F#]of His voice
[B]Seas that are [E]shaken and stirred
[G#m]Can be calmed and [F#]broken for my regard

[B]It is well [E]with my soul
[G#m]It is well, [F#]it is well
[B]With my [E]soul
[G#m]It is well, [F#]it is well with my soul`,
    notes: "Kristene DiMarco arrangement, modern take on classic hymn. Atmospheric.",
    bpm: 68,
    tags: ["worship","peace","hymn","trust"],
  },
  {
    title: "For the One",
    artist: "Bethel Music",
    originalKey: "G",
    format: "chordpro",
    content: `[G]I hear the Savior [D]say
[Em]Come and follow [C]Me
[G]Leave behind the [D]life you know
[Em]Take My hand and [C]see

[G]For the one who's [D]far away
[Em]For the one who's [C]lost today
[G]You would leave the [D]ninety-nine
[Em]For the one, [C]for the one`,
    notes: "Jenn Johnson. Missions heart, builds to passionate bridge.",
    bpm: 72,
    tags: ["worship","missions","compassion"],
  },
  {
    title: "One Thing Remains",
    artist: "Bethel Music",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Higher than the [D]mountains that I face
[Em]Stronger than the [C]power of the grave
[G]Constant in the [D]trial and the change
[Em]One thing re[C]mains

[G]Your love never fails, [D]never gives up
[Em]Never runs out [C]on me
[G]Your love never fails, [D]never gives up
[Em]Never runs out [C]on me`,
    notes: "Jesus Culture co-write. Passionate and repetitive, great for extended worship.",
    bpm: 142,
    tags: ["worship","love","faithfulness"],
  },
  {
    title: "Defender",
    artist: "Bethel Music",
    originalKey: "D",
    format: "chordpro",
    content: `[D]You go before [A]me
[Bm]You're behind [G]me
[D]And I'm surrounded [A]by Your love
[Bm]I have no [G]reason to fear

[D]When I thought I lost me, [A]You were there to find me
[Bm]The fight was fixed and [G]the triumph is Yours
[D]You are my de[A]fender
[Bm]I have no [G]reason to fear`,
    notes: "Steffany Gretzinger & Rita Springer. Gentle beginning, explosive bridge.",
    bpm: 65,
    tags: ["worship","protection","trust"],
  },
  {
    title: "Surrounded (Fight My Battles)",
    artist: "Bethel Music",
    originalKey: "D",
    format: "chordpro",
    content: `[D]There's a table [A]that You've prepared for me
[Bm]In the presence [G]of my enemies
[D]It's Your body [A]and Your blood You shed for me
[Bm]This is how I [G]fight my battles

[D]This is how I fight my [A]battles
[Bm]This is how I fight my [G]battles
[D]It may look like I'm sur[A]rounded
[Bm]But I'm surrounded [G]by You`,
    notes: "Kari Jobe arrangement. Powerful declaration. Extended worship moment.",
    bpm: 70,
    tags: ["worship","spiritual warfare","declaration"],
  },
  {
    title: "It's Gonna Be Alright",
    artist: "Bethel Music",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Even in the [D]middle of the fire
[Em]I'm not gonna [C]worry
[G]Even when the [D]night is closing in
[Em]Your love is my [C]shelter

[G]It's gonna be al[D]right
[Em]It's gonna be al[C]right
[G]I know You hold my [D]life
[Em]It's gonna be al[C]right`,
    notes: "Jenn Johnson. Comforting and reassuring, clap-along feel.",
    bpm: 124,
    tags: ["worship","comfort","trust"],
  },
  {
    title: "We Praise You",
    artist: "Bethel Music",
    originalKey: "A",
    format: "chordpro",
    content: `[A]Out of the [E]darkness
[F#m]Into the [D]light
[A]We lift our [E]voices
[F#m]You are our [D]God

[A]We praise You, [E]we praise You
[F#m]God of ages, [D]Hallelujah
[A]We praise You, [E]we praise You
[F#m]Worthy of all [D]glory`,
    notes: "Brandon Lake. Explosive worship anthem. High energy throughout.",
    bpm: 148,
    tags: ["worship","praise","adoration"],
  },
  {
    title: "Peace",
    artist: "Bethel Music",
    originalKey: "G",
    format: "chordpro",
    content: `[G]I hear the [D]Savior say
[Em]Peace be [C]still
[G]And the wind and [D]the waves obey
[Em]At Your [C]command

[G]Peace, be [D]still
[Em]Peace, be [C]still
[G]You silence the [D]storm that's raging
[Em]You tell the waves [C]be still`,
    notes: "We the Kingdom for Bethel. Contemplative verse, powerful chorus.",
    bpm: 66,
    tags: ["worship","peace","trust"],
  },
  {
    title: "Chasing You",
    artist: "Bethel Music",
    originalKey: "B",
    format: "chordpro",
    content: `[B]I will run after [E]You
[F#]Chasing You with [G#m]all I have
[B]Nothing can com[E]pare to knowing [F#]You

[B]You're the treasure [E]I have found
[F#]More than all the [G#m]world has known
[B]I am chasing [E]You with [F#]all my heart`,
    notes: "Upbeat, energetic. Drive the rhythm on the B chord.",
    bpm: 132,
    tags: ["worship","pursuit","upbeat"],
  },
  {
    title: "Raise Up (Lazarus)",
    artist: "Bethel Music",
    originalKey: "E",
    format: "chordpro",
    content: `[E]Come forth come [B]out of the grave
[C#m]You who were [A]dead are alive again
[E]Lazarus come [B]forth
[C#m]Raised to life by the [A]King of all

[E]He calls us [B]out, He calls us [C#m]up
[A]From the ashes we will [E]rise`,
    notes: "Build intensity into the chorus. Powerful declaration song.",
    bpm: 78,
    tags: ["worship","resurrection","declaration"],
  },
  {
    title: "No Longer I",
    artist: "Bethel Music",
    originalKey: "G",
    format: "chordpro",
    content: `[G]It is no longer [C]I who live
[Em]But Christ who [D]lives in me
[G]The life I live [C]in the flesh
[Em]I live by [D]faith in the Son

[G]No longer [C]I, no longer [Em]I
[D]But Christ in [G]me`,
    notes: "Galatians 2:20 theme. Reflective verse, declarative chorus.",
    bpm: 68,
    tags: ["worship","identity","scripture"],
  },
  {
    title: "We Will Not Be Shaken",
    artist: "Bethel Music",
    originalKey: "A",
    format: "chordpro",
    content: `[A]We will not be [D]shaken
[F#m]We will not be [E]moved
[A]Our God is faithful [D]His promise is true
[F#m]We will not be [E]shaken

[A]Standing on the [D]Rock that never fails
[F#m]Trusting in the [E]God who will pre[A]vail`,
    notes: "Strong anthem feel. Great for congregational singing.",
    bpm: 76,
    tags: ["worship","faith","anthem"],
  },
  {
    title: "You Know Me",
    artist: "Bethel Music",
    originalKey: "G",
    format: "chordpro",
    content: `[G]You know me, You [C]know me
[Em]You searched me and [D]You know me
[G]Where I go You [C]go with me
[Em]In Your presence [D]I find rest

[G]Nothing is hidden [C]from You
[Em]Every thought You [D]see it through
[G]You know me [C]better than I [D]know my[G]self`,
    notes: "Psalm 139 inspired. Gentle and intimate.",
    bpm: 70,
    tags: ["worship","intimacy","psalm"],
  },
  {
    title: "Letting Go",
    artist: "Bethel Music",
    originalKey: "D",
    format: "chordpro",
    content: `[D]I'm letting go of [A]every fear
[Bm]Laying down my [G]doubt right here
[D]Falling into [A]grace again
[Bm]Trusting You through [G]thick and thin

[D]I surrender [A]all to You
[Bm]You make all things [G]new
[D]I'm letting [A]go`,
    notes: "Surrender theme. Soft dynamics on verse, open on chorus.",
    bpm: 66,
    tags: ["worship","surrender","trust"],
  },
  {
    title: "Faithful to the End",
    artist: "Bethel Music",
    originalKey: "C",
    format: "chordpro",
    content: `[C]You have been [G]faithful to the end
[Am]Every promise [F]You fulfill
[C]Through the fire [G]through the storm
[Am]You are faithful [F]evermore

[C]Great is Your [G]faithfulness
[Am]Morning by [F]morning new mercies I [C]see`,
    notes: "Congregational hymn feel. Can slow down at the bridge.",
    bpm: 72,
    tags: ["worship","faithfulness","hymn"],
  },
  {
    title: "Take Courage",
    artist: "Bethel Music",
    originalKey: "Bb",
    format: "chordpro",
    content: `[Bb]Take courage my [F]heart
[Gm]Stay steadfast my [Eb]soul
[Bb]He's in the [F]waiting
[Gm]He's in the [Eb]patience

[Bb]Take courage my [F]heart
[Gm]Stay steadfast my [Eb]soul
[Bb]Joy comes in the [F]morning
[Gm]Hold on through the [Eb]night`,
    notes: "Kristene DiMarco song. Build gently through each verse.",
    bpm: 65,
    tags: ["worship","courage","waiting"],
  },
  {
    title: "Be Still My Soul (Bethel)",
    artist: "Bethel Music",
    originalKey: "D",
    format: "chordpro",
    content: `[D]Be still my [A]soul
[Bm]The Lord is [G]on your side
[D]Bear patiently [A]the cross of [Bm]grief or [G]pain

[D]Be still my [A]soul
[Bm]Your God will [G]undertake
[D]To guide the [A]future as [Bm]He has the [G]past`,
    notes: "Classic hymn reimagined. Reverent and unhurried.",
    bpm: 60,
    tags: ["worship","peace","hymn","classic"],
  },
  {
    title: "Pieces (Bethel)",
    artist: "Bethel Music",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Unreserved, [C]unrestrained
[Em]Your love is [D]wild, Your love is plain
[G]I don't deserve [C]don't need to earn
[Em]Your wild love [D]found me

[G]You don't give Your [C]heart in pieces
[Em]You don't hide Your[D]self to tease us
[G]Unreserved, [C]unrestrained [D]love`,
    notes: "Amanda Cook song. Let dynamics breathe in verses.",
    bpm: 68,
    tags: ["worship","love","grace"],
  },
  {
    title: "Have It All",
    artist: "Bethel Music",
    originalKey: "E",
    format: "chordpro",
    content: `[E]You can have it [B]all Lord
[C#m]Every part of my [A]world
[E]Take this life and [B]breathe on
[C#m]This heart that is [A]now Yours

[E]I'm laying [B]everything down
[C#m]At Your feet the [A]only crown
[E]You can have it [B]all, have it [A]all`,
    notes: "High-energy anthem. Builds to a powerful bridge.",
    bpm: 140,
    tags: ["worship","surrender","anthem"],
  },
  {
    title: "Here for You",
    artist: "Bethel Music",
    originalKey: "C",
    format: "chordpro",
    content: `[C]Let our praise be [G]Your welcome
[Am]Let our songs be a [F]sign
[C]We are here for [G]You, here for [Am]You
[F]Let Your breath come from [C]heaven

[C]We welcome [G]You with praise
[Am]We welcome [F]You here with our [C]hearts open wide`,
    notes: "Matt Redman / Bethel collaboration. Great opener.",
    bpm: 74,
    tags: ["worship","invitation","praise"],
  },
  {
    title: "Without Words (Bethel)",
    artist: "Bethel Music",
    originalKey: "A",
    format: "chordpro",
    content: `[A]All my words fall [E]short
[F#m]I've got nothing [D]new
[A]How could I ex[E]press
[F#m]All my gratitude [D]

[A]I could sing all [E]day long
[F#m]But even then the [D]words are not enough
[A]Without words my [E]soul speaks [D]to You`,
    notes: "Instrumental-heavy song. Leave space for musical expression.",
    bpm: 64,
    tags: ["worship","intimacy","instrumental"],
  },
  {
    title: "Break Out",
    artist: "Bethel Music",
    originalKey: "E",
    format: "chordpro",
    content: `[E]Break out, break [B]out
[C#m]Let the walls come [A]down
[E]Break through, break [B]through
[C#m]There's a new song [A]now

[E]Freedom is our [B]anthem
[C#m]Breaking every [A]chain
[E]We will break [B]out in [C#m]praise [A]again`,
    notes: "High energy declaration. Full band, drive the beat.",
    bpm: 138,
    tags: ["worship","freedom","anthem"],
  },
  {
    title: "Extravagant",
    artist: "Bethel Music",
    originalKey: "Ab",
    format: "chordpro",
    content: `[Ab]Extravagant it [Eb]never stops
[Fm]It never quits [Db]never gives up
[Ab]Your love ex[Eb]travagant
[Fm]Pouring from Your [Db]heart to us

[Ab]We're overwhelmed by [Eb]mercy
[Fm]We're overwhelmed by [Db]grace
[Ab]An extravagant [Eb]love on dis[Db]play`,
    notes: "Bethel Live arrangement. Key change possible at bridge.",
    bpm: 76,
    tags: ["worship","love","grace"],
  },
  {
    title: "Shepherd",
    artist: "Bethel Music",
    originalKey: "G",
    format: "chordpro",
    content: `[G]The Lord is my [C]shepherd
[Em]I shall not [D]want
[G]He makes me lie [C]down in green pastures
[Em]He leads me be[D]side still waters

[G]You restore my [C]soul
[Em]You guide me in [D]paths of righteousness
[G]Even in the [C]valley
[Em]I will fear no [D]evil
[G]For You are [C]with me`,
    notes: "Josh Baldwin. Psalm 23 adaptation. Gentle, pastoral feel.",
    bpm: 72,
    tags: ["worship","psalm","peace"],
  },
  {
    title: "Come Up Here",
    artist: "Bethel Music",
    originalKey: "D",
    format: "chordpro",
    content: `[D]Come up here, [A]come up here
[Bm]Let Me show you [G]what I see
[D]From above the [A]noise and fear
[Bm]There's a higher [G]place to be

[D]Eyes have not [A]seen
[Bm]Ears have not [G]heard
[D]What You have pre[A]pared for me
[Bm]Come up [G]here`,
    notes: "Bethel worship moment. Build from whisper to full voice.",
    bpm: 68,
    tags: ["worship","invitation","heaven"],
  },
  {
    title: "Over It All",
    artist: "Bethel Music",
    originalKey: "E",
    format: "chordpro",
    content: `[E]Over it all, [B]You are over it all
[C#m]The cross before [A]me, the world behind me
[E]No turning back, [B]no turning back
[C#m]Your love is o[A]ver it all

[E]Your blood still [B]speaks
[C#m]It will never lose its [A]power
[E]Over it [B]all, over it [A]all`,
    notes: "Jenn Johnson. Atmospheric worship, layers build gradually.",
    bpm: 70,
    tags: ["worship","sovereignty","cross"],
  },
  {
    title: "Throne Room",
    artist: "Bethel Music",
    originalKey: "A",
    format: "chordpro",
    content: `[A]Holy, holy [E]is the Lord
[F#m]Heaven and earth are [D]full of Your glory
[A]We enter in [E]to the throne room
[F#m]With praise upon [D]our lips

[A]Throne room, [E]we're standing in the throne room
[F#m]Mercy and grace [D]before Your face
[A]We've come to seek [E]You here`,
    notes: "Steffany Gretzinger. Reverent and majestic. Let dynamics swell.",
    bpm: 66,
    tags: ["worship","holiness","presence"],
  },
  {
    title: "After All (Holy)",
    artist: "Bethel Music",
    originalKey: "G",
    format: "chordpro",
    content: `[G]After all You've [D]done
[Em]I will praise You [C]more
[G]After all I've [D]seen
[Em]I believe You [C]still

[G]Holy, [D]holy
[Em]After all, You are [C]holy
[G]Worthy of it [D]all
[Em]After all, You are [C]holy`,
    notes: "David Funk. Tender yet powerful. Repeated chorus builds intensity.",
    bpm: 74,
    tags: ["worship","holiness","gratitude"],
  },
  {
    title: "Pour Over Me",
    artist: "Bethel Music",
    originalKey: "C",
    format: "chordpro",
    content: `[C]Spirit of the [G]living God
[Am]Come and pour [F]over me
[C]Fill this empty [G]vessel, Lord
[Am]With Your love so [F]free

[C]Pour over me, [G]pour over me
[Am]Every good and [F]perfect gift
[C]Lord, pour over [G]me`,
    notes: "Kalley Heiligenthal. Soaking worship feel. Unhurried.",
    bpm: 62,
    tags: ["worship","holy spirit","soaking"],
  },
  {
    title: "Praise Before My Breakthrough",
    artist: "Bethel Music",
    originalKey: "A",
    format: "chordpro",
    content: `[A]I know the battle [E]isn't over
[F#m]I know the war [D]isn't won
[A]But I will praise You [E]in the waiting
[F#m]I will praise be[D]fore it comes

[A]I will praise be[E]fore my breakthrough
[F#m]I will praise be[D]fore the dawn
[A]Even in the [E]waiting, Lord
[F#m]My praise goes [D]on and on`,
    notes: "Bryan & Katie Torwalt. Faith-filled declaration before the answer.",
    bpm: 78,
    tags: ["worship","faith","breakthrough"],
  },
  {
    title: "Born Again",
    artist: "Bethel Music",
    originalKey: "D",
    format: "chordpro",
    content: `[D]You spoke the words and [A]all was born again
[Bm]New creation [G]now I'm born again
[D]Dead to this world, [A]alive in You
[Bm]My old life is [G]gone

[D]I've been born a[A]gain
[Bm]I've been born a[G]gain
[D]Everything has [A]changed
[Bm]Since the day You [G]called my name`,
    notes: "High-energy testimony song. Celebrate the new birth.",
    bpm: 132,
    tags: ["worship","testimony","new life"],
  },
  {
    title: "Deep Cries Out",
    artist: "Bethel Music",
    originalKey: "E",
    format: "chordpro",
    content: `[E]Deep cries out to [B]deep
[C#m]At the sound of [A]waterfalls
[E]All Your waves and [B]breakers
[C#m]Sweep over [A]me

[E]My soul thirsts for [B]the living God
[C#m]When shall I come and [A]appear before You
[E]Deep cries out to [B]deep
[C#m]My soul longs for [A]You`,
    notes: "Psalm 42 theme. Flowing, water-like musical feel.",
    bpm: 66,
    tags: ["worship","longing","psalm"],
  },
  {
    title: "New Wine",
    artist: "Bethel Music",
    originalKey: "B",
    format: "chordpro",
    content: `[B]In the crushing, [G#m]in the pressing
[E]You are making [F#]new wine
[B]In the soil I [G#m]now surrender
[E]You are breaking [F#]new ground

[B]So I yield to [G#m]You and to Your careful hand
[E]When I trust You [F#]I don't need to understand
[B]Make me Your [G#m]vessel
[E]Make me an [F#]offering
[B]Make me what[G#m]ever You want me to [E]be`,
    notes: "Hillsong Worship (performed by Bethel). Surrender anthem.",
    bpm: 68,
    tags: ["worship","surrender","transformation"],
  },
  {
    title: "Garden",
    artist: "Bethel Music",
    originalKey: "G",
    format: "chordpro",
    content: `[G]And I come to the [C]garden alone
[Em]While the dew is [D]still on the roses
[G]And the voice I [C]hear falling on my ear
[Em]The Son of God [D]discloses

[G]And He walks with [C]me and He talks with [Em]me
[D]And He tells me I am His [G]own
[G]And the joy we [C]share as we tarry [Em]there
[D]None other has ever [G]known`,
    notes: "Steffany Gretzinger reimagining of hymn. Intimate and unhurried.",
    bpm: 58,
    tags: ["worship","intimacy","hymn","classic"],
  },
  {
    title: "Starlight",
    artist: "Bethel Music",
    originalKey: "E",
    format: "chordpro",
    content: `[E]You call me out up[B]on the waters
[C#m]The great un[A]known where feet may fail
[E]When the stars light [B]up the heavens
[C#m]I hear You [A]calling out my name

[E]Starlight, star[B]light
[C#m]Your glory fills [A]the night
[E]And I will follow [B]You
[C#m]Beyond the star[A]light`,
    notes: "Amanda Cook. Ethereal, atmospheric. Great for night worship sets.",
    bpm: 70,
    tags: ["worship","wonder","creation"],
  },
  {
    title: "We Won't Be Quiet",
    artist: "Bethel Music",
    originalKey: "A",
    format: "chordpro",
    content: `[A]We won't be [E]quiet
[F#m]We won't be [D]still
[A]Our God is [E]mighty
[F#m]And worthy [D]still

[A]Every tongue will [E]shout it
[F#m]All creation [D]sings
[A]We won't be quiet [E]about our [D]King`,
    notes: "Sean Feucht. Prophetic declaration. High energy and bold.",
    bpm: 142,
    tags: ["worship","declaration","praise"],
  },
  {
    title: "Fierce",
    artist: "Bethel Music",
    originalKey: "B",
    format: "chordpro",
    content: `[B]Nothing can stop [E]Your fierce love
[G#m]Crashing over [F#]us
[B]Higher than the [E]highest wave
[G#m]Deeper than the [F#]deepest sea

[B]Your love is [E]fierce
[G#m]Your love is [F#]wild
[B]Your love is [E]fire
[G#m]Burning for [F#]us`,
    notes: "Jesus Culture / Bethel collab. Driving, passionate worship.",
    bpm: 134,
    tags: ["worship","love","passion"],
  },
  {
    title: "Living Hope",
    artist: "Bethel Music",
    originalKey: "C",
    format: "chordpro",
    content: `[C]How great the chasm that [Am]lay between us
[F]How high the mountain I [G]could not climb
[C]In desperation I [Am]turned to heaven
[F]And spoke Your name [G]into the night

[C]Then through the darkness Your [Am]loving kindness
[F]Tore through the shadows [G]of my soul
[C]The work is finished, the [Am]end is written
[F]Jesus Christ my [G]living hope

[C]Hallelujah, [Am]praise the One who set me free
[F]Hallelujah, [G]death has lost its grip on me
[C]You have broken every [Am]chain
[F]There's salvation in Your [G]name
[C]Jesus Christ my living [Am]hope`,
    notes: "Phil Wickham song, Bethel arrangement. Powerful Easter anthem.",
    bpm: 74,
    tags: ["worship","hope","resurrection"],
  },
  {
    title: "Already Here",
    artist: "Bethel Music",
    originalKey: "D",
    format: "chordpro",
    content: `[D]Before I call [A]You answer
[Bm]Before I speak [G]You know my name
[D]Where I go You've [A]already been
[Bm]You're already [G]here

[D]Already here, al[A]ready here
[Bm]In the middle of my [G]fear
[D]You are already [A]here`,
    notes: "Paul & Hannah McClure. Reassuring, intimate worship.",
    bpm: 68,
    tags: ["worship","presence","peace"],
  },
  {
    title: "Victory Is Yours",
    artist: "Bethel Music",
    originalKey: "E",
    format: "chordpro",
    content: `[E]Every battle [B]every war
[C#m]I know You've [A]already won
[E]So I will sing a [B]victory song
[C#m]The victory is [A]Yours

[E]Nothing stands a[B]gainst Your name
[C#m]Death and hell have [A]lost their claim
[E]Victory is [B]Yours
[C#m]Victory is [A]Yours`,
    notes: "Bethany Wohrle. Triumphant and bold. Drive from the downbeat.",
    bpm: 140,
    tags: ["worship","victory","declaration"],
  },
  {
    title: "Faithful",
    artist: "Bethel Music",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Faithful, [C]You are faithful
[Em]In the morning, [D]in the evening
[G]You are faithful [C]God
[Em]Through the valley, [D]to the mountain
[G]You are faithful [C]still

[G]I will hold on [C]to Your promise
[Em]For Your faithful[D]ness endures
[G]From beginning [C]to the end
[Em]You are [D]faithful`,
    notes: "Brian & Jenn Johnson. Testimony of God's faithfulness over the years.",
    bpm: 72,
    tags: ["worship","faithfulness","trust"],
  },
  {
    title: "You Came (Lazarus)",
    artist: "Bethel Music",
    originalKey: "A",
    format: "chordpro",
    content: `[A]When hope was buried [E]in the ground
[F#m]When death was all [D]that we could see
[A]You came and rolled [E]the stone away
[F#m]You came and set [D]the captives free

[A]You came, [E]You came
[F#m]Into the darkest [D]place
[A]You came, [E]You came
[F#m]With resurrection [D]grace`,
    notes: "Emmy Rose. Resurrection theme. Dramatic build throughout.",
    bpm: 76,
    tags: ["worship","resurrection","hope"],
  },
  {
    title: "Mention of Your Name",
    artist: "Bethel Music",
    originalKey: "D",
    format: "chordpro",
    content: `[D]At the mention of [A]Your name
[Bm]Every knee will [G]bow
[D]At the mention of [A]Your name
[Bm]The mountains fall [G]down

[D]There is power, [A]power
[Bm]In the name of [G]Jesus
[D]There is power, [A]power
[Bm]At the mention [G]of Your name`,
    notes: "Steffany Gretzinger. Name of Jesus focus. Build with authority.",
    bpm: 74,
    tags: ["worship","name of Jesus","power"],
  },
  {
    title: "You Don't Miss a Thing",
    artist: "Bethel Music",
    originalKey: "C",
    format: "chordpro",
    content: `[C]You don't miss a [G]thing
[Am]You catch every [F]tear
[C]When I'm overwhelmed [G]by the weight I carry
[Am]You don't miss a [F]thing

[C]Not a single [G]sparrow falls
[Am]Without Your [F]knowing
[C]You don't miss a [G]thing
[Am]You count the [F]stars and call them each by [C]name`,
    notes: "Amanda Cook. Comforting, pastoral. Great for prayer ministry.",
    bpm: 64,
    tags: ["worship","comfort","care"],
  },
  {
    title: "Bethel Medley: Ever Be / This Is Amazing Grace",
    artist: "Bethel Music",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Your love is [Em]holding me
[C]It never lets me [D]go
[G]And I will ever [Em]be
[C]Undone by [D]You

[G]Who breaks the [Em]power of sin and darkness
[C]Whose love is [D]mighty and so much stronger
[G]The King of [Em]Glory, the King above all kings
[C]This is amazing [D]grace
[G]This is amazing [Em]grace
[C]Who brings our [D]chaos back into [G]order`,
    notes: "Bethel medley arrangement. Flow between songs without pause.",
    bpm: 72,
    tags: ["worship","medley","grace"],
  },
  {
    title: "We Dance",
    artist: "Bethel Music",
    originalKey: "A",
    format: "chordpro",
    content: `[A]Spin me around [E]in circles
[F#m]Lead me into [D]love again
[A]There is joy in [E]Your presence
[F#m]And at Your right [D]hand

[A]We dance, [E]we dance
[F#m]In the river of [D]Your grace
[A]We dance, [E]we dance
[F#m]For You set the [D]captive free`,
    notes: "Steffany Gretzinger. Joyful, free-flowing worship moment.",
    bpm: 120,
    tags: ["worship","joy","freedom"],
  },
  {
    title: "Rest On Us",
    artist: "Bethel Music",
    originalKey: "D",
    format: "chordpro",
    content: `[D]Spirit of the [A]Living God
[Bm]Come fall afresh [G]on me
[D]Come wake me from [A]the dead
[Bm]Come lead me [G]to life again

[D]Holy Spirit [A]rest on us
[Bm]We wait for [G]You
[D]Holy Spirit [A]rest on us
[Bm]We long for [G]You`,
    notes: "Kalley & Josh Baldwin. Prayer for Holy Spirit. Soaking worship.",
    bpm: 60,
    tags: ["worship","holy spirit","prayer"],
  },
  {
    title: "Prepare the Way",
    artist: "Bethel Music",
    originalKey: "C",
    format: "chordpro",
    content: `[C]Prepare the way [G]of the Lord
[Am]Make straight a [F]path in the desert
[C]Every valley [G]lifted up
[Am]Every mountain [F]brought down low

[C]Prepare the [G]way
[Am]He is [F]coming
[C]Prepare the [G]way
[Am]The King is [F]here`,
    notes: "Sean Feucht / Bethel. Isaiah 40 theme. Prophetic worship feel.",
    bpm: 80,
    tags: ["worship","prophetic","preparation"],
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
