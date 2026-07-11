# Contract: Recent Stops localStorage Cache

**Branch**: `028-transit-improvements` | **Date**: 2026-04-29

This is the only persisted client-side data shape introduced or modified by this feature. It is **not** synchronized to Firestore and is **not** shared across devices — it is per-browser, per-user.

## Storage location

| Property | Value |
|---|---|
| Backend | `localStorage` |
| Key | `transit-recent-stops` *(unchanged from current implementation; the schema under it changes)* |
| Encoding | `JSON.stringify(...)` of the container object |
| Owning module | `packages/transit-tracker/src/lib/recentStops.ts` (new) |

All reads and writes MUST go through `recentStops.ts` — no other file in the MFE may touch the key directly. This keeps the migration logic in one place.

## Container shape

```ts
interface RecentStopsCacheV1 {
  version: 1;
  entries: RecentStopEntry[]; // most-recent-first, ≤ 5 items
}

interface RecentStopEntry {
  stopId: string;       // e.g. "1_75403"
  name: string;         // e.g. "Pine St & 5th Ave"
  direction: string;    // e.g. "Eastbound" — may be empty string
  routeIds: string[];   // e.g. ["1_44", "1_67"] — may be empty
  lastSeenAt: number;   // Date.now() at the time of last upstream refresh
}
```

## Read contract

```ts
loadRecentStops(): RecentStopEntry[]
```

Behavior:

1. Read raw value from `localStorage.getItem('transit-recent-stops')`. If absent or `JSON.parse` throws → return `[]`.
2. If parsed value is an array (legacy `string[]` shape) → return `[]`. The next `saveRecentStops` will overwrite the legacy value with a V1 container.
3. If parsed value is a `RecentStopsCacheV1` (object with `version === 1` and `Array.isArray(entries)`) → return `entries`, capped at 5, with each entry validated to have all required fields. Drop malformed entries.
4. Anything else → return `[]`.

The function MUST NOT throw and MUST NOT issue any network request.

## Write contract

```ts
saveRecentStops(entries: RecentStopEntry[]): void
```

Behavior:

1. Truncate `entries` to the first 5 elements.
2. Serialize as `{ version: 1, entries }` and write to the key. If `localStorage.setItem` throws (e.g., quota, private mode) → swallow silently.

## Update contract (called from `TransitTracker.tsx` on stop selection)

```ts
upsertRecentStop(prev: RecentStopEntry[], stop: RecentStopEntry): RecentStopEntry[]
```

Behavior:

1. Remove any existing entry whose `stopId` matches `stop.stopId`.
2. Prepend `stop` to the resulting list.
3. Truncate to the first 5 entries.

This is a pure function — does not touch storage. The caller is responsible for persisting the result via `saveRecentStops`.

## Removal contract

```ts
removeRecentStop(stopId: string): RecentStopEntry[]
```

Behavior:

1. Load entries.
2. Filter out the matching `stopId`.
3. Persist the filtered list and return it.

Used when an upstream lookup signals a stop no longer exists (US1 acceptance scenario 3).

## Migration contract

| From shape | To shape | Trigger | Action |
|---|---|---|---|
| `string[]` (legacy bare-IDs) | `RecentStopsCacheV1` | Implicit on next `saveRecentStops` after a stop visit | Discard old entries; first new visit seeds the V1 container |
| Corrupt / non-JSON | `RecentStopsCacheV1` | Implicit on next save | Same as above |

There is no proactive upgrade fetch. Decision recorded in `research.md` R2.

## Test obligations

The new module MUST have a dedicated unit test file (`test/recentStops.test.ts`) with at minimum:

- Empty storage → `loadRecentStops() === []`
- Legacy `string[]` value → `loadRecentStops() === []` and a subsequent save replaces it with V1
- Valid V1 container → entries returned in stored order, capped at 5
- `upsertRecentStop` dedupes by `stopId` and moves to head
- `saveRecentStops` truncates to 5
- `removeRecentStop` removes by id and persists
- All `localStorage` interactions are mocked; tests do not touch the real DOM storage
