#!/usr/bin/env node
/**
 * Seed Jeremy Riddle worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/jeremy-riddle.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Furious",
    artist: "Jeremy Riddle",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Nothing can stop Your [Em]love for me
[C]You delight in [D]showing mercy
[G]Nothing will ever [Em]take Your place
[C]You've been faithful [D]from the start

[G]His love is [Em]furious, His love is [C]furious
[D]His love is furious for [G]me
[G]His love is [Em]deep, His love is [C]wide
[D]And it covers us
[G]His love is [Em]fierce, His love is [C]strong
[D]It is furious`,
    notes: "Passionate declaration of God's fierce love. Medium build.",
    bpm: 80,
    tags: ["worship","love","passion"],
  },
  {
    title: "Fall Afresh",
    artist: "Jeremy Riddle",
    originalKey: "E",
    format: "chordpro",
    content: `[E]Awaken my soul, come [B]awake
[C#m]To hunger, to [A]seek, to thirst
[E]Awaken first love, come [B]alive
[C#m]And do as You [A]please

[E]Spirit of the living [B]God come fall afresh on me
[C#m]Come wake me from my [A]sleep
[E]Blow through the caverns [B]of my soul
[C#m]Pour in me to [A]overflow
[E]To over[B]flow`,
    notes: "Intimate prayer song. Let it breathe. Acoustic-led.",
    bpm: 66,
    tags: ["worship","prayer","Holy Spirit"],
  },
  {
    title: "Sweetly Broken",
    artist: "Jeremy Riddle",
    originalKey: "G",
    format: "chordpro",
    content: `[G]To the cross I [D]look, to the cross I [Em]cling
[C]Of its suffering [D]I do drink
[G]Of its work I [D]do sing
[Em]On it my Savior, [C]both bruised and [D]crushed
[G]Showed that God is [D]love
[Em]And God is [C]just

[G]At the cross You [D]beckon me
[Em]You draw me [C]gently to my [D]knees and I am
[G]Lost for words, so [D]lost in love
[Em]I'm sweetly [C]broken, wholly [D]surrendered

[G]What a priceless [D]gift, undeserved [Em]life
[C]Have I been [D]given
[G]Through Christ [D]crucified`,
    notes: "Communion song. Tender and reverent. Acoustic guitar focus.",
    bpm: 70,
    tags: ["worship","communion","cross"],
  },
  {
    title: "This Is Our God",
    artist: "Jeremy Riddle",
    originalKey: "D",
    format: "chordpro",
    content: `[D]Your grace is enough, [A]more than enough for me
[Bm]Your grace is enough, [G]more than enough
[D]Your name is a strong and [A]mighty tower
[Bm]Your name is a shelter [G]like no other

[D]This is our [A]God
[Bm]This is who [G]He is, He loves us
[D]This is our [A]God
[Bm]This is what [G]He does, He saves us

[D]He bore the cross, [A]laid down His life
[Bm]So we could have [G]life
[D]Hope is alive, [A]death is defeated
[Bm]Our God is [G]risen`,
    notes: "Declaration song. Build through the chorus.",
    bpm: 76,
    tags: ["praise","declaration","grace"],
  },
  {
    title: "Christ Is Risen",
    artist: "Jeremy Riddle",
    originalKey: "A",
    format: "chordpro",
    content: `[A]Let no one caught in sin re[E]main
[F#m]Inside the lie of in[D]ward shame
[A]But fix our eyes up[E]on the cross
[F#m]And run to Him who [D]showed great love

[A]Christ is risen [E]from the dead
[F#m]Trampling over death by [D]death
[A]Come awake, come [E]awake
[F#m]Come and rise up [D]from the grave

[A]O death, where is your [E]sting?
[F#m]O hell, where is your [D]triumph?
[A]The grave has been [E]swallowed up by life
[F#m]The world will know that [D]Christ is risen`,
    notes: "Easter anthem. Triumphant and bold. Full band.",
    bpm: 130,
    tags: ["praise","resurrection","Easter"],
  },
  {
    title: "Healer",
    artist: "Jeremy Riddle",
    originalKey: "D",
    format: "chordpro",
    content: `[D]You hold my every [A]moment
[Bm]You calm my raging [G]seas
[D]You walk with me through [A]fire
[Bm]And heal all my [G]disease

[D]I trust in You, [A]I trust in You
[Bm]I believe You're my [G]healer
[D]I believe You are [A]all I need
[Bm]I believe You're my [G]healer
[D]I believe [A]

[D]Nothing is im[A]possible for You
[Bm]Nothing is im[G]possible for You
[D]Nothing is im[A]possible for You
[Bm]You hold my [G]world in Your hands`,
    notes: "Healing prayer moment. Tender but confident.",
    bpm: 68,
    tags: ["worship","healing","faith"],
  },
  {
    title: "More",
    artist: "Jeremy Riddle",
    originalKey: "G",
    format: "chordpro",
    content: `[G]I want to know You [D]more
[Em]I want to know You [C]more
[G]Not just a Sunday [D]song
[Em]Not just getting [C]along

[G]Spirit of God, [D]come fill this place
[Em]More of Your [C]glory, more of Your grace
[G]I want to see You [D]face to face
[Em]More, Lord, [C]more

[G]More than a feeling, [D]more than emotion
[Em]More than religion, [C]more than devotion
[G]I want the real [D]thing
[Em]More of [C]You`,
    notes: "Hunger for more of God. Simple and heartfelt.",
    bpm: 72,
    tags: ["worship","hunger","prayer"],
  },
  {
    title: "Prepare the Way",
    artist: "Jeremy Riddle",
    originalKey: "Em",
    format: "chordpro",
    content: `[Em]You have called us [C]out of darkness
[G]Into Your mar[D]velous light
[Em]We are Your people, [C]Your possession
[G]Set apart to [D]worship You

[Em]Prepare the [C]way, prepare the [G]way
[D]Prepare the way of the [Em]Lord
[C]Make straight the [G]paths
[D]Here in our hearts

[Em]Let every valley [C]be lifted up
[G]Let every mountain [D]be made low
[Em]Let every crooked [C]path be made straight
[G]For the glory of the [D]Lord`,
    notes: "Based on Isaiah 40. Prophetic worship moment.",
    bpm: 82,
    tags: ["worship","prophetic","preparation"],
  },
  {
    title: "Show Me Your Face",
    artist: "Jeremy Riddle",
    originalKey: "A",
    format: "chordpro",
    content: `[A]Open up the [E]heavens
[F#m]We want to see [D]You
[A]Open up the [E]floodgates
[F#m]A mighty [D]river

[A]Show me Your [E]face, Lord
[F#m]I need to see [D]You
[A]Show me Your [E]glory
[F#m]Nothing else will [D]do

[A]There's no one like [E]You, God
[F#m]No one even [D]comes close
[A]There's no one like [E]You, God
[F#m]You are worthy of it [D]all`,
    notes: "Seeking God's presence. Extended worship moment.",
    bpm: 70,
    tags: ["worship","presence","intimacy"],
  },
  {
    title: "You Are Good",
    artist: "Jeremy Riddle",
    originalKey: "G",
    format: "chordpro",
    content: `[G]I will give thanks to [Em]You, O Lord
[C]Among the peoples, [D]I will sing praises
[G]For Your steadfast [Em]love is great
[C]Above the heavens, [D]Your faithfulness
[G]Reaches to the [D]clouds

[G]You are [C]good, [D]You are [Em]good
[G]And Your [C]mercy endures for[D]ever
[G]You are [C]good, [D]You are [Em]good
[G]And Your [C]mercy endures for[D]ever

[G]Lord, You're good to [Em]me
[C]Better than I de[D]serve
[G]Lord, You're good to [Em]me
[C]Forever and [D]ever`,
    notes: "Joyful declaration of goodness. Great for praise sets.",
    bpm: 120,
    tags: ["praise","goodness","thanksgiving"],
  },
  {
    title: "Kingdom Come",
    artist: "Jeremy Riddle",
    originalKey: "C",
    format: "chordpro",
    content: `[C]Let Your kingdom [G]come
[Am]Let Your will be [F]done
[C]Here on earth as [G]it is in heaven
[Am]Every day we [F]live

[C]Bring Your [G]heaven down
[Am]Fill this [F]thirsty ground
[C]Let Your Spirit [G]come like a river
[Am]Let Your Spirit [F]come

[C]We pray, [G]kingdom come
[Am]We pray, [F]kingdom come
[C]In this [G]city, in this [Am]nation
[F]Let Your kingdom come`,
    notes: "Kingdom prayer. Simple, powerful, congregational.",
    bpm: 76,
    tags: ["worship","prayer","kingdom"],
  },
  {
    title: "Worthy",
    artist: "Jeremy Riddle",
    originalKey: "D",
    format: "chordpro",
    content: `[D]Holy, holy, [A]Lord God Almighty
[Bm]Who was and is and [G]is to come
[D]With all creation I [A]sing
[Bm]Praise to the [G]King of kings
[D]You are my [A]everything
[Bm]And I will a[G]dore You

[D]Worthy is the [A]Lamb who was slain
[Bm]Worthy is the [G]King who conquered the grave
[D]Worthy is the [A]Lamb who was slain
[Bm]Worthy, [G]worthy, worthy

[D]Crown Him with many [A]crowns
[Bm]The Lamb upon [G]His throne`,
    notes: "Heavenly worship. Rev 4-5 inspired. Majestic.",
    bpm: 72,
    tags: ["worship","worthy","revelation"],
  },
  {
    title: "Send Me",
    artist: "Jeremy Riddle",
    originalKey: "E",
    format: "chordpro",
    content: `[E]Here I am, [B]Lord, send me
[C#m]I will go where [A]You lead
[E]Here I am, [B]set apart
[C#m]Break my heart for what breaks [A]Yours

[E]Send me to the [B]nations
[C#m]Send me to the [A]lost
[E]Send me to the [B]broken
[C#m]I will pay the [A]cost

[E]I'll go where You [B]send me
[C#m]I'll do what You [A]ask
[E]Not my will but [B]Yours be done
[C#m]Here I am, [A]send me`,
    notes: "Commissioning song. Based on Isaiah 6. Missions focus.",
    bpm: 78,
    tags: ["worship","missions","surrender"],
  },
  {
    title: "Breath of God",
    artist: "Jeremy Riddle",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Come, breath of [D]God
[Em]Come and breathe up[C]on this place
[G]Come, breath of [D]God
[Em]Come restore and [C]recreate

[G]Fill our lungs with [D]heaven's air
[Em]Revive us, Lord, we [C]need You here
[G]Blow through these [D]dry and weary bones
[Em]Breath of God, [C]breath of God

[G]We need You like the [D]desert needs the rain
[Em]We need You like the [C]darkness needs the flame
[G]Breathe on us, [D]breathe on us
[Em]Breath of [C]God`,
    notes: "Prayer for revival. Based on Ezekiel 37. Gentle build.",
    bpm: 66,
    tags: ["worship","revival","Holy Spirit"],
  },
  {
    title: "The Anthem",
    artist: "Jeremy Riddle",
    originalKey: "A",
    format: "chordpro",
    content: `[A]I can hear the [E]sound of a mighty rushing wind
[F#m]I can feel the [D]fire fall
[A]Heaven's door is [E]opening wide
[F#m]Let the King of [D]glory in

[A]Hallelujah, [E]hallelujah
[F#m]Jesus, [D]You're the anthem of our hearts
[A]Hallelujah, [E]hallelujah
[F#m]We sing the [D]anthem of our King

[A]You are the song, [E]You are the anthem
[F#m]Rising up from [D]every heart
[A]Louder and louder [E]hear us singing
[F#m]You're the anthem of our [D]hearts`,
    notes: "High energy worship anthem. Big chorus, full band.",
    bpm: 136,
    tags: ["praise","anthem","celebration"],
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
