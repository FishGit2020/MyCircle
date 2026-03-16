import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInterviewChat } from './useInterviewChat';

const mockMutate = vi.fn();

vi.mock('@mycircle/shared', () => ({
  useMutation: () => [mockMutate, { loading: false }],
  AI_CHAT: {},
  createLogger: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }),
}));

describe('useInterviewChat', () => {
  beforeEach(() => {
    localStorage.clear();
    mockMutate.mockReset();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).__interviewApi;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with empty messages', () => {
    const { result } = renderHook(() => useInterviewChat());
    expect(result.current.messages).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('clearChat resets all state', () => {
    const { result } = renderHook(() => useInterviewChat());
    act(() => {
      result.current.clearChat();
    });
    expect(result.current.messages).toEqual([]);
    expect(result.current.question).toBe('');
    expect(result.current.document).toBe('');
    expect(result.current.saveStatus).toBe('idle');
  });

  it('setQuestion updates question used in messages', async () => {
    mockMutate.mockResolvedValue({
      data: { aiChat: { response: 'Tell me more.' } },
    });
    const { result } = renderHook(() => useInterviewChat());
    act(() => {
      result.current.setQuestion('Two Sum');
    });
    await act(async () => {
      result.current.sendMessage('My approach');
      await new Promise((r) => setTimeout(r, 10));
    });
    const vars = mockMutate.mock.calls[0][0].variables;
    expect(vars.message).toContain('Two Sum');
  });

  it('setDocument updates document used in messages', async () => {
    mockMutate.mockResolvedValue({
      data: { aiChat: { response: 'Good.' } },
    });
    const { result } = renderHook(() => useInterviewChat());
    act(() => {
      result.current.setQuestion('Problem');
      result.current.setDocument('Use a hash map');
    });
    await act(async () => {
      result.current.sendMessage('Check my work');
      await new Promise((r) => setTimeout(r, 10));
    });
    const vars = mockMutate.mock.calls[0][0].variables;
    expect(vars.message).toContain('Use a hash map');
  });

  it('startInterview sends a ready message', async () => {
    mockMutate.mockResolvedValue({
      data: { aiChat: { response: 'Welcome! Let us begin.' } },
    });

    const { result } = renderHook(() => useInterviewChat());

    act(() => {
      result.current.startInterview('Two Sum problem');
    });

    // Wait for setTimeout(0) to fire
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    // 2 calls: session name generation (immediate) + interview message (via setTimeout)
    expect(mockMutate).toHaveBeenCalledTimes(2);
    // Name generation call
    const nameVars = mockMutate.mock.calls[0][0].variables;
    expect(nameVars.message).toContain('Summarize');
    // Interview message call
    const vars = mockMutate.mock.calls[1][0].variables;
    expect(vars.message).toContain('Two Sum problem');
    expect(vars.message).toContain('[Coding Problem]');
    expect(vars.systemPrompt).toContain('experienced coding interviewer');
  });

  it('sendMessage includes document content in user message', async () => {
    mockMutate.mockResolvedValue({
      data: { aiChat: { response: 'Good approach.' } },
    });

    const { result } = renderHook(() => useInterviewChat());

    act(() => {
      result.current.setQuestion('Reverse a linked list');
      result.current.setDocument('Use two pointers');
    });

    await act(async () => {
      result.current.sendMessage('Here is my approach');
      await new Promise((r) => setTimeout(r, 10));
    });

    const vars = mockMutate.mock.calls[0][0].variables;
    expect(vars.message).toContain('Reverse a linked list');
    expect(vars.message).toContain('Use two pointers');
    expect(vars.message).toContain('Here is my approach');
  });

  it('loads sessions from Firebase API', async () => {
    const mockList = vi.fn().mockResolvedValue({
      sessions: [{ id: 's1', questionPreview: 'Two Sum', messageCount: 5, updatedAt: 1000, createdAt: 1000 }],
    });
    (window as any).__interviewApi = { list: mockList, save: vi.fn(), load: vi.fn(), delete: vi.fn() };

    const { result } = renderHook(() => useInterviewChat());

    await act(async () => {
      await result.current.loadSessions();
    });

    expect(mockList).toHaveBeenCalledTimes(1);
    expect(result.current.sessions).toHaveLength(1);
    expect(result.current.sessions[0].questionPreview).toBe('Two Sum');
  });

  it('deletes a session and removes it from state', async () => {
    const mockDelete = vi.fn().mockResolvedValue({ ok: true });
    const mockList = vi.fn().mockResolvedValue({
      sessions: [
        { id: 's1', questionPreview: 'Two Sum', messageCount: 5, updatedAt: 1000, createdAt: 1000 },
        { id: 's2', questionPreview: 'Merge Sort', messageCount: 3, updatedAt: 900, createdAt: 900 },
      ],
    });
    (window as any).__interviewApi = { list: mockList, save: vi.fn(), load: vi.fn(), delete: mockDelete };

    const { result } = renderHook(() => useInterviewChat());

    await act(async () => {
      await result.current.loadSessions();
    });
    expect(result.current.sessions).toHaveLength(2);

    await act(async () => {
      await result.current.deleteSession('s1');
    });

    expect(mockDelete).toHaveBeenCalledWith('s1');
    expect(result.current.sessions).toHaveLength(1);
    expect(result.current.sessions[0].id).toBe('s2');
  });

  it('hasPersistedSession is false when no localStorage data', () => {
    const { result } = renderHook(() => useInterviewChat());
    expect(result.current.hasPersistedSession).toBe(false);
  });

  it('clearChat also resets interviewState and isStructuredMode', () => {
    const { result } = renderHook(() => useInterviewChat());
    act(() => {
      result.current.clearChat();
    });
    expect(result.current.interviewState).toBeNull();
    expect(result.current.isStructuredMode).toBe(false);
  });

  it('startStructuredInterview initializes interview state', async () => {
    mockMutate.mockResolvedValue({
      data: { aiChat: { response: 'Let us begin with the first question.' } },
    });

    const { result } = renderHook(() => useInterviewChat());

    const config = {
      mode: 'question-bank' as const,
      chapters: ['Dynamic Arrays'],
      difficulty: 'medium' as const,
      questionCount: 2,
    };

    const questions = [
      {
        id: 'q1',
        chapter: 'Dynamic Arrays',
        chapterSlug: 'dynamic-arrays',
        difficulty: 'medium' as const,
        title: 'Two Sum',
        description: 'Find two numbers that add up to target.',
        tags: ['arrays'],
      },
      {
        id: 'q2',
        chapter: 'Dynamic Arrays',
        chapterSlug: 'dynamic-arrays',
        difficulty: 'medium' as const,
        title: 'Max Subarray',
        description: 'Find the contiguous subarray with largest sum.',
        tags: ['arrays'],
      },
    ];

    act(() => {
      result.current.startStructuredInterview(config, questions);
    });

    // Wait for setTimeout(0) to fire
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(result.current.interviewState).not.toBeNull();
    expect(result.current.isStructuredMode).toBe(true);
    expect(result.current.interviewState?.phase).toBe('active');
    expect(result.current.interviewState?.selectedQuestions).toHaveLength(2);
  });

  it('exposes progress in structured mode', async () => {
    mockMutate.mockResolvedValue({
      data: { aiChat: { response: 'Starting.' } },
    });

    const { result } = renderHook(() => useInterviewChat());

    const config = {
      mode: 'question-bank' as const,
      chapters: ['Trees'],
      difficulty: 'easy' as const,
      questionCount: 3,
    };

    const questions = [
      { id: 'q1', chapter: 'Trees', chapterSlug: 'trees', difficulty: 'easy' as const, title: 'T1', description: 'D1', tags: [] },
      { id: 'q2', chapter: 'Trees', chapterSlug: 'trees', difficulty: 'easy' as const, title: 'T2', description: 'D2', tags: [] },
      { id: 'q3', chapter: 'Trees', chapterSlug: 'trees', difficulty: 'easy' as const, title: 'T3', description: 'D3', tags: [] },
    ];

    act(() => {
      result.current.startStructuredInterview(config, questions);
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(result.current.progress).toEqual({ current: 1, total: 3 });
  });

  it('hint still works in structured mode', async () => {
    mockMutate.mockResolvedValue({
      data: { aiChat: { response: 'Here is a hint.' } },
    });

    const { result } = renderHook(() => useInterviewChat());

    const config = {
      mode: 'question-bank' as const,
      chapters: ['Graphs'],
      difficulty: 'medium' as const,
      questionCount: 1,
    };

    const questions = [
      { id: 'q1', chapter: 'Graphs', chapterSlug: 'graphs', difficulty: 'medium' as const, title: 'BFS Shortest Path', description: 'Find shortest path using BFS.', tags: [] },
    ];

    act(() => {
      result.current.startStructuredInterview(config, questions);
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    // Reset mock to capture hint call
    mockMutate.mockClear();
    mockMutate.mockResolvedValue({
      data: { aiChat: { response: 'Consider using a queue.' } },
    });

    await act(async () => {
      result.current.requestHint();
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(mockMutate).toHaveBeenCalled();
    // The system prompt should contain the question title since it's structured mode
    const vars = mockMutate.mock.calls[0][0].variables;
    expect(vars.systemPrompt).toContain('BFS Shortest Path');
  });

  it('old sessions without interviewState load as custom mode', async () => {
    const mockLoad = vi.fn().mockResolvedValue({
      session: {
        id: 'old-session',
        question: 'Two Sum',
        document: 'def twoSum...',
        messages: [{ id: 'm1', role: 'user', content: 'Hello', timestamp: 1000 }],
      },
    });
    (window as any).__interviewApi = { list: vi.fn(), save: vi.fn(), load: mockLoad, delete: vi.fn() };

    const { result } = renderHook(() => useInterviewChat());

    await act(async () => {
      await result.current.loadSession('old-session');
    });

    expect(result.current.isStructuredMode).toBe(false);
    expect(result.current.interviewState).toBeNull();
  });
});
