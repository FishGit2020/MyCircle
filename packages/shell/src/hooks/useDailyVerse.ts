import { useState, useCallback } from 'react';
import { useQuery, GET_BIBLE_VOTD, getAllDailyVerses } from '@mycircle/shared';
import type { DailyVerse } from '@mycircle/shared';

export type { DailyVerse };

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

interface VotdResponse {
  bibleVotd: {
    text: string;
    reference: string;
    translation: string | null;
    copyright: string | null;
  };
}

export function useDailyVerse() {
  const allVerses = getAllDailyVerses();
  const day = getDayOfYear();

  // Always fetch VOTD via GraphQL (day-based)
  const { data, loading } = useQuery<VotdResponse>(GET_BIBLE_VOTD, {
    variables: { day },
    fetchPolicy: 'cache-first',
  });

  const votd: DailyVerse | null = data?.bibleVotd
    ? {
        text: data.bibleVotd.text,
        reference: data.bibleVotd.reference,
        version: data.bibleVotd.translation || undefined,
        copyright: data.bibleVotd.copyright || undefined,
      }
    : null;

  // Fallback to local day-based verse while GraphQL loads
  const dayIndex = day % allVerses.length;
  const fallbackVerse = allVerses[dayIndex];

  const [randomVerse, setRandomVerse] = useState<DailyVerse | null>(null);

  const shuffleVerse = useCallback(() => {
    const idx = Math.floor(Math.random() * allVerses.length);
    setRandomVerse(allVerses[idx]);
  }, [allVerses]);

  return {
    verse: randomVerse ?? (votd ?? fallbackVerse),
    shuffleVerse,
    loading: !randomVerse && loading,
  };
}
