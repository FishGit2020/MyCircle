# Quickstart: Favorite Cities Cross-MFE Integration

## Prerequisites

- Firebase authenticated user (favorites are auth-only)
- `pnpm install` at repo root
- `pnpm build:shared` after any shared package changes

## Affected Packages

| Package | Change |
|---|---|
| `packages/city-search` | Add favorites section + star buttons to `CitySearch.tsx` |
| `packages/transit-tracker` | Add city chip quick-select to `TransitTracker.tsx` |
| `packages/shell` | Update `CitySearchWrapper`, `remotes.d.ts`, transit route wrapper |
| `packages/shell/src/lib/firebase.ts` | Add 10-city cap to `toggleFavoriteCity` |
| i18n locale files | Add new `search.favoritesSection`, `transit.favoriteCities` keys |

## Running Locally

```bash
# Start all MFEs in dev mode
pnpm dev

# Or start individually:
pnpm dev:city-search    # http://localhost:5174
pnpm dev:transit        # http://localhost:5178
pnpm dev:shell          # http://localhost:5173
```

## Testing the Feature

1. Sign in to the app
2. Navigate to `/search`
3. Click the search field — favorites section appears (empty initially)
4. Type a city name, see star button on results
5. Click star → city appears in favorites section
6. Navigate to `/transit` → see city chip quick-select

## Running Tests

```bash
pnpm --filter @mycircle/city-search test:run
pnpm --filter @mycircle/transit-tracker test:run
pnpm --filter @mycircle/shell test:run
pnpm typecheck
```
