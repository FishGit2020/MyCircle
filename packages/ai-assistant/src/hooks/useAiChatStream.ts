import { useState, useCallback, useRef } from 'react';
import type { ToolCall, AiAction } from './useAiChat';

interface StreamEvent {
  type: 'text' | 'thinking' | 'tool_start' | 'tool_result' | 'done' | 'error';
  content?: string;
  name?: string;
  args?: Record<string, unknown>;
  result?: string;
  message?: string;
  metadata?: {
    actions?: AiAction[];
    provider?: string;
    model?: string;
    tokens?: { input: number; output: number };
    latencyMs?: number;
  };
}

export interface ActiveToolCall {
  name: string;
  args: Record<string, unknown>;
  pending: boolean;
  result?: string;
}

interface StreamState {
  streaming: boolean;
  activeToolCalls: ActiveToolCall[];
  streamingContent: string;
  thinkingSteps: string[];
}

/**
 * Hook for streaming AI chat responses via SSE (fetch + ReadableStream).
 * Returns a sendStream function and streaming state.
 */
export function useAiChatStream() {
  const [streamState, setStreamState] = useState<StreamState>({
    streaming: false,
    activeToolCalls: [],
    streamingContent: '',
    thinkingSteps: [],
  });
  const abortRef = useRef<AbortController | null>(null);

  const stopStream = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setStreamState(prev => ({ ...prev, streaming: false }));
  }, []);

  const sendStream = useCallback(async (
    message: string,
    history: Array<{ role: string; content: string }>,
    context: Record<string, unknown>,
    options?: { model?: string; endpointId?: string; toolMode?: string },
  ): Promise<{
    content: string;
    toolCalls: ToolCall[];
    metadata?: StreamEvent['metadata'];
  }> => {
    // Abort previous stream
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStreamState({ streaming: true, activeToolCalls: [], streamingContent: '', thinkingSteps: [] });

    const token = await window.__getFirebaseIdToken?.();
    if (!token) throw new Error('Authentication required');

    const recaptchaToken = await window.__getRecaptchaToken?.('ai_chat');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
    if (recaptchaToken) headers['x-recaptcha-token'] = recaptchaToken;

    const response = await fetch('/ai/chat/stream', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message,
        history,
        context,
        model: options?.model,
        endpointId: options?.endpointId,
        toolMode: options?.toolMode,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({ error: 'Stream request failed' }));
      throw new Error(errBody.error || `HTTP ${response.status}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';
    const collectedToolCalls: ToolCall[] = [];
    let doneMetadata: StreamEvent['metadata'] | undefined;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          let event: StreamEvent;
          try { event = JSON.parse(jsonStr); }
          catch { continue; }

          switch (event.type) {
            case 'thinking':
              setStreamState(prev => ({
                ...prev,
                thinkingSteps: [...prev.thinkingSteps, event.content || ''],
              }));
              break;

            case 'text':
              fullContent += event.content || '';
              setStreamState(prev => ({
                ...prev,
                streamingContent: prev.streamingContent + (event.content || ''),
              }));
              break;

            case 'tool_start':
              setStreamState(prev => ({
                ...prev,
                activeToolCalls: [...prev.activeToolCalls, {
                  name: event.name!,
                  args: event.args || {},
                  pending: true,
                }],
              }));
              break;

            case 'tool_result':
              setStreamState(prev => ({
                ...prev,
                activeToolCalls: prev.activeToolCalls.map(tc =>
                  tc.name === event.name && tc.pending
                    ? { ...tc, pending: false, result: event.result }
                    : tc
                ),
              }));
              collectedToolCalls.push({
                name: event.name!,
                args: event.args || {},
                result: event.result,
              });
              break;

            case 'done':
              doneMetadata = event.metadata;
              break;

            case 'error':
              throw new Error(event.message || 'Stream error');
          }
        }
      }
    } finally {
      setStreamState(prev => ({ ...prev, streaming: false }));
    }

    return { content: fullContent, toolCalls: collectedToolCalls, metadata: doneMetadata };
  }, []);

  return {
    ...streamState,
    sendStream,
    stopStream,
  };
}
