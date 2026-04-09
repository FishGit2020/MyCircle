# Quickstart: Anniversary Tracker MFE

**Branch**: `027-anniversary-mfe` | **Date**: 2026-04-09

## Prerequisites

- Node.js 18+, pnpm 8+
- Firebase CLI (`firebase-tools`)
- Running on branch `027-anniversary-mfe`

## Local Development

```bash
# Install dependencies
pnpm install

# Build shared package (required before MFE dev)
pnpm build:shared

# Start the anniversary MFE in dev mode (port 3034)
pnpm dev:anniversary

# Start the full stack (shell + all MFEs)
pnpm dev
```

## Key Files to Create/Modify

### New Package: `packages/anniversary/`

```
packages/anniversary/
├── src/
│   ├── components/
│   │   ├── Anniversary.tsx           # Main entry (landing page)
│   │   ├── AnniversaryDetail.tsx     # Drilldown page (yearly timeline)
│   │   ├── AnniversaryForm.tsx       # Create/edit anniversary form
│   │   ├── YearlyTile.tsx            # Yearly entry tile
│   │   ├── YearlyEditor.tsx          # Edit form for a yearly entry
│   │   ├── AnniversaryMap.tsx        # MapLibre map with location pins
│   │   ├── PictureGallery.tsx        # Image gallery for yearly entries
│   │   ├── ContributorManager.tsx    # Search + add/remove contributors
│   │   └── UserSearch.tsx            # User search input component
│   ├── hooks/
│   │   ├── useAnniversaries.ts       # Query hook for all anniversaries
│   │   ├── useAnniversaryDetail.ts   # Query hook for single anniversary
│   │   └── useAnniversaryMutations.ts # All mutation hooks
│   ├── main.tsx                      # Standalone dev entry
│   └── index.css
├── test/
│   └── setup.ts
├── vite.config.ts
├── vitest.config.ts
├── package.json
├── tsconfig.json
└── postcss.config.js
```

### Shell Integration Points

| File | Change |
|------|--------|
| `packages/shell/src/App.tsx` | Add lazy import + `/anniversary` and `/anniversary/:id` routes |
| `packages/shell/vite.config.ts` | Add `anniversary` remote URL (port 3034) |
| `packages/shell/src/remotes.d.ts` | Add `anniversary/Anniversary` module declaration |
| `packages/shell/src/routeConfig.ts` | Add `'anniversary': 'nav.anniversary'` to ROUTE_LABEL_KEYS |
| `packages/shell/src/lib/navConfig.ts` | Add to Family group in NAV_GROUPS, ALL_NAV_ITEMS, ROUTE_MODULE_MAP |
| `packages/shell/src/components/layout/CommandPalette.tsx` | Add command palette entry |
| `packages/shell/src/components/widgets/widgetConfig.ts` | Add WidgetType, ALL_WIDGET_IDS, WIDGET_COMPONENTS, WIDGET_ROUTES |
| `packages/shell/src/components/widgets/AnniversaryWidget.tsx` | New widget component |
| `packages/shell/tailwind.config.js` | Add anniversary content path |
| `packages/shell/test/mocks/` | Add anniversary mock file |
| `packages/shell/vitest.config.ts` | Add anniversary alias |

### Backend

| File | Change |
|------|--------|
| `functions/src/schema.ts` | Add Anniversary types, queries, mutations |
| `functions/src/resolvers/anniversary.ts` | New resolver factory: `createAnniversaryResolvers()` |
| `functions/src/resolvers/index.ts` | Import and spread anniversary resolvers |
| `firestore.rules` | Add rules for `anniversaries/{anniversaryId}` and `years` subcollection |

### Other Integration

| File | Change |
|------|--------|
| `root vitest.config.ts` | Add anniversary alias |
| `root package.json` | Add `dev:anniversary` and `preview:anniversary` scripts |
| `deploy/docker/Dockerfile` | Add COPY lines for anniversary in build + runtime stages |
| `scripts/assemble-firebase.mjs` | Add anniversary to copy block + mfeDirs array |
| `server/production.ts` | Add `'anniversary'` to MFE_PREFIXES |
| `packages/shared/src/apollo/queries.ts` | Add anniversary queries/mutations |
| i18n files (en, es, zh) | Add `nav.anniversary`, `commandPalette.goToAnniversary`, all UI strings |

## Testing

```bash
# Run anniversary MFE tests
pnpm --filter @mycircle/anniversary test:run

# Run full test suite
pnpm test:run

# Lint + type check
pnpm lint && pnpm typecheck

# Backend type check
cd functions && npx tsc --noEmit

# Regenerate GraphQL types after schema changes
pnpm codegen
```

## Validation

```bash
# Run all MCP validators
# (via Claude Code MCP tool: validate_all)
```
