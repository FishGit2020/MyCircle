import { useQuery, GET_BIBLE_VOTD_API } from '@mycircle/shared';
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
  const day = getDayOfYear();

  const { data, loading } = useQuery<VotdApiResponse>(GET_BIBLE_VOTD_API, {
    variables: { day },
    fetchPolicy: 'cache-first',
    skip: !import.meta.env.VITE_GRAPHQL_URL,
  });

  const verse: DailyVerse | null = data?.bibleVotdApi
    ? {
        text: data.bibleVotdApi.text,
        reference: data.bibleVotdApi.reference,
        version: data.bibleVotdApi.translation || undefined,
        copyright: data.bibleVotdApi.copyright || undefined,
      }
    : null;

  return {
    verse,
    loading,
  };
}
