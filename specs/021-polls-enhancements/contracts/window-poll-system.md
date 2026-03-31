# Contract: window.__pollSystem API

**Type**: Window Global Interface (Module Federation Bridge)
**Owner**: Shell (`packages/shell/src/lib/firebase.ts`)
**Consumer**: `packages/poll-system`
**Updated for**: 021-polls-enhancements

---

## Overview

The shell exposes Firestore poll operations to the polls MFE via `window.__pollSystem`. This bridge pattern isolates Firestore initialization (shell-only) from the federated component. The polls MFE reads this API at call-time (not import-time) to avoid race conditions with async Firebase initialization.

---

## Current Interface (Before This Feature)

```typescript
window.__pollSystem?: {
  getAll:     () => Promise<any[]>;
  add:        (poll: Record<string, unknown>) => Promise<string>;
  delete:     (id: string) => Promise<void>;
  vote:       (pollId: string, optionId: string) => Promise<void>;
  subscribe:  (callback: (polls: any[]) => void) => () => void;
}
```

---

## Updated Interface (After This Feature)

```typescript
window.__pollSystem?: {
  // --- Existing methods (unchanged signatures) ---

  /** Fetch all non-deleted polls once */
  getAll: () => Promise<Poll[]>;

  /** Create a new poll; returns the new poll's Firestore ID */
  add: (poll: Omit<Poll, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;

  /** Soft-delete a poll (sets isDeleted: true) */
  delete: (id: string) => Promise<void>;

  /** Subscribe to real-time poll updates; returns unsubscribe function */
  subscribe: (callback: (polls: Poll[]) => void) => () => void;

  // --- Changed: vote renamed to castVote with duplicate-vote protection ---

  /**
   * Cast a vote for an option.
   * Throws if the current user has already voted on this poll.
   * Throws if the poll has expired.
   * Uses a Firestore transaction for atomicity.
   */
  castVote: (pollId: string, optionId: string) => Promise<void>;

  // --- New methods ---

  /**
   * Change an existing vote from one option to another.
   * Throws if the user has not yet voted on this poll.
   * Throws if the poll has expired.
   * Atomically decrements old option count, increments new option count,
   * and upserts the vote record — all in a single Firestore transaction.
   */
  changeVote: (pollId: string, oldOptionId: string, newOptionId: string) => Promise<void>;

  /**
   * Get the current user's voted option ID for a specific poll.
   * Returns null if the user has not voted on this poll.
   */
  getUserVote: (pollId: string) => Promise<string | null>;

  /**
   * Subscribe to the current user's vote records across all polls.
   * Callback receives a map of { [pollId]: optionId }.
   * Returns unsubscribe function.
   * Used to initialize voted-state UI without per-poll lookups.
   */
  subscribeToUserVotes: (callback: (votes: Record<string, string>) => void) => () => void;
}
```

---

## Type Declarations

Changes to `packages/shared/src/types/window.d.ts`:

```typescript
/* ── Poll System ──────────────────────────────────────── */
__pollSystem?: {
  getAll: () => Promise<Poll[]>;
  add: (poll: Record<string, unknown>) => Promise<string>;
  delete: (id: string) => Promise<void>;
  subscribe: (callback: (polls: Poll[]) => void) => () => void;
  castVote: (pollId: string, optionId: string) => Promise<void>;
  changeVote: (pollId: string, oldOptionId: string, newOptionId: string) => Promise<void>;
  getUserVote: (pollId: string) => Promise<string | null>;
  subscribeToUserVotes: (callback: (votes: Record<string, string>) => void) => () => void;
};
```

---

## Behavioral Contracts

| Method | Pre-condition | Post-condition | Error conditions |
|--------|--------------|----------------|-----------------|
| `castVote` | User is authenticated; poll exists; user has NOT voted; poll is not expired | `polls/{id}/votes/{uid}` document created; `options[optionId].votes` incremented by 1 | "Already voted" if VoteRecord exists; "Poll expired"; "Not authenticated" |
| `changeVote` | User is authenticated; poll exists; user HAS voted; poll is not expired | `polls/{id}/votes/{uid}` upserted; old option votes decremented; new option votes incremented | "Not voted" if no VoteRecord; "Poll expired"; "Not authenticated" |
| `getUserVote` | User is authenticated; poll exists | Returns optionId string or null | "Not authenticated" |
| `subscribeToUserVotes` | User is authenticated | Live subscription to all user vote records | Returns no-op unsubscribe if not authenticated |

---

## Migration Note: `vote` → `castVote`

The old `vote(pollId, optionId)` method is replaced by `castVote(pollId, optionId)`. The MFE's `usePolls` hook (`packages/poll-system/src/hooks/usePolls.ts`) must be updated to call `castVote`. The old non-atomic implementation (getDoc + updateDoc pair) is replaced by a Firestore transaction.

The `vote` key will be removed from both the window exposure in `firebase.ts` and the `window.d.ts` type declaration.
