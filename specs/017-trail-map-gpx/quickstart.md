# Quickstart: Trail Map GPX & Route Enhancements

**Branch**: `017-trail-map-gpx`

## Prerequisites

- Node.js 20+, pnpm 9+
- Firebase emulator suite (for local dev with Firestore)

## Setup

```bash
# 1. Check out the feature branch
git checkout 017-trail-map-gpx

# 2. Install dependencies
pnpm install

# 3. Build shared library (required before running MFEs)
pnpm build:shared

# 4. Start the hiking-map MFE in isolation
pnpm dev:hiking-map

# 5. Or start the full dev stack (all MFEs + shell)
pnpm dev
```

## Running Tests

```bash
# Unit tests for hiking-map only
pnpm --filter @mycircle/hiking-map test:run

# Full suite (lint + tests + typecheck)
pnpm lint && pnpm test:run && pnpm typecheck

# Functions typecheck (separate strict tsconfig)
cd functions && npx tsc --noEmit
```

## Key Files to Edit

| Task | File |
|------|------|
| GPX parse/export logic | `packages/hiking-map/src/services/gpxService.ts` (new) |
| Import UI button | `packages/hiking-map/src/components/GpxImportButton.tsx` (new) |
| Elevation chart | `packages/hiking-map/src/components/ElevationProfile.tsx` (new) |
| Multi-waypoint planner | `packages/hiking-map/src/components/RoutePlanner.tsx` |
| Route list (export, search, filter, save UX) | `packages/hiking-map/src/components/SavedRoutes.tsx` |
| SavedRoute type | `packages/hiking-map/src/services/routeStorageService.ts` |
| GraphQL schema | `functions/src/schema.ts` |
| calcRouteMulti resolver | `functions/src/resolvers/routing.ts` |
| Shared query constants | `packages/shared/src/apollo/queries.ts` |
| i18n keys | `packages/shell/src/i18n/locales/en.ts`, `es.ts`, `zh.ts` |

## After Schema Changes

```bash
# Regenerate Apollo types
pnpm codegen

# Verify functions typecheck
cd functions && npx tsc --noEmit
```

## Validate Health

```bash
# Run all MCP validators (i18n, Dockerfile, widgets, etc.)
# In Claude Code: use validate_all MCP tool
```

## Testing a GPX Import Manually

1. Download any `.gpx` file from [wikiloc.com](https://www.wikiloc.com) or use the sample in `packages/hiking-map/test/fixtures/sample.gpx`.
2. Open the app at `http://localhost:3001/hiking`.
3. Click "Import GPX" → select the file.
4. Verify the track renders as a blue polyline and the map zooms to it.
5. Click "Save Route" and confirm the name prompt appears pre-filled.

## Testing GPX Export

1. Open the Saved Routes panel.
2. Click the download icon on any saved route.
3. A `.gpx` file downloads — open it in a text editor and verify it contains `<trk>` and `<trkpt>` elements.
