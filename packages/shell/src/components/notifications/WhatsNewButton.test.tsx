import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WhatsNewButton from './WhatsNewButton';

const mockMarkAllSeen = vi.fn();
const mockAnnouncements = [
  { id: 'ann-1', title: 'Test', description: 'Desc', createdAt: new Date() },
];

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../hooks/useAnnouncements', () => ({
  useAnnouncements: () => ({
    announcements: mockAnnouncements,
    loading: false,
    hasUnread: true,
    markAllSeen: mockMarkAllSeen,
  }),
}));

describe('WhatsNewButton', () => {
  it('renders sparkle button with aria-label', () => {
    render(<WhatsNewButton />);
    expect(screen.getByLabelText('whatsNew.title')).toBeInTheDocument();
  });

  it('shows unread badge when hasUnread is true', () => {
    render(<WhatsNewButton />);
    expect(screen.getByLabelText('whatsNew.newBadge')).toBeInTheDocument();
  });

  it('opens modal on click and marks all as seen', () => {
    render(<WhatsNewButton />);
    fireEvent.click(screen.getByLabelText('whatsNew.title'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(mockMarkAllSeen).toHaveBeenCalledOnce();
  });

  it('closes modal when close button is clicked', () => {
    render(<WhatsNewButton />);
    // Open
    fireEvent.click(screen.getByLabelText('whatsNew.title'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // Close
    fireEvent.click(screen.getByLabelText('whatsNew.close'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
