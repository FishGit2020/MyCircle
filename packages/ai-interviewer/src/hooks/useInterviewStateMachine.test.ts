import { describe, it, expect } from 'vitest';
import {
  toSlug,
  CHAPTERS,
  CHAPTER_SLUGS,
  createInitialState,
  getCurrentQuestion,
  advance,
  addScore,
  getProgress,
  isLastQuestion,
  isComplete,
} from './useInterviewStateMachine';
import type {
  BankQuestion,
  InterviewConfig,
  EvaluationScore,
  Difficulty,
} from './useInterviewStateMachine';

function makeQuestion(id: string, chapter: string, difficulty: Difficulty = 'medium'): BankQuestion {
  return {
    id,
    chapter,
    chapterSlug: toSlug(chapter),
    difficulty,
    title: `${chapter} Problem ${id}`,
    description: `Description for ${id}`,
    tags: [chapter.toLowerCase()],
  };
}

function makeConfig(
  chapters: string[],
  difficulty: Difficulty = 'medium',
  questionCount = 3,
): InterviewConfig {
  return {
    mode: 'question-bank',
    chapters,
    difficulty,
    questionCount,
  };
}

const sampleQuestions: BankQuestion[] = [
  makeQuestion('q1', 'Dynamic Arrays', 'easy'),
  makeQuestion('q2', 'Dynamic Arrays', 'medium'),
  makeQuestion('q3', 'Dynamic Arrays', 'hard'),
  makeQuestion('q4', 'Binary Search', 'easy'),
  makeQuestion('q5', 'Binary Search', 'medium'),
  makeQuestion('q6', 'Binary Search', 'hard'),
  makeQuestion('q7', 'Trees', 'medium'),
  makeQuestion('q8', 'Trees', 'medium'),
  makeQuestion('q9', 'Graphs', 'medium'),
  makeQuestion('q10', 'Graphs', 'medium'),
];

describe('useInterviewStateMachine', () => {
  describe('toSlug', () => {
    it('converts chapter names to slugs', () => {
      expect(toSlug('Dynamic Arrays')).toBe('dynamic-arrays');
      expect(toSlug('Grids & Matrices')).toBe('grids-and-matrices');
      expect(toSlug('Sets & Maps')).toBe('sets-and-maps');
      expect(toSlug('Stacks & Queues')).toBe('stacks-and-queues');
      expect(toSlug('Dynamic Programming')).toBe('dynamic-programming');
      expect(toSlug('Topological Sort')).toBe('topological-sort');
    });
  });

  describe('CHAPTERS', () => {
    it('has exactly 19 chapters', () => {
      expect(CHAPTERS).toHaveLength(19);
    });

    it('CHAPTER_SLUGS matches CHAPTERS length', () => {
      expect(CHAPTER_SLUGS).toHaveLength(19);
    });
  });

  describe('createInitialState', () => {
    it('creates state with correct question count', () => {
      const config = makeConfig(['Dynamic Arrays'], 'medium', 1);
      const state = createInitialState(config, sampleQuestions);
      expect(state.selectedQuestions).toHaveLength(1);
      expect(state.phase).toBe('active');
      expect(state.questionIndex).toBe(0);
      expect(state.scores).toEqual([]);
      expect(state.completed).toBe(false);
    });

    it('limits to available pool size', () => {
      const config = makeConfig(['Dynamic Arrays'], 'medium', 100);
      const state = createInitialState(config, sampleQuestions);
      // Only 1 medium Dynamic Arrays question available (q2)
      expect(state.selectedQuestions).toHaveLength(1);
    });

    it('filters by difficulty', () => {
      const config = makeConfig(['Dynamic Arrays'], 'easy', 5);
      const state = createInitialState(config, sampleQuestions);
      // Only 1 easy Dynamic Arrays question (q1)
      expect(state.selectedQuestions).toHaveLength(1);
      expect(state.selectedQuestions[0].difficulty).toBe('easy');
    });

    it('handles multiple chapters', () => {
      const config = makeConfig(['Trees', 'Graphs'], 'medium', 10);
      const state = createInitialState(config, sampleQuestions);
      // Trees: q7, q8 (medium), Graphs: q9, q10 (medium) = 4
      expect(state.selectedQuestions).toHaveLength(4);
    });

    it('returns empty when no questions match', () => {
      const config = makeConfig(['Heaps'], 'easy', 5);
      const state = createInitialState(config, sampleQuestions);
      expect(state.selectedQuestions).toHaveLength(0);
    });
  });

  describe('getCurrentQuestion', () => {
    it('returns the current question', () => {
      const config = makeConfig(['Dynamic Arrays', 'Binary Search'], 'medium', 2);
      const state = createInitialState(config, sampleQuestions);
      const q = getCurrentQuestion(state);
      expect(q).toBeDefined();
      expect(state.selectedQuestions).toContain(q);
    });

    it('returns undefined when index is out of range', () => {
      const config = makeConfig(['Dynamic Arrays'], 'medium', 1);
      const state = createInitialState(config, sampleQuestions);
      const advanced = advance(state, 5);
      // After advancing past last question, phase goes to wrap_up
      const q = getCurrentQuestion(advanced);
      expect(q).toBeUndefined();
    });
  });

  describe('advance', () => {
    it('moves to next question', () => {
      const config = makeConfig(['Trees', 'Graphs'], 'medium', 4);
      const state = createInitialState(config, sampleQuestions);
      const next = advance(state, 10);
      expect(next.questionIndex).toBe(1);
      expect(next.phase).toBe('active');
      expect(next.questionStartMessageIndex).toBe(10);
    });

    it('moves to wrap_up after last question', () => {
      const config = makeConfig(['Dynamic Arrays'], 'medium', 1);
      const state = createInitialState(config, sampleQuestions);
      expect(state.selectedQuestions).toHaveLength(1);
      const next = advance(state, 5);
      expect(next.phase).toBe('wrap_up');
    });
  });

  describe('addScore', () => {
    it('appends a score', () => {
      const config = makeConfig(['Dynamic Arrays'], 'medium', 1);
      const state = createInitialState(config, sampleQuestions);
      const score: EvaluationScore = {
        questionId: 'q2',
        technical: 8,
        problemSolving: 7,
        communication: 9,
        depth: 6,
        feedback: 'Good work',
      };
      const next = addScore(state, score);
      expect(next.scores).toHaveLength(1);
      expect(next.scores[0].technical).toBe(8);
    });
  });

  describe('getProgress', () => {
    it('returns current and total', () => {
      const config = makeConfig(['Trees', 'Graphs'], 'medium', 3);
      const state = createInitialState(config, sampleQuestions);
      const prog = getProgress(state);
      expect(prog.current).toBe(1);
      expect(prog.total).toBe(3);
    });

    it('updates after advance', () => {
      const config = makeConfig(['Trees', 'Graphs'], 'medium', 3);
      const state = createInitialState(config, sampleQuestions);
      const next = advance(state, 5);
      const prog = getProgress(next);
      expect(prog.current).toBe(2);
      expect(prog.total).toBe(3);
    });
  });

  describe('isLastQuestion', () => {
    it('returns false when not on last question', () => {
      const config = makeConfig(['Trees', 'Graphs'], 'medium', 3);
      const state = createInitialState(config, sampleQuestions);
      expect(isLastQuestion(state)).toBe(false);
    });

    it('returns true on last question', () => {
      const config = makeConfig(['Dynamic Arrays'], 'medium', 1);
      const state = createInitialState(config, sampleQuestions);
      expect(isLastQuestion(state)).toBe(true);
    });
  });

  describe('isComplete', () => {
    it('returns false during active phase', () => {
      const config = makeConfig(['Trees'], 'medium', 2);
      const state = createInitialState(config, sampleQuestions);
      expect(isComplete(state)).toBe(false);
    });

    it('returns true in wrap_up phase', () => {
      const config = makeConfig(['Dynamic Arrays'], 'medium', 1);
      const state = createInitialState(config, sampleQuestions);
      const advanced = advance(state, 5);
      expect(isComplete(advanced)).toBe(true);
    });

    it('returns true when completed flag is set', () => {
      const config = makeConfig(['Trees'], 'medium', 2);
      const state = createInitialState(config, sampleQuestions);
      const completed = { ...state, completed: true };
      expect(isComplete(completed)).toBe(true);
    });
  });
});
