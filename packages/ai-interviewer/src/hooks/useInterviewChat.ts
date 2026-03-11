import { useState, useCallback, useRef } from 'react';
import { useMutation, AI_CHAT } from '@mycircle/shared';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
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
- When the interview ends, provide a structured assessment: strengths, areas for improvement, and an overall rating (1-5)

Respond naturally and concisely as an interviewer would in a real coding interview. Keep responses focused and under 200 words unless giving an end-of-interview assessment.`;
}

export function useInterviewChat() {
  const [state, setState] = useState<InterviewChatState>({
    messages: [],
    loading: false,
    error: null,
  });
  const questionRef = useRef<string>('');
  const abortRef = useRef<AbortController | null>(null);

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
    // Send an initial greeting to kick off the interview
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
      "Let's end the interview. Please provide your assessment of my performance.",
      endpointId,
      model,
    );
  }, [sendRawMessage]);

  const clearChat = useCallback(() => {
    questionRef.current = '';
    setState({ messages: [], loading: false, error: null });
  }, []);

  return {
    messages: state.messages,
    loading: state.loading,
    error: state.error,
    sendMessage,
    startInterview,
    repeatQuestion,
    requestHint,
    endInterview,
    clearChat,
  };
}
