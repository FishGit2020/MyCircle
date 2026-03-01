import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAdd = vi.fn().mockResolvedValue({ id: 'test-id' });
const mockCollection = vi.fn().mockReturnValue({ add: mockAdd });

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({ collection: mockCollection }),
  FieldValue: { serverTimestamp: () => 'SERVER_TIMESTAMP' },
}));

vi.mock('firebase-functions', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

import { logAiChatInteraction, truncate } from '../aiChatLogger';

describe('truncate', () => {
  it('returns empty string for empty input', () => {
    expect(truncate('', 100)).toBe('');
  });

  it('returns text unchanged when under limit', () => {
    expect(truncate('hello', 100)).toBe('hello');
  });

  it('truncates text exceeding limit with ellipsis', () => {
    const text = 'a'.repeat(300);
    const result = truncate(text, 200);
    expect(result.length).toBe(203); // 200 + '...'
    expect(result.endsWith('...')).toBe(true);
  });

  it('handles exact length without truncation', () => {
    const text = 'a'.repeat(200);
    expect(truncate(text, 200)).toBe(text);
  });
});

describe('logAiChatInteraction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes to aiChatLogs collection with correct fields', () => {
    logAiChatInteraction({
      userId: 'user-1',
      provider: 'ollama',
      model: 'gemma2:2b',
      inputTokens: 100,
      outputTokens: 50,
      totalTokens: 150,
      latencyMs: 1200,
      toolCalls: [{ name: 'getWeather', durationMs: 300 }],
      questionPreview: 'What is the weather?',
      answerPreview: 'The weather is sunny.',
      status: 'success',
      usedFallback: false,
    });

    expect(mockCollection).toHaveBeenCalledWith('aiChatLogs');
    expect(mockAdd).toHaveBeenCalledTimes(1);

    const doc = mockAdd.mock.calls[0][0];
    expect(doc.userId).toBe('user-1');
    expect(doc.provider).toBe('ollama');
    expect(doc.model).toBe('gemma2:2b');
    expect(doc.inputTokens).toBe(100);
    expect(doc.outputTokens).toBe(50);
    expect(doc.totalTokens).toBe(150);
    expect(doc.latencyMs).toBe(1200);
    expect(doc.toolCalls).toEqual([{ name: 'getWeather', durationMs: 300 }]);
    expect(doc.status).toBe('success');
    expect(doc.timestamp).toBe('SERVER_TIMESTAMP');
  });

  it('truncates long question and answer previews', () => {
    const longQuestion = 'q'.repeat(500);
    const longAnswer = 'a'.repeat(1000);

    logAiChatInteraction({
      userId: 'user-1',
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      latencyMs: 500,
      toolCalls: [],
      questionPreview: longQuestion,
      answerPreview: longAnswer,
      status: 'success',
      usedFallback: false,
    });

    const doc = mockAdd.mock.calls[0][0];
    expect(doc.questionPreview.length).toBeLessThanOrEqual(203);
    expect(doc.answerPreview.length).toBeLessThanOrEqual(503);
  });

  it('does not throw when Firestore write fails', () => {
    mockAdd.mockRejectedValueOnce(new Error('Firestore error'));

    expect(() => {
      logAiChatInteraction({
        userId: 'user-1',
        provider: 'ollama',
        model: 'test',
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        latencyMs: 0,
        toolCalls: [],
        questionPreview: '',
        answerPreview: '',
        status: 'error',
        error: 'test error',
        usedFallback: false,
      });
    }).not.toThrow();
  });
});
