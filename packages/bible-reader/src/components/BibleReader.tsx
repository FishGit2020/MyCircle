import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useTranslation, StorageKeys } from '@mycircle/shared';
import { useVotd, useBiblePassage, BIBLE_BOOKS } from '../hooks/useBibleData';
import type { BiblePassage } from '../hooks/useBibleData';

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
  try { localStorage.setItem(StorageKeys.BIBLE_BOOKMARKS, JSON.stringify(bookmarks)); } catch { /* */ }
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

// --- Notes helpers ---
interface NoteEntry {
  text: string;
  updatedAt: number;
}

type NotesMap = Record<string, NoteEntry>;

function loadNotes(): NotesMap {
  try {
    const stored = localStorage.getItem(StorageKeys.BIBLE_NOTES);
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

function saveNote(key: string, text: string) {
  try {
    const notes = loadNotes();
    if (text.trim()) {
      notes[key] = { text: text.trim(), updatedAt: Date.now() };
    } else {
      delete notes[key];
    }
    localStorage.setItem(StorageKeys.BIBLE_NOTES, JSON.stringify(notes));
  } catch { /* */ }
}

function getNoteKey(book: string, chapter: number): string {
  return `${book}:${chapter}`;
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

// --- Sub-components ---

function VotdSection() {
  const { t } = useTranslation();
  const { verse, loading, error } = useVotd();

  if (loading) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800/40 animate-pulse">
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
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800/40">
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

function PassageDisplay({ book, chapter, totalChapters, passage, loading, error, onBack, onNavigate }: {
  book: string;
  chapter: number;
  totalChapters: number;
  passage: BiblePassage | null;
  loading: boolean;
  error: unknown;
  onBack: () => void;
  onNavigate: (chapter: number) => void;
}) {
  const { t } = useTranslation();
  const [fontSize, setFontSize] = useState(loadFontSize);
  const [copied, setCopied] = useState(false);
  const [bookmarks, setBookmarks] = useState(loadBookmarks);
  const [notesOpen, setNotesOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const isBookmarked = bookmarks.some(b => b.book === book && b.chapter === chapter);

  // Load note when passage changes
  useEffect(() => {
    const key = getNoteKey(book, chapter);
    const notes = loadNotes();
    setNoteText(notes[key]?.text || '');
    setNoteSaved(false);
  }, [book, chapter]);

  // Debounced auto-save for notes (800ms)
  const handleNoteChange = useCallback((text: string) => {
    setNoteText(text);
    setNoteSaved(false);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveNote(getNoteKey(book, chapter), text);
      setNoteSaved(true);
    }, 800);
  }, [book, chapter]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
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
      await navigator.clipboard.writeText(`${passage.text}\n\n— ${passage.reference}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* */ }
  }, [passage]);

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

          {/* Bookmark */}
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
          <div
            className="prose prose-sm dark:prose-invert max-w-none leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-line"
            style={{ fontSize: `${fontSize}px`, lineHeight: fontSize > 18 ? '1.8' : '1.6' }}
          >
            {passage.text}
          </div>
          {passage.translation && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
              {t('bible.translation')}: {passage.translation}
              {passage.verseCount > 0 && ` — ${passage.verseCount} ${t('bible.verses')}`}
            </p>
          )}
        </div>
      )}

      {/* Notes section */}
      {passage && !loading && (
        <div className="mt-6 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => setNotesOpen(prev => !prev)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-expanded={notesOpen}
            aria-controls="passage-notes"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {t('bible.notes')}
              {noteText.trim() && !notesOpen && (
                <span className="text-xs text-gray-400 dark:text-gray-500 font-normal">
                  ({noteText.trim().length > 40 ? noteText.trim().slice(0, 40) + '...' : noteText.trim()})
                </span>
              )}
            </span>
            <span className="flex items-center gap-2">
              {noteSaved && (
                <span className="text-xs text-green-500 dark:text-green-400">{t('bible.notesSaved')}</span>
              )}
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${notesOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>
          {notesOpen && (
            <div id="passage-notes" className="p-4">
              <textarea
                value={noteText}
                onChange={e => handleNoteChange(e.target.value)}
                placeholder={t('bible.notesPlaceholder')}
                rows={4}
                aria-label={t('bible.notes')}
                className="w-full resize-y rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
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
  const { loadPassage, passage, loading: passageLoading, error: passageError } = useBiblePassage();

  const lastRead = useMemo(() => loadLastRead(), []);

  const handleBookSelect = (book: string, chapters: number) => {
    setCurrentBook(book);
    setCurrentChapters(chapters);
    if (chapters === 1) {
      setCurrentChapter(1);
      loadPassage(book, 1);
      saveLastRead({ book, chapter: 1, chapters });
      setView('passage');
    } else {
      setView('chapters');
    }
  };

  const handleChapterSelect = (chapter: number) => {
    setCurrentChapter(chapter);
    loadPassage(currentBook, chapter);
    saveLastRead({ book: currentBook, chapter, chapters: currentChapters });
    setView('passage');
  };

  const handleNavigateChapter = (chapter: number) => {
    if (chapter < 1 || chapter > currentChapters) return;
    setCurrentChapter(chapter);
    loadPassage(currentBook, chapter);
    saveLastRead({ book: currentBook, chapter, chapters: currentChapters });
  };

  const handleContinueReading = () => {
    if (!lastRead) return;
    setCurrentBook(lastRead.book);
    setCurrentChapters(lastRead.chapters);
    setCurrentChapter(lastRead.chapter);
    loadPassage(lastRead.book, lastRead.chapter);
    setView('passage');
  };

  const handleBookmarkClick = (bm: Bookmark) => {
    const bookData = BIBLE_BOOKS.find(b => b.name === bm.book);
    if (!bookData) return;
    setCurrentBook(bm.book);
    setCurrentChapters(bookData.chapters);
    setCurrentChapter(bm.chapter);
    loadPassage(bm.book, bm.chapter);
    saveLastRead({ book: bm.book, chapter: bm.chapter, chapters: bookData.chapters });
    setView('passage');
  };

  return (
    <div className="space-y-6">
      <VotdSection />

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
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
          {t('bible.readScripture')}
        </h2>

        {view === 'books' && (
          <BookSelector onSelect={handleBookSelect} />
        )}

        {view === 'chapters' && (
          <ChapterSelector
            book={currentBook}
            chapters={currentChapters}
            onSelect={handleChapterSelect}
            onBack={() => setView('books')}
          />
        )}

        {view === 'passage' && (
          <PassageDisplay
            book={currentBook}
            chapter={currentChapter}
            totalChapters={currentChapters}
            passage={passage}
            loading={passageLoading}
            error={passageError}
            onBack={() => setView('chapters')}
            onNavigate={handleNavigateChapter}
          />
        )}
      </div>

      <p className="text-xs text-center text-gray-400 dark:text-gray-500">
        {t('bible.attribution')}
      </p>
    </div>
  );
}
