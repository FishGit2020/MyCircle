import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation, AI_CHAT } from '@mycircle/shared';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface PersistedState {
  messages: ChatMessage[];
  question: string;
  document: string;
  sessionId: string;
  sessionName?: string;
}

const STORAGE_KEY = 'interview-chat-history';

const SYSTEM_PROMPT = `You are an experienced coding interviewer conducting a technical interview. Your role:
- Act as a professional, encouraging but rigorous interviewer
- Do NOT give the answer directly. Guide the candidate through hints and Socratic questions
- Ask clarifying questions about their approach before they start coding
- When they share code or pseudocode, review it for correctness, edge cases, and time/space complexity
- Probe their understanding: "What's the time complexity?" "What happens with empty input?"
- If they're stuck, provide incremental hints rather than full solutions
- Evaluate both their communication skills and technical ability
- Reference specific lines from the candidate's working document when giving feedback

When the candidate asks to end the interview, provide a structured rubric assessment:

**Coding Ability: Score: X/4**
Justification: [Reference specific lines, variable names, boundary checks, algorithmic correctness]

**Problem-Solving: Score: X/4**
Justification: [Evaluate approach exploration, optimization attempts, edge case identification, debugging]

**Communication: Score: X/4**
Justification: [Assess clarity of explanation, ability to walk through examples, complexity analysis accuracy]

**Overall Feedback:**
[2-4 sentences: performance summary, key strengths, specific areas for improvement with line references]

Scores can be integers or half-points (e.g., 3.5/4). Be specific and honest.
Respond concisely (under 200 words) unless giving an end-of-interview assessment.`;

function generateId(): string {
  return crypto.randomUUID();
}

function generateSessionId(): string {
  return `session-${crypto.randomUUID()}`;
}

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

function buildUserMessage(question: string, document: string, message: string): string {
  return `[Coding Problem]
${question || 'No question provided yet'}

[Candidate's Working Document]
${document || 'Empty'}

[Candidate's Message]
${message}`;
}

interface InterviewChatState {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface InterviewSession {
  id: string;
  questionPreview: string;
  messageCount: number;
  updatedAt: number | null;
  createdAt: number | null;
}

export function useInterviewChat() {
  const persisted = loadPersistedState();
  const [state, setState] = useState<InterviewChatState>({
    messages: persisted?.messages ?? [],
    loading: false,
    error: null,
  });
  const questionRef = useRef<string>(persisted?.question ?? '');
  const documentRef = useRef<string>(persisted?.document ?? '');
  const sessionIdRef = useRef<string>(persisted?.sessionId ?? generateSessionId());
  const sessionNameRef = useRef<string>(persisted?.sessionName ?? '');
  const abortRef = useRef<AbortController | null>(null);
  const lastFailedRef = useRef<{ content: string; endpointId?: string; model?: string } | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [sessions, setSessions] = useState<InterviewSession[]>([]);

  // Persist to localStorage whenever messages change
  useEffect(() => {
    if (state.messages.length > 0 && questionRef.current) {
      persistState({
        messages: state.messages,
        question: questionRef.current,
        document: documentRef.current,
        sessionId: sessionIdRef.current,
        sessionName: sessionNameRef.current,
      });
    }
  }, [state.messages]);

  const [aiChatMutation] = useMutation(AI_CHAT);

  // Debounced save to Firebase
  const saveToFirebase = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      if (!window.__interviewApi || state.messages.length === 0) return;
      try {
        setSaveStatus('saving');
        await window.__interviewApi.save({
          sessionId: sessionIdRef.current,
          question: questionRef.current,
          document: documentRef.current,
          messages: state.messages,
          sessionName: sessionNameRef.current || undefined,
        });
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    }, 2000);
  }, [state.messages]);

  // Auto-save to Firebase on message changes
  useEffect(() => {
    if (state.messages.length > 0) {
      saveToFirebase();
    }
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state.messages, saveToFirebase]);

  const setQuestion = useCallback((q: string) => {
    questionRef.current = q;
  }, []);

  const setDocument = useCallback((d: string) => {
    documentRef.current = d;
    // Debounce persist on document changes
    if (state.messages.length > 0) {
      persistState({
        messages: state.messages,
        question: questionRef.current,
        document: documentRef.current,
        sessionId: sessionIdRef.current,
        sessionName: sessionNameRef.current,
      });
      saveToFirebase();
    }
  }, [state.messages, saveToFirebase]);

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

      const dynamicMessage = buildUserMessage(
        questionRef.current,
        documentRef.current,
        content,
      );

      const { data, errors } = await aiChatMutation({
        variables: {
          message: dynamicMessage,
          history,
          model,
          endpointId,
          systemPrompt: SYSTEM_PROMPT,
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

      lastFailedRef.current = null;
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        loading: false,
      }));
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      lastFailedRef.current = { content, endpointId, model };
      const message = err instanceof Error ? err.message : 'Failed to get response';
      setState(prev => ({ ...prev, loading: false, error: message }));
    }
  }, [state.messages, aiChatMutation]);

  // Generate a short session name from the question using AI
  const generateSessionName = useCallback(async (question: string, endpointId?: string, model?: string) => {
    try {
      const { data } = await aiChatMutation({
        variables: {
          message: `Summarize this coding problem in 5 words or fewer as a short title. Reply with ONLY the title, no quotes or punctuation:\n\n${question}`,
          history: [],
          model,
          endpointId,
          systemPrompt: 'You are a helpful assistant. Respond with only the requested output.',
        },
      });
      const name = data?.aiChat?.response?.trim();
      if (name && name.length <= 60) {
        sessionNameRef.current = name;
      }
    } catch { /* non-critical */ }
  }, [aiChatMutation]);

  const startInterview = useCallback((question: string, endpointId?: string, model?: string) => {
    questionRef.current = question;
    sessionIdRef.current = generateSessionId();
    sessionNameRef.current = '';
    setState({ messages: [], loading: false, error: null });
    setTimeout(() => {
      sendRawMessage(
        "I'm ready to start the interview. Please begin.",
        endpointId,
        model,
      );
    }, 0);
    // Fire-and-forget: generate a short name for this session
    generateSessionName(question, endpointId, model);
  }, [sendRawMessage, generateSessionName]);

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

  const retry = useCallback(() => {
    if (!lastFailedRef.current) return;
    const { content, endpointId, model } = lastFailedRef.current;
    // Remove the failed user message (last one) before resending
    setState(prev => ({
      ...prev,
      messages: prev.messages.slice(0, -1),
      error: null,
    }));
    setTimeout(() => {
      sendRawMessage(content, endpointId, model);
    }, 0);
  }, [sendRawMessage]);

  const clearChat = useCallback(() => {
    questionRef.current = '';
    documentRef.current = '';
    sessionIdRef.current = generateSessionId();
    sessionNameRef.current = '';
    setState({ messages: [], loading: false, error: null });
    clearPersistedState();
    setSaveStatus('idle');
  }, []);

  // Load sessions list from Firebase
  const loadSessions = useCallback(async () => {
    if (!window.__interviewApi) return;
    try {
      const result = await window.__interviewApi.list();
      setSessions(result.sessions);
    } catch { /* */ }
  }, []);

  // Load a specific session from Firebase
  const loadSession = useCallback(async (sessionId: string) => {
    if (!window.__interviewApi) return;
    try {
      const result = await window.__interviewApi.load(sessionId);
      const { session } = result;
      questionRef.current = session.question;
      documentRef.current = session.document;
      sessionIdRef.current = sessionId;
      setState({
        messages: session.messages as ChatMessage[],
        loading: false,
        error: null,
      });
      persistState({
        messages: session.messages as ChatMessage[],
        question: session.question,
        document: session.document,
        sessionId,
        sessionName: sessionNameRef.current,
      });
      return session;
    } catch { /* */ }
    return null;
  }, []);

  // Delete a session from Firebase
  const deleteSession = useCallback(async (sessionId: string) => {
    if (!window.__interviewApi) return;
    try {
      await window.__interviewApi.delete(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch { /* */ }
  }, []);

  const hasPersistedSession = persisted !== null && persisted.messages.length > 0;

  return {
    messages: state.messages,
    loading: state.loading,
    error: state.error,
    question: questionRef.current,
    document: documentRef.current,
    sessionId: sessionIdRef.current,
    hasPersistedSession,
    saveStatus,
    sessions,
    setQuestion,
    setDocument,
    sendMessage,
    startInterview,
    repeatQuestion,
    requestHint,
    endInterview,
    retry,
    clearChat,
    loadSessions,
    loadSession,
    deleteSession,
  };
}
