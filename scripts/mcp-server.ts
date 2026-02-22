#!/usr/bin/env npx tsx
/**
 * MyCircle MCP Server
 *
 * A stdio-based MCP server that exposes:
 * 1. Project health validators (i18n sync, Dockerfile, PWA shortcuts, widget registry)
 * 2. MFE tool schema registry (for reference — the actual tool definitions used by Gemini)
 *
 * Usage:
 *   npx tsx scripts/mcp-server.ts
 *
 * Claude Code connects via .mcp.json → stdio transport.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  validateI18n,
  validateDockerfile,
  validatePwaShortcuts,
  validateWidgetRegistry,
  validateAll,
} from './mcp-tools/validators.js';
import { ALL_TOOLS } from './mcp-tools/mfe-tools.js';

const server = new McpServer({
  name: 'mycircle',
  version: '1.0.0',
});

// ─── Validator Tools ──────────────────────────────────────────

server.tool(
  'validate_i18n',
  'Check that all 3 i18n locale files (en, es, zh) have the same keys. Reports missing keys per locale.',
  {},
  async () => ({
    content: [{ type: 'text', text: validateI18n() }],
  })
);

server.tool(
  'validate_dockerfile',
  'Check that deploy/docker/Dockerfile references all packages in both build and runtime stages. Reports missing or stale package references.',
  {},
  async () => ({
    content: [{ type: 'text', text: validateDockerfile() }],
  })
);

server.tool(
  'validate_pwa_shortcuts',
  'Count PWA shortcuts in packages/shell/vite.config.ts and warn if at or over the browser limit of 10.',
  {},
  async () => ({
    content: [{ type: 'text', text: validatePwaShortcuts() }],
  })
);

server.tool(
  'validate_widget_registry',
  'Check that WidgetType, DEFAULT_LAYOUT, WIDGET_COMPONENTS, and WIDGET_ROUTES in WidgetDashboard.tsx are all in sync. Reports any ID mismatches.',
  {},
  async () => ({
    content: [{ type: 'text', text: validateWidgetRegistry() }],
  })
);

server.tool(
  'validate_all',
  'Run all project health validators (i18n, Dockerfile, PWA shortcuts, widget registry) and return a combined report.',
  {},
  async () => ({
    content: [{ type: 'text', text: validateAll() }],
  })
);

// ─── MFE Tool Registry (read-only schema reference) ──────────

server.tool(
  'list_ai_tools',
  'List all AI assistant tool definitions (name, description, parameters, category). Useful for understanding what tools the AI chat supports.',
  {},
  async () => {
    const summary = ALL_TOOLS.map(t => {
      const params = Object.keys(t.parameters.shape || {});
      return `- **${t.name}** [${t.category}]${t.isFrontendAction ? ' (frontend action)' : ''}\n  ${t.description}\n  Parameters: ${params.length > 0 ? params.join(', ') : '(none)'}`;
    }).join('\n\n');

    return {
      content: [{ type: 'text', text: `# AI Assistant Tools (${ALL_TOOLS.length})\n\n${summary}` }],
    };
  }
);

// ─── Start ────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MyCircle MCP server started on stdio');
}

main().catch(err => {
  console.error('MCP server error:', err);
  process.exit(1);
});
