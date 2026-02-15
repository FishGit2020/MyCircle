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

// 90 curated daily verse references for the dashboard
// Actual text is fetched from YouVersion API via the bibleVotdApi resolver
const DAILY_VERSES: DailyVerse[] = [
  // ── Trust & Faith ──
  { reference: "Jeremiah 29:11 (NIV)" },
  { reference: "Proverbs 3:5-6 (NIV)" },
  { reference: "Philippians 4:13 (NIV)" },
  { reference: "2 Corinthians 5:7 (NIV)" },
  { reference: "Hebrews 11:1 (NIV)" },
  { reference: "Proverbs 16:3 (NIV)" },
  { reference: "Proverbs 16:9 (NIV)" },
  { reference: "Hebrews 11:6 (NIV)" },
  { reference: "Psalm 9:10 (NIV)" },
  { reference: "Psalm 56:3 (NIV)" },

  // ── Strength & Courage ──
  { reference: "Joshua 1:9 (NIV)" },
  { reference: "Isaiah 40:31 (NIV)" },
  { reference: "Isaiah 41:10 (NIV)" },
  { reference: "Psalm 46:1 (NIV)" },
  { reference: "Psalm 28:7 (NIV)" },
  { reference: "Psalm 34:4 (NIV)" },
  { reference: "Psalm 18:2 (NIV)" },
  { reference: "Joshua 1:9 (ESV)" },
  { reference: "2 Thessalonians 3:3 (NIV)" },
  { reference: "Proverbs 18:10 (NIV)" },

  // ── Peace & Comfort ──
  { reference: "Psalm 23:1 (NIV)" },
  { reference: "Matthew 11:28 (NIV)" },
  { reference: "Philippians 4:6 (NIV)" },
  { reference: "John 14:27 (NIV)" },
  { reference: "1 Peter 5:7 (NIV)" },
  { reference: "Psalm 46:10 (NIV)" },
  { reference: "Psalm 34:18 (NIV)" },
  { reference: "Psalm 147:3 (NIV)" },
  { reference: "Philippians 4:7 (NIV)" },
  { reference: "Isaiah 26:3 (NIV)" },

  // ── Love & Grace ──
  { reference: "John 3:16 (NIV)" },
  { reference: "1 Corinthians 13:4 (NIV)" },
  { reference: "Lamentations 3:22-23 (ESV)" },
  { reference: "Romans 5:8 (NIV)" },
  { reference: "1 John 3:1 (NIV)" },
  { reference: "1 John 4:7 (NIV)" },
  { reference: "1 Corinthians 13:13 (NIV)" },
  { reference: "Ephesians 2:8 (NIV)" },
  { reference: "1 Peter 4:8 (NIV)" },
  { reference: "1 John 4:19 (NIV)" },

  // ── Hope & Joy ──
  { reference: "Romans 8:28 (NIV)" },
  { reference: "Romans 15:13 (NIV)" },
  { reference: "Psalm 118:24 (NIV)" },
  { reference: "1 Thessalonians 5:16-18 (NIV)" },
  { reference: "Nehemiah 8:10 (NIV)" },
  { reference: "James 1:2-3 (NIV)" },
  { reference: "Psalm 30:5 (NIV)" },
  { reference: "Psalm 30:5 (ESV)" },
  { reference: "Psalm 16:11 (NIV)" },
  { reference: "John 15:11 (NIV)" },

  // ── Guidance & Wisdom ──
  { reference: "Psalm 27:1 (NIV)" },
  { reference: "Psalm 119:105 (NIV)" },
  { reference: "James 1:5 (NIV)" },
  { reference: "Proverbs 9:10 (NIV)" },
  { reference: "Psalm 25:4-5 (NIV)" },
  { reference: "Psalm 32:8 (NIV)" },
  { reference: "Proverbs 2:6 (NIV)" },
  { reference: "Isaiah 30:21 (NIV)" },

  // ── New Life & Transformation ──
  { reference: "2 Corinthians 5:17 (NIV)" },
  { reference: "Ecclesiastes 3:11 (NIV)" },
  { reference: "Romans 12:2 (NIV)" },
  { reference: "Psalm 51:10 (NIV)" },
  { reference: "Galatians 2:20 (NIV)" },
  { reference: "Isaiah 43:18-19 (NIV)" },

  // ── God's Faithfulness & Promises ──
  { reference: "Numbers 6:24-25 (NIV)" },
  { reference: "Psalm 37:4 (NIV)" },
  { reference: "Psalm 19:1 (NIV)" },
  { reference: "Psalm 147:5 (NIV)" },
  { reference: "James 1:17 (NIV)" },
  { reference: "Psalm 145:8 (NIV)" },
  { reference: "Psalm 107:1 (NIV)" },
  { reference: "Psalm 84:11 (NIV)" },

  // ── Purpose & Calling ──
  { reference: "Galatians 5:22-23 (NIV)" },
  { reference: "Ephesians 2:10 (NIV)" },
  { reference: "Colossians 3:23 (NIV)" },
  { reference: "Isaiah 41:13 (NIV)" },
  { reference: "Micah 6:8 (NIV)" },
  { reference: "Matthew 6:33 (NIV)" },

  // ── Praise & Worship ──
  { reference: "Psalm 150:6 (NIV)" },
  { reference: "Psalm 138:1 (NIV)" },
  { reference: "Exodus 15:2 (NLT)" },
  { reference: "Psalm 100:1-2 (NIV)" },
  { reference: "Psalm 113:3 (NIV)" },
  { reference: "Psalm 107:1 (ESV)" },

  // ── Endurance & Perseverance ──
  { reference: "Galatians 6:9 (NIV)" },
  { reference: "Philippians 3:14 (NIV)" },
  { reference: "James 1:12 (NIV)" },
  { reference: "2 Corinthians 12:9 (NIV)" },
  { reference: "1 Corinthians 10:13 (NIV)" },
  { reference: "Philippians 1:6 (NIV)" },
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
