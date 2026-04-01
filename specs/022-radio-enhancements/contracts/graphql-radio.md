# Contract: GraphQL Radio API Changes (022)

## Modified Query: radioStations

```graphql
# Before
radioStations(query: String, limit: Int = 50): [RadioStation!]!

# After — adds optional genre tag and country filters
radioStations(query: String, limit: Int = 50, tag: String, country: String): [RadioStation!]!
```

**Behaviour**:
- `tag`: if provided, filters to stations whose `tags` field contains this value (server-side, forwarded as `tag` to Radio Browser API)
- `country`: if provided, filters to stations from this country (server-side, forwarded as `country` to Radio Browser API)
- All three params (query/tag/country) apply simultaneously as AND logic
- Cache key must include `tag` and `country` to prevent cross-filter stale hits

**Breaking change**: None — both new args are optional with no default. Existing callers passing only `query` and `limit` are unaffected.

---

## New Query: radioTags

```graphql
radioTags(limit: Int = 50): [RadioTag!]!

type RadioTag {
  name: String!
  stationCount: Int!
}
```

**Behaviour**:
- Returns the top `limit` genre tags ordered by station count descending, excluding broken stations
- Calls Radio Browser API `/json/tags?order=stationcount&reverse=true&hidebroken=true&limit={limit}`
- Cached for 5 minutes (same TTL as radioStations)

---

## New Mutation: voteRadioStation

```graphql
voteRadioStation(uuid: String!): Boolean!
```

**Behaviour**:
- Calls Radio Browser API `GET /json/vote/{uuid}` (the API uses GET, not POST)
- Returns `true` if the vote was accepted, `false` if the API rejected it (e.g. duplicate IP)
- Does NOT require MyCircle authentication (Radio Browser API is open)
- Authentication IS required at the MyCircle level (resolver checks `ctx.uid`) to prevent anonymous abuse

**Error cases**:
- Unknown UUID: returns `false` (API returns error message — treated as rejection)
- Network error: throws GraphQL error

---

## Apollo Client Queries to Add (packages/shared/src/apollo/queries.ts)

```typescript
export const GET_RADIO_TAGS = gql`
  query GetRadioTags($limit: Int) {
    radioTags(limit: $limit) {
      name
      stationCount
    }
  }
`;

export const VOTE_RADIO_STATION = gql`
  mutation VoteRadioStation($uuid: String!) {
    voteRadioStation(uuid: $uuid)
  }
`;
```

The existing `GET_RADIO_STATIONS` query must be updated to accept `tag` and `country` variables:

```typescript
export const GET_RADIO_STATIONS = gql`
  ${RADIO_STATION_FIELDS}
  query GetRadioStations($query: String, $limit: Int, $tag: String, $country: String) {
    radioStations(query: $query, limit: $limit, tag: $tag, country: $country) {
      ...RadioStationFields
    }
  }
`;
```
