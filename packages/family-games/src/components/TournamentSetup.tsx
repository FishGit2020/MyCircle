import React, { useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { PlayerProfile, AvatarColor } from '../hooks/usePlayerProfiles';
import { usePlayerProfiles } from '../hooks/usePlayerProfiles';

const AVATAR_COLORS: AvatarColor[] = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'teal'];

const COLOR_CLASSES: Record<AvatarColor, string> = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
  teal: 'bg-teal-500',
};

const SCORE_GAMES = ['trivia', 'math', 'word', 'memory', 'headsup', 'reaction', 'simon', 'sequence', 'colormatch', 'anagram', 'beatclock'];

const GAME_LABEL_KEYS: Record<string, string> = {
  trivia: 'games.trivia',
  math: 'games.mathChallenge',
  word: 'games.wordGame',
  memory: 'games.memoryMatch',
  headsup: 'games.headsUp',
  reaction: 'games.reactionTime',
  simon: 'games.simonSays',
  sequence: 'games.numberSequence',
  colormatch: 'games.colorMatch',
  anagram: 'games.anagram',
  beatclock: 'games.beatTheClock',
};

interface TournamentSetupProps {
  onStart: (session: { players: PlayerProfile[]; games: string[]; rounds: number; mode: 'tournament' | 'h2h' }) => void;
  onCancel: () => void;
}

interface PlayerEntry {
  name: string;
  color: AvatarColor;
}

export default function TournamentSetup({ onStart, onCancel }: TournamentSetupProps) {
  const { t } = useTranslation();
  const { addProfile } = usePlayerProfiles();

  const [mode, setMode] = useState<'tournament' | 'h2h'>('tournament');
  const [players, setPlayers] = useState<PlayerEntry[]>([
    { name: '', color: 'blue' },
    { name: '', color: 'red' },
  ]);
  const [selectedGames, setSelectedGames] = useState<Set<string>>(new Set(['trivia', 'math']));
  const [rounds, setRounds] = useState(1);
  const [error, setError] = useState('');

  const maxPlayers = mode === 'h2h' ? 2 : 6;

  const addPlayer = () => {
    if (players.length >= maxPlayers) return;
    const usedColors = new Set(players.map(p => p.color));
    const nextColor = AVATAR_COLORS.find(c => !usedColors.has(c)) ?? 'green';
    setPlayers(prev => [...prev, { name: '', color: nextColor }]);
  };

  const removePlayer = (idx: number) => {
    if (players.length <= 2) return;
    setPlayers(prev => prev.filter((_, i) => i !== idx));
  };

  const updatePlayer = (idx: number, updates: Partial<PlayerEntry>) => {
    setPlayers(prev => prev.map((p, i) => i === idx ? { ...p, ...updates } : p));
  };

  const toggleGame = (game: string) => {
    setSelectedGames(prev => {
      const next = new Set(prev);
      if (next.has(game)) next.delete(game);
      else next.add(game);
      return next;
    });
  };

  const handleStart = () => {
    const validPlayers = players.filter(p => p.name.trim().length > 0);
    if (validPlayers.length < 2) {
      setError(t('games.minPlayersError' as any)); // eslint-disable-line @typescript-eslint/no-explicit-any
      return;
    }
    if (selectedGames.size === 0) {
      setError(t('games.selectGamesError' as any)); // eslint-disable-line @typescript-eslint/no-explicit-any
      return;
    }
    setError('');
    const profiles = validPlayers.map(p => addProfile(p.name, p.color));
    onStart({ players: profiles, games: Array.from(selectedGames), rounds, mode });
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto py-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          {t('games.tournamentSetup' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('games.tournamentSetupDesc' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </p>
      </div>

      {/* Mode selector */}
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('games.selectMode' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </p>
        <div className="flex gap-2">
          {(['tournament', 'h2h'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); if (m === 'h2h') setPlayers(prev => prev.slice(0, 2)); }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                mode === m
                  ? 'bg-fuchsia-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {m === 'tournament' ? t('games.tournamentMode' as any) : t('games.h2hMode' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </button>
          ))}
        </div>
      </div>

      {/* Players */}
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('games.players' as any)} ({players.length}/{maxPlayers}) {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </p>
        <div className="space-y-2">
          {players.map((player, idx) => (
            <div key={idx} className="flex items-center gap-2">
              {/* Color picker */}
              <div className="relative">
                <div className={`w-8 h-8 rounded-full ${COLOR_CLASSES[player.color]} flex-shrink-0 cursor-pointer`} />
                <select
                  className="absolute inset-0 opacity-0 cursor-pointer w-8 h-8"
                  value={player.color}
                  onChange={e => updatePlayer(idx, { color: e.target.value as AvatarColor })}
                  aria-label={t('games.avatarColor' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
                >
                  {AVATAR_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {/* Name input */}
              <input
                type="text"
                value={player.name}
                onChange={e => updatePlayer(idx, { name: e.target.value })}
                placeholder={`${t('games.playerName' as any)} ${idx + 1}`} // eslint-disable-line @typescript-eslint/no-explicit-any
                maxLength={20}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              />
              {players.length > 2 && (
                <button
                  type="button"
                  onClick={() => removePlayer(idx)}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label={t('games.removePlayer' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        {mode === 'tournament' && players.length < maxPlayers && (
          <button
            type="button"
            onClick={addPlayer}
            className="mt-2 text-sm text-fuchsia-600 dark:text-fuchsia-400 hover:text-fuchsia-700 dark:hover:text-fuchsia-300 transition flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {t('games.addPlayer' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          </button>
        )}
      </div>

      {/* Game selection */}
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('games.selectGames' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {SCORE_GAMES.map(game => (
            <label
              key={game}
              className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition ${
                selectedGames.has(game)
                  ? 'border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedGames.has(game)}
                onChange={() => toggleGame(game)}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                selectedGames.has(game) ? 'border-fuchsia-500 bg-fuchsia-500' : 'border-gray-300 dark:border-gray-600'
              }`}>
                {selectedGames.has(game) && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                {t(GAME_LABEL_KEYS[game] as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Round count (tournament mode only) */}
      {mode === 'tournament' && (
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('games.roundCount' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          </p>
          <div className="flex gap-2">
            {[1, 2, 3].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRounds(r)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                  rounds === r
                    ? 'bg-fuchsia-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition"
        >
          {t('common.cancel' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </button>
        <button
          type="button"
          onClick={handleStart}
          className="flex-1 py-3 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-medium text-sm transition active:scale-95"
        >
          {t('games.startTournament' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </button>
      </div>
    </div>
  );
}
