import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation, AI_CHAT, StorageKeys } from '@mycircle/shared';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface PersistedState {
  messages: ChatMessage[];
  question: string;
}

const STORAGE_KEY = 'interview-chat-history';

function loadPersistedState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* */ }
  return null;
}

function persistState(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* */ }
}

function clearPersistedState() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* */ }
}

interface InterviewChatState {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function buildSystemPrompt(question: string): string {
  return `You are an experienced coding interviewer conducting a technical interview.

The candidate has been given the following coding problem:

---
${question}
---

Your role:
- Act as a professional, encouraging but rigorous interviewer
- Do NOT give the answer directly. Guide the candidate through hints and Socratic questions
- Ask clarifying questions about their approach before they start coding
- When they share code or pseudocode, review it for correctness, edge cases, and time/space complexity
- Probe their understanding: "What's the time complexity?" "What happens with empty input?"
- If they're stuck, provide incremental hints rather than full solutions
- Evaluate both their communication skills and technical ability

When the candidate asks to end the interview, provide a structured rubric assessment in exactly this format:

**Coding Ability: Score: X/4**
Justification: [Reference specific lines, variable names, boundary checks, algorithmic correctness, code quality]

**Problem-Solving: Score: X/4**
Justification: [Evaluate approach exploration, optimization attempts, edge case identification, debugging ability]

**Communication: Score: X/4**
Justification: [Assess clarity of explanation, ability to walk through examples, complexity analysis accuracy]

**Overall Feedback:**
[2-4 sentences summarizing performance, key strengths, specific areas for improvement with line references where applicable, and whether hints were needed]

Scores can be integers or half-points (e.g., 3.5/4). Be specific and reference their actual code/responses. Do not inflate scores — be honest and constructive.

Respond naturally and concisely as an interviewer would in a real coding interview. Keep responses focused and under 200 words unless giving an end-of-interview assessment.`;
}

export function useInterviewChat() {
  const persisted = loadPersistedState();
  const [state, setState] = useState<InterviewChatState>({
    messages: persisted?.messages ?? [],
    loading: false,
    error: null,
  });
  const questionRef = useRef<string>(persisted?.question ?? '');
  const abortRef = useRef<AbortController | null>(null);

  // Persist messages whenever they change
  useEffect(() => {
    if (state.messages.length > 0 && questionRef.current) {
      persistState({ messages: state.messages, question: questionRef.current });
    }
  }, [state.messages]);

  const [aiChatMutation] = useMutation(AI_CHAT);

  const sendRawMessage = useCallback(async (content: string, endpointId?: string, model?: string) => {
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      loading: true,
      error: null,
    }));

    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    try {
      const history = state.messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const systemPrompt = buildSystemPrompt(questionRef.current);

      const { data, errors } = await aiChatMutation({
        variables: {
          message: content,
          history,
          model,
          endpointId,
          systemPrompt,
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

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: result.response,
        timestamp: Date.now(),
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        loading: false,
      }));
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const message = err instanceof Error ? err.message : 'Failed to get response';
      setState(prev => ({ ...prev, loading: false, error: message }));
    }
  }, [state.messages, aiChatMutation]);

  const startInterview = useCallback((question: string, endpointId?: string, model?: string) => {
    questionRef.current = question;
    setState({ messages: [], loading: false, error: null });
    setTimeout(() => {
      sendRawMessage(
        "I'm ready to start the interview. Please begin.",
        endpointId,
        model,
      );
    }, 0);
  }, [sendRawMessage]);

  const sendMessage = useCallback((text: string, endpointId?: string, model?: string) => {
    sendRawMessage(text, endpointId, model);
  }, [sendRawMessage]);

  const repeatQuestion = useCallback((endpointId?: string, model?: string) => {
    sendRawMessage(
      `Here is the problem again:\n\n${questionRef.current}`,
      endpointId,
      model,
    );
  }, [sendRawMessage]);

  const requestHint = useCallback((endpointId?: string, model?: string) => {
    sendRawMessage(
      "I'm stuck. Can you give me a hint without revealing the full answer?",
      endpointId,
      model,
    );
  }, [sendRawMessage]);

  const endInterview = useCallback((endpointId?: string, model?: string) => {
    sendRawMessage(
      "Let's end the interview. Please provide your detailed rubric assessment of my performance including Coding Ability, Problem-Solving, and Communication scores out of 4, with specific justifications referencing my code and responses.",
      endpointId,
      model,
    );
  }, [sendRawMessage]);

  const clearChat = useCallback(() => {
    questionRef.current = '';
    setState({ messages: [], loading: false, error: null });
    clearPersistedState();
  }, []);

  const hasPersistedSession = persisted !== null && persisted.messages.length > 0;

  return {
    messages: state.messages,
    loading: state.loading,
    error: state.error,
    question: questionRef.current,
    hasPersistedSession,
    sendMessage,
    startInterview,
    repeatQuestion,
    requestHint,
    endInterview,
    clearChat,
  };
}
