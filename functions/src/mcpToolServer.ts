/**
 * In-memory MCP tool server for AI chat.
 *
 * Wraps the same tools as the native tool calling path but uses the
 * Model Context Protocol for tool discovery and execution. Uses
 * in-memory transport — no network, no persistent connections, works
 * in serverless (Cloud Functions).
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

export interface McpToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

interface McpToolServerOptions {
  /** Function that executes a tool by name. Same signature as the native executeTool. */
  executeTool: (name: string, args: Record<string, unknown>) => Promise<string>;
  /** Tool definitions in OpenAI format (reused for MCP registration). */
  tools: Array<{ type: string; function: { name: string; description: string; parameters: Record<string, unknown> } }>;
}

/**
 * Create a connected MCP client/server pair using in-memory transport.
 * The server registers all AI tools; the client is used by the resolver
 * to discover and call tools via the MCP protocol.
 */
export async function createMcpToolClient(opts: McpToolServerOptions) {
  const server = new Server(
    { name: 'mycircle-ai-tools', version: '1.0.0' },
    { capabilities: { tools: {} } },
  );

  // Register tool listing
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: opts.tools.map(t => ({
      name: t.function.name,
      description: t.function.description,
      inputSchema: {
        type: 'object' as const,
        ...(t.function.parameters || {}),
      },
    })),
  }));

  // Register tool execution
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      const result = await opts.executeTool(name, (args || {}) as Record<string, unknown>);
      return { content: [{ type: 'text' as const, text: result }] };
    } catch (err: any) {
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ error: err.message }) }],
        isError: true,
      };
    }
  });

  // Create in-memory transport pair and connect
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client(
    { name: 'mycircle-ai-chat', version: '1.0.0' },
    {},
  );

  await server.connect(serverTransport);
  await client.connect(clientTransport);

  return {
    client,
    server,
    /** List tools via MCP protocol (for benchmarking the discovery overhead). */
    async listTools() {
      const response = await client.listTools();
      return response.tools;
    },
    /** Call a tool via MCP protocol. Returns the text result. */
    async callTool(name: string, args: Record<string, unknown>): Promise<string> {
      const response = await client.callTool({ name, arguments: args });
      const content = response.content as Array<{ type: string; text?: string }>;
      const textContent = content.find(c => c.type === 'text');
      return textContent?.text ?? JSON.stringify(content);
    },
    /** Clean up connections. */
    async close() {
      await client.close();
      await server.close();
    },
  };
}
