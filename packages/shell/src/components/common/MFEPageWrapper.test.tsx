import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import MFEPageWrapper from './MFEPageWrapper';

vi.mock('./Loading', () => ({ default: () => <div>Loading...</div> }));
vi.mock('./ErrorBoundary', () => ({ default: ({ children }: any) => <>{children}</> }));

describe('MFEPageWrapper', () => {
  it('renders the lazy component', async () => {
    const MockComponent = React.lazy(() => Promise.resolve({ default: () => <div>MFE Content</div> }));
    render(<MFEPageWrapper component={MockComponent} name="Test MFE" />);
    expect(await screen.findByText('MFE Content')).toBeInTheDocument();
  });
});
