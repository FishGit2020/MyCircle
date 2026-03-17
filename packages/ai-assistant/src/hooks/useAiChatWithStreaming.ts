import { useState, useCallback, useRef } from 'react';
import { useMutation, AI_CHAT, StorageKeys } from '@mycircle/shared';
import { useAiChatStream } from './useAiChatStream';
import type { ChatMessage, AiAction } from './useAiChat';

const STORAGE_KEY = 'ai-chat-history';
const MODEL_STORAGE_KEY = 'mycircle-ai-model';
const ENDPOINT_STORAGE_KEY = 'mycircle-ai-endpoint';
const TOOL_MODE_STORAGE_KEY = 'mycircle-ai-tool-mode';
const STREAMING_AVAILABLE_KEY = 'ai-streaming-available';

/** Gather user context from localStorage for context-aware AI. */
function gatherUserContext(): Record<string, unknown> {
  const ctx: Record<string, unknown> = {};
  try {
    const watchlist = localStorage.getItem(StorageKeys.STOCK_WATCHLIST);
    if (watchlist) {
      const parsed = JSON.parse(watchlist);
      if (Array.isArray(parsed) && parsed.length > 0) ctx.stockWatchlist = parsed.map((w: any) => w.symbol || w).slice(0, 20); // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const subs = localStorage.getItem(StorageKeys.PODCAST_SUBSCRIPTIONS);
    if (subs) {
      const parsed = JSON.parse(subs);
      if (Array.isArray(parsed) && parsed.length > 0) ctx.podcastSubscriptions = parsed.length;
    }
    const recents = localStorage.getItem(StorageKeys.RECENT_CITIES);
    if (recents) {
      const parsed = JSON.parse(recents);
      if (Array.isArray(parsed) && parsed.length > 0) ctx.recentCities = parsed.map((c: any) => c.name || c).slice(0, 5); // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const babyDueDate = localStorage.getItem(StorageKeys.BABY_DUE_DATE);
    if (babyDueDate) ctx.babyDueDate = babyDueDate;
    const childName = localStorage.getItem(StorageKeys.CHILD_NAME);
    if (childName) ctx.childName = childName;
    const childBirthDate = localStorage.getItem(StorageKeys.CHILD_BIRTH_DATE);
    if (childBirthDate) ctx.childBirthDate = childBirthDate;
    const milestones = localStorage.getItem(StorageKeys.CHILD_MILESTONES);
    if (milestones) { try { const parsed = JSON.parse(milestones); if (Array.isArray(parsed)) ctx.childMilestonesCount = parsed.length; } catch { /* */ } }
    const worshipFavs = localStorage.getItem(StorageKeys.WORSHIP_FAVORITES);
    if (worshipFavs) { try { const parsed = JSON.parse(worshipFavs); if (Array.isArray(parsed)) ctx.worshipFavoritesCount = parsed.length; } catch { /* */ } }
    const cloudFiles = localStorage.getItem(StorageKeys.CLOUD_FILES_CACHE);
    if (cloudFiles) { try { const parsed = JSON.parse(cloudFiles); if (Array.isArray(parsed)) ctx.cloudFilesCount = parsed.length; } catch { /* */ } }
    const immCases = localStorage.getItem(StorageKeys.IMMIGRATION_CASES_CACHE);
    if (immCases) { try { const parsed = JSON.parse(immCases); if (Array.isArray(parsed)) ctx.immigrationCasesCount = parsed.length; } catch { /* */ } }
    const dailyLogEntries = localStorage.getItem(StorageKeys.DAILY_LOG_CACHE);
    if (dailyLogEntries) { try { const parsed = JSON.parse(dailyLogEntries); if (Array.isArray(parsed)) ctx.dailyLogEntriesCount = parsed.length; } catch { /* */ } }
    const locale = localStorage.getItem(StorageKeys.LOCALE);
    if (locale) ctx.locale = locale;
    const tempUnit = localStorage.getItem(StorageKeys.TEMP_UNIT);
    if (tempUnit) ctx.tempUnit = tempUnit;
    const speedUnit = localStorage.getItem(StorageKeys.SPEED_UNIT);
    if (speedUnit) ctx.speedUnit = speedUnit;
    const distanceUnit = localStorage.getItem(StorageKeys.DISTANCE_UNIT);
    if (distanceUnit) ctx.distanceUnit = distanceUnit;
    const theme = localStorage.getItem(StorageKeys.THEME);
    if (theme) ctx.theme = theme;
    ctx.currentPage = window.location.pathname;
  } catch { /* ignore */ }
  return ctx;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadMessages(): ChatMessage[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* ignore */ }
  return [];
}

function saveMessages(messages: ChatMessage[]) {
  try {
    const toSave = messages.slice(-50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch { /* ignore */ }
}

/** Handle frontend actions returned by the AI. */
function handleActions(actions: AiAction[]) {
  for (const action of actions) {
    switch (action.type) {
      case 'navigateTo':
        window.dispatchEvent(new CustomEvent('navigate', { detail: action.payload }));
        break;
      case 'addFlashcard':
        window.__flashcards?.add(action.payload);
        break;
      case 'addBookmark':
        window.dispatchEvent(new CustomEvent('bible-bookmark', { detail: action.payload }));
        break;
      case 'listFlashcards':
        window.dispatchEvent(new CustomEvent('flashcards-list', { detail: action.payload }));
        break;
      case 'addNote':
        window.__notebook?.add(action.payload);
        break;
      case 'addDailyLogEntry':
        window.__workTracker?.add(action.payload);
        break;
      case 'setBabyDueDate':
        try {
          localStorage.setItem('baby-due-date', action.payload.dueDate as string);
          window.dispatchEvent(new CustomEvent('baby-due-date-changed', { detail: action.payload }));
        } catch { /* */ }
        break;
      case 'addChildMilestone':
        try {
          const existing = JSON.parse(localStorage.getItem('child-milestones') || '[]');
          existing.push({ milestone: action.payload.milestone, date: action.payload.date || new Date().toISOString().slice(0, 10) });
          localStorage.setItem('child-milestones', JSON.stringify(existing));
          window.dispatchEvent(new CustomEvent('child-milestones-changed', { detail: action.payload }));
        } catch { /* */ }
        break;
      case 'addImmigrationCase':
        window.__immigrationTracker?.add(action.payload);
        break;
    }
  }
}

interface AiChatWithStreamingState {
  messages: ChatMessage[];
  loading: boolean;
  streaming: boolean;
  streamingContent: string;
  error: string | null;
  lastUserContent: string | null;
}

export function useAiChatWithStreaming() {
  const [state, setState] = useState<AiChatWithStreamingState>(() => ({
    messages: loadMessages(),
    loading: false,
    streaming: false,
    streamingContent: '',
    error: null,
    lastUserContent: null,
  }));

  const {
    streaming: isStreaming,
    activeToolCalls,
    streamingContent,
    thinkingSteps,
    sendStream,
    stopStream,
  } = useAiChatStream();

  const abortRef = useRef<AbortController | null>(null);
  const [aiChatMutation] = useMutation(AI_CHAT);

  // Sync streaming state from the stream hook
  const effectiveStreaming = isStreaming;
  const effectiveStreamingContent = streamingContent;

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    setState(prev => {
      const updated = [...prev.messages, userMessage];
      saveMessages(updated);
      return { ...prev, messages: updated, loading: true, streaming: false, streamingContent: '', error: null, lastUserContent: content };
    });

    const history = state.messages.map(m => ({ role: m.role, content: m.content }));
    const userContext = gatherUserContext();

    let savedModel: string | undefined;
    try { savedModel = localStorage.getItem(MODEL_STORAGE_KEY) || undefined; } catch { /* */ }
    let savedEndpoint: string | undefined;
    try { savedEndpoint = localStorage.getItem(ENDPOINT_STORAGE_KEY) || undefined; } catch { /* */ }
    let savedToolMode: string | undefined;
    try { savedToolMode = localStorage.getItem(TOOL_MODE_STORAGE_KEY) || undefined; } catch { /* */ }

    // Check if streaming is known to be unavailable
    let streamingAvailable = true;
    try { streamingAvailable = localStorage.getItem(STREAMING_AVAILABLE_KEY) !== 'false'; } catch { /* */ }

    // Try streaming first
    if (streamingAvailable) {
      try {
        setState(prev => ({ ...prev, streaming: true, loading: false }));

        const result = await sendStream(content, history, userContext, {
          model: savedModel,
          endpointId: savedEndpoint,
          toolMode: savedToolMode,
        });

        // Handle actions from metadata
        if (result.metadata?.actions) {
          handleActions(result.metadata.actions);
        }

        // Parse navigateTo from tool results
        for (const tc of result.toolCalls) {
          if (tc.name === 'navigateTo' && tc.result) {
            try {
              const parsed = JSON.parse(tc.result);
              if (parsed.navigateTo) handleActions([{ type: 'navigateTo', payload: { page: parsed.navigateTo } }]);
            } catch { /* */ }
          }
        }

        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: result.content || 'Sorry, I could not generate a response.',
          toolCalls: result.toolCalls.length > 0 ? result.toolCalls : undefined,
          timestamp: Date.now(),
        };

        setState(prev => {
          const updated = [...prev.messages, assistantMessage];
          saveMessages(updated);
          return { ...prev, messages: updated, loading: false, streaming: false, streamingContent: '', lastUserContent: null };
        });

        // Mark streaming as available
        try { localStorage.setItem(STREAMING_AVAILABLE_KEY, 'true'); } catch { /* */ }
        return;
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        // Streaming failed — mark as unavailable and fall through to GraphQL
        try { localStorage.setItem(STREAMING_AVAILABLE_KEY, 'false'); } catch { /* */ }
        setState(prev => ({ ...prev, streaming: false, loading: true }));
      }
    }

    // GraphQL fallback
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      const { data, errors } = await aiChatMutation({
        variables: { message: content, history, context: userContext, model: savedModel, endpointId: savedEndpoint, toolMode: savedToolMode },
        context: { fetchOptions: { signal: abortRef.current.signal } },
      });

      if (errors && errors.length > 0) throw new Error(errors[0].message);

      const result = data?.aiChat;
      if (!result) throw new Error('No response from AI');

      if (result.actions && result.actions.length > 0) handleActions(result.actions);

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: result.response,
        toolCalls: result.toolCalls || undefined,
        timestamp: Date.now(),
      };

      setState(prev => {
        const updated = [...prev.messages, assistantMessage];
        saveMessages(updated);
        return { ...prev, messages: updated, loading: false, lastUserContent: null };
      });
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const message = err instanceof Error ? err.message : 'Failed to get response';
      setState(prev => ({ ...prev, loading: false, error: message }));
    }
  }, [state.messages, aiChatMutation, sendStream]);

  const clearChat = useCallback(() => {
    stopStream();
    setState({ messages: [], loading: false, streaming: false, streamingContent: '', error: null, lastUserContent: null });
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* */ }
  }, [stopStream]);

  const retry = useCallback(() => {
    if (state.lastUserContent) {
      setState(prev => {
        const messages = prev.messages.slice(0, -1);
        saveMessages(messages);
        return { ...prev, messages, error: null };
      });
      setTimeout(() => {
        if (state.lastUserContent) sendMessage(state.lastUserContent);
      }, 0);
    }
  }, [state.lastUserContent, sendMessage]);

  const abort = useCallback(() => {
    stopStream();
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    setState(prev => ({ ...prev, loading: false, streaming: false, streamingContent: '' }));
  }, [stopStream]);

  return {
    messages: state.messages,
    loading: state.loading,
    streaming: effectiveStreaming,
    streamingContent: effectiveStreamingContent,
    activeToolCalls,
    thinkingSteps,
    error: state.error,
    canRetry: !!state.lastUserContent && !state.loading && !effectiveStreaming,
    sendMessage,
    clearChat,
    retry,
    abort,
  };
}
