# Quickstart: Transit Tracker Improvements

**Branch**: `028-transit-improvements` | **Date**: 2026-04-29

How to verify each user story locally without deploying.

## Prerequisites

```bash
git checkout 028-transit-improvements
pnpm install
pnpm build:shared
```

For backend changes (the API-key wiring), the Firebase emulator is the easiest local target:

```bash
pnpm firebase:build:functions
pnpm dev   # starts shell + all MFEs
# in a separate terminal:
pnpm firebase:emulators
```

Set the local emulator's `API_KEYS` env so the OneBusAway field is present:

```bash
export API_KEYS='{"openweather":"","finnhub":"","gemini":"","youversion":"","onebusaway":"YOUR_DEV_KEY"}'
```

(For a one-off check without a real key, leave `onebusaway` blank — the resolver will fail closed and the UI will show the empty/refresh-failure state, which is itself one of the things this feature verifies.)

---

## Verify US1 — Recent stops render instantly

1. Open the app, search for stop "1_29248" (any valid OBA ID), open it. Repeat with two more stops.
2. Open DevTools → Application → Local Storage and confirm the `transit-recent-stops` key now contains a `{"version":1,"entries":[...]}` object with all three stops, each carrying `name`, `direction`, `routeIds`.
3. Reload the page with the Network tab set to **Offline**.
4. **Expected**: The recent-stops list immediately shows all three stops with their names, directions, and route badges. No `transitStop` request is issued for the initial render.
5. Re-enable network, tap a recent stop. Arrivals begin loading. The cached entry's `lastSeenAt` advances to the new `Date.now()`.

### Migration check

1. In DevTools, replace the value of `transit-recent-stops` with the legacy form: `["1_29248","1_75403"]`.
2. Reload.
3. **Expected**: Recent stops list is empty (legacy form discarded). After visiting a stop, the key is rewritten to the V1 container.

---

## Verify US2 — Predictable failure states

### Refresh failure

1. Open a stop, wait for arrivals to load.
2. In DevTools → Network, throttle to **Offline**.
3. Tap the Refresh button.
4. **Expected**:
   - Previously-loaded arrivals remain on screen.
   - An inline message appears near the Refresh control with text from `transit.refreshFailed` and a Retry control.
   - No blank screen, no spinner stuck running indefinitely.

### Geolocation denied

1. Reload, navigate to the search screen.
2. Tap "Find nearby" and click **Block** on the browser permission prompt.
3. **Expected**: A clear permission-explanation prompt is shown (`transit.locationPermissionDenied`), explaining what location is used for. The Nearby section is not blank or stuck loading.

### Empty arrivals

1. Open a stop ID that has no upcoming arrivals (or wait until late at night).
2. **Expected**: An explicit `transit.noArrivals` message is shown rather than a blank list.

### No search match

1. Type a search term that matches no stop name.
2. **Expected**: An explicit `transit.noSearchMatch` message with a suggestion to find nearby stops instead.

---

## Verify US3 — Stale predictions are cleared on refresh

This requires manipulating the upstream payload, which is most reliable via a unit test against `useTransitArrivals`. End-to-end:

1. Open a stop with a vehicle predicted to arrive in ≤ 1 minute.
2. Wait for the prediction time to pass and tap Refresh.
3. **Expected**: Either
   - The arrival is rendered with a "departed" label (within 60s of effective time), or
   - The arrival is omitted entirely (more than 60s past effective time).
4. **NOT expected**: A negative-minute ETA (e.g., "−2 min").

---

## Verify the credential change

1. With the `expandApiKeys` change deployed (or in the emulator), inspect the running graphql function logs.
2. Confirm the resolver no longer references `OBA_API_KEY = 'TEST'` anywhere in source: `git grep "OBA_API_KEY = 'TEST'" functions/` returns no results.
3. With `onebusaway` field set in the secret, requests to OneBusAway succeed.
4. With the field empty, the resolver returns empty results and logs `[transit] ONEBUSAWAY_API_KEY is missing` once per request.

---

## Final local check before pushing

Per the constitution, all four MUST pass locally before pushing:

```bash
pnpm build:shared
pnpm lint
pnpm test:run
pnpm typecheck
cd functions && npx tsc --noEmit && cd ..
```

The functions-side typecheck is required because `functions/` has a stricter tsconfig (`noUnusedLocals: true`) that the root `pnpm typecheck` does not exercise.
