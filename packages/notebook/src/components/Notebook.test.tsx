import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import Notebook from './Notebook';

// Mock @mycircle/shared
vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  WindowEvents: { NOTEBOOK_CHANGED: 'notebook-changed', PUBLIC_NOTES_CHANGED: 'public-notes-changed' },
  StorageKeys: { NOTEBOOK_CACHE: 'notebook-cache' },
}));

const renderWithRouter = (initialPath = '/notebook') => render(
  <MemoryRouter initialEntries={[initialPath]}>
    <Routes>
      <Route path="/notebook" element={<Notebook />} />
      <Route path="/notebook/new" element={<Notebook />} />
      <Route path="/notebook/:noteId" element={<Notebook />} />
    </Routes>
  </MemoryRouter>
);

describe('Notebook', () => {
  it('shows login message when not authenticated', () => {
    // No __getFirebaseIdToken or __notebook on window → unauthenticated state
    renderWithRouter();
    expect(screen.getByText('notebook.loginToUse')).toBeInTheDocument();
  });
});
