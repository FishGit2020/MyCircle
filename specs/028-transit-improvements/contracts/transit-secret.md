# Contract: Transit API Credential

**Branch**: `028-transit-improvements` | **Date**: 2026-04-29

The OneBusAway API key MUST NOT appear in source. This contract defines exactly how the resolver obtains it.

## Storage

| Property | Value |
|---|---|
| Secret backend | Firebase Functions Secrets (Google Secret Manager) |
| Secret name | `API_KEYS` *(existing — bundled JSON document; do **not** create a new secret)* |
| New JSON field | `onebusaway` |
| Granted to | The graphql Cloud Function (already declared in `functions/src/handlers/graphql.ts`) |
| IAM role | `roles/secretmanager.secretAccessor` on the compute service account *(already granted for `API_KEYS`)* |

Example secret value (illustrative — actual values are not shown):

```json
{
  "openweather": "...",
  "finnhub": "...",
  "gemini": "...",
  "youversion": "...",
  "onebusaway": "REAL_OBA_KEY"
}
```

Updated with:

```bash
printf '<the JSON above>' | npx firebase functions:secrets:set API_KEYS
```

`printf`, never `echo` (constitution V; CLAUDE.md).

## Runtime expansion

`functions/src/handlers/shared.ts → expandApiKeys()` is updated to expose the new field as a process env var. The graphql function (`functions/src/handlers/graphql.ts`) already calls `expandApiKeys()` on every request, so no change is needed there.

```ts
// shared.ts
export function expandApiKeys() {
  if (process.env.API_KEYS) {
    const ak = JSON.parse(process.env.API_KEYS);
    process.env.OPENWEATHER_API_KEY = ak.openweather || '';
    process.env.FINNHUB_API_KEY     = ak.finnhub     || '';
    process.env.GEMINI_API_KEY      = ak.gemini      || '';
    process.env.YOUVERSION_APP_KEY  = ak.youversion  || '';
    process.env.ONEBUSAWAY_API_KEY  = ak.onebusaway  || ''; // NEW
  }
}
```

## Resolver consumption

`functions/src/resolvers/transit.ts` reads the env var and removes the hard-coded constant.

```ts
// BEFORE
const OBA_API_KEY = 'TEST';

// AFTER
function getObaKey(): string {
  const k = process.env.ONEBUSAWAY_API_KEY;
  if (!k) {
    // Fail closed: log and return empty so the resolver short-circuits
    // rather than calling OneBusAway with key=  (which leaks app identity
    // and pollutes their logs).
    console.warn('[transit] ONEBUSAWAY_API_KEY is missing');
    return '';
  }
  return k;
}
```

Each of the three resolvers (`transitArrivals`, `transitStop`, `transitNearbyStops`) early-returns an empty result (`[]` or `null`) when `getObaKey()` returns empty, instead of issuing a request.

## Failure-closed contract

| Condition | Server behavior | Client-visible effect |
|---|---|---|
| `process.env.ONEBUSAWAY_API_KEY` empty | Resolver returns `[]` / `null` without calling upstream; logs a `console.warn` once per request | Front-end shows empty state ("No upcoming arrivals") rather than an internal error |
| Upstream call returns non-2xx | Existing axios behavior (throws) → Apollo surfaces as `error` to the client | Front-end shows refresh-failure inline (US2) |

## Test obligations

- `transit.ts` resolver tests MUST mock `process.env.ONEBUSAWAY_API_KEY` and verify both the present-key path (calls upstream) and the missing-key path (returns empty without calling axios).
- No tests may hit the real OneBusAway API.
- `expandApiKeys()` test (if introduced — currently untested per repo state) MUST verify the new field is picked up.

## What this contract does NOT do

- It does NOT define a new secret. `API_KEYS` already exists.
- It does NOT change the GraphQL schema or any resolver signature.
- It does NOT change CORS, rate limiting, or auth.
- It does NOT change which clients can call the resolver.
