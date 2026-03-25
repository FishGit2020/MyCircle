import { useState, useCallback, useEffect } from 'react';
import { StorageKeys } from '@mycircle/shared';

export type AvatarColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'teal';

export interface PersonalBest {
  score: number;
  timeMs: number;
  difficulty: string;
  achievedAt: string;
}

export interface PlayerProfile {
  id: string;
  displayName: string;
  avatarColor: AvatarColor;
  totalWins: number;
  personalBests: Partial<Record<string, PersonalBest>>;
  createdAt: string;
  updatedAt: string;
}

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function loadProfiles(): PlayerProfile[] {
  try {
    const raw = localStorage.getItem(StorageKeys.FAMILY_GAMES_PROFILES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveProfiles(profiles: PlayerProfile[]): void {
  try {
    localStorage.setItem(StorageKeys.FAMILY_GAMES_PROFILES, JSON.stringify(profiles));
  } catch {
    // Storage full or unavailable — ignore
  }
}

export function usePlayerProfiles() {
  const [profiles, setProfiles] = useState<PlayerProfile[]>(() => loadProfiles());

  // Sync to localStorage whenever profiles change
  useEffect(() => {
    saveProfiles(profiles);
  }, [profiles]);

  const addProfile = useCallback((displayName: string, avatarColor: AvatarColor): PlayerProfile => {
    const trimmed = displayName.trim().slice(0, 20);
    const now = new Date().toISOString();
    const profile: PlayerProfile = {
      id: generateId(),
      displayName: trimmed,
      avatarColor,
      totalWins: 0,
      personalBests: {},
      createdAt: now,
      updatedAt: now,
    };
    setProfiles(prev => [...prev, profile]);
    return profile;
  }, []);

  const updateProfile = useCallback((id: string, updates: Partial<Pick<PlayerProfile, 'displayName' | 'avatarColor'>>) => {
    setProfiles(prev => prev.map(p => {
      if (p.id !== id) return p;
      return {
        ...p,
        ...updates,
        displayName: updates.displayName ? updates.displayName.trim().slice(0, 20) : p.displayName,
        updatedAt: new Date().toISOString(),
      };
    }));
  }, []);

  const removeProfile = useCallback((id: string) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
  }, []);

  const updatePersonalBest = useCallback((profileId: string, gameType: string, entry: PersonalBest) => {
    setProfiles(prev => prev.map(p => {
      if (p.id !== profileId) return p;
      const existing = p.personalBests[gameType];
      if (existing && existing.score >= entry.score) return p;
      return {
        ...p,
        personalBests: { ...p.personalBests, [gameType]: entry },
        updatedAt: new Date().toISOString(),
      };
    }));
  }, []);

  const incrementWins = useCallback((profileId: string) => {
    setProfiles(prev => prev.map(p => {
      if (p.id !== profileId) return p;
      return { ...p, totalWins: p.totalWins + 1, updatedAt: new Date().toISOString() };
    }));
  }, []);

  return { profiles, addProfile, updateProfile, removeProfile, updatePersonalBest, incrementWins };
}
