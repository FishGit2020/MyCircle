import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation, StorageKeys, WindowEvents, getDailyDevotional, parseVerseReference, PageContent } from '@mycircle/shared';
import { useVotd, useBiblePassage, useComparisonPassage, useBibleVersions, BIBLE_BOOKS } from '../hooks/useBibleData';
import type { BiblePassage } from '../hooks/useBibleData';

// Default Bible version (NIV 2011 = 111 on YouVersion)
const DEFAULT_VERSION_ID = '111';

// --- Reference search helpers (US1) ---

type VerseReference = { book: string; chapter: number; verse: number | null };

/** Maps common abbreviations to canonical BIBLE_BOOKS names (lowercase keys). */
const BOOK_ALIASES: Record<string, string> = {
  // Old Testament
  gen: 'Genesis', genesis: 'Genesis',
  ex: 'Exodus', exo: 'Exodus', exodus: 'Exodus',
  lev: 'Leviticus', leviticus: 'Leviticus',
  num: 'Numbers', numbers: 'Numbers',
  deut: 'Deuteronomy', dt: 'Deuteronomy', deuteronomy: 'Deuteronomy',
  josh: 'Joshua', joshua: 'Joshua',
  judg: 'Judges', jdg: 'Judges', judges: 'Judges',
  ruth: 'Ruth',
  '1sam': '1 Samuel', '1sm': '1 Samuel', '1 samuel': '1 Samuel',
  '2sam': '2 Samuel', '2sm': '2 Samuel', '2 samuel': '2 Samuel',
  '1ki': '1 Kings', '1kgs': '1 Kings', '1 kings': '1 Kings',
  '2ki': '2 Kings', '2kgs': '2 Kings', '2 kings': '2 Kings',
  '1chr': '1 Chronicles', '1chron': '1 Chronicles', '1 chronicles': '1 Chronicles',
  '2chr': '2 Chronicles', '2chron': '2 Chronicles', '2 chronicles': '2 Chronicles',
  ezra: 'Ezra',
  neh: 'Nehemiah', nehemiah: 'Nehemiah',
  esth: 'Esther', est: 'Esther', esther: 'Esther',
  job: 'Job',
  ps: 'Psalms', psa: 'Psalms', psalm: 'Psalms', psalms: 'Psalms',
  prov: 'Proverbs', pr: 'Proverbs', pro: 'Proverbs', proverbs: 'Proverbs',
  eccl: 'Ecclesiastes', ecc: 'Ecclesiastes', ecclesiastes: 'Ecclesiastes',
  song: 'Song of Solomon', sos: 'Song of Solomon', ss: 'Song of Solomon', sg: 'Song of Solomon', 'song of solomon': 'Song of Solomon',
  isa: 'Isaiah', isaiah: 'Isaiah',
  jer: 'Jeremiah', jeremiah: 'Jeremiah',
  lam: 'Lamentations', lamentations: 'Lamentations',
  ezek: 'Ezekiel', eze: 'Ezekiel', ezekiel: 'Ezekiel',
  dan: 'Daniel', daniel: 'Daniel',
  hos: 'Hosea', hosea: 'Hosea',
  joel: 'Joel',
  amos: 'Amos',
  obad: 'Obadiah', ob: 'Obadiah', obadiah: 'Obadiah',
  jonah: 'Jonah', jon: 'Jonah',
  mic: 'Micah', micah: 'Micah',
  nah: 'Nahum', nahum: 'Nahum',
  hab: 'Habakkuk', habakkuk: 'Habakkuk',
  zeph: 'Zephaniah', zep: 'Zephaniah', zephaniah: 'Zephaniah',
  hag: 'Haggai', haggai: 'Haggai',
  zech: 'Zechariah', zec: 'Zechariah', zechariah: 'Zechariah',
  mal: 'Malachi', malachi: 'Malachi',
  // New Testament
  matt: 'Matthew', mt: 'Matthew', matthew: 'Matthew',
  mark: 'Mark', mk: 'Mark', mr: 'Mark',
  luke: 'Luke', lk: 'Luke',
  john: 'John', jn: 'John',
  acts: 'Acts',
  rom: 'Romans', romans: 'Romans',
  '1cor': '1 Corinthians', '1co': '1 Corinthians', '1 corinthians': '1 Corinthians',
  '2cor': '2 Corinthians', '2co': '2 Corinthians', '2 corinthians': '2 Corinthians',
  gal: 'Galatians', galatians: 'Galatians',
  eph: 'Ephesians', ephesians: 'Ephesians',
  phil: 'Philippians', php: 'Philippians', philippians: 'Philippians',
  col: 'Colossians', colossians: 'Colossians',
  '1thess': '1 Thessalonians', '1th': '1 Thessalonians', '1 thessalonians': '1 Thessalonians',
  '2thess': '2 Thessalonians', '2th': '2 Thessalonians', '2 thessalonians': '2 Thessalonians',
  '1tim': '1 Timothy', '1ti': '1 Timothy', '1 timothy': '1 Timothy',
  '2tim': '2 Timothy', '2ti': '2 Timothy', '2 timothy': '2 Timothy',
  titus: 'Titus', tit: 'Titus',
  philem: 'Philemon', phlm: 'Philemon', phm: 'Philemon', philemon: 'Philemon',
  heb: 'Hebrews', hebrews: 'Hebrews',
  jas: 'James', ja: 'James', james: 'James',
  '1pet': '1 Peter', '1pe': '1 Peter', '1pt': '1 Peter', '1 peter': '1 Peter',
  '2pet': '2 Peter', '2pe': '2 Peter', '2pt': '2 Peter', '2 peter': '2 Peter',
  '1jn': '1 John', '1jo': '1 John', '1 john': '1 John',
  '2jn': '2 John', '2jo': '2 John', '2 john': '2 John',
  '3jn': '3 John', '3jo': '3 John', '3 john': '3 John',
  jude: 'Jude',
  rev: 'Revelation', apoc: 'Revelation', revelation: 'Revelation',
};

/**
 * Parse a user-typed reference like "John 3:16", "Ps 23", "1 Cor 13" into
 * a resolved canonical book name + chapter + optional verse number.
 * Returns null if the book cannot be resolved or chapter is not valid.
 */
function parseRefInput(input: string): VerseReference | null {
  const normalized = input.trim().replace(/\s+/g, ' ').toLowerCase();
  if (!normalized) return null;
  // Match: optional number-prefix book name + chapter + optional :verse
  const m = normalized.match(/^(.+?)\s+(\d+)(?:[:.](\d+))?$/);
  if (!m) return null;
  const rawBook = m[1].trim();
  const chapter = parseInt(m[2], 10);
  const verse = m[3] ? parseInt(m[3], 10) : null;
  if (!chapter || chapter < 1) return null;
  // Resolve alias or match canonical name directly (case-insensitive)
  const canonical = BOOK_ALIASES[rawBook]
    ?? BIBLE_BOOKS.find(b => b.name.toLowerCase() === rawBook)?.name
    ?? null;
  if (!canonical) return null;
  return { book: canonical, chapter, verse };
}

function loadBibleVersion(): string {
  try {
    const stored = localStorage.getItem(StorageKeys.BIBLE_TRANSLATION);
    if (stored) return stored;
  } catch { /* */ }
  return DEFAULT_VERSION_ID;
}

function saveBibleVersion(version: string) {
  try { localStorage.setItem(StorageKeys.BIBLE_TRANSLATION, version); } catch { /* */ }
}

// --- Bookmark helpers ---
interface Bookmark {
  book: string;
  chapter: number;
  label: string;
  timestamp: number;
}

function loadBookmarks(): Bookmark[] {
  try {
    const stored = localStorage.getItem(StorageKeys.BIBLE_BOOKMARKS);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveBookmarks(bookmarks: Bookmark[]) {
  try {
    localStorage.setItem(StorageKeys.BIBLE_BOOKMARKS, JSON.stringify(bookmarks));
    window.dispatchEvent(new Event(WindowEvents.BIBLE_BOOKMARKS_CHANGED));
  } catch { /* */ }
}

// --- Last read helpers ---
interface LastRead {
  book: string;
  chapter: number;
  chapters: number;
}

function loadLastRead(): LastRead | null {
  try {
    const stored = localStorage.getItem(StorageKeys.BIBLE_LAST_READ);
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
}

function saveLastRead(data: LastRead) {
  try { localStorage.setItem(StorageKeys.BIBLE_LAST_READ, JSON.stringify(data)); } catch { /* */ }
}

// --- Font size helpers ---
const FONT_SIZES = [14, 16, 18, 20, 22];
const DEFAULT_FONT_SIZE = 16;

function loadFontSize(): number {
  try {
    const stored = localStorage.getItem(StorageKeys.BIBLE_FONT_SIZE);
    if (stored) { const n = parseInt(stored, 10); if (FONT_SIZES.includes(n)) return n; }
  } catch { /* */ }
  return DEFAULT_FONT_SIZE;
}

function saveFontSize(size: number) {
  try { localStorage.setItem(StorageKeys.BIBLE_FONT_SIZE, String(size)); } catch { /* */ }
}

// Daily devotional is now sourced from @mycircle/shared's getDailyDevotional()
function getTodayDevotional() {
  return getDailyDevotional();
}

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function isDevotionalCompleted(): boolean {
  try {
    const log = localStorage.getItem(StorageKeys.BIBLE_DEVOTIONAL_LOG);
    if (!log) return false;
    const parsed: string[] = JSON.parse(log);
    return parsed.includes(getTodayKey());
  } catch { return false; }
}

function markDevotionalCompleted() {
  try {
    const log = localStorage.getItem(StorageKeys.BIBLE_DEVOTIONAL_LOG);
    const parsed: string[] = log ? JSON.parse(log) : [];
    const key = getTodayKey();
    if (!parsed.includes(key)) {
      // Keep last 90 days to avoid unbounded growth
      const updated = [...parsed.slice(-89), key];
      localStorage.setItem(StorageKeys.BIBLE_DEVOTIONAL_LOG, JSON.stringify(updated));
    }
  } catch { /* */ }
}

// --- Sub-components ---

function VotdSection({ onReadChapter }: { onReadChapter?: (book: string, chapter: number) => void }) {
  const { t } = useTranslation();
  const { verse, loading, error } = useVotd();

  if (loading) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800/40 animate-pulse min-h-[140px]">
        <div className="h-4 bg-blue-200 dark:bg-blue-800/40 rounded w-3/4 mx-auto mb-3" />
        <div className="h-3 bg-blue-200 dark:bg-blue-800/40 rounded w-1/2 mx-auto" />
      </div>
    );
  }

  if (error || !verse) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800/40">
        <p className="text-sm text-yellow-700 dark:text-yellow-300">{t('bible.votdError')}</p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800/40 min-h-[140px]">
      <h2 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-wide">
        {t('bible.verseOfDay')}
      </h2>
      <blockquote className="text-lg italic text-blue-700 dark:text-blue-300 leading-relaxed">
        &ldquo;{verse.text}&rdquo;
      </blockquote>
      <p className="text-sm text-blue-500 dark:text-blue-400 mt-3 font-medium">
        — {verse.reference}
        {verse.translation ? ` (${verse.translation})` : ''}
      </p>
      {verse.copyright && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{verse.copyright}</p>
      )}
      {onReadChapter && (() => {
        const parsed = parseVerseReference(verse.reference);
        if (!parsed) return null;
        return (
          <button
            type="button"
            onClick={() => onReadChapter(parsed.book, parsed.chapter)}
            className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
          >
            {t('bible.readChapter')} &rarr;
          </button>
        );
      })()}
    </div>
  );
}

function DailyDevotional({ onRead }: { onRead: (book: string, chapter: number) => void }) {
  const { t } = useTranslation();
  const devotional = getTodayDevotional();
  const [completed, setCompleted] = useState(isDevotionalCompleted);

  const handleRead = () => {
    markDevotionalCompleted();
    setCompleted(true);
    onRead(devotional.book, devotional.chapter);
  };

  return (
    <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-5 border border-amber-200 dark:border-amber-700/60">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-amber-700 dark:text-amber-100 uppercase tracking-wide mb-1">
            {t('bible.dailyDevotional')}
          </h2>
          <p className="text-base font-medium text-gray-800 dark:text-white">
            {devotional.book} {devotional.chapter}
          </p>
          <p className="text-sm text-amber-600 dark:text-amber-200/90 mt-1 italic">
            &ldquo;{devotional.theme}&rdquo;
          </p>
        </div>
        <button
          onClick={handleRead}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            completed
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
              : 'bg-amber-600 dark:bg-amber-500 text-white hover:bg-amber-700 dark:hover:bg-amber-600'
          }`}
        >
          {completed ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {t('bible.devotionalCompleted')}
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {t('bible.devotionalRead')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function BookSelector({ onSelect }: { onSelect: (book: string, chapters: number) => void }) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('');

  const filtered = useMemo(() => {
    if (!filter) return BIBLE_BOOKS;
    const lower = filter.toLowerCase();
    return BIBLE_BOOKS.filter(b => b.name.toLowerCase().includes(lower));
  }, [filter]);

  const oldTestament = filtered.filter(b => {
    const idx = BIBLE_BOOKS.indexOf(b);
    return idx >= 0 && idx < 39;
  });
  const newTestament = filtered.filter(b => {
    const idx = BIBLE_BOOKS.indexOf(b);
    return idx >= 39;
  });

  return (
    <div>
      <input
        type="text"
        value={filter}
        onChange={e => setFilter(e.target.value)}
        placeholder={t('bible.searchBooks')}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4"
      />

      {oldTestament.length > 0 && (
        <>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            {t('bible.oldTestament')}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 mb-4">
            {oldTestament.map(book => (
              <button
                key={book.name}
                onClick={() => onSelect(book.name, book.chapters)}
                className="text-left px-3 py-2 rounded-lg text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {book.name}
              </button>
            ))}
          </div>
        </>
      )}

      {newTestament.length > 0 && (
        <>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            {t('bible.newTestament')}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
            {newTestament.map(book => (
              <button
                key={book.name}
                onClick={() => onSelect(book.name, book.chapters)}
                className="text-left px-3 py-2 rounded-lg text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {book.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ChapterSelector({ book, chapters, onSelect, onBack }: {
  book: string;
  chapters: number;
  onSelect: (chapter: number) => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {t('bible.allBooks')}
      </button>

      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">{book}</h3>
      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1.5">
        {Array.from({ length: chapters }, (_, i) => i + 1).map(ch => (
          <button
            key={ch}
            onClick={() => onSelect(ch)}
            className="px-2 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {ch}
          </button>
        ))}
      </div>
    </div>
  );
}

function PassageDisplay({ book, chapter, totalChapters, passage, loading, error, onBack, onNavigate, highlightedVerse }: {
  book: string;
  chapter: number;
  totalChapters: number;
  passage: BiblePassage | null;
  loading: boolean;
  error: unknown;
  onBack: () => void;
  onNavigate: (chapter: number) => void;
  highlightedVerse?: number | null;
}) {
  const { t } = useTranslation();
  const [fontSize, setFontSize] = useState(loadFontSize);
  const [copied, setCopied] = useState(false);
  const [bookmarks, setBookmarks] = useState(loadBookmarks);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const isBookmarked = bookmarks.some(b => b.book === book && b.chapter === chapter);

  // Scroll highlighted verse into view when it changes
  useEffect(() => {
    if (!highlightedVerse || loading) return;
    const el = document.querySelector<HTMLElement>(`[data-verse="${highlightedVerse}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightedVerse, loading]);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const token = await (window as any).__getFirebaseIdToken?.(); // eslint-disable-line @typescript-eslint/no-explicit-any
        if (mounted) setIsAuthenticated(!!token);
      } catch { if (mounted) setIsAuthenticated(false); }
    };
    check();
    const handler = () => check();
    window.addEventListener(WindowEvents.AUTH_STATE_CHANGED, handler);
    return () => { mounted = false; window.removeEventListener(WindowEvents.AUTH_STATE_CHANGED, handler); };
  }, []);

  const toggleBookmark = useCallback(() => {
    setBookmarks(prev => {
      const exists = prev.findIndex(b => b.book === book && b.chapter === chapter);
      let next: Bookmark[];
      if (exists >= 0) {
        next = prev.filter((_, i) => i !== exists);
      } else {
        next = [...prev, { book, chapter, label: `${book} ${chapter}`, timestamp: Date.now() }];
      }
      saveBookmarks(next);
      return next;
    });
  }, [book, chapter]);

  const handleCopy = useCallback(async () => {
    if (!passage) return;
    try {
      const text = passage.verses && passage.verses.length > 0
        ? passage.verses.map(v => `${v.number} ${v.text}`).join('\n')
        : passage.text;
      await navigator.clipboard.writeText(`${text}\n\n— ${passage.reference}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* */ }
  }, [passage]);

  const [linkCopied, setLinkCopied] = useState(false);

  const handleShareLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch { /* */ }
  }, []);

  const changeFontSize = useCallback((delta: number) => {
    setFontSize(prev => {
      const idx = FONT_SIZES.indexOf(prev);
      const next = FONT_SIZES[Math.max(0, Math.min(FONT_SIZES.length - 1, idx + delta))];
      saveFontSize(next);
      return next;
    });
  }, []);

  return (
    <div>
      {/* Navigation header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {book}
        </button>

        {/* Chapter navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onNavigate(chapter - 1)}
            disabled={chapter <= 1}
            className="p-1.5 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition"
            aria-label={t('bible.prevChapter')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[80px] text-center">
            {t('bible.chapter')} {chapter}
          </span>
          <button
            onClick={() => onNavigate(chapter + 1)}
            disabled={chapter >= totalChapters}
            className="p-1.5 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition"
            aria-label={t('bible.nextChapter')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
        {book} {chapter}
      </h3>

      {/* Toolbar: font size, copy, bookmark */}
      {passage && !loading && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {/* Font size */}
          <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-lg px-1">
            <button
              onClick={() => changeFontSize(-1)}
              disabled={fontSize <= FONT_SIZES[0]}
              className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white disabled:opacity-30 transition text-xs font-bold"
              aria-label={t('bible.fontSmaller')}
            >
              A-
            </button>
            <span className="text-xs text-gray-400 dark:text-gray-500 min-w-[28px] text-center">{fontSize}</span>
            <button
              onClick={() => changeFontSize(1)}
              disabled={fontSize >= FONT_SIZES[FONT_SIZES.length - 1]}
              className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white disabled:opacity-30 transition text-sm font-bold"
              aria-label={t('bible.fontLarger')}
            >
              A+
            </button>
          </div>

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white border border-gray-200 dark:border-gray-700 rounded-lg transition"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {t('bible.copied')}
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {t('bible.copy')}
              </>
            )}
          </button>

          {/* Bookmark — only for signed-in users */}
          {isAuthenticated ? (
            <button
              onClick={toggleBookmark}
              className={`flex items-center gap-1 px-2 py-1 text-xs border rounded-lg transition ${
                isBookmarked
                  ? 'text-yellow-600 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20'
                  : 'text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:text-yellow-600 dark:hover:text-yellow-400'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill={isBookmarked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              {isBookmarked ? t('bible.bookmarked') : t('bible.bookmark')}
            </button>
          ) : (
            <span
              title={t('bible.signInToBookmark')}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-300 dark:text-gray-600 border border-gray-100 dark:border-gray-700 rounded-lg cursor-default select-none"
              aria-label={t('bible.signInToBookmark')}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              {t('bible.bookmark')}
            </span>
          )}

          {/* Share link */}
          <button
            type="button"
            onClick={handleShareLink}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white border border-gray-200 dark:border-gray-700 rounded-lg transition"
          >
            {linkCopied ? (
              <>
                <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {t('bible.copied')}
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                {t('bible.sharePassage')}
              </>
            )}
          </button>
        </div>
      )}

      {loading && (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800/40">
          <p className="text-sm text-red-700 dark:text-red-300">{t('bible.passageError')}</p>
        </div>
      )}

      {passage && !loading && (
        <div>
          {passage.verses && passage.verses.length > 0 ? (
            <div
              className="leading-relaxed text-gray-700 dark:text-gray-300"
              style={{ fontSize: `${fontSize}px`, lineHeight: fontSize > 18 ? '1.8' : '1.6' }}
            >
              {passage.verses.map(verse => (
                <span
                  key={verse.number}
                  data-verse={verse.number}
                  className={verse.number === highlightedVerse ? 'bg-yellow-100 dark:bg-yellow-900/30 rounded px-1' : undefined}
                >
                  <sup className="text-xs font-bold text-blue-400 dark:text-blue-500 mr-0.5 select-none">
                    {verse.number}
                  </sup>
                  {verse.text}{' '}
                </span>
              ))}
            </div>
          ) : (
            <div
              className="prose prose-sm dark:prose-invert max-w-none leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-line"
              style={{ fontSize: `${fontSize}px`, lineHeight: fontSize > 18 ? '1.8' : '1.6' }}
            >
              {passage.text}
            </div>
          )}
          {passage.translation && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
              {t('bible.translation')}: {passage.translation}
              {passage.verseCount > 0 && ` — ${passage.verseCount} ${t('bible.verses')}`}
            </p>
          )}
          {passage.copyright && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 italic">
              {passage.copyright}
            </p>
          )}
        </div>
      )}

      {/* Bottom chapter navigation */}
      {passage && !loading && (
        <div className="flex justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => onNavigate(chapter - 1)}
            disabled={chapter <= 1}
            className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-30 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {t('bible.prevChapter')}
          </button>
          <button
            onClick={() => onNavigate(chapter + 1)}
            disabled={chapter >= totalChapters}
            className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-30 transition"
          >
            {t('bible.nextChapter')}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

// --- Main component ---

type View = 'books' | 'chapters' | 'passage';

export default function BibleReader() {
  const { t } = useTranslation();
  const [view, setView] = useState<View>('books');
  const [currentBook, setCurrentBook] = useState('');
  const [currentChapters, setCurrentChapters] = useState(0);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [bookmarks] = useState(loadBookmarks);
  const [bibleVersion, setBibleVersion] = useState(loadBibleVersion);
  // US1: Reference search state
  const [referenceInput, setReferenceInput] = useState('');
  const [referenceError, setReferenceError] = useState<string | null>(null);
  const [highlightedVerse, setHighlightedVerse] = useState<number | null>(null);
  // US3: Comparison state
  const [comparisonMode, setComparisonMode] = useState(false);
  const [secondTranslation, setSecondTranslation] = useState('');
  const { loadPassage, passage, loading: passageLoading, error: passageError } = useBiblePassage();
  const { comparisonPassage, comparisonLoading, loadComparisonPassage } = useComparisonPassage();
  const { versions: dynamicVersions, loading: versionsLoading, error: versionsError } = useBibleVersions();
  const [searchParams, setSearchParams] = useSearchParams();

  const lastRead = useMemo(() => loadLastRead(), []);

  // Read URL search params on mount — enables shareable links & bookmark navigation
  useEffect(() => {
    const bookParam = searchParams.get('book');
    const chapterParam = searchParams.get('chapter');
    const versionParam = searchParams.get('version');
    if (bookParam && chapterParam) {
      const bookData = BIBLE_BOOKS.find(b => b.name === bookParam);
      const ch = parseInt(chapterParam, 10);
      if (bookData && ch >= 1 && ch <= bookData.chapters) {
        if (versionParam) {
          setBibleVersion(versionParam);
          saveBibleVersion(versionParam);
        }
        setCurrentBook(bookData.name);
        setCurrentChapters(bookData.chapters);
        setCurrentChapter(ch);
        loadPassage(bookData.name, ch, versionParam || bibleVersion);
        saveLastRead({ book: bookData.name, chapter: ch, chapters: bookData.chapters });
        setView('passage');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVersionChange = useCallback((version: string) => {
    setBibleVersion(version);
    saveBibleVersion(version);
    // Reload current passage with new version if viewing one
    if (view === 'passage' && currentBook && currentChapter > 0) {
      loadPassage(currentBook, currentChapter, version);
      setSearchParams({ book: currentBook, chapter: String(currentChapter), version }, { replace: true });
    }
  }, [view, currentBook, currentChapter, loadPassage, setSearchParams]);

  // US1: Handle verse reference search submission
  const handleReferenceSearch = useCallback(() => {
    if (!referenceInput.trim()) return;
    const ref = parseRefInput(referenceInput);
    if (!ref) {
      setReferenceError(t('bible.referenceNotFound'));
      return;
    }
    const bookData = BIBLE_BOOKS.find(b => b.name === ref.book);
    if (!bookData || ref.chapter < 1 || ref.chapter > bookData.chapters) {
      setReferenceError(t('bible.referenceNotFound'));
      return;
    }
    setReferenceError(null);
    setReferenceInput('');
    setCurrentBook(ref.book);
    setCurrentChapters(bookData.chapters);
    setCurrentChapter(ref.chapter);
    setHighlightedVerse(ref.verse);
    loadPassage(ref.book, ref.chapter, bibleVersion);
    saveLastRead({ book: ref.book, chapter: ref.chapter, chapters: bookData.chapters });
    setSearchParams({ book: ref.book, chapter: String(ref.chapter), version: bibleVersion }, { replace: true });
    setView('passage');
  }, [referenceInput, bibleVersion, loadPassage, setSearchParams, t]);

  // US3: Toggle comparison mode
  const handleComparisonToggle = useCallback(() => {
    setComparisonMode(prev => {
      if (!prev) {
        // Opening: pick default second translation (first that differs from bibleVersion)
        const other = dynamicVersions.find(v => String(v.id) !== bibleVersion);
        const defaultSecond = other ? String(other.id) : '';
        setSecondTranslation(st => st || defaultSecond);
        if (defaultSecond && currentBook && currentChapter > 0) {
          loadComparisonPassage(currentBook, currentChapter, defaultSecond);
        }
      }
      return !prev;
    });
  }, [bibleVersion, currentBook, currentChapter, dynamicVersions, loadComparisonPassage]);

  // US3: Handle second translation selection
  const handleSecondTranslationChange = useCallback((version: string) => {
    setSecondTranslation(version);
    if (version !== bibleVersion && currentBook && currentChapter > 0) {
      loadComparisonPassage(currentBook, currentChapter, version);
    }
  }, [bibleVersion, currentBook, currentChapter, loadComparisonPassage]);

  const handleBookSelect = (book: string, chapters: number) => {
    setCurrentBook(book);
    setCurrentChapters(chapters);
    setHighlightedVerse(null);
    if (chapters === 1) {
      setCurrentChapter(1);
      loadPassage(book, 1, bibleVersion);
      saveLastRead({ book, chapter: 1, chapters });
      setSearchParams({ book, chapter: '1', version: bibleVersion }, { replace: true });
      setView('passage');
    } else {
      setView('chapters');
    }
  };

  const handleChapterSelect = (chapter: number) => {
    setCurrentChapter(chapter);
    loadPassage(currentBook, chapter, bibleVersion);
    saveLastRead({ book: currentBook, chapter, chapters: currentChapters });
    setSearchParams({ book: currentBook, chapter: String(chapter), version: bibleVersion }, { replace: true });
    window.__logAnalyticsEvent?.('bible_chapter_read', { book: currentBook, chapter });
    setView('passage');
  };

  const handleNavigateChapter = (chapter: number) => {
    if (chapter < 1 || chapter > currentChapters) return;
    setCurrentChapter(chapter);
    setHighlightedVerse(null);
    loadPassage(currentBook, chapter, bibleVersion);
    if (comparisonMode && secondTranslation && secondTranslation !== bibleVersion) {
      loadComparisonPassage(currentBook, chapter, secondTranslation);
    }
    saveLastRead({ book: currentBook, chapter, chapters: currentChapters });
    setSearchParams({ book: currentBook, chapter: String(chapter), version: bibleVersion }, { replace: true });
    window.__logAnalyticsEvent?.('bible_chapter_read', { book: currentBook, chapter });
  };

  const handleContinueReading = () => {
    if (!lastRead) return;
    setCurrentBook(lastRead.book);
    setCurrentChapters(lastRead.chapters);
    setCurrentChapter(lastRead.chapter);
    loadPassage(lastRead.book, lastRead.chapter, bibleVersion);
    setSearchParams({ book: lastRead.book, chapter: String(lastRead.chapter), version: bibleVersion }, { replace: true });
    setView('passage');
  };

  const handleDevotionalRead = (book: string, chapter: number) => {
    const bookData = BIBLE_BOOKS.find(b => b.name === book);
    if (!bookData) return;
    setCurrentBook(book);
    setCurrentChapters(bookData.chapters);
    setCurrentChapter(chapter);
    loadPassage(book, chapter, bibleVersion);
    saveLastRead({ book, chapter, chapters: bookData.chapters });
    setSearchParams({ book, chapter: String(chapter), version: bibleVersion }, { replace: true });
    setView('passage');
  };

  const handleBookmarkClick = (bm: Bookmark) => {
    const bookData = BIBLE_BOOKS.find(b => b.name === bm.book);
    if (!bookData) return;
    setCurrentBook(bm.book);
    setCurrentChapters(bookData.chapters);
    setCurrentChapter(bm.chapter);
    loadPassage(bm.book, bm.chapter, bibleVersion);
    saveLastRead({ book: bm.book, chapter: bm.chapter, chapters: bookData.chapters });
    setSearchParams({ book: bm.book, chapter: String(bm.chapter), version: bibleVersion }, { replace: true });
    setView('passage');
  };

  return (
    <PageContent className="space-y-6">
      <VotdSection onReadChapter={handleDevotionalRead} />
      <DailyDevotional onRead={handleDevotionalRead} />

      {/* Continue reading & bookmarks bar */}
      {view === 'books' && (lastRead || bookmarks.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {lastRead && (
            <button
              onClick={handleContinueReading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {t('bible.continueReading')}: {lastRead.book} {lastRead.chapter}
            </button>
          )}
          {bookmarks.slice(0, 5).map((bm, i) => (
            <button
              key={`${bm.book}-${bm.chapter}-${i}`}
              onClick={() => handleBookmarkClick(bm)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              {bm.label}
            </button>
          ))}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {t('bible.readScripture')}
          </h2>
          <div className="flex items-center gap-2">
            <label htmlFor="bible-version" className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {t('bible.version')}
            </label>
            <select
              id="bible-version"
              value={bibleVersion}
              onChange={(e) => handleVersionChange(e.target.value)}
              aria-label={t('bible.versionSelect')}
              disabled={versionsLoading}
              className="max-w-[200px] truncate px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
            >
              {versionsLoading && (
                <option value={bibleVersion}>{t('bible.loadingVersions')}</option>
              )}
              {versionsError && dynamicVersions.length === 0 && (
                <option value={DEFAULT_VERSION_ID}>KJV — King James Version</option>
              )}
              {dynamicVersions.map(v => (
                <option key={v.id} value={String(v.id)}>
                  {v.abbreviation} — {v.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* US1: Reference search bar — always visible */}
        <div className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              aria-label={t('bible.referenceSearchLabel')}
              placeholder={t('bible.referenceSearchPlaceholder')}
              value={referenceInput}
              onChange={e => { setReferenceInput(e.target.value); setReferenceError(null); }}
              onKeyDown={e => { if (e.key === 'Enter') handleReferenceSearch(); }}
              className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleReferenceSearch}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-500 transition"
            >
              {t('bible.referenceSearch')}
            </button>
          </div>
          {referenceError && (
            <p className="text-red-500 dark:text-red-400 text-xs mt-1">{referenceError}</p>
          )}
        </div>

        {view === 'books' && (
          <BookSelector onSelect={handleBookSelect} />
        )}

        {view === 'chapters' && (
          <ChapterSelector
            book={currentBook}
            chapters={currentChapters}
            onSelect={handleChapterSelect}
            onBack={() => { setView('books'); setSearchParams({}, { replace: true }); }}
          />
        )}

        {view === 'passage' && (
          <div>
            {/* US3: Comparison controls */}
            {dynamicVersions.length > 1 && (
              <div className="flex items-center justify-end gap-2 mb-3 flex-wrap">
                {comparisonMode && (
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-gray-500 dark:text-gray-400">
                      {t('bible.comparisonSecondLabel')}
                    </label>
                    <select
                      value={secondTranslation}
                      onChange={e => handleSecondTranslationChange(e.target.value)}
                      aria-label={t('bible.comparisonSecondLabel')}
                      className="text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-1.5 py-1 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    >
                      {dynamicVersions.map(v => (
                        <option key={v.id} value={String(v.id)}>
                          {v.abbreviation}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleComparisonToggle}
                  className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  {comparisonMode ? t('bible.closeComparison') : t('bible.compareTranslations')}
                </button>
              </div>
            )}
            {comparisonMode && secondTranslation === bibleVersion && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">
                {t('bible.chooseDifferentTranslation')}
              </p>
            )}
            <div className={comparisonMode && secondTranslation !== bibleVersion ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : ''}>
              <PassageDisplay
                book={currentBook}
                chapter={currentChapter}
                totalChapters={currentChapters}
                passage={passage}
                loading={passageLoading}
                error={passageError}
                onBack={() => { setComparisonMode(false); setView('chapters'); setSearchParams({}, { replace: true }); }}
                onNavigate={handleNavigateChapter}
                highlightedVerse={highlightedVerse}
              />
              {comparisonMode && secondTranslation !== bibleVersion && (
                <div className="border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700 pt-4 md:pt-0 md:pl-4">
                  {comparisonLoading ? (
                    <div className="space-y-3 animate-pulse">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                      ))}
                    </div>
                  ) : comparisonPassage ? (
                    <div>
                      {comparisonPassage.translation && (
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                          {comparisonPassage.translation}
                        </p>
                      )}
                      {comparisonPassage.verses && comparisonPassage.verses.length > 0 ? (
                        <div className="leading-relaxed text-gray-700 dark:text-gray-300 text-sm">
                          {comparisonPassage.verses.map(v => (
                            <span key={v.number}>
                              <sup className="text-xs font-bold text-blue-400 dark:text-blue-500 mr-0.5 select-none">
                                {v.number}
                              </sup>
                              {v.text}{' '}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-line">
                          {comparisonPassage.text}
                        </div>
                      )}
                      {comparisonPassage.copyright && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 italic">
                          {comparisonPassage.copyright}
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-center text-gray-400 dark:text-gray-500">
        {t('bible.attributionYouVersion')}
      </p>
    </PageContent>
  );
}
