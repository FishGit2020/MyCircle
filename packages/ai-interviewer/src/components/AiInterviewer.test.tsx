import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AiInterviewer from './AiInterviewer';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string, opts?: Record<string, unknown>) => opts ? `${key} ${JSON.stringify(opts)}` : key }),
  PageContent: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className}>{children}</div>,
  useQuery: () => ({ data: undefined, loading: false }),
  useLazyQuery: () => [vi.fn(), { data: undefined, loading: false }],
  useMutation: () => [vi.fn(), { loading: false }],
  AI_CHAT: {},
  GET_BENCHMARK_ENDPOINTS: {},
  GET_BENCHMARK_ENDPOINT_MODELS: {},
  WindowEvents: { AUTH_STATE_CHANGED: 'auth-state-changed' },
  createLogger: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }),
}));

// Mock fetch for question bank
const mockFetch = vi.fn();
beforeEach(() => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      chapters: ['Dynamic Arrays', 'Binary Search'],
      questions: [
        { id: 'q1', chapter: 'Dynamic Arrays', chapterSlug: 'dynamic-arrays', difficulty: 'medium', title: 'Two Sum', description: 'Find two numbers.', tags: [] },
      ],
    }),
  });
  vi.stubGlobal('fetch', mockFetch);
});

describe('AiInterviewer', () => {
  it('renders the title', () => {
    render(<AiInterviewer />);
    expect(screen.getByText('aiInterviewer.title')).toBeInTheDocument();
  });

  it('shows endpoint and model selectors', () => {
    render(<AiInterviewer />);
    expect(screen.getByRole('combobox', { name: /aiInterviewer.endpoint/ })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /aiInterviewer.model/ })).toBeInTheDocument();
  });

  it('shows sessions button', () => {
    render(<AiInterviewer />);
    expect(screen.getByText('aiInterviewer.sessions')).toBeInTheDocument();
  });

  it('renders interview setup with mode toggle', () => {
    render(<AiInterviewer />);
    expect(screen.getByText('aiInterviewer.questionBankMode')).toBeInTheDocument();
    expect(screen.getByText('aiInterviewer.customMode')).toBeInTheDocument();
  });

  it('shows start button', () => {
    render(<AiInterviewer />);
    // Start button shows "select model first" when no model is selected
    expect(screen.getByText('aiInterviewer.selectModelFirst')).toBeInTheDocument();
  });

  it('shows chapter selection pills', () => {
    render(<AiInterviewer />);
    expect(screen.getByText('aiInterviewer.chapter.dynamic-arrays')).toBeInTheDocument();
    expect(screen.getByText('aiInterviewer.chapter.binary-search')).toBeInTheDocument();
    expect(screen.getByText('aiInterviewer.chapter.trees')).toBeInTheDocument();
  });

  it('shows difficulty selector', () => {
    render(<AiInterviewer />);
    expect(screen.getByText('aiInterviewer.easy')).toBeInTheDocument();
    expect(screen.getByText('aiInterviewer.medium')).toBeInTheDocument();
    expect(screen.getByText('aiInterviewer.hard')).toBeInTheDocument();
  });

  it('shows select all and deselect all buttons', () => {
    render(<AiInterviewer />);
    expect(screen.getByText('aiInterviewer.selectAll')).toBeInTheDocument();
    expect(screen.getByText('aiInterviewer.deselectAll')).toBeInTheDocument();
  });
});
