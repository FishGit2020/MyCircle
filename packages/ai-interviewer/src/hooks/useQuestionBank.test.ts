import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuestionBank } from './useQuestionBank';

const mockQuestionBank = {
  chapters: ['Dynamic Arrays', 'Binary Search'],
  questions: [
    {
      id: 'dynamic-arrays-medium-1',
      chapter: 'Dynamic Arrays',
      chapterSlug: 'dynamic-arrays',
      difficulty: 'medium' as const,
      title: 'Two Sum',
      description: 'Find two numbers that add up to target.',
      tags: ['array', 'hash-map'],
    },
    {
      id: 'binary-search-easy-1',
      chapter: 'Binary Search',
      chapterSlug: 'binary-search',
      difficulty: 'easy' as const,
      title: 'Search Insert Position',
      description: 'Find the insert position in sorted array.',
      tags: ['binary-search'],
    },
  ],
};

const mockRefetch = vi.fn().mockResolvedValue({ data: { questionBank: mockQuestionBank } });
const mockCreateMutation = vi.fn();
const mockUpdateMutation = vi.fn();
const mockDeleteMutation = vi.fn();

let mockQueryResult = {
  data: { questionBank: mockQuestionBank },
  loading: false,
  error: undefined as Error | undefined,
};

vi.mock('@mycircle/shared', () => ({
  useQuery: () => ({ ...mockQueryResult, refetch: mockRefetch }),
  useMutation: (query: unknown) => {
    if (query === 'CREATE_INTERVIEW_QUESTION') return [mockCreateMutation, { loading: false }];
    if (query === 'UPDATE_INTERVIEW_QUESTION') return [mockUpdateMutation, { loading: false }];
    if (query === 'DELETE_INTERVIEW_QUESTION') return [mockDeleteMutation, { loading: false }];
    return [vi.fn(), { loading: false }];
  },
  GET_QUESTION_BANK: 'GET_QUESTION_BANK',
  CREATE_INTERVIEW_QUESTION: 'CREATE_INTERVIEW_QUESTION',
  UPDATE_INTERVIEW_QUESTION: 'UPDATE_INTERVIEW_QUESTION',
  DELETE_INTERVIEW_QUESTION: 'DELETE_INTERVIEW_QUESTION',
  createLogger: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }),
}));

beforeEach(() => {
  mockRefetch.mockClear();
  mockCreateMutation.mockReset();
  mockUpdateMutation.mockReset();
  mockDeleteMutation.mockReset();
  mockQueryResult = {
    data: { questionBank: mockQuestionBank },
    loading: false,
    error: undefined,
  };
});

describe('useQuestionBank', () => {
  it('returns question bank data from Apollo query', () => {
    const { result } = renderHook(() => useQuestionBank());

    expect(result.current.data).toEqual(mockQuestionBank);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('returns loading state', () => {
    mockQueryResult = { data: undefined as unknown, loading: true, error: undefined };

    const { result } = renderHook(() => useQuestionBank());

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
  });

  it('returns error from query', () => {
    mockQueryResult = { data: undefined as unknown, loading: false, error: new Error('Failed to load question bank') };

    const { result } = renderHook(() => useQuestionBank());

    expect(result.current.error).toBe('Failed to load question bank');
    expect(result.current.data).toBeNull();
  });

  it('createQuestion calls mutation and refetches', async () => {
    const createdQuestion = {
      id: 'dynamic-arrays-medium-12345',
      chapter: 'Dynamic Arrays',
      chapterSlug: 'dynamic-arrays',
      difficulty: 'medium' as const,
      title: 'New Question',
      description: 'A new question.',
      tags: ['array'],
    };

    mockCreateMutation.mockResolvedValueOnce({
      data: { createInterviewQuestion: createdQuestion },
    });

    const { result } = renderHook(() => useQuestionBank());

    let created: unknown;
    await act(async () => {
      created = await result.current.createQuestion({
        chapter: 'Dynamic Arrays',
        chapterSlug: 'dynamic-arrays',
        difficulty: 'medium',
        title: 'New Question',
        description: 'A new question.',
        tags: ['array'],
      });
    });

    expect(created).toEqual(createdQuestion);
    expect(mockCreateMutation).toHaveBeenCalledWith({
      variables: {
        input: {
          chapter: 'Dynamic Arrays',
          chapterSlug: 'dynamic-arrays',
          difficulty: 'medium',
          title: 'New Question',
          description: 'A new question.',
          tags: ['array'],
        },
      },
    });
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('updateQuestion calls mutation and refetches', async () => {
    const updatedQuestion = {
      ...mockQuestionBank.questions[0],
      title: 'Updated Title',
    };

    mockUpdateMutation.mockResolvedValueOnce({
      data: { updateInterviewQuestion: updatedQuestion },
    });

    const { result } = renderHook(() => useQuestionBank());

    let updated: unknown;
    await act(async () => {
      updated = await result.current.updateQuestion('dynamic-arrays-medium-1', { title: 'Updated Title' });
    });

    expect(updated).toEqual(updatedQuestion);
    expect(mockUpdateMutation).toHaveBeenCalledWith({
      variables: { id: 'dynamic-arrays-medium-1', input: { title: 'Updated Title' } },
    });
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('deleteQuestion calls mutation and refetches', async () => {
    mockDeleteMutation.mockResolvedValueOnce({
      data: { deleteInterviewQuestion: true },
    });

    const { result } = renderHook(() => useQuestionBank());

    let deleted: boolean | undefined;
    await act(async () => {
      deleted = await result.current.deleteQuestion('dynamic-arrays-medium-1');
    });

    expect(deleted).toBe(true);
    expect(mockDeleteMutation).toHaveBeenCalledWith({
      variables: { id: 'dynamic-arrays-medium-1' },
    });
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('createQuestion returns null on failure', async () => {
    mockCreateMutation.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useQuestionBank());

    let created: unknown;
    await act(async () => {
      created = await result.current.createQuestion({
        chapter: 'Dynamic Arrays',
        chapterSlug: 'dynamic-arrays',
        difficulty: 'medium',
        title: '',
        description: '',
        tags: [],
      });
    });

    expect(created).toBeNull();
  });

  it('deleteQuestion returns false on failure', async () => {
    mockDeleteMutation.mockRejectedValueOnce(new Error('Not found'));

    const { result } = renderHook(() => useQuestionBank());

    let deleted: boolean | undefined;
    await act(async () => {
      deleted = await result.current.deleteQuestion('nonexistent-id');
    });

    expect(deleted).toBe(false);
  });
});
