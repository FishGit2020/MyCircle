import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import MFEPageWrapper from './MFEPageWrapper';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

function MockComponent() {
  return <div data-testid="mock-mfe">Mock MFE Content</div>;
}

const LazyMock = React.lazy(() => Promise.resolve({ default: MockComponent }));

describe('MFEPageWrapper', () => {
  it('renders the lazy-loaded component', async () => {
    render(<MFEPageWrapper component={LazyMock} name="TestMFE" />);
    expect(await screen.findByTestId('mock-mfe')).toBeInTheDocument();
    expect(screen.getByText('Mock MFE Content')).toBeInTheDocument();
  });

  it('shows loading spinner while Suspense resolves', () => {
    const NeverResolve = React.lazy(() => new Promise<{ default: React.ComponentType }>(() => {}));
    render(<MFEPageWrapper component={NeverResolve} name="Slow" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
