# Feature Spec: Deal Finder

**Status**: Implemented
**Package**: `packages/deal-finder`
**Route**: `/deals`
**Port**: 3030

## Summary

Deal aggregator that collects and displays deals from multiple sources including SlickDeals, DealNews, and Reddit deal subreddits. Features a Cloud Function backend for deal scraping with a demo data fallback when the API is unavailable.

## Key Features

- Aggregated deals from multiple sources (SlickDeals, DealNews, Reddit)
- Deal list display with title, price, source, and link
- Source filtering and search
- Demo data fallback when Cloud Function is unavailable
- Deal detail view with external link to source

## Data Sources

- **Cloud Function**: `/deals-api/**` -> `dealsProxy` (deal scraping/aggregation)
- **Demo data**: Fallback static data when API is unavailable

## Integration Points

- **Shell route**: `/deals` in App.tsx (no auth required)
- **Widget**: `dealFinder` in widgetConfig.ts
- **Nav group**: Daily (`nav.group.daily`)
- **i18n namespace**: `nav.dealFinder`, `deals.*`
- **Cloud Function**: `/deals-api/**` -> `dealsProxy`

## Tech Stack

- React 18, TypeScript, Tailwind CSS
- Cloud Function backend for deal aggregation
- Custom hooks: `useDeals` for fetching and filtering deals
- TypeScript types in `types.ts`
- Demo data fallback pattern

## Testing

- Unit tests: `packages/deal-finder/src/**/*.test.{ts,tsx}`
- E2E: `e2e/deals.spec.ts`
