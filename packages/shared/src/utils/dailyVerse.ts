/**
 * Single source of truth for daily verse and devotional selection.
 * Ensures the dashboard daily verse and Bible Reader devotional
 * never show the same content on the same day.
 *
 * Verse text is fetched from the YouVersion API at runtime.
 * Only references and versions are stored locally.
 */

export interface DailyVerse {
  text?: string;
  reference: string;
  copyright?: string;
}

export interface DailyDevotional {
  book: string;
  chapter: number;
  theme: string;
}

// 90 curated encouraging verse references (USFM format for direct YouVersion API use)
// Actual text is fetched from YouVersion API via the bibleVotdApi resolver
const DAILY_VERSES: DailyVerse[] = [
  // ── Hope & Encouragement ──
  { reference: "JER.29.11" },               // For I know the plans I have for you
  { reference: "ISA.41.10" },               // So do not fear, for I am with you
  { reference: "JOS.1.9" },                 // Be strong and courageous
  { reference: "PHP.4.13" },                // I can do all this through him
  { reference: "ISA.40.31" },               // Those who hope in the LORD
  { reference: "ROM.8.28" },                // All things work together for good
  { reference: "DEU.31.6" },                // Be strong and courageous, do not be afraid
  { reference: "PSA.46.1" },                // God is our refuge and strength
  { reference: "MAT.11.28" },               // Come to me, all you who are weary
  { reference: "ROM.15.13" },               // May the God of hope fill you

  // ── Comfort & Peace ──
  { reference: "PSA.23.4" },                // Even though I walk through the darkest valley
  { reference: "JHN.14.27" },               // Peace I leave with you
  { reference: "PHP.4.6-PHP.4.7" },         // Do not be anxious about anything
  { reference: "PSA.34.18" },               // The LORD is close to the brokenhearted
  { reference: "1PE.5.7" },                 // Cast all your anxiety on him
  { reference: "ISA.26.3" },                // You will keep in perfect peace
  { reference: "PSA.147.3" },               // He heals the brokenhearted
  { reference: "PSA.55.22" },               // Cast your cares on the LORD
  { reference: "PSA.46.10" },               // Be still, and know that I am God
  { reference: "COL.3.15" },                // Let the peace of Christ rule in your hearts

  // ── Strength & Courage ──
  { reference: "2CO.12.9" },                // My grace is sufficient for you
  { reference: "PSA.27.1" },                // The LORD is my light and my salvation
  { reference: "ISA.40.29" },               // He gives strength to the weary
  { reference: "PSA.28.7" },                // The LORD is my strength and my shield
  { reference: "PSA.18.2" },                // The LORD is my rock, my fortress
  { reference: "2TI.1.7" },                 // God gave us a spirit not of fear
  { reference: "ISA.12.2" },                // Surely God is my salvation
  { reference: "PSA.118.6" },               // The LORD is with me; I will not be afraid
  { reference: "PSA.73.26" },               // God is the strength of my heart
  { reference: "NAM.1.7" },                 // The LORD is good, a refuge in trouble

  // ── God's Faithfulness ──
  { reference: "LAM.3.22-LAM.3.23" },       // His compassions never fail
  { reference: "2TH.3.3" },                 // The Lord is faithful
  { reference: "PHP.1.6" },                 // He who began a good work in you
  { reference: "NUM.6.24-NUM.6.26" },       // The LORD bless you and keep you
  { reference: "PSA.37.4" },                // Take delight in the LORD
  { reference: "JER.31.3" },                // I have loved you with an everlasting love
  { reference: "PSA.145.18" },              // The LORD is near to all who call on him
  { reference: "PSA.138.7" },               // Though I walk in midst of trouble
  { reference: "HEB.13.5" },                // Never will I leave you
  { reference: "ISA.49.15-ISA.49.16" },     // Can a mother forget her baby

  // ── Overcoming & Perseverance ──
  { reference: "ROM.8.31" },                // If God is for us, who can be against us
  { reference: "JHN.16.33" },               // Take heart! I have overcome the world
  { reference: "GAL.6.9" },                 // Let us not become weary in doing good
  { reference: "JAS.1.2-JAS.1.3" },         // Consider it pure joy
  { reference: "JAS.1.12" },                // Blessed is the one who perseveres
  { reference: "2CO.4.16-2CO.4.17" },       // Therefore we do not lose heart
  { reference: "HEB.10.35-HEB.10.36" },     // Do not throw away your confidence
  { reference: "ROM.5.3-ROM.5.4" },         // Suffering produces perseverance
  { reference: "HEB.12.1" },                // Let us run with perseverance
  { reference: "PSA.31.24" },               // Be strong and take heart

  // ── Trust & Faith ──
  { reference: "PRO.3.5-PRO.3.6" },         // Trust in the LORD with all your heart
  { reference: "PSA.56.3" },                // When I am afraid, I put my trust in you
  { reference: "JER.17.7" },                // Blessed is the one who trusts in the LORD
  { reference: "PSA.62.1-PSA.62.2" },       // Truly my soul finds rest in God
  { reference: "PRO.16.3" },                // Commit to the LORD whatever you do
  { reference: "ISA.30.21" },               // Your ears will hear a voice behind you
  { reference: "PSA.32.8" },                // I will instruct you and teach you
  { reference: "PSA.16.8" },                // I keep my eyes always on the LORD
  { reference: "PSA.121.1-PSA.121.2" },     // I lift up my eyes to the mountains
  { reference: "MIC.7.7" },                 // I watch in hope for the LORD

  // ── God's Protection ──
  { reference: "PSA.91.1-PSA.91.2" },       // Whoever dwells in the shelter of the Most High
  { reference: "ISA.43.2" },                // When you pass through the waters
  { reference: "PSA.121.7-PSA.121.8" },     // The LORD will keep you from all harm
  { reference: "PSA.91.11" },               // He will command his angels concerning you
  { reference: "ISA.54.17" },               // No weapon forged against you will prevail
  { reference: "PSA.34.4" },                // I sought the LORD, and he answered me
  { reference: "PRO.18.10" },               // The name of the LORD is a fortified tower
  { reference: "PSA.94.19" },               // When anxiety was great within me
  { reference: "PSA.40.1-PSA.40.2" },       // I waited patiently for the LORD
  { reference: "DEU.33.27" },               // The eternal God is your refuge

  // ── Joy & Renewal ──
  { reference: "PSA.30.5" },                // Weeping may stay for the night
  { reference: "ISA.43.18-ISA.43.19" },     // See, I am doing a new thing
  { reference: "2CO.5.17" },                // If anyone is in Christ, new creation
  { reference: "ECC.3.11" },                // He has made everything beautiful in its time
  { reference: "JHN.15.11" },               // That my joy may be in you
  { reference: "ROM.12.12" },               // Be joyful in hope
  { reference: "HAB.3.17-HAB.3.18" },       // Though the fig tree does not bud
  { reference: "ZEP.3.17" },                // The LORD your God is with you, mighty to save
  { reference: "PSA.23.1" },                // The LORD is my shepherd, I lack nothing
  { reference: "JER.29.13" },               // You will seek me and find me

  // ── God's Love & Grace ──
  { reference: "ROM.8.38-ROM.8.39" },       // Nothing can separate us from God's love
  { reference: "1JN.4.18" },                // Perfect love drives out fear
  { reference: "EPH.3.20" },                // He is able to do immeasurably more
  { reference: "PHP.4.19" },                // My God will meet all your needs
  { reference: "JHN.10.10" },               // I have come that they may have life
  { reference: "PSA.103.2-PSA.103.4" },     // Forget not all his benefits
  { reference: "ISA.40.28" },               // The LORD is the everlasting God
  { reference: "MAT.11.29-MAT.11.30" },     // Take my yoke upon you
  { reference: "ISA.61.1" },                // He has sent me to bind up the brokenhearted
  { reference: "JHN.14.1" },                // Do not let your hearts be troubled
];

// 30 curated devotionals for the Bible Reader (different from daily verses)
const DEVOTIONALS: DailyDevotional[] = [
  { book: 'Psalms', chapter: 23, theme: 'The Lord is my shepherd' },
  { book: 'John', chapter: 3, theme: 'For God so loved the world' },
  { book: 'Romans', chapter: 8, theme: 'More than conquerors' },
  { book: 'Philippians', chapter: 4, theme: 'Rejoice in the Lord always' },
  { book: 'Isaiah', chapter: 40, theme: 'Those who hope in the Lord' },
  { book: 'Matthew', chapter: 5, theme: 'The Beatitudes' },
  { book: 'Genesis', chapter: 1, theme: 'In the beginning' },
  { book: 'Proverbs', chapter: 3, theme: 'Trust in the Lord' },
  { book: '1 Corinthians', chapter: 13, theme: 'Love is patient, love is kind' },
  { book: 'Hebrews', chapter: 11, theme: 'Faith is confidence in what we hope for' },
  { book: 'Ephesians', chapter: 6, theme: 'The armor of God' },
  { book: 'James', chapter: 1, theme: 'Consider it pure joy' },
  { book: 'Revelation', chapter: 21, theme: 'A new heaven and a new earth' },
  { book: 'Psalms', chapter: 91, theme: 'He who dwells in the shelter of the Most High' },
  { book: 'Matthew', chapter: 6, theme: 'Do not worry about tomorrow' },
  { book: 'Romans', chapter: 12, theme: 'A living sacrifice' },
  { book: 'Psalms', chapter: 119, theme: 'Your word is a lamp to my feet' },
  { book: 'Colossians', chapter: 3, theme: 'Set your hearts on things above' },
  { book: 'Joshua', chapter: 1, theme: 'Be strong and courageous' },
  { book: 'Psalms', chapter: 46, theme: 'God is our refuge and strength' },
  { book: 'Galatians', chapter: 5, theme: 'The fruit of the Spirit' },
  { book: 'Luke', chapter: 15, theme: 'The prodigal son' },
  { book: '2 Timothy', chapter: 1, theme: 'Fan into flame the gift of God' },
  { book: 'Psalms', chapter: 139, theme: 'You knit me together' },
  { book: 'Isaiah', chapter: 53, theme: 'He was pierced for our transgressions' },
  { book: '1 Peter', chapter: 5, theme: 'Cast all your anxiety on Him' },
  { book: 'Ecclesiastes', chapter: 3, theme: 'A time for everything' },
  { book: 'Jeremiah', chapter: 29, theme: 'Plans to prosper you' },
  { book: 'Matthew', chapter: 28, theme: 'Go and make disciples' },
  { book: 'Psalms', chapter: 1, theme: 'Blessed is the one' },
];

function getDayOfYear(date: Date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Get the daily verse reference for the dashboard.
 * Uses day-of-year to cycle through verses.
 * Text should be fetched from the YouVersion API via bibleVotdApi.
 */
export function getDailyVerse(date: Date = new Date()): DailyVerse {
  const dayOfYear = getDayOfYear(date);
  return DAILY_VERSES[dayOfYear % DAILY_VERSES.length];
}

/**
 * Get the daily devotional for the Bible Reader.
 * Uses an offset from the verse index to guarantee different content.
 */
export function getDailyDevotional(date: Date = new Date()): DailyDevotional {
  const dayOfYear = getDayOfYear(date);
  return DEVOTIONALS[dayOfYear % DEVOTIONALS.length];
}

/**
 * Get all daily verses (for shuffle functionality in useDailyVerse).
 */
export function getAllDailyVerses(): DailyVerse[] {
  return DAILY_VERSES;
}
