import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CollapsibleSection from './CollapsibleSection';

vi.mock('@mycircle/shared', async () => {
  const actual = await vi.importActual<object>('@mycircle/shared');
  return {
    ...actual,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

const STORAGE_KEY = 'test-section-expanded';

beforeEach(() => {
  localStorage.removeItem(STORAGE_KEY);
});

describe('CollapsibleSection', () => {
  it('renders the title from the key', () => {
    render(
      <CollapsibleSection titleKey="babyJournal.myMoments.title" storageKey={STORAGE_KEY}>
        <p>content</p>
      </CollapsibleSection>
    );
    expect(screen.getByText('babyJournal.myMoments.title')).toBeInTheDocument();
  });

  it('is collapsed by default', () => {
    render(
      <CollapsibleSection titleKey="babyJournal.myMoments.title" storageKey={STORAGE_KEY}>
        <p>hidden content</p>
      </CollapsibleSection>
    );
    expect(screen.queryByText('hidden content')).not.toBeInTheDocument();
  });

  it('expands when header button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <CollapsibleSection titleKey="babyJournal.myMoments.title" storageKey={STORAGE_KEY}>
        <p>visible content</p>
      </CollapsibleSection>
    );
    const btn = screen.getByRole('button');
    await user.click(btn);
    expect(screen.getByText('visible content')).toBeInTheDocument();
  });

  it('persists expanded state to localStorage', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <CollapsibleSection titleKey="babyJournal.myMoments.title" storageKey={STORAGE_KEY}>
        <p>content</p>
      </CollapsibleSection>
    );
    await user.click(screen.getByRole('button'));
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
  });

  it('reads initial state from localStorage', () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    render(
      <CollapsibleSection titleKey="babyJournal.myMoments.title" storageKey={STORAGE_KEY}>
        <p>expanded content</p>
      </CollapsibleSection>
    );
    expect(screen.getByText('expanded content')).toBeInTheDocument();
  });

  it('sets aria-expanded correctly', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <CollapsibleSection titleKey="babyJournal.myMoments.title" storageKey={STORAGE_KEY}>
        <p>content</p>
      </CollapsibleSection>
    );
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    await user.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });
});
