import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import ShareButton from './ShareButton';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

vi.mock('react-router', () => ({
  useSearchParams: () => [new URLSearchParams('name=London')],
}));

const mockClipboardWriteText = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: mockClipboardWriteText },
    writable: true,
    configurable: true,
  });
  Object.defineProperty(navigator, 'share', {
    value: undefined,
    writable: true,
    configurable: true,
  });
});

describe('ShareButton', () => {
  it('renders share link and image buttons', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<ShareButton weatherRef={ref} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(2);
  });

  it('shows share label', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<ShareButton weatherRef={ref} />);
    expect(screen.getByText('share.share')).toBeInTheDocument();
  });

  it('shows image label', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<ShareButton weatherRef={ref} />);
    expect(screen.getByText('share.image')).toBeInTheDocument();
  });

  it('copies to clipboard when share link is clicked', async () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<ShareButton weatherRef={ref} />);
    await act(async () => {
      fireEvent.click(screen.getByTitle('share.shareLink'));
    });
    expect(mockClipboardWriteText).toHaveBeenCalledWith(expect.any(String));
  });

  it('shows copied text after clipboard write', async () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<ShareButton weatherRef={ref} />);
    await act(async () => {
      fireEvent.click(screen.getByTitle('share.shareLink'));
    });
    expect(screen.getByText('share.copied')).toBeInTheDocument();
  });
});
