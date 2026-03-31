import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Setup from './Setup';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  PageContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useQuery: () => ({ data: null, loading: false }),
  useMutation: () => [vi.fn(), { loading: false }],
}));

vi.mock('./SqlConnectionSection', () => ({
  default: () => <div data-testid="sql-section">SQL</div>,
}));

vi.mock('./EndpointSection', () => ({
  default: () => <div data-testid="endpoint-section">Endpoints</div>,
}));

vi.mock('./BackfillSection', () => ({
  default: () => <div data-testid="backfill-section">Backfill</div>,
}));

vi.mock('./AnalyticsDashboard', () => ({
  default: () => <div data-testid="analytics-section">Analytics</div>,
}));

vi.mock('./analytics/ChatSearch', () => ({
  default: () => <div data-testid="search-section">Search</div>,
}));

describe('Setup', () => {
  it('renders the setup page with title and tabs', () => {
    render(<Setup />);
    expect(screen.getByText('setup.title')).toBeInTheDocument();
    expect(screen.getByText('setup.tabs.connection')).toBeInTheDocument();
    expect(screen.getByText('setup.tabs.endpoints')).toBeInTheDocument();
    expect(screen.getByText('setup.tabs.analytics')).toBeInTheDocument();
  });

  it('renders SQL connection section by default', () => {
    render(<Setup />);
    expect(screen.getByTestId('sql-section')).toBeInTheDocument();
  });
});
