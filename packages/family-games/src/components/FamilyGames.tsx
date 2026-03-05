import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation, WindowEvents, PageContent } from '@mycircle/shared';
import GameCard from './GameCard';
import Scoreboard from './Scoreboard';
import type { GameType } from './GameCard';

const VALID_GAMES = new Set<string>(['trivia', 'math', 'word', 'memory', 'headsup', 'reaction', 'simon', 'sequence', 'colormatch', 'maze', 'anagram']);

const GAME_TITLE_KEYS: Record<string, string> = {
  trivia: 'games.trivia', math: 'games.mathChallenge', word: 'games.wordGame',
  memory: 'games.memoryMatch', headsup: 'games.headsUp', reaction: 'games.reactionTime',
  simon: 'games.simonSays', sequence: 'games.numberSequence', colormatch: 'games.colorMatch',
  maze: 'games.mazeRunner', anagram: 'games.anagram',
};

export default function FamilyGames() {
  const { t } = useTranslation();
  const { gameType } = useParams<{ gameType?: string }>();
  const navigate = useNavigate();
  const [GameComponent, setGameComponent] = useState<React.ComponentType<{ onBack: () => void }> | null>(null);

  // Broadcast game name as breadcrumb detail
  useEffect(() => {
    if (gameType && VALID_GAMES.has(gameType)) {
      const label = t(GAME_TITLE_KEYS[gameType] as any) || gameType;
      window.dispatchEvent(new CustomEvent(WindowEvents.BREADCRUMB_DETAIL, { detail: label }));
    } else {
      window.dispatchEvent(new CustomEvent(WindowEvents.BREADCRUMB_DETAIL, { detail: null }));
    }
    return () => {
      window.dispatchEvent(new CustomEvent(WindowEvents.BREADCRUMB_DETAIL, { detail: null }));
    };
  }, [gameType, t]);

  // Load game component when URL param changes
  useEffect(() => {
    if (!gameType || !VALID_GAMES.has(gameType)) {
      setGameComponent(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        let mod: { default: React.ComponentType<{ onBack: () => void }> };
        switch (gameType as GameType) {
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
          case 'reaction':
            mod = await import('./ReactionGame');
            break;
          case 'simon':
            mod = await import('./SimonGame');
            break;
          case 'sequence':
            mod = await import('./SequenceGame');
            break;
          case 'colormatch':
            mod = await import('./ColorMatchGame');
            break;
          case 'maze':
            mod = await import('./MazeGame');
            break;
          case 'anagram':
            mod = await import('./AnagramGame');
            break;
          default:
            return;
        }
        if (!cancelled) setGameComponent(() => mod.default);
      } catch {
        // Module load failed
      }
    })();

    return () => { cancelled = true; };
  }, [gameType]);

  const handleSelectGame = (type: GameType) => {
    navigate(`/family-games/${type}`);
  };

  const handleBack = () => {
    navigate('/family-games');
  };

  // Show active game if URL has a valid game type
  if (gameType && VALID_GAMES.has(gameType) && GameComponent) {
    return (
      <PageContent>
        <GameComponent onBack={handleBack} />
      </PageContent>
    );
  }

  return (
    <PageContent className="space-y-6">
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
        <GameCard type="reaction" titleKey={'games.reactionTime' as any} descKey={'games.reactionDesc' as any} color="red" onSelect={handleSelectGame}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
        />
        <GameCard type="simon" titleKey={'games.simonSays' as any} descKey={'games.simonDesc' as any} color="yellow" onSelect={handleSelectGame}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>}
        />
        <GameCard type="sequence" titleKey={'games.numberSequence' as any} descKey={'games.sequenceDesc' as any} color="teal" onSelect={handleSelectGame}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>}
        />
        <GameCard type="colormatch" titleKey={'games.colorMatch' as any} descKey={'games.colorMatchDesc' as any} color="rose" onSelect={handleSelectGame}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>}
        />
        <GameCard type="maze" titleKey={'games.mazeRunner' as any} descKey={'games.mazeDesc' as any} color="emerald" onSelect={handleSelectGame}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>}
        />
        <GameCard type="anagram" titleKey={'games.anagram' as any} descKey={'games.anagramDesc' as any} color="sky" onSelect={handleSelectGame}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>}
        />
      </div>

      {/* Scoreboard */}
      <Scoreboard />
    </PageContent>
  );
}
