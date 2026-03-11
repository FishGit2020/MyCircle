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
});
