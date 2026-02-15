import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Notebook from './Notebook';

// Mock @mycircle/shared
vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  WindowEvents: { NOTEBOOK_CHANGED: 'notebook-changed', PUBLIC_NOTES_CHANGED: 'public-notes-changed' },
  StorageKeys: { NOTEBOOK_CACHE: 'notebook-cache' },
}));

describe('Notebook', () => {
  it('shows login message when not authenticated', () => {
    // No __getFirebaseIdToken or __notebook on window → unauthenticated state
    render(<Notebook />);
    expect(screen.getByText('notebook.loginToUse')).toBeInTheDocument();
  });
});
