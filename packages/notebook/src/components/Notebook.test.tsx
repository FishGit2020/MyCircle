import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import Notebook from './Notebook';

// Mock @mycircle/shared
vi.mock('@mycircle/shared', () => ({
  PageContent: ({ children, className = '' }: any) => <div className={className}>{children}</div>, // eslint-disable-line @typescript-eslint/no-explicit-any
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  useQuery: vi.fn(() => ({ data: null, loading: false })),
  useMutation: vi.fn(() => [vi.fn()]),
  GET_NOTES: 'GET_NOTES',
  ADD_NOTE: 'ADD_NOTE',
  UPDATE_NOTE: 'UPDATE_NOTE',
  DELETE_NOTE: 'DELETE_NOTE',
  GET_PUBLIC_NOTES: 'GET_PUBLIC_NOTES',
  ADD_PUBLIC_NOTE: 'ADD_PUBLIC_NOTE',
  UPDATE_PUBLIC_NOTE: 'UPDATE_PUBLIC_NOTE',
  DELETE_PUBLIC_NOTE: 'DELETE_PUBLIC_NOTE',
  WindowEvents: { AUTH_STATE_CHANGED: 'auth-state-changed', NOTEBOOK_CHANGED: 'notebook-changed', PUBLIC_NOTES_CHANGED: 'public-notes-changed' },
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
