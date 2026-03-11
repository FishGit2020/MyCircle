#!/usr/bin/env node
/**
 * Seed Vineyard Worship worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/vineyard-worship.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Come Now Is the Time to Worship",
    artist: "Vineyard Worship",
    originalKey: "D",
    format: "chordpro",
    content: `[D]Come, now is the time to [A]worship
[Em]Come, now is the time to [G]give your heart
[D]Come, just as you are to [A]worship
[Em]Come, just as you are be[G]fore your God
[D]Come

[G]One day every tongue will [D]confess You are God
[G]One day every knee will [Em]bow
[G]Still the greatest treasure re[D]mains for those
[G]Who gladly [A]choose You [D]now`,
    notes: "Classic call to worship, acoustic-driven",
    bpm: 108,
    tags: ["worship","classic","call-to-worship"],
  },
  {
    title: "Hungry (Falling on My Knees)",
    artist: "Vineyard Worship",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Hungry I come to [D/F#]You
[Em]For I know You satis[C]fy
[G]I am empty [D/F#]but I know
[Em]Your love does not run [C]dry

[G]So I wait for [D/F#]You
[Em]So I wait for [C]You

[G]I'm falling on my [D]knees
[Em]Offering all of [C]me
[G]Jesus You're all this [D]heart is living for
[Em]I'm falling on my [C]knees
[G]I'm falling on my [D]knees
[Em]Offering all of [C]me`,
    notes: "Reverent and longing, keep volume low",
    bpm: 72,
    tags: ["worship","devotional","intimate"],
  },
  {
    title: "Breathe on Me",
    artist: "Vineyard Worship",
    originalKey: "C",
    format: "chordpro",
    content: `[C]Breathe on me, [G/B]breath of God
[Am]Fill me with [F]life anew
[C]That I may [G/B]love what Thou dost love
[Am]And do what [F]Thou wouldst [G]do

[C]Breathe on me, [G/B]breath of God
[Am]Until my [F]heart is pure
[C]Until with [G/B]Thee I will one [Am]will
[F]To do and [G]to en[C]dure

[F]Holy Spirit [G]breathe on me
[Am]Set my heart on [F]fire
[C]Breathe on me [G]breath of God
[Am]You are my [F]one de[C]sire`,
    notes: "Prayerful and gentle, great for prayer ministry",
    bpm: 68,
    tags: ["worship","prayer","holy-spirit"],
  },
  {
    title: "Refiner's Fire",
    artist: "Vineyard Worship",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Purify my [D]heart
[Em]Let me be as [C]gold
[G]And precious [D]silver
[Em]Purify my [C]heart
[G]Let me be as [D]gold
[Em]Pure [C]gold

[C]Refiner's [D]fire
[G]My heart's one de[Em]sire
[C]Is to be [D]holy
[G]Set apart for [Em]You Lord
[C]I choose to [D]be holy
[Em]Set apart for [C]You my Master
[G]Ready to do [D]Your will`,
    notes: "Classic Vineyard song, Brian Doerksen, gentle and sincere",
    bpm: 76,
    tags: ["worship","classic","holiness"],
  },
  {
    title: "Change My Heart Oh God",
    artist: "Vineyard Worship",
    originalKey: "C",
    format: "chordpro",
    content: `[C]Change my heart oh [F]God
[G]Make it ever [C]true
[C]Change my heart oh [F]God
[G]May I be like [C]You

[F]You are the [G]potter
[Am]I am the [F]clay
[F]Mold me and [G]make me
[Am]This is what I [G]pray

[C]Change my heart oh [F]God
[G]Make it ever [C]true
[C]Change my heart oh [F]God
[G]May I be like [C]You`,
    notes: "Eddie Espinosa classic, simple and singable",
    bpm: 80,
    tags: ["worship","classic","prayer"],
  },
  {
    title: "Isn't He",
    artist: "Vineyard Worship",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Isn't He [C]beautiful
[D]Isn't He [G]wonderful
[G]Isn't He, [C]isn't He, [D]isn't He

[G]Beautiful, [C]beautiful
[D]Lord of [G]all
[G]Prince of [C]Peace, Son of [D]God isn't [G]He`,
    notes: "Classic Vineyard simplicity. Let it loop with gentle builds.",
    bpm: 66,
    tags: ["worship","adoration","classic"],
  },
  {
    title: "Holy and Anointed One",
    artist: "Vineyard Worship",
    originalKey: "D",
    format: "chordpro",
    content: `[D]Jesus, [A]Jesus
[Bm]Holy and A[G]nointed One
[D]Jesus [A] [G]

[D]Your name is like [A]honey on my lips
[Bm]Your Spirit like [G]water to my soul
[D]Your Word is a [A]lamp unto my [G]feet
[D]Jesus I [A]love [G]You`,
    notes: "John Barnett classic. Intimate and reverent.",
    bpm: 64,
    tags: ["worship","classic","intimacy"],
  },
  {
    title: "Sweetly Broken",
    artist: "Vineyard Worship",
    originalKey: "G",
    format: "chordpro",
    content: `[G]To the cross I [D]look
[Em]To the cross I [C]cling
[G]Of its suffering [D]I do drink
[Em]Of its work I do [C]sing

[G]Sweetly broken, [D]wholly surrendered
[Em]Sweetly broken, [C]wholly given to [G]You`,
    notes: "Jeremy Riddle song. Communion-ready atmosphere.",
    bpm: 68,
    tags: ["worship","cross","surrender"],
  },
  {
    title: "Draw Me Close",
    artist: "Vineyard Worship",
    originalKey: "F",
    format: "chordpro",
    content: `[F]Draw me close to [C]You
[Dm]Never let me [Bb]go
[F]I lay it all down [C]again
[Dm]To hear You say that [Bb]I'm Your friend

[F]You are my de[C]sire
[Dm]No one else will [Bb]do
[F]Nothing else could take Your [C]place
[Dm]To feel the warmth of [Bb]Your em[F]brace`,
    notes: "Kelly Carpenter classic. One of Vineyard's most beloved.",
    bpm: 62,
    tags: ["worship","classic","intimacy"],
  },
  {
    title: "Let It Rise",
    artist: "Vineyard Worship",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Let the glory of the [D]Lord
[Em]Rise among [C]us
[G]Let the glory of the [D]Lord
[Em]Rise among [C]us

[G]Let the praises of the [D]King
[Em]Rise among [C]us
[G]Let it [D]rise [Em] [C]`,
    notes: "Holland Davis classic. Great corporate worship opener.",
    bpm: 76,
    tags: ["worship","glory","praise"],
  },
  {
    title: "More Love More Power",
    artist: "Vineyard Worship",
    originalKey: "Em",
    format: "chordpro",
    content: `[Em]More love, more [C]power
[D]More of You in my [Em]life
[Em]More love, more [C]power
[D]More of You in my [Em]life

[Em]I will worship [C]You with all of my [D]heart
[Em]I will worship [C]You with all of my [D]mind
[Em]I will worship [C]You with all of my [D]strength
[Em]You are my [C]Lord [D] [Em]`,
    notes: "Jude Del Hierro classic. Simple, powerful prayer.",
    bpm: 70,
    tags: ["worship","prayer","classic"],
  },
  {
    title: "You Are Good (Vineyard)",
    artist: "Vineyard Worship",
    originalKey: "A",
    format: "chordpro",
    content: `[A]Lord You are [E]good
[F#m]And Your mercy endures for[D]ever
[A]Lord You are [E]good
[F#m]And Your mercy endures for[D]ever

[A]People from every [E]nation and tongue
[F#m]From generation to gener[D]ation
[A]We worship You, halle[E]lujah [D]`,
    notes: "Psalm 100:5 celebration. Joyful and energetic.",
    bpm: 128,
    tags: ["worship","goodness","celebration"],
  },
  {
    title: "Hallelujah Your Love Is Amazing",
    artist: "Vineyard Worship",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Your love is a[D]mazing
[Em]Steady and un[C]changing
[G]Your love is a [D]mountain
[Em]Firm beneath my [C]feet

[G]Hallelujah, halle[D]lujah
[Em]Hallelujah, Your [C]love makes me sing
[G]Hallelujah, halle[D]lujah
[Em]Hallelujah, Your [C]love makes me [G]sing`,
    notes: "Brenton Brown song. Joyful, singable, great opener.",
    bpm: 120,
    tags: ["worship","love","joy"],
  },
  {
    title: "We Fall Down",
    artist: "Vineyard Worship",
    originalKey: "D",
    format: "chordpro",
    content: `[D]We fall down, we [A]lay our crowns
[Bm]At the feet of [G]Jesus
[D]The greatness of [A]mercy and love
[Bm]At the feet of [G]Jesus

[D]And we cry holy, holy, [A]holy
[Bm]And we cry holy, holy, [G]holy
[D]And we cry holy, holy, [A]holy is the [G]Lamb`,
    notes: "Chris Tomlin wrote this during Vineyard era. Reverent.",
    bpm: 64,
    tags: ["worship","reverence","classic"],
  },
  {
    title: "Step by Step",
    artist: "Vineyard Worship",
    originalKey: "G",
    format: "chordpro",
    content: `[G]O God You are my [C]God
[D]And I will ever [G]praise You
[G]O God You are my [C]God
[D]And I will ever [G]praise You

[G]I will seek You in the [C]morning
[D]And I will learn to walk in Your [G]ways
[G]And step by step You [C]lead me
[D]And I will follow You all of my [G]days`,
    notes: "Rich Mullins / Vineyard classic. Singable and timeless.",
    bpm: 74,
    tags: ["worship","classic","following"],
  },
  {
    title: "Seek First",
    artist: "Vineyard Worship",
    originalKey: "D",
    format: "chordpro",
    content: `[D]Seek ye first the [A]kingdom of God
[Bm]And His righteous[G]ness
[D]And all these things shall be [A]added unto you
[Bm]Allelu, allelu[G]ia

[D]Ask and it shall be [A]given unto you
[Bm]Seek and ye shall [G]find
[D]Knock and it shall be [A]opened unto [G]you
[Bm]Allelu, allelu[G]ia`,
    notes: "Matthew 6:33. Traditional Vineyard arrangement. Timeless.",
    bpm: 70,
    tags: ["worship","scripture","classic"],
  },
  {
    title: "I Could Sing of Your Love Forever",
    artist: "Vineyard Worship",
    originalKey: "E",
    format: "chordpro",
    content: `[E]Over the mountains and the [B]sea
[C#m]Your river runs with love for [A]me
[E]And I will open up my [B]heart
[C#m]And let the Healer set me [A]free

[E]I could sing of Your love for[B]ever
[C#m]I could sing of Your love for[A]ever
[E]I could sing of Your love for[B]ever
[C#m]I could sing of Your love for[A]ever`,
    notes: "Martin Smith / Delirious classic covered by Vineyard. Iconic.",
    bpm: 118,
    tags: ["worship","love","classic"],
  },
  {
    title: "Spirit of God",
    artist: "Vineyard Worship",
    originalKey: "C",
    format: "chordpro",
    content: `[C]Spirit of God fall [G]fresh on me
[Am]Fill me anew, fill [F]me anew
[C]Spirit of God fall [G]fresh on me
[Am]Melt me, mold me, [F]use me

[C]Living breath of [G]God
[Am]Come breathe on [F]us
[C]Spirit of [G]God [F]come`,
    notes: "Vineyard intimacy at its best. Soft, expectant.",
    bpm: 62,
    tags: ["worship","spirit","prayer"],
  },
  {
    title: "I Love You Lord (Vineyard)",
    artist: "Vineyard Worship",
    originalKey: "F",
    format: "chordpro",
    content: `[F]I love You [C]Lord
[Dm]And I lift my [Bb]voice
[F]To worship [C]You
[Dm]Oh my soul re[Bb]joice

[F]Take joy my [C]King
[Dm]In what You [Bb]hear
[F]May it be a [C]sweet sweet [Dm]sound
[Bb]In Your [F]ear`,
    notes: "Laurie Klein classic. One of the simplest, most beloved worship songs.",
    bpm: 58,
    tags: ["worship","love","classic"],
  },
  {
    title: "All I Need Is You",
    artist: "Vineyard Worship",
    originalKey: "D",
    format: "chordpro",
    content: `[D]All I need is [A]You Lord
[Bm]Is You Lord, is [G]You Lord
[D]All I need is [A]You Lord
[Bm]Is You [G]Lord

[D]One thing I [A]ask, one thing I [Bm]seek
[G]To see Your [D]beauty
[A]To find You in the [Bm]place
[G]I am in`,
    notes: "Brian Johnson / early Bethel meets Vineyard. Minimal arrangement.",
    bpm: 68,
    tags: ["worship","simplicity","devotion"],
  },
  {
    title: "Mercy (Vineyard)",
    artist: "Vineyard Worship",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Lord have mercy on [D]me
[Em]A sinner in need of [C]grace
[G]Lord have mercy on [D]me
[Em]I fall before Your [C]face

[G]Your mercy is [D]new every morning
[Em]Great is Your faith[C]fulness
[G]Lord have mercy [D]on [C]me`,
    notes: "Vineyard mercy prayer. Lamentations 3:22-23 theme.",
    bpm: 64,
    tags: ["worship","mercy","prayer"],
  },
  {
    title: "Faithful One",
    artist: "Vineyard Worship",
    originalKey: "D",
    format: "chordpro",
    content: `[D]Faithful One, so un[A]changing
[Bm]Ageless One, You're my [G]rock of peace
[D]Lord of all, I de[A]pend on You
[Bm]I call out to [G]You again and again

[D]You are my rock in [A]times of trouble
[Bm]You lift me up when I [G]fall down
[D]All through the storm Your [A]love is the anchor
[Bm]My hope is in [G]You a[D]lone`,
    notes: "Brian Doerksen classic. Steady and reassuring.",
    bpm: 72,
    tags: ["worship","faithfulness","classic"],
  },
  {
    title: "Shout to the North",
    artist: "Vineyard Worship",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Men of faith rise [C]up and sing
[D]Of the great and [G]glorious King
[G]You are strong when [C]you feel weak
[D]In your broken[G]ness complete

[G]Shout to the [C]north and the south
[D]Sing to the [Em]east and the west
[G]Jesus is [C]Savior to [D]all
[Em]Lord of heaven and [C]earth`,
    notes: "Martin Smith / Delirious song, beloved in Vineyard circles. Triumphant.",
    bpm: 126,
    tags: ["worship","praise","declaration"],
  },
  {
    title: "Arms of Love",
    artist: "Vineyard Worship",
    originalKey: "D",
    format: "chordpro",
    content: `[D]I sing a simple [A]song of love
[Bm]To my Savior, [G]to my Jesus
[D]I'm grateful for the [A]things You've done
[Bm]My loving Savior, [G]precious Jesus

[D]My heart is glad that [A]You've called me Your own
[Bm]There's no place I'd rather [G]be
[D]Than in Your [A]arms of [G]love`,
    notes: "Craig Musseau classic. Tender Vineyard simplicity.",
    bpm: 66,
    tags: ["worship","love","classic"],
  },
  {
    title: "You Are Here (Turn Your Eyes)",
    artist: "Vineyard Worship",
    originalKey: "C",
    format: "chordpro",
    content: `[C]You are here, [G]moving in our midst
[Am]I worship [F]You, I worship You
[C]You are here, [G]working in this place
[Am]I worship [F]You, I worship You

[C]Turn your eyes up[G]on the Lord
[Am]And the things of earth will [F]grow strangely dim
[C]In the light of [G]His glory and [F]grace`,
    notes: "Vineyard arrangement with classic hymn bridge. Atmospheric.",
    bpm: 70,
    tags: ["worship","presence","classic"],
  },
  {
    title: "Every Move I Make",
    artist: "Vineyard Worship",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Every move I make I make in [C]You
[G]You make me move [D]Jesus
[G]Every breath I take I breathe in [C]You
[G]Every step I take I take in [D]You

[G]Na na na na na na [C]na
[G]Na na na na na na [D]na
[G]Waves of mercy, [C]waves of grace
[D]Everywhere I look I see Your [G]face`,
    notes: "David Ruis kids/youth classic. Fun and energetic.",
    bpm: 132,
    tags: ["worship","joy","kids"],
  },
  {
    title: "Come and Listen",
    artist: "Vineyard Worship",
    originalKey: "A",
    format: "chordpro",
    content: `[A]Come and listen, come to the [E]water's edge
[F#m]All you who know and [D]fear the Lord
[A]Come and listen, [E]let me tell you what He's done
[F#m]Come and [D]listen

[A]He has done great [E]things
[F#m]He has done great [D]things
[A]Come and [E]listen [D]`,
    notes: "Psalm 66:16. Testimony and invitation song.",
    bpm: 78,
    tags: ["worship","invitation","testimony"],
  },
  {
    title: "All Who Are Thirsty (Vineyard)",
    artist: "Vineyard Worship",
    originalKey: "D",
    format: "chordpro",
    content: `[D]All who are [A]thirsty
[Bm]All who are [G]weak
[D]Come to the [A]fountain
[Bm]Dip your heart in the [G]stream of life

[D]Let the pain and the [A]sorrow
[Bm]Be washed a[G]way
[D]In the waves of His [A]mercy
[Bm]As deep cries out to [G]deep

[D]Come Lord [A]Jesus come
[Bm]Come Lord [G]Jesus come`,
    notes: "Brenton Brown & Glenn Robertson. Vineyard classic invitation.",
    bpm: 68,
    tags: ["worship","thirst","invitation"],
  },
  {
    title: "Dwell",
    artist: "Vineyard Worship",
    originalKey: "E",
    format: "chordpro",
    content: `[E]Dwell in the midst of [B]us
[C#m]Come and dwell in the [A]midst of us
[E]You're worthy, [B]You're worthy
[C#m]Come and dwell in the [A]midst of us

[E]Here among the [B]broken
[C#m]Here among the [A]weary
[E]Come and make Your [B]home with us
[C#m]Come and dwell in [A]us`,
    notes: "Psalm 22:3 inhabiting our praise. Intimate and expectant.",
    bpm: 62,
    tags: ["worship","presence","dwelling"],
  },
  {
    title: "Over Me",
    artist: "Vineyard Worship",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Over me, over [D]me
[Em]Let Your anointing [C]fall over me
[G]Over me, over [D]me
[Em]Let the glory of the [C]Lord come over me

[G]I rest beneath the [D]shadow of Your wings
[Em]I trust in You, my [C]God and King
[G]Let Your presence [D]come over [C]me`,
    notes: "Psalm 91:4 imagery. Gentle soaking worship.",
    bpm: 60,
    tags: ["worship","anointing","rest"],
  },
  {
    title: "Praise the Lord (Vineyard)",
    artist: "Vineyard Worship",
    originalKey: "A",
    format: "chordpro",
    content: `[A]Praise the Lord from the [E]heavens
[F#m]Praise Him in the [D]heights above
[A]Praise Him all His [E]angels
[F#m]Praise Him all His [D]heavenly hosts

[A]Let them praise the [E]name of the Lord
[F#m]For His name a[D]lone is exalted
[A]His splendor is above the [E]earth and the [D]heavens`,
    notes: "Psalm 148 setting. Celebratory and majestic.",
    bpm: 118,
    tags: ["worship","praise","psalm"],
  },
  {
    title: "Worthy (Vineyard)",
    artist: "Vineyard Worship",
    originalKey: "D",
    format: "chordpro",
    content: `[D]Worthy, You are [A]worthy
[Bm]King of kings, Lord of [G]lords You are worthy
[D]Worthy, You are [A]worthy
[Bm]King of kings, Lord of [G]lords I worship You

[D]You paid the [A]price for my sin
[Bm]Once for all You [G]shed Your blood
[D]I am redeemed by the [A]Lamb of God
[Bm]Worthy is the [G]Lamb`,
    notes: "Revelation 5 theme. Simple and powerful declaration.",
    bpm: 72,
    tags: ["worship","worthy","adoration"],
  },
  {
    title: "Thank You Lord for Your Presence",
    artist: "Vineyard Worship",
    originalKey: "C",
    format: "chordpro",
    content: `[C]Thank You Lord for Your [G]presence
[Am]Thank You Lord for this [F]day
[C]Thank You Lord for Your [G]Spirit
[Am]That guides me a[F]long the way

[C]In Your presence there is [G]fullness of joy
[Am]At Your right hand [F]pleasures evermore
[C]Thank You [G]Lord [F]`,
    notes: "Psalm 16:11. Simple gratitude worship song.",
    bpm: 68,
    tags: ["worship","gratitude","presence"],
  },
  {
    title: "It's Falling",
    artist: "Vineyard Worship",
    originalKey: "E",
    format: "chordpro",
    content: `[E]It's falling, it's [B]falling
[C#m]The rain of Your [A]love is falling
[E]My soul cries [B]out
[C#m]Send Your rain down [A]now

[E]Let it fall on [B]us
[C#m]Let it rain on [A]us
[E]Open up the [B]heavens Lord
[C#m]Let it fall, let it [A]fall`,
    notes: "Rain metaphor for anointing. Expectant worship prayer.",
    bpm: 74,
    tags: ["worship","anointing","prayer"],
  },
  {
    title: "Fire of God",
    artist: "Vineyard Worship",
    originalKey: "Em",
    format: "chordpro",
    content: `[Em]Fire of God fall [C]fresh on me
[D]Burn away what [Em]shouldn't be
[Em]Fire of God fall [C]fresh on me
[D]Purify my [Em]heart

[Em]Come and consume [C]every part of me
[D]Holy flame of [Em]love
[Em]Fire of God come [C]down
[D]Set this place a[Em]blaze`,
    notes: "Holy Spirit fire prayer. Acts 2 imagery. Passionate.",
    bpm: 80,
    tags: ["worship","fire","holy-spirit"],
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
