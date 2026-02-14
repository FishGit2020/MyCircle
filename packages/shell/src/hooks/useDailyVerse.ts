import { useState, useCallback } from 'react';
import { useQuery, GET_BIBLE_VOTD_API, getAllDailyVerses } from '@mycircle/shared';
import type { DailyVerse } from '@mycircle/shared';

export type { DailyVerse };

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

interface VotdApiResponse {
  bibleVotdApi: {
    text: string;
    reference: string;
    translation: string | null;
    copyright: string | null;
  };
}

export function useDailyVerse() {
  const allVerses = getAllDailyVerses();
  const day = getDayOfYear();

  // Fetch VOTD from YouVersion API (same source as Bible Reader)
  const { data, loading } = useQuery<VotdApiResponse>(GET_BIBLE_VOTD_API, {
    variables: { day },
    fetchPolicy: 'cache-first',
  });

  const votd: DailyVerse | null = data?.bibleVotdApi
    ? {
        text: data.bibleVotdApi.text,
        reference: data.bibleVotdApi.reference,
        version: data.bibleVotdApi.translation || undefined,
        copyright: data.bibleVotdApi.copyright || undefined,
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
