import { useState, useMemo } from 'react';
import { useTranslation } from '@weather/shared';
import { useVotd, useBiblePassage, BIBLE_BOOKS } from '../hooks/useBibleData';
import type { BiblePassage } from '../hooks/useBibleData';

function VotdSection() {
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
        <p className="text-sm text-yellow-700 dark:text-yellow-300">Unable to load verse of the day</p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800/40">
      <h2 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-wide">
        Verse of the Day
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
  const [filter, setFilter] = useState('');

  const filtered = useMemo(() => {
    if (!filter) return BIBLE_BOOKS;
    const lower = filter.toLowerCase();
    return BIBLE_BOOKS.filter(b => b.name.toLowerCase().includes(lower));
  }, [filter]);

  // Group into OT (0-38) and NT (39-65)
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
        placeholder="Search books..."
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4"
      />

      {oldTestament.length > 0 && (
        <>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Old Testament</h3>
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
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">New Testament</h3>
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
  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        All Books
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

function PassageDisplay({ book, chapter, passage, loading, error, onBack }: {
  book: string;
  chapter: number;
  passage: BiblePassage | null;
  loading: boolean;
  error: unknown;
  onBack: () => void;
}) {
  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {book} — Chapters
      </button>

      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        {book} {chapter}
      </h3>

      {loading && (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800/40">
          <p className="text-sm text-red-700 dark:text-red-300">Failed to load passage. Please try again.</p>
        </div>
      )}

      {passage && !loading && (
        <div>
          <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-line">
            {passage.text}
          </div>
          {passage.translation && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
              Translation: {passage.translation}
              {passage.verseCount > 0 && ` — ${passage.verseCount} verses`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

type View = 'books' | 'chapters' | 'passage';

export default function BibleReader() {
  const { t } = useTranslation();
  const [view, setView] = useState<View>('books');
  const [currentBook, setCurrentBook] = useState('');
  const [currentChapters, setCurrentChapters] = useState(0);
  const [currentChapter, setCurrentChapter] = useState(0);
  const { loadPassage, passage, loading: passageLoading, error: passageError } = useBiblePassage();

  const handleBookSelect = (book: string, chapters: number) => {
    setCurrentBook(book);
    setCurrentChapters(chapters);
    if (chapters === 1) {
      // Single-chapter books go straight to passage
      setCurrentChapter(1);
      loadPassage(book, 1);
      setView('passage');
    } else {
      setView('chapters');
    }
  };

  const handleChapterSelect = (chapter: number) => {
    setCurrentChapter(chapter);
    loadPassage(currentBook, chapter);
    setView('passage');
  };

  return (
    <div className="space-y-6">
      <VotdSection />

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
          {t('bible.readScripture') || 'Read Scripture'}
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
            passage={passage}
            loading={passageLoading}
            error={passageError}
            onBack={() => setView('chapters')}
          />
        )}
      </div>

      <p className="text-xs text-center text-gray-400 dark:text-gray-500">
        Scripture text from bible-api.com (World English Bible)
      </p>
    </div>
  );
}
