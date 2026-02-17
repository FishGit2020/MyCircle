import type { Phrase } from '../data/phrases';

interface PhraseCardProps {
  phrase: Phrase;
  showTranslation?: boolean;
}

export default function PhraseCard({ phrase, showTranslation = true }: PhraseCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
      <p className="text-2xl font-bold text-gray-800 dark:text-white mb-2" data-testid="phrase-english">
        {phrase.english}
      </p>
      <p className="text-sm text-blue-500 dark:text-blue-400 mb-3" data-testid="phrase-phonetic">
        {phrase.phonetic}
      </p>
      {showTranslation && (
        <p className="text-lg text-gray-600 dark:text-gray-300" data-testid="phrase-chinese">
          {phrase.chinese}
        </p>
      )}
      <div className="mt-3 flex justify-center">
        {Array.from({ length: phrase.difficulty }, (_, i) => (
          <span key={i} className="w-2 h-2 rounded-full bg-yellow-400 mx-0.5" />
        ))}
        {Array.from({ length: 3 - phrase.difficulty }, (_, i) => (
          <span key={i} className="w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-600 mx-0.5" />
        ))}
      </div>
    </div>
  );
}
