# MCP Server Guide

MyCircle includes a custom [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that provides project health validators, data readers, and code exploration tools for Claude Code.

## What It Does

The MCP server exposes six categories of tools:

1. **Project Health Validators** — Automated checks for CLAUDE.md rules (i18n sync, Dockerfile sync, PWA shortcuts, widget registry). Claude Code can call these to verify project consistency.
2. **AI Tool Registry** — Read-only schema reference for all AI assistant tools. Useful for understanding what tools the AI chat supports.
3. **Firestore Reader Tools** — Query Firestore collections, get document counts, and read recent feedback/announcements. Requires authenticated Google Cloud credentials.
4. **Sentry Reader Tools** — List and inspect Sentry error reports with stack traces. Requires a Sentry auth token.
5. **Component Explorer Tools** — Search, inspect, and list React components and hooks across all MFE packages by name, props, features, or hooks used.
6. **Planned Tools** — Analytics, i18n analysis, accessibility audit, and route exploration tools currently under development.

## How to Use with Claude Code

The server is configured in `.mcp.json` at the project root:

```json
{
  "mcpServers": {
    "mycircle": {
      "command": "npx",
      "args": ["tsx", "scripts/mcp-server.ts"]
    }
  }
}
```

After starting a new Claude Code session, the `mycircle` server should appear in `/mcp`. All tools are then available for Claude to call.

## Configuration & Environment Variables

Some tools require credentials or configuration to connect to external services.

### Firestore (required for `read_firestore_*` and `read_user_feedback`)

Firestore tools use the Firebase Admin SDK with Application Default Credentials. Authenticate with one of:

```bash
# Option 1: gcloud CLI (recommended for local dev)
gcloud auth application-default login

# Option 2: service account key file
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

The project ID is inferred from the default credentials. No additional env vars needed.

### Sentry (required for `read_sentry_*`)

Set the `SENTRY_AUTH_TOKEN` environment variable or add it to `.env.local`:

```bash
export SENTRY_AUTH_TOKEN=sntrys_...
```

Create a token at: https://sentry.io/settings/account/api/auth-tokens/
Required scope: `project:read`

Optional overrides (defaults work for MyCircle):
- `SENTRY_ORG` — Sentry organization slug (default: `youpeng-huang`)
- `SENTRY_PROJECT` — Sentry project slug (default: `javascript-react`)

### Analytics (planned — not yet implemented)

Future analytics tools will require:

```bash
export GA_PROPERTY_ID=properties/123456789
```

---

## Validator Tools

### `validate_i18n`

Checks that all 3 locale files (`en.ts`, `es.ts`, `zh.ts`) have the same keys. Reports missing keys per locale.

**Parameters:** (none)

**Ask Claude:** "Run the i18n validator to check for missing translations."

**Example output:**
```
i18n sync issues found:

es: missing 2 key(s):
  ai.newFeatureKey
  widgets.newWidgetDesc
```

### `validate_dockerfile`

Checks that `deploy/docker/Dockerfile` references all packages in both build and runtime stages. Reports missing or stale package references.

**Parameters:** (none)

**Ask Claude:** "Validate the Dockerfile references all packages."

**Example output:**
```
Dockerfile sync issues:

Build stage: missing COPY for: new-package
Runtime stage: missing COPY --from=builder for: new-package
```

### `validate_pwa_shortcuts`

Counts PWA shortcuts in `packages/shell/vite.config.ts` and warns if at or over the browser limit of 10.

**Parameters:** (none)

**Ask Claude:** "How many PWA shortcut slots are left?"

**Example output:**
```
PWA shortcuts: 9/10. 1 slot(s) available.
```

### `validate_widget_registry`

Checks that `WidgetType`, `DEFAULT_LAYOUT`, `WIDGET_COMPONENTS`, and `WIDGET_ROUTES` in `WidgetDashboard.tsx` are all in sync. Reports any ID mismatches.

**Parameters:** (none)

**Ask Claude:** "Check that the widget registry is in sync."

**Example output:**
```
Widget registry mismatches:

'newWidget' missing from: DEFAULT_LAYOUT, WIDGET_COMPONENTS
```

### `validate_all`

Runs all 4 validators and returns a combined report. This is the most commonly used tool — call it after any feature addition or removal.

**Parameters:** (none)

**Ask Claude:** "Run all project validators."

### `list_ai_tools`

Lists all AI assistant tool definitions with name, description, parameters, and category.

**Parameters:** (none)

**Ask Claude:** "What AI chat tools are available?"

---

## Firestore Reader Tools

These tools query the production Firestore database. They require authenticated Google Cloud credentials (see Configuration section above).

### `read_firestore_feedback`

Query any Firestore collection with ordering and pagination. Useful for reading feedback, announcements, or any other collection.

**Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `collection` | `string` | `"feedback"` | Firestore collection name to read |
| `limit` | `number` | `20` | Maximum number of documents to return |
| `orderBy` | `string` | `"createdAt"` | Field to order results by |
| `orderDirection` | `"asc" \| "desc"` | `"desc"` | Sort direction |

**Ask Claude:** "Show me the last 10 feedback entries from Firestore."

**Example output:**
```
# feedback (3 documents)

[1] id: abc123
  message: Love the new dark mode!
  createdAt: 2026-03-10T14:32:00.000Z
  userId: user_456

[2] id: def789
  message: Bible reader search is slow
  createdAt: 2026-03-09T08:15:00.000Z
  userId: user_012
```

### `read_firestore_stats`

Get document counts for key Firestore collections: `worshipSongs`, `announcements`, and `users`. Quick health check for data volume.

**Parameters:** (none)

**Ask Claude:** "How many worship songs and users are in Firestore?"

**Example output:**
```
# Firestore Collection Stats

worshipSongs: 142 documents
announcements: 8 documents
users: 37 documents
```

### `read_user_feedback`

Read recent feedback and announcements from the last N days. Queries both the `feedback` and `announcements` collections, filtering by `createdAt` timestamp.

**Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `days` | `number` | `7` | Number of days to look back |

**Ask Claude:** "Show me all user feedback and announcements from the last 3 days."

**Example output:**
```
## feedback (2 in last 3 days)

[1] id: abc123
  message: Map tiles load slowly on mobile
  createdAt: 2026-03-12T10:00:00.000Z

## announcements
No documents in the last 3 day(s).
```

---

## Sentry Reader Tools

These tools query the Sentry error tracking API. They require a `SENTRY_AUTH_TOKEN` (see Configuration section above).

### `read_sentry_issues`

List recent Sentry error reports for the MyCircle project. Supports filtering by status and free-text search query.

**Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `limit` | `number` | `10` | Maximum issues to return |
| `query` | `string` | _(optional)_ | Search query to filter issues |
| `status` | `"unresolved" \| "resolved" \| "ignored"` | `"unresolved"` | Issue status filter |

**Ask Claude:** "Show me the top 5 unresolved Sentry errors."

**Example output:**
```
# Sentry Issues (unresolved) — 3 result(s)

1. **TypeError: Cannot read property 'map' of undefined**
   ID: 4821573 | Level: error | Events: 42
   Culprit: packages/weather-display/src/components/WeatherDisplay.tsx
   First seen: 3/8/2026 | Last seen: 3/13/2026
   URL: https://sentry.io/organizations/youpeng-huang/issues/4821573/

2. **ChunkLoadError: Loading chunk 123 failed**
   ID: 4819201 | Level: error | Events: 7
   Culprit: (unknown)
   First seen: 3/11/2026 | Last seen: 3/12/2026
   URL: https://sentry.io/organizations/youpeng-huang/issues/4819201/
```

### `read_sentry_issue_detail`

Get the full details for a specific Sentry issue including metadata, tags, affected user count, and the stack trace from the latest event.

**Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `issueId` | `string` | _(required)_ | Sentry issue ID (numeric string) |

**Ask Claude:** "Get the stack trace for Sentry issue 4821573."

**Example output:**
```
# TypeError: Cannot read property 'map' of undefined

| Field | Value |
|-------|-------|
| ID | 4821573 |
| Level | error |
| Status | unresolved |
| Events | 42 |
| Affected users | 12 |
| Culprit | WeatherDisplay.tsx |

## Tags

- **browser**: Chrome 122 (30), Firefox 121 (8), Safari 17 (4)
- **os**: Android 14 (20), iOS 17 (15)

## Latest Event

Event ID: a1b2c3d4e5f6
Date: 3/13/2026, 2:15:00 PM

### TypeError: Cannot read property 'map' of undefined

  at WeatherDisplay (packages/weather-display/src/components/WeatherDisplay.tsx:45:12)
  at renderWithHooks (node_modules/react-dom/cjs/react-dom.development.js:14985:18)
```

---

## Component Explorer Tools

These tools scan the local codebase and do not require any external credentials. They parse React component and hook files across all MFE packages.

### `explore_components`

Search for React components and hooks across all MFE packages. Matches against component names, prop names, hook names, import paths, i18n keys, ARIA attributes, child components, and file paths.

**Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `query` | `string` | _(required)_ | Search term — component name, prop name, hook name, or feature keyword (e.g., `"map"`, `"pagination"`, `"audio"`, `"maplibre"`) |
| `package` | `string` | _(optional)_ | Filter to a specific MFE package name (e.g., `"weather-display"`) |

**Ask Claude:** "Find all components that use pagination."

**Example output:**
```
# Components matching "pagination"

Found 2 result(s).

### export component SongList
- **Package**: worship-songs
- **File**: packages/worship-songs/src/components/SongList.tsx
- **Props**: songs: Song[], loading?: boolean
- **Hooks used**: useCallback, useMemo, useState, useTranslation
- **i18n keys**: 3 (worshipSongs.title, worshipSongs.search, worshipSongs.noResults)
- **Children**: Pagination, SongCard

### export component BookList
- **Package**: digital-library
- **File**: packages/digital-library/src/components/BookList.tsx
- **Props**: books: Book[], onSelect: (id: string) => void
- **Hooks used**: useCallback, useState, useTranslation
```

### `component_detail`

Get detailed information about a specific component or hook file: props/parameters, types defined, hooks used, imports, i18n keys, ARIA attributes, and child components.

**Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `filePath` | `string` | _(required)_ | File path relative to project root (e.g., `"packages/hiking-map/src/components/MapView.tsx"`) |

**Ask Claude:** "Show me the details of the MapView component."

**Example output:**
```
# MapView
- **File**: packages/hiking-map/src/components/MapView.tsx
- **Kind**: component
- **Exported**: yes
- **Lines**: 280

## Props / Parameters
- `style?`: React.CSSProperties
- `onMapReady?`: (map: Map) => void
- `initialCenter?`: [number, number]

## Types Defined
- MapViewProps
- MarkerData

## Hooks Used
- useCallback
- useEffect
- useRef
- useState

## Imports
- react
- maplibre-gl
- @mycircle/shared

## i18n Keys
- hiking.mapLoading
- hiking.mapError

## ARIA Attributes
- aria-label

## Child Components
- LoadingSpinner
- ErrorBoundary
```

### `list_mfe_features`

Overview of all MFE packages: main component, route, hooks, component count, and key features inferred from imports and patterns (e.g., GraphQL, Firestore data, audio playback, charts, i18n).

**Parameters:** (none)

**Ask Claude:** "Give me an overview of all MFE packages and their capabilities."

**Example output:**
```
# MFE Feature Overview

10 packages scanned.

### weather-display
- **Main component**: WeatherDisplay
- **Route**: /weather-display
- **Components** (4): WeatherDisplay, ForecastCard, WeatherMap, TemperatureChart
- **Hooks** (2): useWeatherData, useLocationSearch
- **Key features**: GraphQL, i18n, charts, Firestore data

### podcast-player
- **Main component**: PodcastPlayer
- **Route**: /podcast-player
- **Components** (6): PodcastPlayer, EpisodeList, AudioControls, ...
- **Hooks** (3): usePodcastSearch, useAudioPlayer, usePlaybackState
- **Key features**: audio playback, GraphQL, i18n
```

---

## Planned Tools (Under Development)

The following tools are being built and will be registered in `mcp-server.ts` in upcoming PRs. Sections here are placeholders for documentation.

### Analytics Tools

#### `read_analytics_summary`

Get a summary of Google Analytics data for the MyCircle property — page views, active users, top pages, and session metrics.

**Parameters:** TBD — expected: `dateRange` (e.g., `"7d"`, `"30d"`), `metric`.

**Requires:** `GA_PROPERTY_ID` environment variable.

#### `read_feature_usage`

Get usage metrics for specific MFE features — which pages/features users interact with most.

**Parameters:** TBD — expected: `feature` (MFE name or route), `dateRange`.

**Requires:** `GA_PROPERTY_ID` environment variable.

### i18n Analysis Tools

#### `analyze_i18n_bundle`

Analyze the i18n bundle for a specific locale — key count, nesting depth, estimated bundle size, and keys with long values.

**Parameters:** TBD — expected: `locale` (`"en"`, `"es"`, `"zh"`).

#### `find_unused_i18n_keys`

Scan source files for `t('key')` calls and compare against locale definitions to find keys that exist in locale files but are never referenced in code.

**Parameters:** TBD — expected: `locale` (optional, defaults to `"en"`).

#### `find_missing_i18n_keys`

Scan source files for `t('key')` calls and compare against locale definitions to find keys used in code that are missing from one or more locale files.

**Parameters:** TBD — expected: none (checks all locales).

### Accessibility Audit Tools

#### `check_accessibility`

Run a static accessibility audit on component files — checks for missing `aria-label`, missing `alt` attributes, buttons without `type`, insufficient touch targets, and missing dark mode variants.

**Parameters:** TBD — expected: `package` (optional, scans all if omitted).

#### `check_color_contrast`

Check Tailwind color classes in component files against WCAG contrast ratio guidelines. Flags class pairs that may have insufficient contrast.

**Parameters:** TBD — expected: `filePath` or `package`.

### Route Explorer Tools

#### `list_routes`

List all registered routes in the shell `App.tsx` and their corresponding MFE packages, lazy imports, and breadcrumb labels.

**Parameters:** TBD — expected: none.

#### `route_detail`

Get detailed information about a specific route — component, federation remote config, navigation group, widget mapping, and i18n label keys.

**Parameters:** TBD — expected: `route` (e.g., `"/weather-display"`).

#### `find_route_gaps`

Compare registered routes against the full integration checklist (shell routes, BottomNav, CommandPalette, WidgetDashboard, Dockerfile, i18n keys) and report missing integration points.

**Parameters:** TBD — expected: none.

---

## Architecture

```
Claude Code ──stdio──> mcp-server.ts ──> validators.ts (reads files, reports issues)
                                     ├──> mfe-tools.ts (schema-only reference)
                                     ├──> firestore-reader.ts (Firestore Admin SDK)
                                     ├──> sentry-reader.ts (Sentry REST API)
                                     └──> component-explorer.ts (local file scanning)

User ──AI chat──> GraphQL Mutation (aiChat) ──> resolvers.ts
                                                    │
                                                    ├── imports tool declarations from mfe-tools.ts
                                                    │   (via gemini-bridge.ts → Gemini format)
                                                    │
                                                    ├── Gemini calls tools → executeAiTool()
                                                    │
                                                    └── returns { response, toolCalls, actions[] }
                                                                                │
Frontend (useAiChat) <──────────────────────────────────────────────────────────┘
     ├── navigateTo → window.dispatchEvent('navigate')
     ├── addFlashcard → window.__flashcards.add()
     └── addBookmark → window.dispatchEvent('bible-bookmark')
```

## AI Chat MCP Integration

In addition to the Claude Code MCP server (`scripts/mcp-server.ts`), MyCircle uses MCP internally for AI chat tool execution.

### In-Memory MCP Server (`functions/src/mcpToolServer.ts`)

The `mcpToolServer` creates a connected MCP client/server pair using `InMemoryTransport` from `@modelcontextprotocol/sdk`. This avoids network overhead and persistent connections, making it fully compatible with serverless environments like Firebase Cloud Functions.

**How it works:**

1. `createMcpToolClient()` accepts an `executeTool` function and an array of tool definitions (OpenAI format)
2. It spins up an MCP `Server` that registers all tools for listing (`ListToolsRequestSchema`) and execution (`CallToolRequestSchema`)
3. An MCP `Client` is connected to the server via `InMemoryTransport.createLinkedPair()`
4. The returned object exposes `listTools()`, `callTool(name, args)`, and `close()` methods

```
Resolver (aiChat mutation)
   │
   │  toolMode === 'mcp'?
   │
   ├── Yes → createMcpToolClient({ executeTool, tools })
   │           └── client.callTool(name, args)
   │                 └── MCP Server → executeTool(name, args) → result
   │
   └── No  → executeTool(name, args) directly (native path)
```

### UI Toggle

The AI Chat UI includes a Native/MCP toggle that sets the `toolMode` parameter on the `aiChat` GraphQL mutation. When `toolMode` is `"mcp"`, the resolver routes tool calls through the MCP client. When omitted or `"native"`, tools are called directly. The response includes a `toolMode` field so the UI can display which path was used.

### GraphQL Schema

```graphql
mutation AiChat($message: String!, ..., $toolMode: String) {
  aiChat(message: $message, ..., toolMode: $toolMode) {
    response
    toolCalls { ... }
    actions { ... }
    toolMode    # "mcp" or "native"
  }
}
```

### Key Files

| File | Purpose |
|---|---|
| `functions/src/mcpToolServer.ts` | In-memory MCP server/client factory |
| `functions/src/resolvers.ts` | Resolver that uses `toolMode` to choose execution path |
| `packages/ai-assistant/src/hooks/useAiChat.ts` | Passes `toolMode` in mutation variables |
| `packages/ai-assistant/src/components/AiAssistant.tsx` | UI toggle for Native/MCP mode |

## Adding New Tools

1. **Define the tool** in `scripts/mcp-tools/mfe-tools.ts`:
   ```ts
   export const myNewTool: ToolDef = {
     name: 'myNewTool',
     description: 'What it does',
     parameters: z.object({ param: z.string().describe('Description') }),
     category: 'myMfe',
     isFrontendAction: false, // true if it returns a frontend action
   };
   ```
   Add it to the `ALL_TOOLS` array.

2. **Add execution handler** in `server/graphql/resolvers.ts` inside `executeAiTool()`:
   ```ts
   case 'myNewTool':
     return { result: await executeMyNewTool(args.param as string) };
   ```

3. **For frontend-action tools**, add a handler in `packages/ai-assistant/src/hooks/useAiChat.ts` inside `handleActions()`:
   ```ts
   case 'myNewTool':
     window.dispatchEvent(new CustomEvent('my-action', { detail: action.payload }));
     break;
   ```

4. **Add i18n keys** for the tool label in all 3 locale files and update `ToolCallDisplay.tsx` with the icon and label key.

5. **Update `functions/src/index.ts`** if the tool should be available in production (Firebase Cloud Functions).

## Adding New Validators

1. **Add the validator function** in `scripts/mcp-tools/validators.ts`:
   ```ts
   export function validateMyThing(): string {
     // Read files, check invariants, return report string
   }
   ```

2. **Register it** in `scripts/mcp-server.ts`:
   ```ts
   server.tool('validate_my_thing', 'Description', {}, async () => ({
     content: [{ type: 'text', text: validateMyThing() }],
   }));
   ```

3. **Add it to `validateAll()`** in `validators.ts`.

## File Reference

| File | Purpose |
|---|---|
| `.mcp.json` | Claude Code MCP server config |
| `scripts/mcp-server.ts` | MCP stdio server entry point |
| `scripts/mcp-tools/validators.ts` | Project health validators |
| `scripts/mcp-tools/mfe-tools.ts` | Shared AI tool definitions (Zod schemas) |
| `scripts/mcp-tools/gemini-bridge.ts` | Zod → Gemini FunctionDeclaration converter |
| `scripts/mcp-tools/firestore-reader.ts` | Firestore Admin SDK reader tools |
| `scripts/mcp-tools/sentry-reader.ts` | Sentry REST API reader tools |
| `scripts/mcp-tools/component-explorer.ts` | Local codebase component/hook scanner |
