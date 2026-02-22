# MCP Server Guide

MyCircle includes a custom [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that provides project health validators and an AI tool registry for Claude Code.

## What It Does

The MCP server exposes two categories of tools:

1. **Project Health Validators** — Automated checks for CLAUDE.md rules (i18n sync, Dockerfile sync, PWA shortcuts, widget registry). Claude Code can call these to verify project consistency.
2. **AI Tool Registry** — Read-only schema reference for all AI assistant tools. Useful for understanding what tools the AI chat supports.

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

## Validator Tools

### `validate_i18n`

Checks that all 3 locale files (`en.ts`, `es.ts`, `zh.ts`) have the same keys. Reports missing keys per locale.

**Example output:**
```
i18n sync issues found:

es: missing 2 key(s):
  ai.newFeatureKey
  widgets.newWidgetDesc
```

### `validate_dockerfile`

Checks that `deploy/docker/Dockerfile` references all packages in both build and runtime stages. Reports missing or stale package references.

**Example output:**
```
Dockerfile sync issues:

Build stage: missing COPY for: new-package
Runtime stage: missing COPY --from=builder for: new-package
```

### `validate_pwa_shortcuts`

Counts PWA shortcuts in `packages/shell/vite.config.ts` and warns if at or over the browser limit of 10.

**Example output:**
```
PWA shortcuts: 9/10. 1 slot(s) available.
```

### `validate_widget_registry`

Checks that `WidgetType`, `DEFAULT_LAYOUT`, `WIDGET_COMPONENTS`, and `WIDGET_ROUTES` in `WidgetDashboard.tsx` are all in sync. Reports any ID mismatches.

**Example output:**
```
Widget registry mismatches:

'newWidget' missing from: DEFAULT_LAYOUT, WIDGET_COMPONENTS
```

### `validate_all`

Runs all 4 validators and returns a combined report. This is the most commonly used tool — call it after any feature addition or removal.

### `list_ai_tools`

Lists all AI assistant tool definitions with name, description, parameters, and category.

## Architecture

```
Claude Code ──stdio──> mcp-server.ts ──> validators.ts (reads files, reports issues)
                                     └──> mfe-tools.ts (schema-only reference)

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
