import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAiChatStream } from './useAiChatStream';

// Helper to create a mock ReadableStream from SSE events
function createMockSSEStream(events: Array<Record<string, unknown>>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const lines = events.map(e => `data: ${JSON.stringify(e)}\n\n`).join('');
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(lines));
      controller.close();
    },
  });
}

describe('useAiChatStream', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.__getFirebaseIdToken = vi.fn().mockResolvedValue('mock-token');
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useAiChatStream());
    expect(result.current.streaming).toBe(false);
    expect(result.current.streamingContent).toBe('');
    expect(result.current.activeToolCalls).toEqual([]);
  });

  it('streams text events and returns content', async () => {
    const mockStream = createMockSSEStream([
      { type: 'text', content: 'Hello ' },
      { type: 'text', content: 'world!' },
      { type: 'done', metadata: { provider: 'gemini', model: 'gemini-2.5-flash', tokens: { input: 10, output: 5 }, latencyMs: 100 } },
    ]);

    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      body: mockStream,
    } as unknown as Response);

    const { result } = renderHook(() => useAiChatStream());

    let streamResult: any;
    await act(async () => {
      streamResult = await result.current.sendStream('Hi', [], {});
    });

    expect(streamResult.content).toBe('Hello world!');
    expect(streamResult.metadata?.provider).toBe('gemini');
    expect(result.current.streaming).toBe(false);
  });

  it('handles tool_start and tool_result events', async () => {
    const mockStream = createMockSSEStream([
      { type: 'tool_start', name: 'getWeather', args: { city: 'NYC' } },
      { type: 'tool_result', name: 'getWeather', result: '{"temp":72}' },
      { type: 'text', content: 'The weather is 72F.' },
      { type: 'done', metadata: {} },
    ]);

    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      body: mockStream,
    } as unknown as Response);

    const { result } = renderHook(() => useAiChatStream());

    let streamResult: any;
    await act(async () => {
      streamResult = await result.current.sendStream('Weather?', [], {});
    });

    expect(streamResult.toolCalls).toHaveLength(1);
    expect(streamResult.toolCalls[0].name).toBe('getWeather');
    expect(streamResult.content).toBe('The weather is 72F.');
  });

  it('throws on error event', async () => {
    const mockStream = createMockSSEStream([
      { type: 'error', message: 'Rate limit exceeded' },
    ]);

    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      body: mockStream,
    } as unknown as Response);

    const { result } = renderHook(() => useAiChatStream());

    await expect(
      act(async () => {
        await result.current.sendStream('Hi', [], {});
      })
    ).rejects.toThrow('Rate limit exceeded');
  });

  it('throws on non-ok HTTP response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      json: vi.fn().mockResolvedValue({ error: 'Unauthorized' }),
    } as unknown as Response);

    const { result } = renderHook(() => useAiChatStream());

    await expect(
      act(async () => {
        await result.current.sendStream('Hi', [], {});
      })
    ).rejects.toThrow('Unauthorized');
  });

  it('throws when no auth token', async () => {
    window.__getFirebaseIdToken = vi.fn().mockResolvedValue(null);

    const { result } = renderHook(() => useAiChatStream());

    await expect(
      act(async () => {
        await result.current.sendStream('Hi', [], {});
      })
    ).rejects.toThrow('Authentication required');
  });
});
