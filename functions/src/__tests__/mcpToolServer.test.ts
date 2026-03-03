import { describe, it, expect, vi } from 'vitest';
import { createMcpToolClient } from '../mcpToolServer.js';

function makeTool(name: string, description: string) {
  return {
    type: 'function',
    function: {
      name,
      description,
      parameters: {
        properties: { query: { type: 'string', description: 'Search query' } },
        required: ['query'],
      },
    },
  };
}

describe('mcpToolServer', () => {
  it('createMcpToolClient lists all registered tools', async () => {
    const executeTool = vi.fn();
    const tools = [
      makeTool('getWeather', 'Get weather'),
      makeTool('searchCities', 'Search cities'),
    ];

    const mcp = await createMcpToolClient({ executeTool, tools });
    try {
      const listed = await mcp.listTools();
      expect(listed).toHaveLength(2);
      expect(listed.map((t: any) => t.name)).toEqual(['getWeather', 'searchCities']);
      expect(listed[0].description).toBe('Get weather');
      expect(listed[0].inputSchema).toMatchObject({ type: 'object' });
    } finally {
      await mcp.close();
    }
  });

  it('callTool routes through MCP and returns the expected result', async () => {
    const executeTool = vi.fn().mockResolvedValue('{"temp":72,"city":"NYC"}');
    const tools = [makeTool('getWeather', 'Get weather')];

    const mcp = await createMcpToolClient({ executeTool, tools });
    try {
      const result = await mcp.callTool('getWeather', { query: 'NYC' });
      expect(result).toBe('{"temp":72,"city":"NYC"}');
      expect(executeTool).toHaveBeenCalledWith('getWeather', { query: 'NYC' });
    } finally {
      await mcp.close();
    }
  });

  it('callTool returns error JSON when executeTool throws', async () => {
    const executeTool = vi.fn().mockRejectedValue(new Error('API rate limit exceeded'));
    const tools = [makeTool('getStockQuote', 'Get stock quote')];

    const mcp = await createMcpToolClient({ executeTool, tools });
    try {
      const result = await mcp.callTool('getStockQuote', { query: 'AAPL' });
      const parsed = JSON.parse(result);
      expect(parsed).toEqual({ error: 'API rate limit exceeded' });
      expect(executeTool).toHaveBeenCalledWith('getStockQuote', { query: 'AAPL' });
    } finally {
      await mcp.close();
    }
  });

  it('callTool passes empty args when none provided', async () => {
    const executeTool = vi.fn().mockResolvedValue('done');
    const tools = [makeTool('listFlashcards', 'List flashcards')];

    const mcp = await createMcpToolClient({ executeTool, tools });
    try {
      const result = await mcp.callTool('listFlashcards', {});
      expect(result).toBe('done');
      expect(executeTool).toHaveBeenCalledWith('listFlashcards', {});
    } finally {
      await mcp.close();
    }
  });
});
