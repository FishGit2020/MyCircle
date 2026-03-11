import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AiInterviewer from './AiInterviewer';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  PageContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  useQuery: () => ({ data: undefined, loading: false }),
  useLazyQuery: () => [vi.fn(), { data: undefined, loading: false }],
  useMutation: () => [vi.fn(), { loading: false }],
  AI_CHAT: {},
  GET_BENCHMARK_ENDPOINTS: {},
  GET_BENCHMARK_ENDPOINT_MODELS: {},
  createLogger: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }),
}));

describe('AiInterviewer', () => {
  it('renders the title', () => {
    render(<AiInterviewer />);
    expect(screen.getByText('aiInterviewer.title')).toBeInTheDocument();
  });

  it('shows start interview button', () => {
    render(<AiInterviewer />);
    expect(screen.getByText('aiInterviewer.startInterview')).toBeInTheDocument();
  });

  it('shows endpoint and model selectors', () => {
    render(<AiInterviewer />);
    expect(screen.getByRole('combobox', { name: /aiInterviewer.endpoint/ })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /aiInterviewer.model/ })).toBeInTheDocument();
  });

  it('shows question textarea', () => {
    render(<AiInterviewer />);
    expect(screen.getByRole('textbox', { name: /aiInterviewer.questionLabel/ })).toBeInTheDocument();
  });
});
