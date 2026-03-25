import React, { useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import { usePlayerProfiles } from '../hooks/usePlayerProfiles';
import type { PlayerProfile, AvatarColor } from '../hooks/usePlayerProfiles';

const AVATAR_BG: Record<AvatarColor, string> = {
  red: 'bg-red-400',
  orange: 'bg-orange-400',
  yellow: 'bg-yellow-400',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-400',
  teal: 'bg-teal-500',
};

const AVATAR_COLORS: AvatarColor[] = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'teal'];

const GAME_LABELS: Record<string, string> = {
  trivia: 'Trivia',
  word: 'Word',
  memory: 'Memory',
  math: 'Math',
  headsup: 'Heads Up',
  reaction: 'Reaction',
  simon: 'Simon',
  sequence: 'Sequence',
  colormatch: 'Color Match',
  maze: 'Maze',
  anagram: 'Anagram',
  dino: 'Dino Run',
  beatclock: 'Beat the Clock',
};

interface FamilyLeaderboardProps {
  onClose: () => void;
}

type TabView = 'profiles' | 'bests';

export default function FamilyLeaderboard({ onClose }: FamilyLeaderboardProps) {
  const { t } = useTranslation();
  const { profiles, addProfile, updateProfile, removeProfile } = usePlayerProfiles();
  const [tab, setTab] = useState<TabView>('profiles');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState<AvatarColor>('blue');

  const startAdd = () => {
    setAddingNew(true);
    setEditingId(null);
    setEditName('');
    setEditColor('blue');
  };

  const startEdit = (profile: PlayerProfile) => {
    setEditingId(profile.id);
    setAddingNew(false);
    setEditName(profile.displayName);
    setEditColor(profile.avatarColor);
  };

  const saveNew = () => {
    const name = editName.trim();
    if (!name) return;
    addProfile(name, editColor);
    setAddingNew(false);
    setEditName('');
  };

  const saveEdit = () => {
    if (!editingId) return;
    const name = editName.trim();
    if (!name) return;
    updateProfile(editingId, { displayName: name, avatarColor: editColor });
    setEditingId(null);
  };

  const cancel = () => {
    setAddingNew(false);
    setEditingId(null);
    setEditName('');
  };

  // Sort profiles by totalWins desc
  const sorted = [...profiles].sort((a, b) => b.totalWins - a.totalWins);

  return (
    <div className="flex flex-col h-full max-w-md mx-auto px-4 py-6 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {t('games.familyLeaderboard' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close leaderboard"
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        <button
          type="button"
          onClick={() => setTab('profiles')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'profiles'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {t('games.playerProfiles' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </button>
        <button
          type="button"
          onClick={() => setTab('bests')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'bests'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {t('games.personalBest' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </button>
      </div>

      {tab === 'profiles' && (
        <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
          {sorted.length === 0 && !addingNew && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              {t('games.noScoresYet' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </p>
          )}

          {sorted.map((profile, idx) => (
            <div key={profile.id}>
              {editingId === profile.id ? (
                <ProfileForm
                  name={editName}
                  color={editColor}
                  onNameChange={setEditName}
                  onColorChange={setEditColor}
                  onSave={saveEdit}
                  onCancel={cancel}
                  saveLabel={t('games.savePlayer' as any) as string} /* eslint-disable-line @typescript-eslint/no-explicit-any */
                  cancelLabel={t('games.cancel' as any) as string} /* eslint-disable-line @typescript-eslint/no-explicit-any */
                />
              ) : (
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                  {idx < 3 && (
                    <span className="text-xl">{['🥇', '🥈', '🥉'][idx]}</span>
                  )}
                  {idx >= 3 && (
                    <span className="text-sm font-bold text-gray-400 dark:text-gray-500 w-6 text-center">{idx + 1}</span>
                  )}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${AVATAR_BG[profile.avatarColor]}`}>
                    {profile.displayName.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{profile.displayName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {profile.totalWins} {t('games.totalWins' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => startEdit(profile)}
                    aria-label={`Edit ${profile.displayName}`}
                    className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeProfile(profile.id)}
                    aria-label={`Delete ${profile.displayName}`}
                    className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}

          {addingNew && (
            <ProfileForm
              name={editName}
              color={editColor}
              onNameChange={setEditName}
              onColorChange={setEditColor}
              onSave={saveNew}
              onCancel={cancel}
              saveLabel={t('games.savePlayer' as any) as string} /* eslint-disable-line @typescript-eslint/no-explicit-any */
              cancelLabel={t('games.cancel' as any) as string} /* eslint-disable-line @typescript-eslint/no-explicit-any */
            />
          )}

          {!addingNew && profiles.length < 10 && (
            <button
              type="button"
              onClick={startAdd}
              className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:border-fuchsia-400 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              {t('games.addNewPlayer' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </button>
          )}
        </div>
      )}

      {tab === 'bests' && (
        <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
          {profiles.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              {t('games.noScoresYet' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </p>
          )}
          {profiles.map(profile => {
            const bests = Object.entries(profile.personalBests);
            if (bests.length === 0) return null;
            return (
              <div key={profile.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs ${AVATAR_BG[profile.avatarColor]}`}>
                    {profile.displayName.slice(0, 1).toUpperCase()}
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">{profile.displayName}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {bests.map(([gameType, best]) => (
                    <div key={gameType} className="bg-gray-50 dark:bg-gray-700 rounded-lg px-2 py-1.5">
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{GAME_LABELS[gameType] ?? gameType}</p>
                      <p className="text-sm font-bold text-fuchsia-600 dark:text-fuchsia-400">{best.score}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface ProfileFormProps {
  name: string;
  color: AvatarColor;
  onNameChange: (v: string) => void;
  onColorChange: (v: AvatarColor) => void;
  onSave: () => void;
  onCancel: () => void;
  saveLabel: string;
  cancelLabel: string;
}

function ProfileForm({ name, color, onNameChange, onColorChange, onSave, onCancel, saveLabel, cancelLabel }: ProfileFormProps) {
  return (
    <div className="p-3 bg-fuchsia-50 dark:bg-fuchsia-900/20 rounded-xl border border-fuchsia-200 dark:border-fuchsia-700 flex flex-col gap-2">
      <input
        type="text"
        value={name}
        onChange={e => onNameChange(e.target.value)}
        placeholder="Player name"
        maxLength={20}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
        aria-label="Player name"
      />
      <div className="flex gap-1.5 flex-wrap">
        {AVATAR_COLORS.map(c => (
          <button
            key={c}
            type="button"
            onClick={() => onColorChange(c)}
            aria-label={`Color ${c}`}
            className={`w-7 h-7 rounded-full ${AVATAR_BG[c]} transition ${color === c ? 'ring-2 ring-offset-2 ring-fuchsia-500' : ''}`}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={!name.trim()}
          className="flex-1 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition"
        >
          {saveLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}
