#!/usr/bin/env node
/**
 * Seed worship songs from smaller-catalog artists into Firestore.
 * Artists: Passion (3), Anne Wilson (3), Amanda Cook (3), Lauren Daigle (2), CityAlight (2), Cory Asbury (1), Leeland (1), Vertical Worship (1), Zach Williams (1), Sean Feucht (1), Various (Spanish) (1), Marcos Witt (1), Danilo Montero (1), David Crowder (1)
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/other-artists.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Glorious Day",
    artist: "Passion",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]I was buried beneath my [C]shame
[Em]Who could carry that [D]kind of weight
[G]It was my tomb, 'til [C]I met You

{Chorus}
[G]I was breathing but [C]wasn't alive
[Em]All my failures I [D]tried to hide
[G]It was my tomb, 'til [C]I met You

{Verse 2}
[G]You called my name and [C]I ran out of that grave
[Em]Out of the darkness [D]into the glorious day
[G]You called my name and [C]I ran out of that grave
[Em]Out of the darkness [D]into the glorious [G]day`,
    notes: "Celebration of new life. Energetic chorus, full band.",
    bpm: 76,
    tags: ["praise","resurrection","freedom"],
  },
  {
    title: "God You're So Good",
    artist: "Passion",
    originalKey: "B",
    format: "chordpro",
    content: `{Verse 1}
[B]Amazing, [G#m]so amazing, [E]how can it be
[F#]True that You'd love me

{Pre-Chorus}
[B]God You're so good, [G#m]God You're so good
[E]God You're so good, [F#]You're so good to me

{Pre-Chorus}
[B]Faithful, [G#m]so faithful, [E]is Your love for me
[F#]For all my days

{Pre-Chorus}
[B]Beautiful, [G#m]beautiful, [E]there is nothing that
[F#]Compares to You

{Verse 2}
[B]Healing, [G#m]forgiving, [E]Your love never ends
[F#]You are so good`,
    notes: "Simple chorus. Great for congregational worship.",
    bpm: 74,
    tags: ["worship","goodness","praise"],
  },
  {
    title: "Worthy of Your Name",
    artist: "Passion",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]No eye has seen and [E]no ear has heard
[F#m]The depths of Your [D]love, Lord
[A]No mind could fathom the [E]love that You showed
[F#m]When You left the [D]heavens

{Chorus}
[A]To break into our [E]darkness
[F#m]With the blazing light of [D]hope

{Verse 2}
[A]We're calling [E]worthy, worthy, [F#m]worthy
[D]Worthy of Your name
[A]You're worthy, [E]worthy, [F#m]worthy
[D]Worthy of Your name, [A]Jesus`,
    notes: "Bold declaration. Builds well with a worship team.",
    bpm: 70,
    tags: ["worship","worthy","declaration"],
  },
  {
    title: "My Jesus",
    artist: "Anne Wilson",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]Are you past the point of [G]weary
[Am]Is your burden weighing [F]heavy
[C]Is it all too much to [G]carry
[Am]Let me tell you bout my [F]Jesus

{Chorus}
[C]Do you feel that empty [G]feeling
[Am]Cause shame's done all its [F]stealing
[C]And you're desperate for some [G]healing
[Am]Let me tell you bout my [F]Jesus

{Verse 2}
[C]He makes a way where there [G]ain't no way
[Am]Rises up from an [F]empty grave
[C]Ain't no sinner that He [G]can't save
[Am]Let me tell you bout my [F]Jesus
[C]His love is strong and His [G]grace is free
[Am]And the good news is I [F]know that He
[C]Can do for you what He's [G]done for me
[Am]Let me tell you bout my [F]Je[C]sus`,
    notes: "Country-gospel crossover, heartfelt testimony",
    bpm: 84,
    tags: ["worship","testimony","country-gospel"],
  },
  {
    title: "Sunday Sermons",
    artist: "Anne Wilson",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Mama read me stories from the [D]Bible
[Em]Daddy's prayers before we [C]ate
[G]Grandma took us down to [D]Sunday school
[Em]That's where I learned a[C]bout grace

{Chorus}
[G]Guess I took for granted [D]growing up
[Em]What those Sunday [C]sermons gave
[G]Now I'm living proof that [D]Jesus saves
[Em]All because of Sunday [C]sermons

{Verse 2}
[G]Sunday sermons, [D]Sunday sermons
[Em]Seeds were planted, [C]prayers were answered
[G]Sunday sermons [D]changed my life
[Em]Sunday [C]sermons`,
    notes: "Nostalgic country worship, storytelling style",
    bpm: 88,
    tags: ["worship","testimony","country"],
  },
  {
    title: "Rain in the Rearview",
    artist: "Anne Wilson",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]Storm clouds breaking [E]over my shoulder
[F#m]Sun is coming [D]through
[A]Windshield's clearing [E]mile after mile
[F#m]I see the sky is [D]blue

{Chorus}
[A]I've got the rain in the [E]rearview
[F#m]Better days on the [D]horizon
[A]Everything that tried to [E]break me
[F#m]Made me more like [D]Jesus
[A]I've got the rain in the [E]rearview
[F#m]And the Son right [D]in front of me
[A]Rain in the [E]rearview
[F#m]Rain in the [D]rearview`,
    notes: "Hopeful country-pop, driving rhythm",
    bpm: 108,
    tags: ["worship","hope","country-pop"],
  },
  {
    title: "Shepherd",
    artist: "Amanda Cook",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]I don't want to be a [Em]hireling
[C]Running from the [D]wolves
[G]I want to be a [Em]shepherd
[C]With the heart of [D]You

{Chorus}
[G]You are the shepherd of my [Em]soul
[C]You lead me by still [D]waters
[G]You restore my soul [Em]again
[C]And guide me through the [D]valleys

{Verse 2}
[G]You're my Shepherd [Em]Lord
[C]I shall not [D]want
[G]You're my Shepherd [Em]Lord
[C]I shall not [D]want
[G]Goodness and mercy follow [Em]me
[C]All the days of [D]my life`,
    notes: "Psalm 23 inspired, intimate and personal",
    bpm: 70,
    tags: ["worship","psalm","intimate"],
  },
  {
    title: "Closer (Amanda Cook)",
    artist: "Amanda Cook",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]I will run to [A]You
[Bm]I will run to [G]You
[D]Turning from every[A]thing I've known
[Bm]Turning to everything [G]unseen

{Chorus}
[D]Oh closer, [A]closer
[Bm]My heart's desire is to [G]know You more
[D]Oh deeper, [A]deeper
[Bm]My soul cries out to be [G]close to You

{Verse 2}
[D]Your love has captured [A]me
[Bm]Your grace has set me [G]free
[D]Your life, the air I [A]breathe
[Bm]Be my every[G]thing`,
    notes: "Bethel worship moment, flowing and free",
    bpm: 72,
    tags: ["worship","intimate","devotional"],
  },
  {
    title: "You Make Me Brave (Amanda Cook)",
    artist: "Amanda Cook",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]You make me brave, [D]You make me brave
[Em]You call me out be[C]yond the shore into the waves
[G]You make me brave, [D]You make me brave
[Em]No fear can hinder [C]now the love that made a way

{Chorus}
[G]You are for me, [D]You are not against me
[Em]You are for me, [C]You are not against me
[G]Champion of [D]heaven You made a way for
[Em]All to enter [C]in

{Verse 2}
[G]I have heard You [D]calling my name
[Em]I have heard the [C]song of love that You sing
[G]So I will let You [D]draw me out beyond the shore
[Em]Into Your [C]grace`,
    notes: "Bethel anthem, Amanda Cook original version emphasis",
    bpm: 74,
    tags: ["worship","courage","anthem"],
  },
  {
    title: "You Say",
    artist: "Lauren Daigle",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]I keep fighting voices in my [F]mind that say I'm not enough
[Gm]Every single lie that tells me [Eb]I will never measure up
[Bb]Am I more than just the sum of [F]every high and every low
[Gm]Remind me once again just who I [Eb]am because I need to know

{Chorus}
[Bb]You say I am [F]loved when I can't feel a thing
[Gm]You say I am [Eb]strong when I think I am weak
[Bb]And You say I am [F]held when I am falling short
[Gm]And when I don't be[Eb]long, oh You say I am Yours
[Bb]And I believe, [F]oh I believe
[Gm]What You say of [Eb]me, I believe`,
    notes: "Identity anthem. Gentle but powerful. Piano-driven.",
    bpm: 120,
    tags: ["worship","identity","encouragement"],
  },
  {
    title: "Rescue",
    artist: "Lauren Daigle",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]You are not hidden, [F]there's never been a moment
[Gm]You were forgotten, [Eb]You are not hopeless
[Bb]Though you have been broken, [F]Your innocence stolen
[Gm]I hear you whisper under[Eb]neath your breath

{Chorus}
[Bb]I hear you whisper, [F]you have nothing left

{Verse 2}
[Bb]I will send out an [F]army to find you
[Gm]In the middle of the [Eb]darkest night, it's true
[Bb]I will rescue [F]you

{Bridge}
[Bb]There is no distance [F]that cannot be covered
[Gm]Over and over, [Eb]You're not defenseless
[Bb]I'll be Your shelter, [F]I'll be Your armor`,
    notes: "Comforting song. Good for moments of ministry.",
    bpm: 65,
    tags: ["worship","comfort","rescue"],
  },
  {
    title: "Yet Not I But Through Christ in Me",
    artist: "CityAlight",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]What gift of grace is [A]Jesus my redeemer
[Bm]There is no more for [G]heaven now to give
[D]He is my joy, my [A]righteousness and freedom
[Bm]My steadfast love, my [G]deep and boundless peace

{Chorus}
[D]To this I hold, my [A]hope is only Jesus
[Bm]For my life is [G]wholly bound to His
[D]Oh how strange and [A]divine, I can sing all is mine
[Bm]Yet not I, but through [G]Christ in [D]me

{Verse 2}
[D]The night is dark, but [A]I am not forsaken
[Bm]For by my side, the [G]Savior He will stay
[D]I labor on in [A]weakness and rejoicing
[Bm]For in my need, His [G]power is displayed`,
    notes: "Modern hymn. Beautiful theology. Congregational favorite.",
    bpm: 78,
    tags: ["hymn","worship","grace"],
  },
  {
    title: "Christ Is Mine Forevermore",
    artist: "CityAlight",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Mine are days that [D]God has numbered
[Em]I was made to [C]walk with Him
[G]Yet I look for [D]worldly treasure
[Em]And forsake the [C]King of kings

{Chorus}
[G]But mine is hope in [D]my Redeemer
[Em]Though I fall, His [C]love is sure
[G]For Christ has paid for [D]every failing
[Em]I am His for[C]evermore

{Verse 2}
[G]Mine are tears in [D]times of sorrow
[Em]Darkness not yet [C]understood
[G]Through the valley [D]I must travel
[Em]Where I see my [C]Father's good`,
    notes: "Hymn-style. Rich lyrics. Acoustic arrangement works beautifully.",
    bpm: 70,
    tags: ["hymn","assurance","worship"],
  },
  {
    title: "The Father's House",
    artist: "Cory Asbury",
    originalKey: "Ab",
    format: "chordpro",
    content: `{Verse 1}
[Ab]Sometimes on this journey I get [Eb]lost in my mistakes
[Fm]What looks to me like [Db]a dead end
Is just a new beginning

{Chorus}
[Ab]Fear is just a shadow but [Eb]it's nothing in the light
[Fm]I don't have to see the [Db]ending
As long as God is in it

{Verse 2}
[Ab]Lay down what I want and [Eb]find what I need
[Fm]There is freedom [Db]in surrender

{Chorus}
[Ab]Welcome home, [Eb]set a place at the table
[Fm]There's no darkness [Db]in the Father's house
[Ab]There's singing and [Eb]dancing
[Fm]I've come back to the [Db]Father's house`,
    notes: "Prodigal son theme. Joyful and welcoming. Capo 1 play G shapes.",
    bpm: 114,
    tags: ["worship","home","grace"],
  },
  {
    title: "Way Maker",
    artist: "Leeland",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]You are here, moving in our midst
[B]I worship You, I worship You
[C#m]You are here, working in this place
[A]I worship You, I worship You

{Chorus}
[E]Way maker, miracle worker
[B]Promise keeper, light in the darkness
[C#m]My God, that is who You are
[A]Way maker, miracle worker
[E]Promise keeper, light in the darkness
[B]My God, that is who You are

{Verse 2}
[E]You are here, touching every heart
[B]I worship You, I worship You
[C#m]You are here, healing every life
[A]I worship You, I worship You`,
    notes: "Originally by Sinach. One of the biggest worship songs worldwide.",
    bpm: 68,
    tags: ["worship","miracle","declaration"],
  },
  {
    title: "Yes I Will",
    artist: "Vertical Worship",
    originalKey: "Bb",
    format: "chordpro",
    content: `{Verse 1}
[Bb]I count on one thing
[F]The same God that never fails
[Gm]Will not fail me now
[Eb]You won't fail me now

{Chorus}
[Bb]In the waiting, the [F]same God who's never late
[Gm]Is working all things [Eb]out

{Verse 2}
[Bb]Yes I will, lift You [F]high in the lowest valley
[Gm]Yes I will, bless Your [Eb]name
[Bb]Yes I will, sing for [F]joy when my heart is heavy
[Gm]All my days, yes I [Eb]will

{Chorus}
[Bb]I choose to praise, to [F]give You my best in trial
[Gm]Through fire or rain, [Eb]yes I will`,
    notes: "Declaration of praise. Great for building faith.",
    bpm: 73,
    tags: ["worship","praise","faith"],
  },
  {
    title: "Chain Breaker",
    artist: "Zach Williams",
    originalKey: "Am",
    format: "chordpro",
    content: `{Verse 1}
[Am]If you've been walking the [F]same old road for [C]miles and miles
[Am]If you've been hearing the [F]same old voice tell the [C]same old lies
[Am]If you've been hoping for [F]something more from your [C]life
[Dm]If you've been reaching in the dark for [E]answers

{Chorus}
[Am]If you've got [F]pain, He's a [C]pain taker
[Am]If you feel [F]lost, He's a [C]way maker
[Am]If you need [F]freedom or [C]saving
[Dm]He's a prison-shaking [E]Savior
[Am]If you got [F]chains, He's a [C]chain breaker`,
    notes: "Powerful anthem of freedom. Southern rock worship feel.",
    bpm: 83,
    tags: ["praise","freedom","chains"],
  },
  {
    title: "Let Us Worship (No Weapon)",
    artist: "Sean Feucht",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]No weapon formed against me [Em]shall remain
[C]I'll rejoice, I'll be [D]glad in the day that the Lord has made
[G]I won't live by what I [Em]see
[C]I'll not be moved by [D]the waves

{Chorus}
[G]There's a war and I know it
[Em]There's a fight and I'll face it
[C]But I've got a word from the [D]Lord
[G]So I'll stand on every [Em]promise He has spoken
[C]'Cause I know that my [D]God doesn't lie

{Verse 2}
[G]Let us worship, [Em]let us worship
[C]Let us worship, [D]let us worship`,
    notes: "Outdoor worship energy. Bold and declarative.",
    bpm: 130,
    tags: ["praise","warfare","declaration"],
  },
  {
    title: "Way Maker (Spanish Influence)",
    artist: "Various (Spanish)",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]You are here, moving in our [B]midst
[C#m]I worship You, I worship [A]You
[E]You are here, working in this [B]place
[C#m]I worship You, I worship [A]You

{Chorus}
[E]Abres camino [B]donde no lo hay
[C#m]Haces milagros [A]nada imposible
[E]Way maker, miracle [B]worker
[C#m]Promise keeper, light in the [A]darkness
[E]Mi Dios [B]así eres Tú
[C#m]Así eres [A]Tú`,
    notes: "Bilingual arrangement, seamless English-Spanish transitions",
    bpm: 68,
    tags: ["worship","bilingual","spanish"],
  },
  {
    title: "Tu Fidelidad",
    artist: "Marcos Witt",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Tu fidelidad es [D]grande
[Em]Tu fidelidad in[C]comparable es
[G]Nadie como Tú ben[D]dito Dios
[Em]Grande es Tu fideli[C]dad

{Chorus}
[G]No hay nadie como [D]Tú
[Em]No hay nadie como [C]Tú
[G]Mi corazón se [D]rinde ante Ti
[Em]Señor Tu amor es [C]fiel

{Verse 2}
[G]Tu fidelidad es [D]grande
[Em]Es grande Dios [C]para mí
[G]Tu fidelidad [D]oh Señor
[Em]Es grande Tu fideli[C]dad`,
    notes: "Classic Spanish worship, Marcos Witt arrangement",
    bpm: 78,
    tags: ["worship","spanish","faithfulness"],
  },
  {
    title: "Abre Mis Ojos",
    artist: "Danilo Montero",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]Abre mis ojos oh [A]Cristo
[Bm]Abre mis ojos Te [G]pido
[D]Yo quiero [A]verte
[Bm]Yo quiero [G]verte

{Chorus}
[D]Abre mis ojos oh [A]Cristo
[Bm]Abre mis ojos Te [G]pido
[D]Yo quiero [A]verte
[Bm]Yo quiero [G]verte

{Verse 2}
[G]En alto y levant[A]ado
[Bm]Brillando en la [G]luz de Tu gloria
[D]Derrama Tu [A]poder y Tu amor
[Bm]Mientras cant[G]amos santo santo [D]santo`,
    notes: "Spanish version of Open the Eyes of My Heart, Danilo Montero",
    bpm: 104,
    tags: ["worship","spanish","prayer"],
  },
  {
    title: "My Victory (Crowder)",
    artist: "David Crowder",
    originalKey: "E",
    format: "chordpro",
    content: `{Verse 1}
[E]You came for criminals [B]and every Pharisee
[C#m]You came for hypocrites [A]even one like me
[E]You carried the cross up [B]Calvary
[C#m]You carried me, [A]You carried me

{Chorus}
[E]This is my victory, [B]Jesus conquered the grave
[C#m]This is my victory, [A]Jesus conquered the grave
[E]This is my victory [B]now and forever
[C#m]My God has made a [A]way
[E]My victory [B]my victory
[C#m]Oh Your [A]victory`,
    notes: "David Crowder solo era, powerful Easter anthem",
    bpm: 130,
    tags: ["worship","victory","easter"],
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
