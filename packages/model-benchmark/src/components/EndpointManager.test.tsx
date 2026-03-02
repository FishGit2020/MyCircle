import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import EndpointManager from './EndpointManager';

// Mock @mycircle/shared — EndpointManager is now a thin wrapper around SharedEndpointManager
vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  EndpointManager: ({ source }: { source: string }) => (
    <div data-testid="shared-endpoint-manager" data-source={source}>
      Shared EndpointManager (source={source})
    </div>
  ),
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

describe('EndpointManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders shared EndpointManager with source="benchmark"', () => {
    render(<EndpointManager />);
    const shared = screen.getByTestId('shared-endpoint-manager');
    expect(shared).toBeInTheDocument();
    expect(shared).toHaveAttribute('data-source', 'benchmark');
  });
});
