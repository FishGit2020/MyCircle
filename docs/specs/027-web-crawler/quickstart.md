# Quickstart: Web Crawler Enhancements

**Branch**: `027-web-crawler` | **Date**: 2026-03-17

## Prerequisites

- Node.js 18+, pnpm installed
- Firebase CLI (`npm install -g firebase-tools`)
- Logged in to Firebase (`firebase login`)
- Repository cloned and dependencies installed (`pnpm install`)

## Development Setup

```bash
# 1. Switch to feature branch
git checkout 027-web-crawler

# 2. Install dependencies (auto-runs codegen via postinstall)
pnpm install

# 3. Build shared package (required before MFE dev)
pnpm build:shared

# 4. Start all MFEs in dev mode (includes web-crawler)
pnpm dev
```

The web crawler MFE will be available at `http://localhost:5173/web-crawler`.

## Backend Development

```bash
# Verify backend types after schema changes
cd functions && npx tsc --noEmit

# Regenerate GraphQL types after schema/query changes
pnpm codegen

# Run Firebase emulator for local testing
pnpm emulator:start
```

## Testing

```bash
# Run web-crawler tests
pnpm --filter @mycircle/web-crawler test:run

# Run all tests
pnpm test:run

# Typecheck everything
pnpm typecheck
```

## Verification Checklist

After implementing enhancements, verify:

1. **SSRF protection**: Submit `http://127.0.0.1` — should see error message
2. **Search**: Crawl 2+ URLs, use search bar to filter by keyword
3. **Metadata**: Crawl an article page, verify author/date/description shown
4. **Content reader**: Click a document, verify full text displayed in reader view
5. **Dark mode**: Toggle dark mode, verify reader view has proper `dark:` variants
6. **i18n**: Switch language, verify new strings are translated

## Key Files to Modify

| File | Change |
|------|--------|
| `functions/src/schema.ts` | Add new fields to `CrawledDocument`, add `searchCrawlJobs` query |
| `functions/src/resolvers/webCrawler.ts` | Add search resolver, SSRF validation |
| `functions/src/handlers/webCrawler.ts` | Add SSRF IP check, extract metadata fields |
| `packages/shared/src/apollo/queries.ts` | Add `SEARCH_CRAWL_JOBS` query, update `GET_CRAWL_JOB_DETAIL` fields |
| `packages/web-crawler/src/components/WebCrawler.tsx` | Add search bar, content reader view |
| `packages/web-crawler/src/hooks/useCrawler.ts` | Add `useSearchCrawlJobs` hook |
| i18n locales (en, es, zh) | Add keys for search, reader, metadata labels |
