import React, { useEffect } from 'react';
import { useTranslation } from '@mycircle/shared';

const FamilyGamesWidget = React.memo(function FamilyGamesWidget() {
  const { t } = useTranslation();
  const [totalGames, setTotalGames] = React.useState(0);

  useEffect(() => {
    const api = window.__familyGames;
    if (!api?.getScores) return;
    const gameTypes = ['trivia', 'math', 'word', 'memory', 'headsup'];
    let total = 0;
    let done = 0;
    gameTypes.forEach(gt => {
      api.getScores(gt).then((scores: any[]) => {
        total += scores.length;
        done++;
        if (done === gameTypes.length) setTotalGames(total);
      }).catch(() => {
        done++;
        if (done === gameTypes.length) setTotalGames(total);
      });
    });
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-fuchsia-50 dark:bg-fuchsia-900/30 flex items-center justify-center text-fuchsia-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.familyGames')}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.familyGamesDesc')}</p>
        </div>
      </div>
      {totalGames > 0 && (
        <p className="text-xs text-fuchsia-600 dark:text-fuchsia-400/70">
          {t('widgets.gamesPlayed' as any).replace('{count}', String(totalGames))}
        </p>
      )}
    </div>
  );
});

export default FamilyGamesWidget;
