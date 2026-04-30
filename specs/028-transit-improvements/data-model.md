# Phase 1 Data Model: Transit Tracker Improvements

**Branch**: `028-transit-improvements` | **Date**: 2026-04-29

This feature does **not** change any GraphQL schema, Firestore document, or upstream payload. It does change two client-side data shapes and adds one display-time annotation. Both are local to the `transit-tracker` MFE.

---

## 1. RecentStopEntry (NEW — local cache)

The cached representation of a recently-visited stop, kept in `localStorage` so the recent list renders instantly with full metadata.

| Field | Type | Required | Notes |
|---|---|---|---|
| `stopId` | `string` | yes | Stable region-scoped stop ID (matches `Stop.id`). |
| `name` | `string` | yes | Human-readable stop name shown in the list. |
| `direction` | `string` | yes | Direction label (e.g., "N", "Eastbound"). May be empty string if upstream provides none, but the field MUST be present. |
| `routeIds` | `string[]` | yes | Route IDs that serve the stop, used to render route badges. May be empty. |
| `lastSeenAt` | `number` | yes | Epoch milliseconds at which the entry was last refreshed from upstream. Used for ordering and for opportunistic refresh decisions. |

### Storage container

| Field | Type | Notes |
|---|---|---|
| `version` | `number` (literal `1`) | Schema version. New writes always set `1`. |
| `entries` | `RecentStopEntry[]` | Most-recent-first. Capped at 5 by writer. |

Stored as `JSON.stringify(...)` under the existing `localStorage` key `transit-recent-stops`.

### Validation rules

- `stopId` MUST be non-empty.
- `entries` MUST be an array; reads that find a non-array (including the legacy `string[]` form) treat the cache as empty.
- On every save, `entries` is truncated to the first 5 elements.
- On read, entries with missing required fields are filtered out (defensive — should not occur from this app's writes).
- No cross-entry uniqueness enforcement at storage time; the writer dedupes by `stopId` before saving.

### State transitions

```text
(no entry)
    │  user opens stop S → upstream returns Stop metadata
    ▼
present (entries[0] = {stopId: S, name, direction, routeIds, lastSeenAt: now})
    │  user opens stop S again → metadata refreshed
    ▼
present (entries[0] updated; lastSeenAt advanced)
    │  user opens 5+ different stops without re-opening S
    ▼
evicted (S falls off the cap of 5)
```

A stop never transitions back from "evicted" without a fresh visit.

### Migration

| Stored shape | Action on read |
|---|---|
| `RecentStopsCacheV1` (`{version:1, entries:[...]}`) | Use as-is. |
| Legacy `string[]` (e.g., `["1_75403","1_29248"]`) | Discard. The writer immediately overwrites with V1 on the next save. No upgrade fetch. |
| Anything else (corrupt JSON, wrong type) | Treat as empty cache. |

---

## 2. ArrivalDeparture (CHANGED — display annotation only)

The existing client-side display shape (`packages/transit-tracker/src/types.ts`) gains one optional flag to support the "departed" label without changing the upstream wire format.

| Field | Type | Required | Notes |
|---|---|---|---|
| (existing fields) | — | — | `routeId`, `routeShortName`, `routeLongName`, `tripHeadsign`, `scheduledArrivalTime`, `predictedArrivalTime`, `predicted`, `status`, `vehicleId`, `distanceFromStop` — unchanged. |
| `departed` | `boolean` (new, optional) | no | `true` when the displayable arrival's effective time is in the recent past (within 60s). UI suppresses the negative ETA and renders a "departed" label. |

### Display-time partitioning rule

Given `effectiveTime = predicted ? predictedArrivalTime : scheduledArrivalTime` and `delta = effectiveTime − Date.now()`:

| Condition | Outcome |
|---|---|
| `delta > 0` | Render normally; `departed` undefined/false. |
| `−60_000 ≤ delta ≤ 0` | Render with `departed: true`; UI shows "departed" label, no negative-minute number. |
| `delta < −60_000` | Omit from rendered list entirely. |

This partitioning happens inside `useTransitArrivals` after the upstream fetch resolves. No additional API call.

---

## 3. NearbyPermission (NEW — hook return value, in-memory only)

A small enum-like union that `useNearbyStops` exposes so the UI can branch on the geolocation outcome.

```ts
type NearbyPermission = 'unknown' | 'granted' | 'denied' | 'unavailable';
```

| Value | Meaning | Source |
|---|---|---|
| `'unknown'` | The user has not yet triggered "Find nearby". | Default before any call. |
| `'granted'` | A `getCurrentPosition` call returned a position. | Resolution callback. |
| `'denied'` | `getCurrentPosition` errored with code `1` (PERMISSION_DENIED). | Error callback. |
| `'unavailable'` | `getCurrentPosition` errored with code `2` (POSITION_UNAVAILABLE) or `3` (TIMEOUT), or `navigator.geolocation` is undefined. | Error callback / feature detection. |

This value is not persisted. It's consulted only to choose the correct UI state (permission prompt vs. unavailable message vs. empty results message).

---

## 4. Refresh state (CHANGED — hook return value, in-memory only)

`useTransitArrivals` returns one additional derived field so the UI can render "couldn't refresh — showing last result" alongside the prior data without confusing it with a true initial-load failure.

| Field | Type | Notes |
|---|---|---|
| `error` | `string \| null` | Non-null when there is **no** data at all (initial fetch failed). Existing semantics preserved. |
| `refreshError` | `string \| null` (new) | Non-null when cached data exists from a prior fetch AND the most recent fetch errored. The UI shows this inline near the Refresh button. |

Both fields can be cleared by a successful subsequent fetch. Neither is persisted.

---

## Entities not changing

For completeness, the following remain exactly as they are today:

- `Stop` (upstream/GraphQL — no schema change).
- `FavoriteStop` (Firestore + localStorage — out of scope).
- `NearbyStop` (display-only on the search screen — no fields added).
- The OneBusAway upstream payload — no resolver-shape changes; only the credential read changes.
