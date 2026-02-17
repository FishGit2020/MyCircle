import { useState } from 'react';
import { useQuery, getAllDailyVerses, GET_BIBLE_PASSAGE, NIV_COPYRIGHT } from '@mycircle/shared';
import type { DailyVerse } from '@mycircle/shared';

export type { DailyVerse };

interface PassageResponse {
  biblePassage: {
    text: string;
    reference: string;
    translation: string | null;
    copyright: string | null;
  };
}

export function useCuratedVerse() {
  const verses = getAllDailyVerses();
  const [localVerse] = useState<DailyVerse>(
    () => verses[Math.floor(Math.random() * verses.length)],
  );

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
        copyright: localVerse.copyright ?? NIV_COPYRIGHT,
      };

  return { verse, loading };
}
