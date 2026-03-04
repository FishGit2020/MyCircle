import React, { useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import GameCard from './GameCard';
import Scoreboard from './Scoreboard';
import type { GameType } from './GameCard';

export default function FamilyGames() {
  const { t } = useTranslation();
  const [activeGame, setActiveGame] = useState<GameType | null>(null);
  const [GameComponent, setGameComponent] = useState<React.ComponentType<{ onBack: () => void }> | null>(null);

  const handleSelectGame = async (type: GameType) => {
    try {
      let mod: { default: React.ComponentType<{ onBack: () => void }> };
      switch (type) {
        case 'trivia':
          mod = await import('./TriviaGame');
          break;
        case 'math':
          mod = await import('./MathGame');
          break;
        case 'word':
          mod = await import('./WordGame');
          break;
        case 'memory':
          mod = await import('./MemoryGame');
          break;
        case 'headsup':
          mod = await import('./HeadsUpGame');
          break;
      }
      setActiveGame(type);
      setGameComponent(() => mod.default);
    } catch {
      // Game module not yet available — will be added in PR2/PR3
    }
  };

  const handleBack = () => {
    setActiveGame(null);
    setGameComponent(null);
  };

  if (activeGame && GameComponent) {
    return (
      <div className="pb-20 md:pb-8">
        <GameComponent onBack={handleBack} />
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-8 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          {t('games.title')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('games.subtitle')}
        </p>
      </div>

      {/* Game selector grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <GameCard
          type="trivia"
          titleKey="games.trivia"
          descKey="games.triviaDesc"
          color="purple"
          onSelect={handleSelectGame}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <GameCard
          type="math"
          titleKey="games.mathChallenge"
          descKey="games.mathDesc"
          color="blue"
          onSelect={handleSelectGame}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          }
        />
        <GameCard
          type="word"
          titleKey="games.wordGame"
          descKey="games.wordDesc"
          color="green"
          onSelect={handleSelectGame}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
          }
        />
        <GameCard
          type="memory"
          titleKey="games.memoryMatch"
          descKey="games.memoryDesc"
          color="orange"
          onSelect={handleSelectGame}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          }
        />
        <GameCard
          type="headsup"
          titleKey="games.headsUp"
          descKey="games.headsUpDesc"
          color="fuchsia"
          onSelect={handleSelectGame}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Scoreboard */}
      <Scoreboard />
    </div>
  );
}
