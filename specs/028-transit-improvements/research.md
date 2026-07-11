# Phase 0 Research: Transit Tracker Improvements

**Branch**: `028-transit-improvements` | **Date**: 2026-04-29

This document resolves the open implementation questions implied by the spec under the "lean, no extra API calls" constraint.

---

## R1. How to inject the OneBusAway API key without a new secret

**Decision**: Reuse the existing `API_KEYS` Firebase secret (a bundled JSON document) and add a `onebusaway` field. Expand it to `process.env.ONEBUSAWAY_API_KEY` inside `functions/src/handlers/shared.ts → expandApiKeys()`. The `transit.ts` resolver reads `process.env.ONEBUSAWAY_API_KEY` and fails closed if it's empty.

**Rationale**:

- The graphql Cloud Function (`functions/src/handlers/graphql.ts`) already declares `secrets: ['API_KEYS', 'PODCASTINDEX_CREDS', 'USCIS_CREDS']` and calls `expandApiKeys()` at request time. Adding another field to the existing JSON secret requires *zero* changes to the function declaration and *zero* new IAM grants on the compute service account.
- This matches the established convention used for `OPENWEATHER_API_KEY`, `FINNHUB_API_KEY`, `GEMINI_API_KEY`, `YOUVERSION_APP_KEY` — adding a new top-level secret would be inconsistent and create a second pattern for the same problem.
- Failing closed (return an empty arrivals/stop array with a logged error rather than calling OneBusAway with `key=` empty) avoids leaking diagnostic detail to the client.

**Alternatives considered**:

- **Standalone `OBA_API_KEY` secret with `defineSecret(...)`**: Cleaner separation per service, but adds a new secret name, requires a new IAM grant on the compute SA (`secretmanager.secretAccessor`), and needs a new entry in the `secrets:` array of the graphql function. Three integration points for one key — outweighed by the consistency benefit of the bundled approach.
- **Hard-coded production key**: Rejected. Constitution forbids credentials in source. Spec FR-011 forbids placeholder values too.
- **Public/keyless OneBusAway endpoints**: OneBusAway requires a key for production use; there is no keyless tier.

**Operational note**: Update the `API_KEYS` secret value with `printf` (never `echo`) per CLAUDE.md:

```bash
printf '{"openweather":"...","finnhub":"...","gemini":"...","youversion":"...","onebusaway":"REAL_KEY"}' \
  | npx firebase functions:secrets:set API_KEYS
```

---

## R2. Recent-stops cache schema and migration

**Decision**: Replace the current `string[]` schema at `localStorage['transit-recent-stops']` with a versioned object: `{ version: 1, entries: RecentStopEntry[] }`. On read, accept either shape:

- If the stored value is the old `string[]` form, treat it as a list of bare IDs and discard them in place — the next time the user opens any of those stops, the entry is repopulated from the upstream response with full metadata. There is no on-the-fly upgrade fetch (that would violate the "no unnecessary API calls" goal).
- If the stored value is the new versioned form, use it directly.
- Cap the list at 5 entries on every save (existing `MAX_RECENT = 5` behavior).

**`RecentStopEntry` shape**: `{ stopId, name, direction, routeIds, lastSeenAt }`. See `data-model.md`.

**Rationale**:

- The user's stated constraint is to avoid unnecessary API calls. Pro-actively re-fetching every cached old-format entry on first run would be a burst of N calls to upgrade transparent state — exactly the behavior we're avoiding. Letting the user's next interaction populate the entry is free.
- A version field future-proofs the cache without committing to a migration framework.
- Capping on save keeps the entry list bounded; eviction on read is unnecessary.

**Alternatives considered**:

- **Background refetch on app load to upgrade old entries**: Rejected — adds N upstream calls on a flow that today makes zero. Conflicts with SC-005 ("zero API calls per second when idle").
- **Delete the old key entirely on first run of the new build**: Rejected — silently empties users' recent lists, which is hostile.
- **Store a single blob with both old and new schema fields**: Rejected — encourages drift; a clean version field is simpler.

---

## R3. Stale-prediction display threshold

**Decision**: After every successful refresh, partition the response by `(predictedTime − now)`:

- **Future (> 0)**: render normally with positive ETA.
- **Recent past (−60s ≤ Δ ≤ 0)**: render with a "departed" label and no negative-minute ETA.
- **Far past (Δ < −60s)**: omit from the list entirely.

The current `useTransitArrivals` hook already filters with a strict `arrivalTime > now`. That removes both the recent-past and far-past arrivals indistinguishably, which is why "departed" never shows up today. The new behavior splits the filter and adds a `departed: boolean` to the displayed `ArrivalDeparture`.

**Rationale**:

- Spec FR-009 requires omitting > 60s past arrivals; FR-010 requires labeling within-60s arrivals as "departed". The current hook conflates the two.
- 60s is the spec-defined threshold. Implementation does not introduce a new tunable.
- Same response object — no extra API call. Fully aligned with the resource constraint.

**Alternatives considered**:

- **Push the partitioning into the resolver**: Rejected — the resolver cannot know "now" relative to the user's clock; the front-end is the right place to evaluate elapsed time.
- **Keep showing negative ETAs but in red**: Rejected — the spec explicitly forbids negative-minute ETAs (FR-010).

---

## R4. Distinguishing failure modes in `useNearbyStops`

**Decision**: The hook returns a `permission: 'unknown' | 'granted' | 'denied' | 'unavailable'` field in addition to its existing `loading`, `error`, and `stops` fields. The UI uses `permission` to choose which prompt or empty-state message to render. Geolocation calls go through `navigator.geolocation.getCurrentPosition`'s error callback, mapping `PERMISSION_DENIED` → `'denied'`, `POSITION_UNAVAILABLE` / `TIMEOUT` → `'unavailable'`, success → `'granted'`. A first call before the user invokes "Find nearby" remains `'unknown'`.

**Rationale**:

- Today, all geolocation failures collapse into a single `error` string. UI cannot distinguish "user denied" (where the right action is a permission-explanation prompt) from "no stops nearby" (where the right action is to broaden the search). Spec FR-006 and the AC for US2 require this distinction.
- The `PermissionState` of `navigator.permissions.query({name:'geolocation'})` is unreliable in some browsers; using the actual `getCurrentPosition` error code is more portable.

**Alternatives considered**:

- **Throw distinct error types**: Rejected — React hooks return values; introducing throw/catch adds machinery for no UX benefit.
- **Use `navigator.permissions` API directly**: Rejected — uneven support across our target browsers; the error code on the actual call is the source of truth anyway.

---

## R5. Distinguishing initial-load failure from refresh failure

**Decision**: Augment the `useTransitArrivals` return shape so the UI can show "couldn't refresh — last result still visible" when `arrivalsData` already has a value but a subsequent `refetch` fails. Add a derived `refreshError: string | null` field that is non-null only when there is cached data AND the most recent fetch errored. The existing `error` field continues to indicate "no data at all" (initial load failed).

**Rationale**:

- The spec's US2 acceptance scenario 1 requires last-known data to remain visible while announcing the refresh failure. Apollo's `cache-and-network` policy already keeps the cached data accessible, but the current hook returns a single `error` field that does not capture the "have data but new fetch failed" case distinctly.
- Splitting the two states avoids a silent regression where a successful first load followed by a failing manual refresh blanks the UI.

**Alternatives considered**:

- **Toast / snackbar instead of inline message**: Rejected — easy to miss, and the spec wants the message inline near the data so the user can see *what* is stale.
- **Auto-retry with backoff**: Rejected — adds extra calls and conflicts with the resource-light constraint. Manual Retry button only.

---

## R6. Empty-state distinctions

**Decision**: Three explicit empty states, each with its own i18n string:

| State | Trigger | Message key |
|---|---|---|
| Stop has no upcoming arrivals | `arrivals.length === 0 && !loading && !error` | `transit.noArrivals` |
| Search returns no matches | `searchTerm && filteredResults.length === 0` | `transit.noSearchMatch` |
| Geolocation denied | `permission === 'denied'` (from R4) | `transit.locationPermissionDenied` |

The `transit.noArrivals` key already exists; the other two are new and must be added in en/es/zh.

**Rationale**:

- Spec FR-007 and FR-008 require explicit, distinct empty states. Reusing a single generic "no results" message would fail the acceptance scenarios.
- Adding only two new keys keeps the i18n surface minimal.

**Alternatives considered**:

- **A generic empty-state component with a passed-in message**: Rejected — adds an abstraction for three call sites; the spec rules favor inline conditionals (Constitution VI: Simplicity).

---

## Summary of decisions

| ID | Question | Decision |
|---|---|---|
| R1 | OneBusAway key delivery | Bundle into `API_KEYS` JSON secret; expand to `ONEBUSAWAY_API_KEY` env var |
| R2 | Recent-stops cache shape & migration | Versioned `{version:1, entries:[...]}`; old `string[]` form is silently dropped (no upgrade fetch) |
| R3 | Stale-prediction threshold | `> 60s past` → omit; `≤ 60s past` → "departed" label; `> now` → normal |
| R4 | Geolocation failure modes | Hook exposes `permission` field; UI branches on it |
| R5 | Initial vs refresh failure | Hook exposes `refreshError` distinct from `error` |
| R6 | Empty states | Three distinct messages: noArrivals (existing), noSearchMatch (new), locationPermissionDenied (new) |

All open questions resolved. Phase 1 design proceeds.
