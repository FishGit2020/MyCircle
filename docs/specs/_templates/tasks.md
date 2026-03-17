# Tasks: [Feature Name]

**Status**: Not Started | In Progress | Complete
**Branch**: `feat/feature-name`

## Phase 1: Core Implementation
- [ ] Create package scaffold (package.json, vite.config.ts, vitest.config.ts)
- [ ] Implement main component
- [ ] Implement hooks / data fetching
- [ ] Add types

## Phase 2: Shell Integration
- [ ] App.tsx route
- [ ] vite.config.ts federation remote
- [ ] remotes.d.ts type declaration
- [ ] tailwind.config.js content path
- [ ] navConfig.ts (NAV_GROUPS + ALL_NAV_ITEMS + ROUTE_MODULE_MAP)
- [ ] routeConfig.ts (ROUTE_LABEL_KEYS)
- [ ] CommandPalette.tsx
- [ ] iconRegistry.tsx
- [ ] widgetConfig.ts + widget component

## Phase 3: i18n & Deployment
- [ ] i18n keys in en.ts, es.ts, zh.ts
- [ ] Dockerfile (both stages)
- [ ] assemble-firebase.mjs
- [ ] Root package.json (dev + preview + concurrently)
- [ ] firebase.json rewrite (if Cloud Function)

## Phase 4: Testing & Docs
- [ ] Unit tests (component + hooks)
- [ ] Shell mock + vitest aliases (root + shell)
- [ ] E2E spec
- [ ] docs/architecture.md entry
- [ ] MCP tools navigateTo list
- [ ] Run validate_all
