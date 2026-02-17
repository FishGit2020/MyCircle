import { useTranslation, type TranslationKey } from '@mycircle/shared';
import { phrases, categoryOrder, type PhraseCategory } from '../data/phrases';

interface ProgressDashboardProps {
  completedIds: Set<string>;
  quizScores: Array<{ date: string; correct: number; total: number }>;
  streak: number;
}

const categoryKeyMap: Record<PhraseCategory, TranslationKey> = {
  greetings: 'english.category.greetings',
  feelings: 'english.category.feelings',
  house: 'english.category.house',
  food: 'english.category.food',
  goingOut: 'english.category.goingOut',
  people: 'english.category.people',
  time: 'english.category.time',
  emergency: 'english.category.emergency',
};

export default function ProgressDashboard({ completedIds, quizScores, streak }: ProgressDashboardProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid="total-completed">
            {completedIds.size}
          </div>
          <div className="text-xs text-blue-500 dark:text-blue-400">{t('english.progress')}</div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400" data-testid="streak-count">
            {streak}
          </div>
          <div className="text-xs text-orange-500 dark:text-orange-400">{t('english.streak')}</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="quiz-count">
            {quizScores.length}
          </div>
          <div className="text-xs text-green-500 dark:text-green-400">{t('english.quiz')}</div>
        </div>
      </div>

      {/* Category progress */}
      <div className="space-y-3">
        {categoryOrder.map((cat) => {
          const catPhrases = phrases.filter((p) => p.category === cat);
          const completed = catPhrases.filter((p) => completedIds.has(p.id)).length;
          const total = catPhrases.length;
          const pct = total > 0 ? (completed / total) * 100 : 0;

          return (
            <div key={cat}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {t(categoryKeyMap[cat])}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {completed}/{total}
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                  data-testid={`progress-bar-${cat}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
