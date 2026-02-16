import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('KeyboardShortcutsHelp', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<KeyboardShortcutsHelp open={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders dialog when open', () => {
    render(<KeyboardShortcutsHelp open={true} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('shortcuts.title')).toBeInTheDocument();
  });

  it('shows action shortcuts', () => {
    render(<KeyboardShortcutsHelp open={true} onClose={vi.fn()} />);
    expect(screen.getByText('shortcuts.actions')).toBeInTheDocument();
    expect(screen.getByText('shortcuts.toggleTheme')).toBeInTheDocument();
    expect(screen.getByText('shortcuts.showShortcuts')).toBeInTheDocument();
  });

  it('shows navigation shortcuts', () => {
    render(<KeyboardShortcutsHelp open={true} onClose={vi.fn()} />);
    expect(screen.getByText('shortcuts.navigation')).toBeInTheDocument();
    expect(screen.getByText('shortcuts.goHome')).toBeInTheDocument();
    expect(screen.getByText('shortcuts.goWeather')).toBeInTheDocument();
    expect(screen.getByText('shortcuts.goBible')).toBeInTheDocument();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsHelp open={true} onClose={onClose} />);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsHelp open={true} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('shortcuts.closeModal'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsHelp open={true} onClose={onClose} />);
    const backdrop = document.querySelector('.bg-black\\/50');
    if (backdrop) fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('has aria-modal attribute on dialog', () => {
    render(<KeyboardShortcutsHelp open={true} onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });
});
