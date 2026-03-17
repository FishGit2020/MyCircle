import { useState, useCallback, useRef, useEffect } from 'react';
import {
  useMutation,
  useLazyQuery,
  AI_CHAT,
  SAVE_INTERVIEW_SESSION,
  DELETE_INTERVIEW_SESSION,
  GET_INTERVIEW_SESSIONS,
  GET_INTERVIEW_SESSION,
} from '@mycircle/shared';
import type {
  InterviewConfig,
  InterviewState,
  BankQuestion,
  EvaluationScore,
} from './useInterviewStateMachine';
import {
  createInitialState,
  getCurrentQuestion,
  advance,
  addScore,
  getProgress,
  isLastQuestion as checkIsLastQuestion,
} from './useInterviewStateMachine';

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
  interviewState?: InterviewState;
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

function buildStructuredSystemPrompt(question: BankQuestion): string {
  return `You are an experienced coding interviewer conducting a structured technical interview.

CURRENT QUESTION:
Title: ${question.title}
Difficulty: ${question.difficulty}
Chapter: ${question.chapter}

Description:
${question.description}

Your role:
- Act as a professional, encouraging but rigorous interviewer
- Do NOT give the answer directly. Guide the candidate through hints and Socratic questions
- Ask clarifying questions about their approach before they start coding
- When they share code or pseudocode, review it for correctness, edge cases, and time/space complexity
- Probe their understanding: "What's the time complexity?" "What happens with empty input?"
- If they're stuck, provide incremental hints rather than full solutions
- Evaluate both their communication skills and technical ability
- Reference specific lines from the candidate's working document when giving feedback
- Respond concisely (under 200 words)`;
}

const EVALUATION_PROMPT = `You are evaluating a coding interview candidate's performance on the question just discussed.
Based on the conversation, provide a JSON evaluation with these fields (scores 1-10):
- technical: correctness of solution, understanding of data structures/algorithms
- problemSolving: approach exploration, optimization, edge case identification
- communication: clarity of explanation, ability to walk through examples
- depth: understanding of time/space complexity, trade-offs, alternative approaches
- feedback: 1-2 sentence summary of performance

Respond with ONLY valid JSON, no markdown code fences:
{"technical":7,"problemSolving":6,"communication":8,"depth":5,"feedback":"Good understanding of the basic approach but missed edge cases."}`;

const WRAP_UP_PROMPT = `You are wrapping up a structured coding interview. The candidate has completed all questions.
Provide a comprehensive interview report including:
1. Overall performance summary
2. Strengths observed across questions
3. Areas for improvement
4. Final recommendation

Be specific and reference actual responses from the interview.`;

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
  updatedAt: string | null;
  createdAt: string | null;
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

  // V2 structured interview state
  const [interviewState, setInterviewState] = useState<InterviewState | null>(
    persisted?.interviewState ?? null,
  );
  const interviewStateRef = useRef<InterviewState | null>(interviewState);
  const [evaluating, setEvaluating] = useState(false);

  // Keep ref in sync
  useEffect(() => {
    interviewStateRef.current = interviewState;
  }, [interviewState]);

  // Persist to localStorage whenever messages change
  useEffect(() => {
    if (state.messages.length > 0 && questionRef.current) {
      persistState({
        messages: state.messages,
        question: questionRef.current,
        document: documentRef.current,
        sessionId: sessionIdRef.current,
        sessionName: sessionNameRef.current,
        interviewState: interviewStateRef.current ?? undefined,
      });
    }
  }, [state.messages]);

  const [aiChatMutation] = useMutation(AI_CHAT);
  const [saveSessionMutation] = useMutation(SAVE_INTERVIEW_SESSION);
  const [deleteSessionMutation] = useMutation(DELETE_INTERVIEW_SESSION);
  const [fetchSessions] = useLazyQuery(GET_INTERVIEW_SESSIONS, { fetchPolicy: 'network-only' });
  const [fetchSession] = useLazyQuery(GET_INTERVIEW_SESSION, { fetchPolicy: 'network-only' });

  // Debounced save to Firebase via GraphQL
  const saveToFirebase = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      if (state.messages.length === 0) return;
      try {
        setSaveStatus('saving');
        await saveSessionMutation({
          variables: {
            input: {
              sessionId: sessionIdRef.current,
              question: questionRef.current,
              document: documentRef.current,
              messages: state.messages.map((m) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                timestamp: m.timestamp,
              })),
              sessionName: sessionNameRef.current || undefined,
              interviewState: interviewStateRef.current
                ? (interviewStateRef.current as unknown as Record<string, unknown>)
                : undefined,
              scores: interviewStateRef.current?.scores
                ? (interviewStateRef.current.scores as unknown as Record<string, unknown>)
                : undefined,
              config: interviewStateRef.current?.config
                ? (interviewStateRef.current.config as unknown as Record<string, unknown>)
                : undefined,
            },
          },
        });
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    }, 2000);
  }, [state.messages, saveSessionMutation]);

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
        interviewState: interviewStateRef.current ?? undefined,
      });
      saveToFirebase();
    }
  }, [state.messages, saveToFirebase]);

  const sendRawMessage = useCallback(async (
    content: string,
    endpointId?: string,
    model?: string,
    systemPromptOverride?: string,
  ) => {
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

      // Choose system prompt: override > structured > default
      let systemPrompt = systemPromptOverride ?? SYSTEM_PROMPT;
      if (!systemPromptOverride && interviewStateRef.current?.phase === 'active') {
        const currentQ = getCurrentQuestion(interviewStateRef.current);
        if (currentQ) {
          systemPrompt = buildStructuredSystemPrompt(currentQ);
        }
      }

      const { data, errors } = await aiChatMutation({
        variables: {
          message: dynamicMessage,
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

  /** Start a structured interview using question bank. */
  const startStructuredInterview = useCallback((
    config: InterviewConfig,
    allQuestions: BankQuestion[],
    endpointId?: string,
    model?: string,
  ) => {
    const newState = createInitialState(config, allQuestions);
    setInterviewState(newState);
    interviewStateRef.current = newState;

    const firstQuestion = newState.selectedQuestions[0];
    if (!firstQuestion) return;

    questionRef.current = `${firstQuestion.title}\n\n${firstQuestion.description}`;
    sessionIdRef.current = generateSessionId();
    sessionNameRef.current = '';
    setState({ messages: [], loading: false, error: null });

    setTimeout(() => {
      sendRawMessage(
        "I'm ready to start the interview. Please begin with the first question.",
        endpointId,
        model,
        buildStructuredSystemPrompt(firstQuestion),
      );
    }, 0);

    generateSessionName(firstQuestion.title, endpointId, model);
  }, [sendRawMessage, generateSessionName]);

  /** Evaluate the current question using AI, returning a score. */
  const evaluateCurrentQuestion = useCallback(async (
    endpointId?: string,
    model?: string,
  ): Promise<EvaluationScore | null> => {
    const iState = interviewStateRef.current;
    if (!iState) return null;
    const currentQ = getCurrentQuestion(iState);
    if (!currentQ) return null;

    setEvaluating(true);
    try {
      const history = state.messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const { data, errors } = await aiChatMutation({
        variables: {
          message: `Please evaluate the candidate's performance on "${currentQ.title}" based on our conversation so far.`,
          history,
          model,
          endpointId,
          systemPrompt: EVALUATION_PROMPT,
        },
      });

      if (errors && errors.length > 0) throw new Error(errors[0].message);

      const raw = data?.aiChat?.response || '';
      try {
        const parsed = JSON.parse(raw);
        return {
          questionId: currentQ.id,
          technical: parsed.technical ?? 5,
          problemSolving: parsed.problemSolving ?? 5,
          communication: parsed.communication ?? 5,
          depth: parsed.depth ?? 5,
          feedback: parsed.feedback ?? '',
        };
      } catch {
        return {
          questionId: currentQ.id,
          technical: 5,
          problemSolving: 5,
          communication: 5,
          depth: 5,
          feedback: raw.slice(0, 200),
        };
      }
    } catch {
      return null;
    } finally {
      setEvaluating(false);
    }
  }, [state.messages, aiChatMutation]);

  /** Evaluate current question, advance state, present next question or wrap up. */
  const nextQuestion = useCallback(async (endpointId?: string, model?: string) => {
    const iState = interviewStateRef.current;
    if (!iState) return;

    // Evaluate current question
    const score = await evaluateCurrentQuestion(endpointId, model);
    let updatedState = iState;
    if (score) {
      updatedState = addScore(updatedState, score);
    }

    // Advance
    const messageIndex = state.messages.length;
    updatedState = advance(updatedState, messageIndex);
    setInterviewState(updatedState);
    interviewStateRef.current = updatedState;

    if (updatedState.phase === 'wrap_up') {
      // Send wrap-up message
      const avgScores = updatedState.scores.length > 0
        ? {
          technical: (updatedState.scores.reduce((s, sc) => s + sc.technical, 0) / updatedState.scores.length).toFixed(1),
          problemSolving: (updatedState.scores.reduce((s, sc) => s + sc.problemSolving, 0) / updatedState.scores.length).toFixed(1),
          communication: (updatedState.scores.reduce((s, sc) => s + sc.communication, 0) / updatedState.scores.length).toFixed(1),
          depth: (updatedState.scores.reduce((s, sc) => s + sc.depth, 0) / updatedState.scores.length).toFixed(1),
        }
        : null;

      const scoresSummary = avgScores
        ? `\n\nRunning averages: Technical ${avgScores.technical}/10, Problem-Solving ${avgScores.problemSolving}/10, Communication ${avgScores.communication}/10, Depth ${avgScores.depth}/10`
        : '';

      sendRawMessage(
        `All questions are complete. Please provide a final interview summary and assessment.${scoresSummary}`,
        endpointId,
        model,
        WRAP_UP_PROMPT,
      );
    } else {
      // Present next question
      const nextQ = getCurrentQuestion(updatedState);
      if (nextQ) {
        questionRef.current = `${nextQ.title}\n\n${nextQ.description}`;
        sendRawMessage(
          `Let's move on to the next question. Please present: ${nextQ.title}`,
          endpointId,
          model,
          buildStructuredSystemPrompt(nextQ),
        );
      }
    }
  }, [state.messages, evaluateCurrentQuestion, sendRawMessage]);

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
    // In structured mode, trigger nextQuestion flow
    if (interviewStateRef.current?.phase === 'active') {
      nextQuestion(endpointId, model);
      return;
    }
    sendRawMessage(
      "Let's end the interview. Please provide your detailed rubric assessment of my performance including Coding Ability, Problem-Solving, and Communication scores out of 4, with specific justifications referencing my code and responses.",
      endpointId,
      model,
    );
  }, [sendRawMessage, nextQuestion]);

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
    setInterviewState(null);
    interviewStateRef.current = null;
  }, []);

  // Load sessions list via GraphQL
  const loadSessions = useCallback(async () => {
    try {
      const { data } = await fetchSessions();
      if (data?.interviewSessions) {
        setSessions(data.interviewSessions as InterviewSession[]);
      }
    } catch { /* */ }
  }, [fetchSessions]);

  // Load a specific session via GraphQL
  const loadSession = useCallback(async (sessionId: string) => {
    try {
      const { data } = await fetchSession({ variables: { id: sessionId } });
      const session = data?.interviewSession;
      if (!session) return null;

      questionRef.current = session.question;
      documentRef.current = session.document;
      sessionIdRef.current = sessionId;

      // Restore V2 interview state if present
      if (session.interviewState) {
        const restored = session.interviewState as unknown as InterviewState;
        setInterviewState(restored);
        interviewStateRef.current = restored;
      } else {
        setInterviewState(null);
        interviewStateRef.current = null;
      }

      const messages = session.messages as ChatMessage[];
      setState({
        messages,
        loading: false,
        error: null,
      });
      persistState({
        messages,
        question: session.question,
        document: session.document,
        sessionId,
        sessionName: sessionNameRef.current,
        interviewState: interviewStateRef.current ?? undefined,
      });
      return session;
    } catch { /* */ }
    return null;
  }, [fetchSession]);

  // Delete a session via GraphQL — if it's the active session, reset to fresh state
  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      await deleteSessionMutation({ variables: { id: sessionId } });
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (sessionId === sessionIdRef.current) {
        questionRef.current = '';
        documentRef.current = '';
        sessionIdRef.current = generateSessionId();
        sessionNameRef.current = '';
        lastFailedRef.current = null;
        setState({ messages: [], loading: false, error: null });
        clearPersistedState();
        setSaveStatus('idle');
        setInterviewState(null);
        interviewStateRef.current = null;
      }
    } catch { /* */ }
  }, [deleteSessionMutation]);

  const hasPersistedSession = persisted !== null && persisted.messages.length > 0;

  // Derived structured mode values
  const isStructuredMode = interviewState !== null && interviewState.config.mode === 'question-bank';
  const progress = interviewState ? getProgress(interviewState) : null;
  const currentBankQuestion = interviewState ? getCurrentQuestion(interviewState) : undefined;
  const scores = interviewState?.scores ?? [];
  const isLast = interviewState ? checkIsLastQuestion(interviewState) : false;

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
    // V2 structured mode
    interviewState,
    evaluating,
    progress,
    currentBankQuestion,
    isStructuredMode,
    scores,
    isLastQuestion: isLast,
    // Actions
    setQuestion,
    setDocument,
    sendMessage,
    startInterview,
    startStructuredInterview,
    repeatQuestion,
    requestHint,
    endInterview,
    nextQuestion,
    retry,
    clearChat,
    loadSessions,
    loadSession,
    deleteSession,
  };
}
