import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import ShareButton from './ShareButton';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  createLogger: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }),
}));

vi.mock('react-router', () => ({
  useSearchParams: () => [new URLSearchParams('name=TestCity')],
}));

describe('ShareButton', () => {
  it('renders without crashing', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<ShareButton weatherRef={ref} />);
    expect(screen.getByTitle('share.shareLink')).toBeInTheDocument();
  });

  it('renders save as image button', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<ShareButton weatherRef={ref} />);
    expect(screen.getByTitle('share.saveAsImage')).toBeInTheDocument();
  });
});
