import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WhatsNew from './WhatsNew';
import type { Announcement } from '../../hooks/useAnnouncements';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockAnnouncements: Announcement[] = [
  {
    id: 'ann-1',
    title: 'New Feature: Bible Versions',
    description: 'You can now switch between Bible translations.',
    icon: 'feature',
    createdAt: new Date('2026-02-10'),
  },
  {
    id: 'ann-2',
    title: 'Bug Fix: Print Layout',
    description: 'Fixed print output for worship songs.',
    icon: 'fix',
    createdAt: new Date('2026-02-08'),
  },
];

describe('WhatsNew', () => {
  it('does not render when open is false', () => {
    const { container } = render(
      <WhatsNew announcements={mockAnnouncements} open={false} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the dialog when open is true', () => {
    render(<WhatsNew announcements={mockAnnouncements} open={true} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('whatsNew.title')).toBeInTheDocument();
  });

  it('renders all announcements', () => {
    render(<WhatsNew announcements={mockAnnouncements} open={true} onClose={vi.fn()} />);
    expect(screen.getByText('New Feature: Bible Versions')).toBeInTheDocument();
    expect(screen.getByText('Bug Fix: Print Layout')).toBeInTheDocument();
  });

  it('renders descriptions', () => {
    render(<WhatsNew announcements={mockAnnouncements} open={true} onClose={vi.fn()} />);
    expect(screen.getByText('You can now switch between Bible translations.')).toBeInTheDocument();
    expect(screen.getByText('Fixed print output for worship songs.')).toBeInTheDocument();
  });

  it('shows empty state when no announcements', () => {
    render(<WhatsNew announcements={[]} open={true} onClose={vi.fn()} />);
    expect(screen.getByText('whatsNew.noUpdates')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<WhatsNew announcements={mockAnnouncements} open={true} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('whatsNew.close'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(<WhatsNew announcements={mockAnnouncements} open={true} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<WhatsNew announcements={mockAnnouncements} open={true} onClose={onClose} />);
    // Click the backdrop (role="presentation")
    fireEvent.click(screen.getByRole('presentation'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not close when dialog content is clicked', () => {
    const onClose = vi.fn();
    render(<WhatsNew announcements={mockAnnouncements} open={true} onClose={onClose} />);
    // Click inside the dialog
    fireEvent.click(screen.getByText('New Feature: Bible Versions'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('has proper a11y attributes', () => {
    render(<WhatsNew announcements={mockAnnouncements} open={true} onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'whats-new-title');
  });

  it('renders formatted dates', () => {
    render(<WhatsNew announcements={mockAnnouncements} open={true} onClose={vi.fn()} />);
    // The date should contain "2026" since the test date is Feb 10, 2026
    const timeElements = document.querySelectorAll('time');
    expect(timeElements.length).toBe(2);
    expect(timeElements[0]).toHaveAttribute('dateTime', expect.stringContaining('2026'));
  });
});
