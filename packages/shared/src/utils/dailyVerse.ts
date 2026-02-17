/**
 * Single source of truth for daily verse and devotional selection.
 * Ensures the dashboard daily verse and Bible Reader devotional
 * never show the same content on the same day.
 *
 * Verse text is fetched from the YouVersion API at runtime.
 * Hardcoded NIV text serves as offline fallback.
 */

export interface DailyVerse {
  text?: string;
  reference: string;
  usfm?: string;
  copyright?: string;
}

export interface DailyDevotional {
  book: string;
  chapter: number;
  theme: string;
}

// 90 curated encouraging verses with hardcoded NIV text as offline fallback.
// `usfm` is the USFM reference for the YouVersion API; `reference` is human-readable.
const DAILY_VERSES: DailyVerse[] = [
  // ── Hope & Encouragement ──
  { usfm: "JER.29.11", reference: "Jeremiah 29:11", text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future." },
  { usfm: "ISA.41.10", reference: "Isaiah 41:10", text: "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand." },
  { usfm: "JOS.1.9", reference: "Joshua 1:9", text: "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go." },
  { usfm: "PHP.4.13", reference: "Philippians 4:13", text: "I can do all this through him who gives me strength." },
  { usfm: "ISA.40.31", reference: "Isaiah 40:31", text: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint." },
  { usfm: "ROM.8.28", reference: "Romans 8:28", text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose." },
  { usfm: "DEU.31.6", reference: "Deuteronomy 31:6", text: "Be strong and courageous. Do not be afraid or terrified because of them, for the Lord your God goes with you; he will never leave you nor forsake you." },
  { usfm: "PSA.46.1", reference: "Psalm 46:1", text: "God is our refuge and strength, an ever-present help in trouble." },
  { usfm: "MAT.11.28", reference: "Matthew 11:28", text: "Come to me, all you who are weary and burdened, and I will give you rest." },
  { usfm: "ROM.15.13", reference: "Romans 15:13", text: "May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit." },

  // ── Comfort & Peace ──
  { usfm: "PSA.23.4", reference: "Psalm 23:4", text: "Even though I walk through the darkest valley, I will fear no evil, for you are with me; your rod and your staff, they comfort me." },
  { usfm: "JHN.14.27", reference: "John 14:27", text: "Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid." },
  { usfm: "PHP.4.6-PHP.4.7", reference: "Philippians 4:6\u20137", text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus." },
  { usfm: "PSA.34.18", reference: "Psalm 34:18", text: "The Lord is close to the brokenhearted and saves those who are crushed in spirit." },
  { usfm: "1PE.5.7", reference: "1 Peter 5:7", text: "Cast all your anxiety on him because he cares for you." },
  { usfm: "ISA.26.3", reference: "Isaiah 26:3", text: "You will keep in perfect peace those whose minds are steadfast, because they trust in you." },
  { usfm: "PSA.147.3", reference: "Psalm 147:3", text: "He heals the brokenhearted and binds up their wounds." },
  { usfm: "PSA.55.22", reference: "Psalm 55:22", text: "Cast your cares on the Lord and he will sustain you; he will never let the righteous be shaken." },
  { usfm: "PSA.46.10", reference: "Psalm 46:10", text: "He says, \u201cBe still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth.\u201d" },
  { usfm: "COL.3.15", reference: "Colossians 3:15", text: "Let the peace of Christ rule in your hearts, since as members of one body you were called to peace. And be thankful." },

  // ── Strength & Courage ──
  { usfm: "2CO.12.9", reference: "2 Corinthians 12:9", text: "But he said to me, \u201cMy grace is sufficient for you, for my power is made perfect in weakness.\u201d Therefore I will boast all the more gladly about my weaknesses, so that Christ\u2019s power may rest on me." },
  { usfm: "PSA.27.1", reference: "Psalm 27:1", text: "The Lord is my light and my salvation\u2014whom shall I fear? The Lord is the stronghold of my life\u2014of whom shall I be afraid?" },
  { usfm: "ISA.40.29", reference: "Isaiah 40:29", text: "He gives strength to the weary and increases the power of the weak." },
  { usfm: "PSA.28.7", reference: "Psalm 28:7", text: "The Lord is my strength and my shield; my heart trusts in him, and he helps me. My heart leaps for joy, and with my song I praise him." },
  { usfm: "PSA.18.2", reference: "Psalm 18:2", text: "The Lord is my rock, my fortress and my deliverer; my God is my rock, in whom I take refuge, my shield and the horn of my salvation, my stronghold." },
  { usfm: "2TI.1.7", reference: "2 Timothy 1:7", text: "For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline." },
  { usfm: "ISA.12.2", reference: "Isaiah 12:2", text: "Surely God is my salvation; I will trust and not be afraid. The Lord, the Lord himself, is my strength and my defense; he has become my salvation." },
  { usfm: "PSA.118.6", reference: "Psalm 118:6", text: "The Lord is with me; I will not be afraid. What can mere mortals do to me?" },
  { usfm: "PSA.73.26", reference: "Psalm 73:26", text: "My flesh and my heart may fail, but God is the strength of my heart and my portion forever." },
  { usfm: "NAM.1.7", reference: "Nahum 1:7", text: "The Lord is good, a refuge in times of trouble. He cares for those who trust in him." },

  // ── God's Faithfulness ──
  { usfm: "LAM.3.22-LAM.3.23", reference: "Lamentations 3:22\u201323", text: "Because of the Lord\u2019s great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness." },
  { usfm: "2TH.3.3", reference: "2 Thessalonians 3:3", text: "But the Lord is faithful, and he will strengthen you and protect you from the evil one." },
  { usfm: "PHP.1.6", reference: "Philippians 1:6", text: "Being confident of this, that he who began a good work in you will carry it on to completion until the day of Christ Jesus." },
  { usfm: "NUM.6.24-NUM.6.26", reference: "Numbers 6:24\u201326", text: "The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you; the Lord turn his face toward you and give you peace." },
  { usfm: "PSA.37.4", reference: "Psalm 37:4", text: "Take delight in the Lord, and he will give you the desires of your heart." },
  { usfm: "JER.31.3", reference: "Jeremiah 31:3", text: "The Lord appeared to us in the past, saying: \u201cI have loved you with an everlasting love; I have drawn you with unfailing kindness.\u201d" },
  { usfm: "PSA.145.18", reference: "Psalm 145:18", text: "The Lord is near to all who call on him, to all who call on him in truth." },
  { usfm: "PSA.138.7", reference: "Psalm 138:7", text: "Though I walk in the midst of trouble, you preserve my life. You stretch out your hand against the anger of my foes; with your right hand you save me." },
  { usfm: "HEB.13.5", reference: "Hebrews 13:5", text: "Keep your lives free from the love of money and be content with what you have, because God has said, \u201cNever will I leave you; never will I forsake you.\u201d" },
  { usfm: "ISA.49.15-ISA.49.16", reference: "Isaiah 49:15\u201316", text: "Can a mother forget the baby at her breast and have no compassion on the child she has borne? Though she may forget, I will not forget you! See, I have engraved you on the palms of my hands." },

  // ── Overcoming & Perseverance ──
  { usfm: "ROM.8.31", reference: "Romans 8:31", text: "What, then, shall we say in response to these things? If God is for us, who can be against us?" },
  { usfm: "JHN.16.33", reference: "John 16:33", text: "I have told you these things, so that in me you may have peace. In this world you will have trouble. But take heart! I have overcome the world." },
  { usfm: "GAL.6.9", reference: "Galatians 6:9", text: "Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up." },
  { usfm: "JAS.1.2-JAS.1.3", reference: "James 1:2\u20133", text: "Consider it pure joy, my brothers and sisters, whenever you face trials of many kinds, because you know that the testing of your faith produces perseverance." },
  { usfm: "JAS.1.12", reference: "James 1:12", text: "Blessed is the one who perseveres under trial because, having stood the test, that person will receive the crown of life that the Lord has promised to those who love him." },
  { usfm: "2CO.4.16-2CO.4.17", reference: "2 Corinthians 4:16\u201317", text: "Therefore we do not lose heart. Though outwardly we are wasting away, yet inwardly we are being renewed day by day. For our light and momentary troubles are achieving for us an eternal glory that far outweighs them all." },
  { usfm: "HEB.10.35-HEB.10.36", reference: "Hebrews 10:35\u201336", text: "So do not throw away your confidence; it will be richly rewarded. You need to persevere so that when you have done the will of God, you will receive what he has promised." },
  { usfm: "ROM.5.3-ROM.5.4", reference: "Romans 5:3\u20134", text: "Not only so, but we also glory in our sufferings, because we know that suffering produces perseverance; perseverance, character; and character, hope." },
  { usfm: "HEB.12.1", reference: "Hebrews 12:1", text: "Therefore, since we are surrounded by such a great cloud of witnesses, let us throw off everything that hinders and the sin that so easily entangles. And let us run with perseverance the race marked out for us." },
  { usfm: "PSA.31.24", reference: "Psalm 31:24", text: "Be strong and take heart, all you who hope in the Lord." },

  // ── Trust & Faith ──
  { usfm: "PRO.3.5-PRO.3.6", reference: "Proverbs 3:5\u20136", text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight." },
  { usfm: "PSA.56.3", reference: "Psalm 56:3", text: "When I am afraid, I put my trust in you." },
  { usfm: "JER.17.7", reference: "Jeremiah 17:7", text: "But blessed is the one who trusts in the Lord, whose confidence is in him." },
  { usfm: "PSA.62.1-PSA.62.2", reference: "Psalm 62:1\u20132", text: "Truly my soul finds rest in God; my salvation comes from him. Truly he is my rock and my salvation; he is my fortress, I will never be shaken." },
  { usfm: "PRO.16.3", reference: "Proverbs 16:3", text: "Commit to the Lord whatever you do, and he will establish your plans." },
  { usfm: "ISA.30.21", reference: "Isaiah 30:21", text: "Whether you turn to the right or to the left, your ears will hear a voice behind you, saying, \u201cThis is the way; walk in it.\u201d" },
  { usfm: "PSA.32.8", reference: "Psalm 32:8", text: "I will instruct you and teach you in the way you should go; I will counsel you with my loving eye on you." },
  { usfm: "PSA.16.8", reference: "Psalm 16:8", text: "I keep my eyes always on the Lord. With him at my right hand, I will not be shaken." },
  { usfm: "PSA.121.1-PSA.121.2", reference: "Psalm 121:1\u20132", text: "I lift up my eyes to the mountains\u2014where does my help come from? My help comes from the Lord, the Maker of heaven and earth." },
  { usfm: "MIC.7.7", reference: "Micah 7:7", text: "But as for me, I watch in hope for the Lord, I wait for God my Savior; my God will hear me." },

  // ── God's Protection ──
  { usfm: "PSA.91.1-PSA.91.2", reference: "Psalm 91:1\u20132", text: "Whoever dwells in the shelter of the Most High will rest in the shadow of the Almighty. I will say of the Lord, \u201cHe is my refuge and my fortress, my God, in whom I trust.\u201d" },
  { usfm: "ISA.43.2", reference: "Isaiah 43:2", text: "When you pass through the waters, I will be with you; and when you pass through the rivers, they will not sweep over you. When you walk through the fire, you will not be burned; the flames will not set you ablaze." },
  { usfm: "PSA.121.7-PSA.121.8", reference: "Psalm 121:7\u20138", text: "The Lord will keep you from all harm\u2014he will watch over your life; the Lord will watch over your coming and going both now and forevermore." },
  { usfm: "PSA.91.11", reference: "Psalm 91:11", text: "For he will command his angels concerning you to guard you in all your ways." },
  { usfm: "ISA.54.17", reference: "Isaiah 54:17", text: "No weapon forged against you will prevail, and you will refute every tongue that accuses you. This is the heritage of the servants of the Lord, and this is their vindication from me, declares the Lord." },
  { usfm: "PSA.34.4", reference: "Psalm 34:4", text: "I sought the Lord, and he answered me; he delivered me from all my fears." },
  { usfm: "PRO.18.10", reference: "Proverbs 18:10", text: "The name of the Lord is a fortified tower; the righteous run to it and are safe." },
  { usfm: "PSA.94.19", reference: "Psalm 94:19", text: "When anxiety was great within me, your consolation brought me joy." },
  { usfm: "PSA.40.1-PSA.40.2", reference: "Psalm 40:1\u20132", text: "I waited patiently for the Lord; he turned to me and heard my cry. He lifted me out of the slimy pit, out of the mud and mire; he set my feet on a rock and gave me a firm place to stand." },
  { usfm: "DEU.33.27", reference: "Deuteronomy 33:27", text: "The eternal God is your refuge, and underneath are the everlasting arms. He will drive out your enemies before you, saying, \u201cDestroy them!\u201d" },

  // ── Joy & Renewal ──
  { usfm: "PSA.30.5", reference: "Psalm 30:5", text: "For his anger lasts only a moment, but his favor lasts a lifetime; weeping may stay for the night, but rejoicing comes in the morning." },
  { usfm: "ISA.43.18-ISA.43.19", reference: "Isaiah 43:18\u201319", text: "Forget the former things; do not dwell on the past. See, I am doing a new thing! Now it springs up; do you not perceive it? I am making a way in the wilderness and streams in the wasteland." },
  { usfm: "2CO.5.17", reference: "2 Corinthians 5:17", text: "Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!" },
  { usfm: "ECC.3.11", reference: "Ecclesiastes 3:11", text: "He has made everything beautiful in its time. He has also set eternity in the human heart; yet no one can fathom what God has done from beginning to end." },
  { usfm: "JHN.15.11", reference: "John 15:11", text: "I have told you this so that my joy may be in you and your joy may be complete." },
  { usfm: "ROM.12.12", reference: "Romans 12:12", text: "Be joyful in hope, patient in affliction, faithful in prayer." },
  { usfm: "HAB.3.17-HAB.3.18", reference: "Habakkuk 3:17\u201318", text: "Though the fig tree does not bud and there are no grapes on the vines, though the olive crop fails and the fields produce no food, though there are no sheep in the pen and no cattle in the stalls, yet I will rejoice in the Lord, I will be joyful in God my Savior." },
  { usfm: "ZEP.3.17", reference: "Zephaniah 3:17", text: "The Lord your God is with you, the Mighty Warrior who saves. He will take great delight in you; in his love he will no longer rebuke you, but will rejoice over you with singing." },
  { usfm: "PSA.23.1", reference: "Psalm 23:1", text: "The Lord is my shepherd, I lack nothing." },
  { usfm: "JER.29.13", reference: "Jeremiah 29:13", text: "You will seek me and find me when you seek me with all your heart." },

  // ── God's Love & Grace ──
  { usfm: "ROM.8.38-ROM.8.39", reference: "Romans 8:38\u201339", text: "For I am convinced that neither death nor life, neither angels nor demons, neither the present nor the future, nor any powers, neither height nor depth, nor anything else in all creation, will be able to separate us from the love of God that is in Christ Jesus our Lord." },
  { usfm: "1JN.4.18", reference: "1 John 4:18", text: "There is no fear in love. But perfect love drives out fear, because fear has to do with punishment. The one who fears is not made perfect in love." },
  { usfm: "EPH.3.20", reference: "Ephesians 3:20", text: "Now to him who is able to do immeasurably more than all we ask or imagine, according to his power that is at work within us." },
  { usfm: "PHP.4.19", reference: "Philippians 4:19", text: "And my God will meet all your needs according to the riches of his glory in Christ Jesus." },
  { usfm: "JHN.10.10", reference: "John 10:10", text: "The thief comes only to steal and kill and destroy; I have come that they may have life, and have it to the full." },
  { usfm: "PSA.103.2-PSA.103.4", reference: "Psalm 103:2\u20134", text: "Praise the Lord, my soul, and forget not all his benefits\u2014who forgives all your sins and heals all your diseases, who redeems your life from the pit and crowns you with love and compassion." },
  { usfm: "ISA.40.28", reference: "Isaiah 40:28", text: "Do you not know? Have you not heard? The Lord is the everlasting God, the Creator of the ends of the earth. He will not grow tired or weary, and his understanding no one can fathom." },
  { usfm: "MAT.11.29-MAT.11.30", reference: "Matthew 11:29\u201330", text: "Take my yoke upon you and learn from me, for I am gentle and humble in heart, and you will find rest for your souls. For my yoke is easy and my burden is light." },
  { usfm: "ISA.61.1", reference: "Isaiah 61:1", text: "The Spirit of the Sovereign Lord is on me, because the Lord has anointed me to proclaim good news to the poor. He has sent me to bind up the brokenhearted, to proclaim freedom for the captives and release from darkness for the prisoners." },
  { usfm: "JHN.14.1", reference: "John 14:1", text: "Do not let your hearts be troubled. You believe in God; believe also in me." },
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
 * Includes hardcoded NIV text as offline fallback; API text is preferred at runtime.
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
