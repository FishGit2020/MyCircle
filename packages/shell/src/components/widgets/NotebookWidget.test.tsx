import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotebookWidget from './NotebookWidget';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  StorageKeys: { NOTEBOOK_CACHE: 'notebook_cache' },
  WindowEvents: {
    NOTEBOOK_CHANGED: 'notebook-changed',
    AUTH_STATE_CHANGED: 'auth-state-changed',
    PUBLIC_NOTES_CHANGED: 'public-notes-changed',
  },
}));

describe('NotebookWidget', () => {
  it('renders without crashing', () => {
    render(<NotebookWidget />);
    expect(screen.getByText('widgets.notebook')).toBeInTheDocument();
  });

  it('shows description text', () => {
    render(<NotebookWidget />);
    expect(screen.getByText('widgets.notebookDesc')).toBeInTheDocument();
  });

  it('shows no notes message when no data', () => {
    render(<NotebookWidget />);
    expect(screen.getByText('widgets.noNotes')).toBeInTheDocument();
  });

  it('has proper heading structure', () => {
    const { container } = render(<NotebookWidget />);
    const heading = container.querySelector('h4');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('widgets.notebook');
  });
});
