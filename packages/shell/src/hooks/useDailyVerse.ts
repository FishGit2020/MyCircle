import { useState, useCallback, useMemo } from 'react';
import { useQuery, GET_BIBLE_VOTD } from '@mycircle/shared';

export interface DailyVerse {
  text: string;
  reference: string;
  version?: string;
  copyright?: string;
}

// Curated daily verses — shown by default (fallback if GraphQL is unavailable)
const DAILY_VERSES: DailyVerse[] = [
  { text: "For I know the plans I have for you, declares the LORD, plans to prosper you and not to harm you, plans to give you hope and a future.", reference: "Jeremiah 29:11" },
  { text: "Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.", reference: "Proverbs 3:5-6" },
  { text: "I can do all this through him who gives me strength.", reference: "Philippians 4:13" },
  { text: "The LORD is my shepherd, I lack nothing.", reference: "Psalm 23:1" },
  { text: "Be strong and courageous. Do not be afraid; do not be discouraged, for the LORD your God will be with you wherever you go.", reference: "Joshua 1:9" },
  { text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.", reference: "Romans 8:28" },
  { text: "The LORD is my light and my salvation — whom shall I fear? The LORD is the stronghold of my life — of whom shall I be afraid?", reference: "Psalm 27:1" },
  { text: "But those who hope in the LORD will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.", reference: "Isaiah 40:31" },
  { text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.", reference: "Philippians 4:6" },
  { text: "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.", reference: "Isaiah 41:10" },
  { text: "Come to me, all you who are weary and burdened, and I will give you rest.", reference: "Matthew 11:28" },
  { text: "The LORD bless you and keep you; the LORD make his face shine on you and be gracious to you.", reference: "Numbers 6:24-25" },
  { text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.", reference: "John 3:16" },
  { text: "Delight yourself in the LORD, and he will give you the desires of your heart.", reference: "Psalm 37:4" },
  { text: "The name of the LORD is a fortified tower; the righteous run to it and are safe.", reference: "Proverbs 18:10" },
  { text: "He has made everything beautiful in its time. He has also set eternity in the human heart.", reference: "Ecclesiastes 3:11" },
  { text: "Cast all your anxiety on him because he cares for you.", reference: "1 Peter 5:7" },
  { text: "This is the day that the LORD has made; let us rejoice and be glad in it.", reference: "Psalm 118:24" },
  { text: "But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control.", reference: "Galatians 5:22-23" },
  { text: "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the LORD your God will be with you wherever you go.", reference: "Joshua 1:9" },
  { text: "The LORD is close to the brokenhearted and saves those who are crushed in spirit.", reference: "Psalm 34:18" },
  { text: "Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!", reference: "2 Corinthians 5:17" },
  { text: "Commit to the LORD whatever you do, and he will establish your plans.", reference: "Proverbs 16:3" },
  { text: "God is our refuge and strength, an ever-present help in trouble.", reference: "Psalm 46:1" },
  { text: "In their hearts humans plan their course, but the LORD establishes their steps.", reference: "Proverbs 16:9" },
  { text: "The steadfast love of the LORD never ceases; his mercies never come to an end; they are new every morning; great is your faithfulness.", reference: "Lamentations 3:22-23" },
  { text: "Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.", reference: "John 14:27" },
  { text: "For we walk by faith, not by sight.", reference: "2 Corinthians 5:7" },
  { text: "Be still, and know that I am God.", reference: "Psalm 46:10" },
  { text: "Love is patient, love is kind. It does not envy, it does not boast, it is not proud.", reference: "1 Corinthians 13:4" },
  { text: "May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit.", reference: "Romans 15:13" },
];

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
  const dailyVerse = useMemo(() => {
    const day = new Date().getDate();
    return DAILY_VERSES[(day - 1) % DAILY_VERSES.length];
  }, []);

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
    loading: showVotd && votdLoading,
  };
}
