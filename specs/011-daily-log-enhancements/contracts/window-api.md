# Contract: window.__workTracker Extension

**Feature**: 011-daily-log-enhancements
**Date**: 2026-03-24

---

## Overview

The `window.__workTracker` bridge is the interface between the `daily-log` MFE and the shell's Firebase layer. This contract extends the existing API with optional `mood` and `tags` fields. All changes are backward-compatible: MFE code that does not pass `mood`/`tags` continues to work without modification.

---

## Type Declaration (packages/shared/src/types/window.d.ts)

```typescript
import type { MoodValue } from '../../daily-log/types'; // or inline the type

declare global {
  interface Window {
    __workTracker?: {
      /** Fetch all entries for the authenticated user. */
      getAll: () => Promise<Array<{
        id: string;
        date: string;       // 'YYYY-MM-DD' local timezone
        content: string;
        createdAt: { seconds: number; nanoseconds: number };
        mood?: string;      // NEW: one of MoodValue, absent = no mood
        tags?: string[];    // NEW: 0–10 normalized strings, absent = no tags
      }>>;

      /** Add a new entry. Returns the new document ID. */
      add: (entry: {
        date: string;
        content: string;
        mood?: string;     // NEW: optional
        tags?: string[];   // NEW: optional
      }) => Promise<string>;

      /** Update fields on an existing entry. */
      update: (id: string, updates: Partial<{
        content: string;
        date: string;
        mood: string;      // NEW: optional update target
        tags: string[];    // NEW: optional update target
      }>) => Promise<void>;

      /** Delete an entry by ID. */
      delete: (id: string) => Promise<void>;

      /**
       * Subscribe to real-time entry updates.
       * Callback fires immediately with current data, then on every change.
       * Returns an unsubscribe function.
       */
      subscribe?: (callback: (entries: Array<{
        id: string;
        date: string;
        content: string;
        createdAt: { seconds: number; nanoseconds: number };
        mood?: string;
        tags?: string[];
      }>) => void) => () => void;
    };
  }
}
```

---

## Behavioral Contract

### add()

- **Precondition**: user is authenticated (`auth.currentUser` present)
- **Throws**: `Error('Not authenticated')` if called while unauthenticated
- **`mood`**: if provided, stored as-is; caller is responsible for passing a valid `MoodValue`
- **`tags`**: if provided, stored as-is; caller is responsible for normalization (lowercase, trimmed, ≤10 items, each ≤30 chars)
- **Returns**: `Promise<string>` — the new Firestore document ID

### update()

- **Partial update**: only the keys present in `updates` are written; other fields are unchanged
- **Setting `mood` to `undefined`**: to remove mood, pass `{ mood: undefined }` — or use Firestore `deleteField()` in the shell implementation
- **`tags: []`**: an empty array removes all tags from the entry

### subscribe()

- **Real-time**: fires synchronously on subscription, then on every Firestore change
- **Ordering**: entries returned ordered by `date` descending, then `createdAt` descending
- **Unsubscribe**: calling the returned function cancels the Firestore listener

---

## Shell Implementation Locations

| Concern | File | Lines |
|---------|------|-------|
| Type declaration | `packages/shared/src/types/window.d.ts` | 77–84 (extend) |
| Firestore `addDailyLogEntry` | `packages/shell/src/lib/firebase.ts` | ~1029 |
| Firestore `updateDailyLogEntry` | `packages/shell/src/lib/firebase.ts` | ~1038 |
| Bridge wiring | `packages/shell/src/lib/firebase.ts` | ~1063–1083 |

---

## Non-breaking Change Guarantee

- Callers that do not pass `mood` or `tags` continue to work unchanged.
- Entries read from Firestore that lack `mood`/`tags` fields return `undefined` for those fields (TypeScript optional, not nullable).
- No Firestore migration script needed.
