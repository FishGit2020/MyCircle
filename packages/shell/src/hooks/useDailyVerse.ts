import { useState, useCallback } from 'react';
import { useQuery, GET_BIBLE_VOTD, getDailyVerse, getAllDailyVerses } from '@mycircle/shared';
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
  const initialVerse = getDailyVerse();
  const initialIndex = allVerses.findIndex(
    v => v.reference === initialVerse.reference
  );

  const [verseIndex, setVerseIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
  const dailyVerse = allVerses[verseIndex];

  const shuffleVerse = useCallback(() => {
    setVerseIndex(prev => (prev + 1) % allVerses.length);
  }, [allVerses.length]);

  const [showVotd, setShowVotd] = useState(false);
  const day = getDayOfYear();

  // Fetch VOTD via GraphQL — only when showVotd is toggled on
  const { data, loading: votdLoading } = useQuery<VotdResponse>(GET_BIBLE_VOTD, {
    variables: { day },
    skip: !showVotd,
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

  const toggleVotd = useCallback(() => {
    setShowVotd(prev => !prev);
  }, []);

  return {
    verse: showVotd && votd ? votd : dailyVerse,
    showVotd,
    toggleVotd,
    shuffleVerse,
    loading: showVotd && votdLoading,
  };
}
