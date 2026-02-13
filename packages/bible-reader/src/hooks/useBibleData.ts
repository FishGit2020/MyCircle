import { useState, useCallback } from 'react';
import { useQuery, useLazyQuery, GET_BIBLE_VOTD, GET_BIBLE_PASSAGE } from '@mycircle/shared';

// --- Types ---

export interface BibleVerse {
  text: string;
  reference: string;
  translation: string | null;
  copyright: string | null;
}

export interface BiblePassage {
  text: string;
  reference: string;
  translation: string | null;
  verseCount: number;
}

interface VotdResponse {
  bibleVotd: BibleVerse;
}

interface PassageResponse {
  biblePassage: BiblePassage;
}

// 66 canonical books with chapter counts
export const BIBLE_BOOKS = [
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

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

/** Hook to get the Verse of the Day via GraphQL */
export function useVotd() {
  const day = getDayOfYear();
  const { data, loading, error } = useQuery<VotdResponse>(GET_BIBLE_VOTD, {
    variables: { day },
    fetchPolicy: 'cache-first',
  });

  return {
    verse: data?.bibleVotd ?? null,
    loading,
    error,
  };
}

/** Hook to lazily fetch a Bible passage via GraphQL */
export function useBiblePassage() {
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<number>(0);

  const [fetchPassage, { data, loading, error }] = useLazyQuery<PassageResponse>(GET_BIBLE_PASSAGE, {
    fetchPolicy: 'cache-first',
  });

  const loadPassage = useCallback((book: string, chapter: number, translation?: string) => {
    setSelectedBook(book);
    setSelectedChapter(chapter);
    fetchPassage({ variables: { reference: `${book} ${chapter}`, translation } });
  }, [fetchPassage]);

  return {
    passage: data?.biblePassage ?? null,
    loading,
    error,
    selectedBook,
    selectedChapter,
    loadPassage,
  };
}
