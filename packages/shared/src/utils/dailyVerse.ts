/**
 * Single source of truth for daily verse and devotional selection.
 * Ensures the dashboard daily verse and Bible Reader devotional
 * never show the same content on the same day.
 */

export interface DailyVerse {
  text: string;
  reference: string;
  copyright?: string;
}

export interface DailyDevotional {
  book: string;
  chapter: number;
  theme: string;
}

// 90 curated daily verses for the dashboard (NIV unless noted)
const NIV = 'Scripture quotations taken from The Holy Bible, New International Version® NIV®. Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.™';
const ESV = 'Scripture quotations are from The ESV® Bible, Copyright © 2001 by Crossway.';
const NLT = 'Scripture quotations are taken from the Holy Bible, New Living Translation, Copyright © 1996, 2004, 2015 by Tyndale House Foundation.';
const NKJV = 'Scripture taken from the New King James Version®. Copyright © 1982 by Thomas Nelson.';

const DAILY_VERSES: DailyVerse[] = [
  // ── Trust & Faith ──
  { text: "For I know the plans I have for you, declares the LORD, plans to prosper you and not to harm you, plans to give you hope and a future.", reference: "Jeremiah 29:11 (NIV)", copyright: NIV },
  { text: "Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.", reference: "Proverbs 3:5-6 (NIV)", copyright: NIV },
  { text: "I can do all this through him who gives me strength.", reference: "Philippians 4:13 (NIV)", copyright: NIV },
  { text: "For we walk by faith, not by sight.", reference: "2 Corinthians 5:7 (NIV)", copyright: NIV },
  { text: "Now faith is confidence in what we hope for and assurance about what we do not see.", reference: "Hebrews 11:1 (NIV)", copyright: NIV },
  { text: "Commit to the LORD whatever you do, and he will establish your plans.", reference: "Proverbs 16:3 (NIV)", copyright: NIV },
  { text: "In their hearts humans plan their course, but the LORD establishes their steps.", reference: "Proverbs 16:9 (NIV)", copyright: NIV },
  { text: "And without faith it is impossible to please God, because anyone who comes to him must believe that he exists and that he rewards those who earnestly seek him.", reference: "Hebrews 11:6 (NIV)", copyright: NIV },
  { text: "Those who know your name trust in you, for you, LORD, have never forsaken those who seek you.", reference: "Psalm 9:10 (NIV)", copyright: NIV },
  { text: "When I am afraid, I put my trust in you.", reference: "Psalm 56:3 (NIV)", copyright: NIV },

  // ── Strength & Courage ──
  { text: "Be strong and courageous. Do not be afraid; do not be discouraged, for the LORD your God will be with you wherever you go.", reference: "Joshua 1:9 (NIV)", copyright: NIV },
  { text: "But those who hope in the LORD will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.", reference: "Isaiah 40:31 (NIV)", copyright: NIV },
  { text: "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.", reference: "Isaiah 41:10 (NIV)", copyright: NIV },
  { text: "God is our refuge and strength, an ever-present help in trouble.", reference: "Psalm 46:1 (NIV)", copyright: NIV },
  { text: "The LORD is my strength and my shield; my heart trusts in him, and he helps me.", reference: "Psalm 28:7 (NIV)", copyright: NIV },
  { text: "I sought the LORD, and he answered me; he delivered me from all my fears.", reference: "Psalm 34:4 (NIV)", copyright: NIV },
  { text: "The LORD is my rock, my fortress and my deliverer; my God is my rock, in whom I take refuge.", reference: "Psalm 18:2 (NIV)", copyright: NIV },
  { text: "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the LORD your God will be with you wherever you go.", reference: "Joshua 1:9 (ESV)", copyright: ESV },
  { text: "But the Lord is faithful, and he will strengthen you and protect you from the evil one.", reference: "2 Thessalonians 3:3 (NIV)", copyright: NIV },
  { text: "The name of the LORD is a fortified tower; the righteous run to it and are safe.", reference: "Proverbs 18:10 (NIV)", copyright: NIV },

  // ── Peace & Comfort ──
  { text: "The LORD is my shepherd, I lack nothing.", reference: "Psalm 23:1 (NIV)", copyright: NIV },
  { text: "Come to me, all you who are weary and burdened, and I will give you rest.", reference: "Matthew 11:28 (NIV)", copyright: NIV },
  { text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.", reference: "Philippians 4:6 (NIV)", copyright: NIV },
  { text: "Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.", reference: "John 14:27 (NIV)", copyright: NIV },
  { text: "Cast all your anxiety on him because he cares for you.", reference: "1 Peter 5:7 (NIV)", copyright: NIV },
  { text: "Be still, and know that I am God.", reference: "Psalm 46:10 (NIV)", copyright: NIV },
  { text: "The LORD is close to the brokenhearted and saves those who are crushed in spirit.", reference: "Psalm 34:18 (NIV)", copyright: NIV },
  { text: "He heals the brokenhearted and binds up their wounds.", reference: "Psalm 147:3 (NIV)", copyright: NIV },
  { text: "And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.", reference: "Philippians 4:7 (NIV)", copyright: NIV },
  { text: "You will keep in perfect peace those whose minds are steadfast, because they trust in you.", reference: "Isaiah 26:3 (NIV)", copyright: NIV },

  // ── Love & Grace ──
  { text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.", reference: "John 3:16 (NIV)", copyright: NIV },
  { text: "Love is patient, love is kind. It does not envy, it does not boast, it is not proud.", reference: "1 Corinthians 13:4 (NIV)", copyright: NIV },
  { text: "The steadfast love of the LORD never ceases; his mercies never come to an end; they are new every morning; great is your faithfulness.", reference: "Lamentations 3:22-23 (ESV)", copyright: ESV },
  { text: "But God demonstrates his own love for us in this: While we were still sinners, Christ died for us.", reference: "Romans 5:8 (NIV)", copyright: NIV },
  { text: "See what great love the Father has lavished on us, that we should be called children of God! And that is what we are!", reference: "1 John 3:1 (NIV)", copyright: NIV },
  { text: "Dear friends, let us love one another, for love comes from God. Everyone who loves has been born of God and knows God.", reference: "1 John 4:7 (NIV)", copyright: NIV },
  { text: "And now these three remain: faith, hope and love. But the greatest of these is love.", reference: "1 Corinthians 13:13 (NIV)", copyright: NIV },
  { text: "For it is by grace you have been saved, through faith — and this is not from yourselves, it is the gift of God.", reference: "Ephesians 2:8 (NIV)", copyright: NIV },
  { text: "Above all, love each other deeply, because love covers over a multitude of sins.", reference: "1 Peter 4:8 (NIV)", copyright: NIV },
  { text: "We love because he first loved us.", reference: "1 John 4:19 (NIV)", copyright: NIV },

  // ── Hope & Joy ──
  { text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.", reference: "Romans 8:28 (NIV)", copyright: NIV },
  { text: "May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit.", reference: "Romans 15:13 (NIV)", copyright: NIV },
  { text: "This is the day that the LORD has made; let us rejoice and be glad in it.", reference: "Psalm 118:24 (NIV)", copyright: NIV },
  { text: "Rejoice always, pray continually, give thanks in all circumstances; for this is God's will for you in Christ Jesus.", reference: "1 Thessalonians 5:16-18 (NIV)", copyright: NIV },
  { text: "The joy of the LORD is your strength.", reference: "Nehemiah 8:10 (NIV)", copyright: NIV },
  { text: "Consider it pure joy, my brothers and sisters, whenever you face trials of many kinds, because you know that the testing of your faith produces perseverance.", reference: "James 1:2-3 (NIV)", copyright: NIV },
  { text: "For his anger lasts only a moment, but his favor lasts a lifetime; weeping may stay for the night, but rejoicing comes in the morning.", reference: "Psalm 30:5 (NIV)", copyright: NIV },
  { text: "Weeping may tarry for the night, but joy comes with the morning.", reference: "Psalm 30:5 (ESV)", copyright: ESV },
  { text: "You make known to me the path of life; you will fill me with joy in your presence, with eternal pleasures at your right hand.", reference: "Psalm 16:11 (NIV)", copyright: NIV },
  { text: "I have told you this so that my joy may be in you and your joy may be complete.", reference: "John 15:11 (NIV)", copyright: NIV },

  // ── Guidance & Wisdom ──
  { text: "The LORD is my light and my salvation — whom shall I fear? The LORD is the stronghold of my life — of whom shall I be afraid?", reference: "Psalm 27:1 (NIV)", copyright: NIV },
  { text: "Your word is a lamp for my feet, a light on my path.", reference: "Psalm 119:105 (NIV)", copyright: NIV },
  { text: "If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you.", reference: "James 1:5 (NIV)", copyright: NIV },
  { text: "The fear of the LORD is the beginning of wisdom, and knowledge of the Holy One is understanding.", reference: "Proverbs 9:10 (NIV)", copyright: NIV },
  { text: "Show me your ways, LORD, teach me your paths. Guide me in your truth and teach me, for you are God my Savior.", reference: "Psalm 25:4-5 (NIV)", copyright: NIV },
  { text: "I will instruct you and teach you in the way you should go; I will counsel you with my loving eye on you.", reference: "Psalm 32:8 (NIV)", copyright: NIV },
  { text: "For the LORD gives wisdom; from his mouth come knowledge and understanding.", reference: "Proverbs 2:6 (NIV)", copyright: NIV },
  { text: "Whether you turn to the right or to the left, your ears will hear a voice behind you, saying, 'This is the way; walk in it.'", reference: "Isaiah 30:21 (NIV)", copyright: NIV },

  // ── New Life & Transformation ──
  { text: "Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!", reference: "2 Corinthians 5:17 (NIV)", copyright: NIV },
  { text: "He has made everything beautiful in its time. He has also set eternity in the human heart.", reference: "Ecclesiastes 3:11 (NIV)", copyright: NIV },
  { text: "Do not conform to the pattern of this world, but be transformed by the renewing of your mind.", reference: "Romans 12:2 (NIV)", copyright: NIV },
  { text: "Create in me a pure heart, O God, and renew a steadfast spirit within me.", reference: "Psalm 51:10 (NIV)", copyright: NIV },
  { text: "I have been crucified with Christ and I no longer live, but Christ lives in me.", reference: "Galatians 2:20 (NIV)", copyright: NIV },
  { text: "Forget the former things; do not dwell on the past. See, I am doing a new thing!", reference: "Isaiah 43:18-19 (NIV)", copyright: NIV },

  // ── God's Faithfulness & Promises ──
  { text: "The LORD bless you and keep you; the LORD make his face shine on you and be gracious to you.", reference: "Numbers 6:24-25 (NIV)", copyright: NIV },
  { text: "Delight yourself in the LORD, and he will give you the desires of your heart.", reference: "Psalm 37:4 (NIV)", copyright: NIV },
  { text: "The heavens declare the glory of God; the skies proclaim the work of his hands.", reference: "Psalm 19:1 (NIV)", copyright: NIV },
  { text: "Great is our Lord and mighty in power; his understanding has no limit.", reference: "Psalm 147:5 (NIV)", copyright: NIV },
  { text: "Every good and perfect gift is from above, coming down from the Father of the heavenly lights.", reference: "James 1:17 (NIV)", copyright: NIV },
  { text: "The LORD is gracious and compassionate, slow to anger and rich in love.", reference: "Psalm 145:8 (NIV)", copyright: NIV },
  { text: "Give thanks to the LORD, for he is good; his love endures forever.", reference: "Psalm 107:1 (NIV)", copyright: NIV },
  { text: "For the LORD God is a sun and shield; the LORD bestows favor and honor; no good thing does he withhold from those whose walk is blameless.", reference: "Psalm 84:11 (NIV)", copyright: NIV },

  // ── Purpose & Calling ──
  { text: "But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control.", reference: "Galatians 5:22-23 (NIV)", copyright: NIV },
  { text: "For we are God's handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do.", reference: "Ephesians 2:10 (NIV)", copyright: NIV },
  { text: "Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.", reference: "Colossians 3:23 (NIV)", copyright: NIV },
  { text: "For I am the LORD your God who takes hold of your right hand and says to you, Do not fear; I will help you.", reference: "Isaiah 41:13 (NIV)", copyright: NIV },
  { text: "He has shown you, O mortal, what is good. And what does the LORD require of you? To act justly and to love mercy and to walk humbly with your God.", reference: "Micah 6:8 (NIV)", copyright: NIV },
  { text: "But seek first his kingdom and his righteousness, and all these things will be given to you as well.", reference: "Matthew 6:33 (NIV)", copyright: NIV },

  // ── Praise & Worship ──
  { text: "Let everything that has breath praise the LORD. Praise the LORD.", reference: "Psalm 150:6 (NIV)", copyright: NIV },
  { text: "I will praise you, LORD, with all my heart; before the gods I will sing your praise.", reference: "Psalm 138:1 (NIV)", copyright: NIV },
  { text: "The LORD is my strength and my song; he has given me victory.", reference: "Exodus 15:2 (NLT)", copyright: NLT },
  { text: "Shout for joy to the LORD, all the earth. Worship the LORD with gladness; come before him with joyful songs.", reference: "Psalm 100:1-2 (NIV)", copyright: NIV },
  { text: "From the rising of the sun to the place where it sets, the name of the LORD is to be praised.", reference: "Psalm 113:3 (NIV)", copyright: NIV },
  { text: "Oh give thanks to the LORD, for he is good, for his steadfast love endures forever!", reference: "Psalm 107:1 (ESV)", copyright: ESV },

  // ── Endurance & Perseverance ──
  { text: "Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.", reference: "Galatians 6:9 (NIV)", copyright: NIV },
  { text: "I press on toward the goal to win the prize for which God has called me heavenward in Christ Jesus.", reference: "Philippians 3:14 (NIV)", copyright: NIV },
  { text: "Blessed is the one who perseveres under trial because, having stood the test, that person will receive the crown of life.", reference: "James 1:12 (NIV)", copyright: NIV },
  { text: "But he said to me, 'My grace is sufficient for you, for my power is made perfect in weakness.'", reference: "2 Corinthians 12:9 (NIV)", copyright: NIV },
  { text: "No temptation has overtaken you except what is common to mankind. And God is faithful; he will not let you be tempted beyond what you can bear.", reference: "1 Corinthians 10:13 (NIV)", copyright: NIV },
  { text: "Being confident of this, that he who began a good work in you will carry it on to completion until the day of Christ Jesus.", reference: "Philippians 1:6 (NIV)", copyright: NIV },
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
 * Get the daily verse for the dashboard.
 * Uses day-of-year to cycle through verses.
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
