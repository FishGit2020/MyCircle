import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MilestoneEventsSection from './MilestoneEventsSection';

const mockAddEvent = vi.fn().mockResolvedValue(undefined);
const mockUpdateEvent = vi.fn().mockResolvedValue(undefined);
const mockDeleteEvent = vi.fn().mockResolvedValue(undefined);

vi.mock('../hooks/useMilestoneEvents', () => ({
  useMilestoneEvents: () => ({
    events: [
      {
        id: 'ev1',
        childId: null,
        title: 'First kick',
        eventDate: '2026-01-15',
        note: 'Felt it today!',
        createdAt: '2026-01-15T10:00:00Z',
        updatedAt: '2026-01-15T10:00:00Z',
      },
    ],
    loading: false,
    error: undefined,
    addEvent: mockAddEvent,
    updateEvent: mockUpdateEvent,
    deleteEvent: mockDeleteEvent,
  }),
}));

vi.mock('@mycircle/shared', async () => {
  const actual = await vi.importActual<object>('@mycircle/shared');
  return {
    ...actual,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

describe('MilestoneEventsSection', () => {
  it('shows sign-in prompt when not authenticated', () => {
    render(<MilestoneEventsSection childId={null} isAuthenticated={false} />);
    expect(screen.getByText('babyJournal.myMoments.signInPrompt')).toBeInTheDocument();
  });

  it('renders existing event when authenticated', () => {
    render(<MilestoneEventsSection childId={null} isAuthenticated={true} />);
    expect(screen.getByText('First kick')).toBeInTheDocument();
  });

  it('shows note text', () => {
    render(<MilestoneEventsSection childId={null} isAuthenticated={true} />);
    expect(screen.getByText('Felt it today!')).toBeInTheDocument();
  });

  it('shows add button when authenticated', () => {
    render(<MilestoneEventsSection childId={null} isAuthenticated={true} />);
    expect(screen.getByText('babyJournal.myMoments.add')).toBeInTheDocument();
  });

  it('opens form when Add is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    render(<MilestoneEventsSection childId={null} isAuthenticated={true} />);
    await user.click(screen.getByText('babyJournal.myMoments.add'));
    expect(screen.getByPlaceholderText('babyJournal.myMoments.titlePlaceholder')).toBeInTheDocument();
  });

  it('shows delete confirmation when delete button clicked', async () => {
    const user = userEvent.setup({ delay: null });
    render(<MilestoneEventsSection childId={null} isAuthenticated={true} />);
    const deleteBtn = screen.getByLabelText('babyJournal.myMoments.delete');
    await user.click(deleteBtn);
    expect(screen.getByText('babyJournal.myMoments.deleteConfirm')).toBeInTheDocument();
  });
});
