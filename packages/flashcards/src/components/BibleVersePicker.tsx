import React, { useState } from 'react';
import { useTranslation, useLazyQuery, GET_BIBLE_PASSAGE } from '@mycircle/shared';
import type { FlashCard } from '../types';
import VersePicker from './VersePicker';

// 66 canonical books with chapter counts (from bible-reader)
const BIBLE_BOOKS = [
  { name: 'Genesis', chapters: 50 }, { name: 'Exodus', chapters: 40 }, { name: 'Leviticus', chapters: 27 },
  { name: 'Numbers', chapters: 36 }, { name: 'Deuteronomy', chapters: 34 }, { name: 'Joshua', chapters: 24 },
  { name: 'Judges', chapters: 21 }, { name: 'Ruth', chapters: 4 }, { name: '1 Samuel', chapters: 31 },
  { name: '2 Samuel', chapters: 24 }, { name: '1 Kings', chapters: 22 }, { name: '2 Kings', chapters: 25 },
  { name: '1 Chronicles', chapters: 29 }, { name: '2 Chronicles', chapters: 36 }, { name: 'Ezra', chapters: 10 },
  { name: 'Nehemiah', chapters: 13 }, { name: 'Esther', chapters: 10 }, { name: 'Job', chapters: 42 },
  { name: 'Psalms', chapters: 150 }, { name: 'Proverbs', chapters: 31 }, { name: 'Ecclesiastes', chapters: 12 },
  { name: 'Song of Solomon', chapters: 8 }, { name: 'Isaiah', chapters: 66 }, { name: 'Jeremiah', chapters: 52 },
  { name: 'Lamentations', chapters: 5 }, { name: 'Ezekiel', chapters: 48 }, { name: 'Daniel', chapters: 12 },
  { name: 'Hosea', chapters: 14 }, { name: 'Joel', chapters: 3 }, { name: 'Amos', chapters: 9 },
  { name: 'Obadiah', chapters: 1 }, { name: 'Jonah', chapters: 4 }, { name: 'Micah', chapters: 7 },
  { name: 'Nahum', chapters: 3 }, { name: 'Habakkuk', chapters: 3 }, { name: 'Zephaniah', chapters: 3 },
  { name: 'Haggai', chapters: 2 }, { name: 'Zechariah', chapters: 14 }, { name: 'Malachi', chapters: 4 },
  { name: 'Matthew', chapters: 28 }, { name: 'Mark', chapters: 16 }, { name: 'Luke', chapters: 24 },
  { name: 'John', chapters: 21 }, { name: 'Acts', chapters: 28 }, { name: 'Romans', chapters: 16 },
  { name: '1 Corinthians', chapters: 16 }, { name: '2 Corinthians', chapters: 13 }, { name: 'Galatians', chapters: 6 },
  { name: 'Ephesians', chapters: 6 }, { name: 'Philippians', chapters: 4 }, { name: 'Colossians', chapters: 4 },
  { name: '1 Thessalonians', chapters: 5 }, { name: '2 Thessalonians', chapters: 3 }, { name: '1 Timothy', chapters: 6 },
  { name: '2 Timothy', chapters: 4 }, { name: 'Titus', chapters: 3 }, { name: 'Philemon', chapters: 1 },
  { name: 'Hebrews', chapters: 13 }, { name: 'James', chapters: 5 }, { name: '1 Peter', chapters: 5 },
  { name: '2 Peter', chapters: 3 }, { name: '1 John', chapters: 5 }, { name: '2 John', chapters: 1 },
  { name: '3 John', chapters: 1 }, { name: 'Jude', chapters: 1 }, { name: 'Revelation', chapters: 22 },
];

interface VerseItem {
  number: number;
  text: string;
}

interface PassageResponse {
  biblePassage: {
    text: string;
    reference: string;
    verseCount: number;
    verses: VerseItem[];
  };
}

interface BibleVersePickerProps {
  onAddCards: (cards: FlashCard[]) => void;
  onClose: () => void;
}

type Step = 'book' | 'chapter' | 'verse';

export default function BibleVersePicker({ onAddCards, onClose }: BibleVersePickerProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('book');
  const [selectedBook, setSelectedBook] = useState('');
  const [selectedChapter, setSelectedChapter] = useState(0);

  const [fetchPassage, { data, loading }] = useLazyQuery<PassageResponse>(GET_BIBLE_PASSAGE, {
    fetchPolicy: 'cache-first',
  });

  const book = BIBLE_BOOKS.find(b => b.name === selectedBook);

  const handleBookSelect = (bookName: string) => {
    setSelectedBook(bookName);
    setStep('chapter');
  };

  const handleChapterSelect = (ch: number) => {
    setSelectedChapter(ch);
    fetchPassage({ variables: { reference: `${selectedBook} ${ch}` } });
    setStep('verse');
  };

  const handleAddCards = (cardData: Array<{ front: string; back: string; reference: string; verseRange: string; type: 'bible-first-letter' | 'bible-full' }>) => {
    const cards: FlashCard[] = cardData.map(d => ({
      id: `bible-${selectedBook.toLowerCase().replace(/\s/g, '')}-${selectedChapter}-${d.verseRange}-${d.type === 'bible-first-letter' ? 'fl' : 'ft'}`,
      type: d.type,
      category: selectedBook,
      front: d.front,
      back: d.back,
      meta: {
        reference: d.reference,
        book: selectedBook,
        chapter: selectedChapter,
        verses: d.verseRange,
      },
    }));
    onAddCards(cards);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Fixed header */}
        <div className="px-6 pt-6 pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              {t('flashcards.addBibleVerses')}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="px-6 pb-6 overflow-y-auto flex-1 min-h-0">
          {/* Book selector */}
          {step === 'book' && (
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                {t('flashcards.selectBook')}
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                {BIBLE_BOOKS.map(b => (
                  <button
                    key={b.name}
                    type="button"
                    onClick={() => handleBookSelect(b.name)}
                    className="text-left px-3 py-2 text-sm rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-300 transition"
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chapter selector */}
          {step === 'chapter' && book && (
            <div>
              <button
                type="button"
                onClick={() => setStep('book')}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-3"
              >
                ← {t('flashcards.selectBook')}
              </button>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                {selectedBook} — {t('flashcards.selectChapter')}
              </h3>
              <div className="grid grid-cols-5 sm:grid-cols-8 gap-1.5">
                {Array.from({ length: book.chapters }, (_, i) => i + 1).map(ch => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => handleChapterSelect(ch)}
                    className="py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Verse picker */}
          {step === 'verse' && (
            <div>
              {loading ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">Loading...</p>
              ) : data?.biblePassage ? (
                <VersePicker
                  passageText={data.biblePassage.text}
                  verses={data.biblePassage.verses}
                  reference={data.biblePassage.reference}
                  book={selectedBook}
                  chapter={selectedChapter}
                  onAddCards={handleAddCards}
                  onBack={() => setStep('chapter')}
                />
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  Failed to load passage
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
