import { useQuery, GET_BIBLE_VOTD_API, getDailyVerse } from '@mycircle/shared';
import type { DailyVerse } from '@mycircle/shared';
import type { GetBibleVotdApiQuery } from '@mycircle/shared';

export type { DailyVerse };

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function useDailyVerse() {
  const day = getDayOfYear();
  const localVerse = getDailyVerse();

  const { data, loading } = useQuery<GetBibleVotdApiQuery>(GET_BIBLE_VOTD_API, {
    variables: { day },
    fetchPolicy: 'cache-first',
  });

  // Use API verse when available; otherwise fall back to
  // the local curated verse with hardcoded NIV text.
  const verse: DailyVerse = data?.bibleVotdApi?.text
    ? {
        text: data.bibleVotdApi.text,
        reference: data.bibleVotdApi.reference,
        copyright: data.bibleVotdApi.copyright || undefined,
      }
    : {
        ...localVerse,
        copyright: localVerse.copyright,
      };

  return {
    verse,
    loading,
  };
}
