# Contract: `window.__familyGames` Bridge Extensions

**Type**: Internal window global (shell → MFE)
**Stability**: Stable (additive only — existing methods unchanged)

---

## Existing Methods (unchanged)

```typescript
window.__familyGames = {
  getScores(gameType: string): Promise<ScoreEntry[]>;
  subscribe(gameType: string, cb: (scores: ScoreEntry[]) => void): () => void;
  saveScore(data: { gameType: string; score: number; timeMs: number; difficulty: string }): Promise<void>;
}
```

## New Methods (additive)

```typescript
window.__familyGames = {
  // ...existing methods...

  /**
   * Fetch the top N scores across all game types for a given set of Firestore UIDs.
   * Used by the Family Leaderboard to show authenticated users' cross-game bests.
   * Returns empty array if user is not authenticated or db is unavailable.
   */
  getLeaderboard(uids: string[]): Promise<LeaderboardEntry[]>;
}

interface LeaderboardEntry {
  uid: string;
  displayName: string;
  gameType: string;
  score: number;
  timeMs: number;
  difficulty: string;
  playedAt: string; // ISO 8601
}
```

**Shell-side addition**: `packages/shell/src/lib/firebase.ts` — add `getLeaderboard` to the existing `window.__familyGames` block.

**MFE access pattern** (always read at call-time, not cached at import):
```typescript
const api = window.__familyGames;
if (api?.getLeaderboard) {
  const entries = await api.getLeaderboard(uids);
}
```

---

## Window Global Type Declarations

`packages/shell/src/remotes.d.ts` must be updated to include the `getLeaderboard` method in the `__familyGames` interface declaration.
