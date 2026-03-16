import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useQuestionBank, _resetCache } from './useQuestionBank';

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

const mockFetch = vi.fn();

beforeEach(() => {
  _resetCache();
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useQuestionBank', () => {
  it('fetches question bank on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockQuestionBank,
    });

    const { result } = renderHook(() => useQuestionBank());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual(mockQuestionBank);
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith('/interview-api/question-bank');
  });

  it('handles fetch error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useQuestionBank());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Failed to load question bank: 500');
  });

  it('createQuestion calls POST and refetches', async () => {
    const createdQuestion = {
      id: 'dynamic-arrays-medium-12345',
      chapter: 'Dynamic Arrays',
      chapterSlug: 'dynamic-arrays',
      difficulty: 'medium' as const,
      title: 'New Question',
      description: 'A new question.',
      tags: ['array'],
    };

    // Initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockQuestionBank,
    });

    const { result } = renderHook(() => useQuestionBank());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // POST create
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ question: createdQuestion }),
    });
    // Refetch after create
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...mockQuestionBank,
        questions: [...mockQuestionBank.questions, createdQuestion],
      }),
    });

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
    expect(mockFetch).toHaveBeenCalledWith('/interview-api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chapter: 'Dynamic Arrays',
        chapterSlug: 'dynamic-arrays',
        difficulty: 'medium',
        title: 'New Question',
        description: 'A new question.',
        tags: ['array'],
      }),
    });
  });

  it('updateQuestion calls PUT and refetches', async () => {
    const updatedQuestion = {
      ...mockQuestionBank.questions[0],
      title: 'Updated Title',
    };

    // Initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockQuestionBank,
    });

    const { result } = renderHook(() => useQuestionBank());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // PUT update
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ question: updatedQuestion }),
    });
    // Refetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...mockQuestionBank,
        questions: [updatedQuestion, mockQuestionBank.questions[1]],
      }),
    });

    let updated: unknown;
    await act(async () => {
      updated = await result.current.updateQuestion('dynamic-arrays-medium-1', { title: 'Updated Title' });
    });

    expect(updated).toEqual(updatedQuestion);
    expect(mockFetch).toHaveBeenCalledWith('/interview-api/questions/dynamic-arrays-medium-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated Title' }),
    });
  });

  it('deleteQuestion calls DELETE and refetches', async () => {
    // Initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockQuestionBank,
    });

    const { result } = renderHook(() => useQuestionBank());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // DELETE
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    });
    // Refetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...mockQuestionBank,
        questions: [mockQuestionBank.questions[1]],
      }),
    });

    let deleted: boolean | undefined;
    await act(async () => {
      deleted = await result.current.deleteQuestion('dynamic-arrays-medium-1');
    });

    expect(deleted).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith('/interview-api/questions/dynamic-arrays-medium-1', {
      method: 'DELETE',
    });
  });

  it('createQuestion returns null on failure', async () => {
    // Initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockQuestionBank,
    });

    const { result } = renderHook(() => useQuestionBank());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // POST fails
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
    });

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
    // Initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockQuestionBank,
    });

    const { result } = renderHook(() => useQuestionBank());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // DELETE fails
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    let deleted: boolean | undefined;
    await act(async () => {
      deleted = await result.current.deleteQuestion('nonexistent-id');
    });

    expect(deleted).toBe(false);
  });
});
