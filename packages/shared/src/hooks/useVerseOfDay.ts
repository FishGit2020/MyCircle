import { useState, useCallback } from 'react';
import { useQuery } from '../apollo';
import { GET_BIBLE_PASSAGE } from '../apollo/queries';

export interface VerseRef {
  reference: string;
  textKey?: string;
}

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Shared hook for day-of-year verse selection + API fetching.
 * Used by baby-tracker and child-development.
 *
 * @param verses - Array of verse references (with optional i18n fallback key)
 * @param fallbackText - Optional function to resolve fallback text (e.g. i18n `t()`)
 * @returns verse reference, fetched text, loading state, and shuffle function
 */
export function useVerseOfDay(
  verses: VerseRef[],
  fallbackText?: (key: string) => string,
) {
  const [verseIndex, setVerseIndex] = useState(
    () => getDayOfYear() % verses.length,
  );

  const verse = verses[verseIndex];

  const { data, loading } = useQuery<{ biblePassage?: { text?: string } }>(GET_BIBLE_PASSAGE, {
    variables: { reference: verse.reference },
    errorPolicy: 'ignore',
  });

  const apiText = data?.biblePassage?.text || '';
  const text =
    apiText ||
    (verse.textKey && fallbackText ? fallbackText(verse.textKey) : '');

  const shuffle = useCallback(() => {
    setVerseIndex((prev) => {
      let next = Math.floor(Math.random() * verses.length);
      while (next === prev && verses.length > 1) {
        next = Math.floor(Math.random() * verses.length);
      }
      return next;
    });
  }, [verses.length]);

  return { reference: verse.reference, text, loading, shuffle };
}
