/**
 * Pure state machine for structured interview flow.
 * No React hooks — just types and pure functions.
 */

export type Difficulty = 'easy' | 'medium' | 'hard';
export type InterviewPhase = 'setup' | 'active' | 'wrap_up' | 'end';

export interface BankQuestion {
  id: string;
  chapter: string;
  chapterSlug: string;
  difficulty: Difficulty;
  title: string;
  description: string;
  tags: string[];
}

export interface InterviewConfig {
  mode: 'question-bank' | 'custom';
  chapters: string[];
  difficulty: Difficulty;
  questionCount: number;
}

export interface EvaluationScore {
  questionId: string;
  technical: number;
  problemSolving: number;
  communication: number;
  depth: number;
  feedback: string;
}

export interface InterviewState {
  config: InterviewConfig;
  phase: InterviewPhase;
  questionIndex: number;
  questionStartMessageIndex: number;
  scores: EvaluationScore[];
  selectedQuestions: BankQuestion[];
  completed: boolean;
}

/** The 19 algorithm chapters. */
export const CHAPTERS = [
  'Dynamic Arrays',
  'String Manipulation',
  'Two Pointers',
  'Grids & Matrices',
  'Binary Search',
  'Sets & Maps',
  'Sorting',
  'Stacks & Queues',
  'Recursion',
  'Linked Lists',
  'Trees',
  'Graphs',
  'Heaps',
  'Sliding Windows',
  'Backtracking',
  'Dynamic Programming',
  'Greedy Algorithms',
  'Topological Sort',
  'Prefix Sums',
] as const;

/** Convert a chapter name to a URL-safe slug. */
export function toSlug(name: string): string {
  return name
    .replace(/&/g, 'and')
    .toLowerCase()
    .replace(/\s+/g, '-');
}

/** Pre-computed slugs for all chapters. */
export const CHAPTER_SLUGS: string[] = CHAPTERS.map(toSlug);

/** Fisher-Yates shuffle (returns new array). */
function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Create the initial interview state.
 * Filters questions by selected chapter slugs + difficulty, shuffles, and picks `questionCount`.
 */
export function createInitialState(
  config: InterviewConfig,
  allQuestions: BankQuestion[],
): InterviewState {
  const chapterSet = new Set(config.chapters.map(toSlug));
  const filtered = allQuestions.filter(
    (q) => chapterSet.has(q.chapterSlug) && q.difficulty === config.difficulty,
  );
  const shuffled = shuffle(filtered);
  const count = Math.min(config.questionCount, shuffled.length);
  return {
    config,
    phase: 'active',
    questionIndex: 0,
    questionStartMessageIndex: 0,
    scores: [],
    selectedQuestions: shuffled.slice(0, count),
    completed: false,
  };
}

/** Get the current question (or undefined if out of range). */
export function getCurrentQuestion(state: InterviewState): BankQuestion | undefined {
  return state.selectedQuestions[state.questionIndex];
}

/** Advance to the next question. If no more questions, move to wrap_up. */
export function advance(state: InterviewState, messageIndex: number): InterviewState {
  const nextIndex = state.questionIndex + 1;
  if (nextIndex >= state.selectedQuestions.length) {
    return { ...state, phase: 'wrap_up', questionIndex: nextIndex };
  }
  return { ...state, questionIndex: nextIndex, questionStartMessageIndex: messageIndex };
}

/** Add a score for the current question. */
export function addScore(state: InterviewState, score: EvaluationScore): InterviewState {
  return { ...state, scores: [...state.scores, score] };
}

/** Get progress as { current, total }. */
export function getProgress(state: InterviewState): { current: number; total: number } {
  return {
    current: Math.min(state.questionIndex + 1, state.selectedQuestions.length),
    total: state.selectedQuestions.length,
  };
}

/** Whether the current question is the last one. */
export function isLastQuestion(state: InterviewState): boolean {
  return state.questionIndex >= state.selectedQuestions.length - 1;
}

/** Whether the interview is fully complete. */
export function isComplete(state: InterviewState): boolean {
  return state.phase === 'wrap_up' || state.phase === 'end' || state.completed;
}
