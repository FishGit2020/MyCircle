#!/usr/bin/env node
/**
 * Seed Brooke Ligertwood worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/brooke-ligertwood.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Nicea (Holy, Holy, Holy)",
    artist: "Brooke Ligertwood",
    originalKey: "C",
    format: "chordpro",
    content: `[C]Holy, holy, [F]holy, [C]Lord God Al[G]mighty
[Am]Early in the [F]morning our [C]song shall rise to [G]Thee
[C]Holy, holy, [F]holy, [C]merciful and [G]mighty
[F]God in three [C]persons, [G]blessed Trini[C]ty

[C]Holy, holy, [F]holy, [C]all the saints a[G]dore Thee
[Am]Casting down their [F]golden crowns a[C]round the glassy [G]sea
[C]Cherubim and [F]seraphim [C]falling down be[G]fore Thee
[F]Which wert and [C]art and [G]evermore shalt [C]be

[Am]You are [F]holy, there is [G]no one like You
[Am]You are [F]holy, there is [G]no one be[C]side You`,
    notes: "Modern arrangement of the classic hymn. Beautiful and reverent.",
    bpm: 66,
    tags: ["hymn","holiness","worship"],
  },
  {
    title: "A Thousand Hallelujahs",
    artist: "Brooke Ligertwood",
    originalKey: "A",
    format: "chordpro",
    content: `[A]Who else would rocks cry [E]out to worship
[F#m]Whose glory taught the [D]stars to shine
[A]Perhaps creation [E]longs to have the
[F#m]Words to truly prai[D]se You rightly

[A]A thousand halle[E]lujahs
[F#m]And a thousand [D]more
[A]A thousand halle[E]lujahs
[F#m]Is not enough for [D]You Lord

[A]Who else would die for [E]our redemption
[F#m]Whose resurrection [D]means I'm free
[A]So all creation [E]shouts together
[F#m]A thousand halle[D]lujahs and a thousand [A]more`,
    notes: "Majestic and sweeping, builds to a huge ending",
    bpm: 76,
    tags: ["worship","praise","majesty"],
  },
  {
    title: "Honey in the Rock",
    artist: "Brooke Ligertwood",
    originalKey: "F",
    format: "chordpro",
    content: `[F]Oh God of Abraham [C]God of covenant
[Dm]And faithful promises [Bb]time and time again
[F]You have proven [C]You'll do just what You said

[F]There's honey in the [C]rock
[Dm]Living water, bread of [Bb]heaven
[F]Fed by a hand that [C]won't let go and won't forget you
[Dm]Oh there's honey in the [Bb]rock

[F]There ain't no lack with [C]Jesus
[Dm]There ain't no loss with [Bb]God
[F]At the banqueting [C]table
[Dm]Sit down beside [Bb]the Lord`,
    notes: "With Brandon Lake, gospel-influenced groove",
    bpm: 105,
    tags: ["worship","provision","gospel"],
  },
  {
    title: "None but Jesus",
    artist: "Brooke Ligertwood",
    originalKey: "G",
    format: "chordpro",
    content: `[G]In the quiet, [D]in the stillness
[Em]I know that [C]You are God
[G]In the secret [D]of Your presence
[Em]I know there I [C]am restored

[G]When You call I won't re[D]fuse
[Em]Each new day again I'll [C]choose

[G]There is no one [D]else for me
[Em]None but Jesus [C]
[G]Crucified to [D]set me free
[Em]Now I live to [C]bring Him praise

[G]In the chaos, [D]in confusion
[Em]I know You're [C]sovereign still
[G]In the moment [D]of my weakness
[Em]You give me [C]grace to do Your will`,
    notes: "Brooke Fraser original, contemplative and pure",
    bpm: 74,
    tags: ["worship","devotional","surrender"],
  },
  {
    title: "Communion",
    artist: "Brooke Ligertwood",
    originalKey: "Eb",
    format: "chordpro",
    content: `[Eb]This is the body [Bb]broken for you
[Cm]This is the blood [Ab]shed for you
[Eb]In remembrance [Bb]of everything
[Cm]You have [Ab]done

[Eb]At this table [Bb]I remember
[Cm]Grace so free and [Ab]love so tender
[Eb]Broken bread and [Bb]crimson [Ab]cup`,
    notes: "Communion service song. Reverent and unhurried.",
    bpm: 60,
    tags: ["worship","communion","remembrance"],
  },
  {
    title: "Desert Song",
    artist: "Brooke Ligertwood",
    originalKey: "Bb",
    format: "chordpro",
    content: `[Bb]This is my prayer in the [F]desert
[Gm]When all that's within me feels [Eb]dry
[Bb]This is my prayer in my [F]hunger and need
[Gm]My God is the God who pro[Eb]vides

[Bb]I will bring praise, I will [F]bring praise
[Gm]No weapon formed against me shall re[Eb]main
[Bb]I will re[F]joice, I will de[Gm]clare
[Eb]God is my victory and He is [Bb]here`,
    notes: "Hillsong classic by Brooke. Build from desert to victory.",
    bpm: 70,
    tags: ["worship","perseverance","seasons"],
  },
  {
    title: "All Who Are Thirsty",
    artist: "Brooke Ligertwood",
    originalKey: "D",
    format: "chordpro",
    content: `[D]All who are [A]thirsty
[Bm]All who are [G]weak
[D]Come to the [A]fountain
[Bm]Dip your heart in the [G]stream of life

[D]Let the pain and the [A]sorrow
[Bm]Be washed [G]away
[D]In the waves of His [A]mercy
[Bm]As deep cries out to [G]deep`,
    notes: "Brenton Brown / early Brooke Fraser era. Flowing dynamics.",
    bpm: 68,
    tags: ["worship","thirst","refreshing"],
  },
  {
    title: "Hosanna (Brooke)",
    artist: "Brooke Ligertwood",
    originalKey: "Eb",
    format: "chordpro",
    content: `[Eb]I see the King of [Bb]Glory
[Cm]Coming on the clouds with [Ab]fire
[Eb]The whole earth [Bb]shakes
[Cm]The whole earth [Ab]shakes

[Eb]Hosanna, Ho[Bb]sanna
[Cm]Hosanna in the [Ab]highest
[Eb]Hosanna, Ho[Bb]sanna
[Cm]Hosanna in the [Ab]highest`,
    notes: "Hillsong United classic. Brooke wrote it. Powerful anthem.",
    bpm: 74,
    tags: ["worship","praise","anthem"],
  },
  {
    title: "What a Savior",
    artist: "Brooke Ligertwood",
    originalKey: "A",
    format: "chordpro",
    content: `[A]What a Savior, what a [E]Friend
[F#m]What a glorious [D]mystery
[A]That the God of this whole [E]earth
[F#m]Would come to rescue [D]me

[A]He left His throne a[E]bove
[F#m]Emptied Himself of [D]all but love
[A]What a Savior [E]He [D]is`,
    notes: "Hymn-influenced. Clean arrangement, vocal-focused.",
    bpm: 66,
    tags: ["worship","savior","hymn"],
  },
  {
    title: "Hear Our Prayer",
    artist: "Brooke Ligertwood",
    originalKey: "C",
    format: "chordpro",
    content: `[C]Hear our prayer, [G]hear our cry
[Am]From the depths we [F]call to You
[C]Hear our prayer, [G]Lord tonight
[Am]We are [F]desperate for You

[C]Come and fill this [G]place
[Am]Let Your glory [F]fall
[C]Hear our [G]prayer [F]Lord`,
    notes: "Corporate prayer song. Builds in desperation and hope.",
    bpm: 64,
    tags: ["worship","prayer","corporate"],
  },
  {
    title: "Closer Than You Know",
    artist: "Brooke Ligertwood",
    originalKey: "G",
    format: "chordpro",
    content: `[G]You are closer than You [D]know
[Em]Closer than the [C]air I breathe
[G]Before I even [D]call Your name
[Em]You are [C]here

[G]Ever present [D]help in trouble
[Em]You are closer than I [C]know
[G]Nearer than my [D]next heart[C]beat`,
    notes: "Psalm 46:1 theme. Reassuring, intimate worship.",
    bpm: 66,
    tags: ["worship","nearness","comfort"],
  },
  {
    title: "The Passion",
    artist: "Brooke Ligertwood",
    originalKey: "Ab",
    format: "chordpro",
    content: `[Ab]My Jesus, my [Eb]Savior
[Fm]You suffered and [Db]died on a tree
[Ab]The nails in Your [Eb]hands
[Fm]The thorns on Your [Db]brow

[Ab]What love could be [Eb]greater
[Fm]What sacrifice [Db]deeper
[Ab]The passion of [Eb]Christ for [Db]me`,
    notes: "Good Friday / Passion Week song. Solemn and beautiful.",
    bpm: 58,
    tags: ["worship","cross","passion"],
  },
  {
    title: "Psalm 23 (Brooke)",
    artist: "Brooke Ligertwood",
    originalKey: "D",
    format: "chordpro",
    content: `[D]The Lord is my [A]Shepherd
[Bm]I shall not [G]want
[D]He makes me lie [A]down
[Bm]In green [G]pastures

[D]He leads me be[A]side still waters
[Bm]He restores my [G]soul
[D]Surely goodness and [A]mercy
[Bm]Shall follow [G]me`,
    notes: "Direct scripture setting. Gentle, pastoral arrangement.",
    bpm: 62,
    tags: ["worship","psalm","peace"],
  },
  {
    title: "Mercy",
    artist: "Brooke Ligertwood",
    originalKey: "Bb",
    format: "chordpro",
    content: `[Bb]Mercy, mercy [F]Lord
[Gm]Falling on my [Eb]knees
[Bb]Mercy, mercy [F]Lord
[Gm]It's Your mercy [Eb]I need

[Bb]Like a flood You [F]come
[Gm]Washing over [Eb]me
[Bb]Your mercy is e[F]nough for [Eb]me`,
    notes: "Soaking in mercy. Let each phrase land with weight.",
    bpm: 60,
    tags: ["worship","mercy","grace"],
  },
  {
    title: "Grace That Won't Let Go",
    artist: "Brooke Ligertwood",
    originalKey: "E",
    format: "chordpro",
    content: `[E]Amazing grace that [B]won't let go
[C#m]Holding me through [A]every storm
[E]When I'm weak Your [B]love is strong
[C#m]Grace that won't let [A]go

[E]You pursue me [B]to the end
[C#m]Nothing separates me [A]from Your love
[E]Grace that won't let [B]go [A]`,
    notes: "Romans 8:38-39 theme. Warm, assured delivery.",
    bpm: 68,
    tags: ["worship","grace","assurance"],
  },
  {
    title: "A Holy Moment",
    artist: "Brooke Ligertwood",
    originalKey: "G",
    format: "chordpro",
    content: `[G]This is a holy [D]moment
[Em]Heaven touching [C]earth
[G]The veil is thin and [D]we are standing
[Em]On holy [C]ground

[G]We take off our [D]shoes
[Em]We bow our [C]hearts
[G]This is a holy [D]moment [C]Lord`,
    notes: "Exodus 3:5 inspired. Hushed, reverent start.",
    bpm: 56,
    tags: ["worship","holiness","reverence"],
  },
  {
    title: "Weight of Your Glory",
    artist: "Brooke Ligertwood",
    originalKey: "A",
    format: "chordpro",
    content: `[A]The weight of Your [E]glory
[F#m]Is more than my [D]heart can hold
[A]Fall on us like [E]rain
[F#m]Like fire from [D]heaven

[A]We want to see Your [E]glory
[F#m]The weight of Your pre[D]sence here
[A]Glory of the [E]Lord [D]`,
    notes: "Experiential worship. Room for spontaneous vocals.",
    bpm: 66,
    tags: ["worship","glory","presence"],
  },
  {
    title: "Born Again (Brooke)",
    artist: "Brooke Ligertwood",
    originalKey: "C",
    format: "chordpro",
    content: `[C]Born again, [G]born again
[Am]Something comes a[F]live within
[C]Born again by the [G]Spirit of God
[Am]New creation, [F]old has gone

[C]From above a [G]second birth
[Am]Water and the [F]Spirit's work
[C]Born again, [G]born a[F]gain`,
    notes: "John 3:3-5. Joyful, new-life energy.",
    bpm: 124,
    tags: ["worship","salvation","new life"],
  },
  {
    title: "New Creation",
    artist: "Brooke Ligertwood",
    originalKey: "D",
    format: "chordpro",
    content: `[D]I am a new cre[A]ation
[Bm]The old has passed a[G]way
[D]Behold the new has [A]come
[Bm]I am alive in [G]You today

[D]No more condem[A]nation
[Bm]No more guilt or [G]shame
[D]I am a new cre[A]ation in [G]Christ`,
    notes: "2 Corinthians 5:17. Declaration of identity in Christ.",
    bpm: 72,
    tags: ["worship","identity","new creation"],
  },
  {
    title: "Defender of the Weak",
    artist: "Brooke Ligertwood",
    originalKey: "G",
    format: "chordpro",
    content: `[G]You are the defender [D]of the weak
[Em]Champion of the [C]broken-hearted
[G]You lift the lowly [D]from the dust
[Em]And seat them with the [C]princes

[G]Defender of the [D]weak
[Em]Father to the [C]fatherless
[G]You fight for [D]me [C]Lord`,
    notes: "Psalm 68:5 theme. Strength in tenderness.",
    bpm: 68,
    tags: ["worship","justice","defender"],
  },
  {
    title: "Still I Will Praise",
    artist: "Brooke Ligertwood",
    originalKey: "A",
    format: "chordpro",
    content: `[A]When the night is [E]long
[F#m]And the answers don't [D]come
[A]Still I will praise, [E]still I will praise
[F#m]When the tears won't [D]stop

[A]Still I will [E]praise You Lord
[F#m]Still I will [D]praise
[A]My heart will choose to [E]worship
[F#m]In the valley and the [D]mountain [A]top`,
    notes: "Habakkuk 3:17-18 inspired. Worship through suffering.",
    bpm: 66,
    tags: ["worship","perseverance","faith"],
  },
  {
    title: "Rejoice (Brooke)",
    artist: "Brooke Ligertwood",
    originalKey: "D",
    format: "chordpro",
    content: `[D]Rejoice in the [A]Lord always
[Bm]Again I say re[G]joice
[D]Let your gentle spirit [A]be known to everyone
[Bm]The Lord is [G]near

[D]Rejoice, re[A]joice
[Bm]Let all the earth re[G]joice
[D]He has done great [A]things [G]`,
    notes: "Philippians 4:4-5. Bright and joyful declaration.",
    bpm: 120,
    tags: ["worship","joy","declaration"],
  },
  {
    title: "Open Arms (Brooke)",
    artist: "Brooke Ligertwood",
    originalKey: "C",
    format: "chordpro",
    content: `[C]With open arms You [G]welcome me
[Am]No shame, no fear, just [F]grace
[C]Into the place where [G]I belong
[Am]Held in Your em[F]brace

[C]Open arms, [G]open heart
[Am]You receive me [F]as I am
[C]Nothing can separate me [G]from Your [F]love`,
    notes: "Prodigal son imagery. Warm and welcoming.",
    bpm: 64,
    tags: ["worship","grace","acceptance"],
  },
  {
    title: "What a Beautiful Name (Brooke Solo)",
    artist: "Brooke Ligertwood",
    originalKey: "D",
    format: "chordpro",
    content: `[D]You were the Word at the [A]beginning
[Bm]One with God the Lord Most [G]High
[D]Your hidden glory in cre[A]ation
[Bm]Now revealed in [G]You our Christ

[D]What a beautiful [A]Name it is
[Bm]What a beautiful [G]Name it is
[D]The Name of [A]Jesus Christ my [Bm]King
[G]What a beautiful [D]Name it is
[A]Nothing compares to [Bm]this
[G]What a beautiful [D]Name it is
The Name of [A]Jesus [D]`,
    notes: "Brooke solo arrangement of the Hillsong anthem. Stripped-back and intimate.",
    bpm: 68,
    tags: ["worship","name","Jesus"],
  },
  {
    title: "Where My Heart Belongs",
    artist: "Brooke Ligertwood",
    originalKey: "E",
    format: "chordpro",
    content: `[E]This is where my [B]heart belongs
[C#m]Right here in Your [A]presence Lord
[E]Nowhere else I'd [B]rather be
[C#m]Than at Your [A]feet

[E]Where my heart be[B]longs
[C#m]Is where You [A]are
[E]You are my [B]home [A]`,
    notes: "Psalm 84:10 theme. Simple devotion.",
    bpm: 62,
    tags: ["worship","devotion","home"],
  },
  {
    title: "Trust (Brooke)",
    artist: "Brooke Ligertwood",
    originalKey: "G",
    format: "chordpro",
    content: `[G]I will trust in [D]You alone
[Em]When the path is un[C]certain
[G]I will trust Your [D]sovereign hand
[Em]Over every sea[C]son

[G]Trust, I put my [D]trust in You
[Em]Hope, my hope is [C]found in You
[G]Lord of all I [D]trust in [C]You`,
    notes: "Proverbs 3:5-6. Quiet confidence in God's plan.",
    bpm: 66,
    tags: ["worship","trust","faith"],
  },
  {
    title: "Abide in Me",
    artist: "Brooke Ligertwood",
    originalKey: "F",
    format: "chordpro",
    content: `[F]Abide in me as [C]I abide in You
[Dm]Let Your Word make [Bb]home in me
[F]Apart from You I [C]can do nothing
[Dm]You're the vine and [Bb]I'm the branch

[F]Abide in [C]me
[Dm]Let Your rivers of [Bb]living water flow
[F]Abide in [C]me [Bb]Lord`,
    notes: "John 15:4-5. Contemplative and prayerful.",
    bpm: 58,
    tags: ["worship","abiding","intimacy"],
  },
  {
    title: "Morning Star",
    artist: "Brooke Ligertwood",
    originalKey: "A",
    format: "chordpro",
    content: `[A]Bright Morning [E]Star
[F#m]Your light breaks through the [D]darkness
[A]Hope of the [E]world
[F#m]You shine for all to [D]see

[A]Jesus, bright Morning [E]Star
[F#m]Rising with healing [D]in Your wings
[A]Dawn of redemption's [E]day [D]`,
    notes: "Revelation 22:16. Dawn imagery worship. Hopeful.",
    bpm: 70,
    tags: ["worship","hope","light"],
  },
  {
    title: "Lead Me On (Brooke)",
    artist: "Brooke Ligertwood",
    originalKey: "Bb",
    format: "chordpro",
    content: `[Bb]Lead me on, [F]lead me on
[Gm]Through the valley and the [Eb]shadow
[Bb]Lead me on, [F]lead me on
[Gm]I will follow where You [Eb]go

[Bb]Your rod and staff they [F]comfort me
[Gm]You prepare a [Eb]table
[Bb]Lead me on [F]Lord [Eb]lead me on`,
    notes: "Psalm 23:4 journey song. Trusting guidance.",
    bpm: 64,
    tags: ["worship","guidance","trust"],
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
