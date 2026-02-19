import { useQuery, getAllDailyVerses, GET_BIBLE_PASSAGE } from '@mycircle/shared';
import type { DailyVerse } from '@mycircle/shared';

export type { DailyVerse };

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export interface VerseFragment {
  number: number;
  text: string;
}

interface PassageResponse {
  biblePassage: {
    text: string;
    reference: string;
    translation: string | null;
    copyright: string | null;
    verses: VerseFragment[] | null;
  };
}

export function useCuratedVerse() {
  const verses = getAllDailyVerses();
  // Use day-based selection with an offset from the daily verse index
  // so Bible Reader shows a different verse than the dashboard
  const day = getDayOfYear();
  const offset = Math.floor(verses.length / 2);
  const localVerse = verses[(day + offset) % verses.length];

  const { data, loading } = useQuery<PassageResponse>(GET_BIBLE_PASSAGE, {
    variables: { reference: localVerse.usfm ?? localVerse.reference },
    fetchPolicy: 'cache-first',
  });

  const verse: DailyVerse = data?.biblePassage?.text
    ? {
        text: data.biblePassage.text,
        reference: data.biblePassage.reference,
        copyright: data.biblePassage.copyright || undefined,
      }
    : {
        ...localVerse,
        copyright: localVerse.copyright,
      };

  // Structured verses with numbers (from API only)
  const verseFragments: VerseFragment[] | null =
    data?.biblePassage?.verses && data.biblePassage.verses.length > 0
      ? data.biblePassage.verses
      : null;

  return { verse, verseFragments, loading };
}
