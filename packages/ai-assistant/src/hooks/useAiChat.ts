import { useState, useCallback, useRef } from 'react';
import { useMutation, AI_CHAT } from '@mycircle/shared';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
  timestamp: number;
}

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
  result?: string;
}

export interface AiAction {
  type: string;
  payload: Record<string, unknown>;
}

interface AiChatState {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  lastUserContent: string | null; // for retry
}

const STORAGE_KEY = 'ai-chat-history';
const MODEL_STORAGE_KEY = 'mycircle-ai-model';

/** Gather user context from localStorage for context-aware AI. */
function gatherUserContext(): Record<string, unknown> {
  const ctx: Record<string, unknown> = {};
  try {
    // Stock watchlist
    const watchlist = localStorage.getItem('stock-watchlist');
    if (watchlist) {
      const parsed = JSON.parse(watchlist);
      if (Array.isArray(parsed) && parsed.length > 0) {
        ctx.stockWatchlist = parsed.map((w: any) => w.symbol || w).slice(0, 20);
      }
    }

    // Podcast subscriptions
    const subs = localStorage.getItem('podcast-subscriptions');
    if (subs) {
      const parsed = JSON.parse(subs);
      if (Array.isArray(parsed) && parsed.length > 0) {
        ctx.podcastSubscriptions = parsed.length;
      }
    }

    // Favorite cities
    const favs = localStorage.getItem('mycircle-favorite-cities');
    if (favs) {
      const parsed = JSON.parse(favs);
      if (Array.isArray(parsed) && parsed.length > 0) {
        ctx.favoriteCities = parsed.map((c: any) => c.name || c).slice(0, 10);
      }
    }

    // Recent cities
    const recents = localStorage.getItem('mycircle-recent-cities');
    if (recents) {
      const parsed = JSON.parse(recents);
      if (Array.isArray(parsed) && parsed.length > 0) {
        ctx.recentCities = parsed.map((c: any) => c.name || c).slice(0, 5);
      }
    }

    // User preferences
    const locale = localStorage.getItem('mycircle-locale');
    if (locale) ctx.locale = locale;
    const tempUnit = localStorage.getItem('mycircle-temp-unit');
    if (tempUnit) ctx.tempUnit = tempUnit;
    const theme = localStorage.getItem('mycircle-theme');
    if (theme) ctx.theme = theme;

    // Current page
    ctx.currentPage = window.location.pathname;
  } catch { /* ignore localStorage errors */ }
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
    // Keep at most 50 messages to avoid bloating localStorage
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
        (window as any).__flashcards?.add(action.payload);
        break;
      case 'addBookmark':
        window.dispatchEvent(new CustomEvent('bible-bookmark', { detail: action.payload }));
        break;
      case 'listFlashcards':
        window.dispatchEvent(new CustomEvent('flashcards-list', { detail: action.payload }));
        break;
    }
  }
}

export function useAiChat() {
  const [state, setState] = useState<AiChatState>(() => ({
    messages: loadMessages(),
    loading: false,
    error: null,
    lastUserContent: null,
  }));
  const abortRef = useRef<AbortController | null>(null);

  const [aiChatMutation] = useMutation(AI_CHAT);

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
      return {
        ...prev,
        messages: updated,
        loading: true,
        error: null,
        lastUserContent: content,
      };
    });

    // Abort any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    try {
      const history = state.messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const userContext = gatherUserContext();

      let savedModel: string | undefined;
      try { savedModel = localStorage.getItem(MODEL_STORAGE_KEY) || undefined; } catch { /* */ }

      const { data, errors } = await aiChatMutation({
        variables: {
          message: content,
          history,
          context: userContext,
          model: savedModel,
        },
        context: {
          fetchOptions: { signal: abortRef.current.signal },
        },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const result = data?.aiChat;
      if (!result) {
        throw new Error('No response from AI');
      }

      // Handle frontend actions
      if (result.actions && result.actions.length > 0) {
        handleActions(result.actions);
      }

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
        return {
          ...prev,
          messages: updated,
          loading: false,
          lastUserContent: null,
        };
      });
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const message = err instanceof Error ? err.message : 'Failed to get response';
      setState(prev => ({ ...prev, loading: false, error: message }));
    }
  }, [state.messages, aiChatMutation]);

  const clearChat = useCallback(() => {
    setState({ messages: [], loading: false, error: null, lastUserContent: null });
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* */ }
  }, []);

  const retry = useCallback(() => {
    if (state.lastUserContent) {
      // Remove the last user message (will be re-added by sendMessage)
      setState(prev => {
        const messages = prev.messages.slice(0, -1);
        saveMessages(messages);
        return { ...prev, messages, error: null };
      });
      // Small delay so the state update lands before sendMessage reads state.messages
      setTimeout(() => {
        if (state.lastUserContent) {
          sendMessage(state.lastUserContent);
        }
      }, 0);
    }
  }, [state.lastUserContent, sendMessage]);

  return {
    messages: state.messages,
    loading: state.loading,
    error: state.error,
    canRetry: !!state.lastUserContent && !state.loading,
    sendMessage,
    clearChat,
    retry,
  };
}
