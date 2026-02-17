import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

const mockNavigate = vi.fn();

vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

describe('useKeyboardShortcuts', () => {
  let onToggleTheme: ReturnType<typeof vi.fn>;
  let onShowHelp: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onToggleTheme = vi.fn();
    onShowHelp = vi.fn();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Ctrl+D calls onToggleTheme', () => {
    renderHook(() => useKeyboardShortcuts({ onToggleTheme, onShowHelp }));

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'd', ctrlKey: true })
    );

    expect(onToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('? calls onShowHelp', () => {
    renderHook(() => useKeyboardShortcuts({ onToggleTheme, onShowHelp }));

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: '?', ctrlKey: false })
    );

    expect(onShowHelp).toHaveBeenCalledTimes(1);
  });

  it('g then h navigates to /', () => {
    renderHook(() => useKeyboardShortcuts({ onToggleTheme, onShowHelp }));

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'g', ctrlKey: false })
    );
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'h', ctrlKey: false })
    );

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('g then w navigates to /weather', () => {
    renderHook(() => useKeyboardShortcuts({ onToggleTheme, onShowHelp }));

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'g', ctrlKey: false })
    );
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'w', ctrlKey: false })
    );

    expect(mockNavigate).toHaveBeenCalledWith('/weather');
  });

  it('ignores shortcuts when typing in an input element', () => {
    renderHook(() => useKeyboardShortcuts({ onToggleTheme, onShowHelp }));

    const inputEl = document.createElement('input');
    document.body.appendChild(inputEl);
    inputEl.focus();

    inputEl.dispatchEvent(
      new KeyboardEvent('keydown', { key: '?', bubbles: true })
    );

    expect(onShowHelp).not.toHaveBeenCalled();

    document.body.removeChild(inputEl);
  });

  it('go-prefix times out after 1 second', () => {
    vi.useFakeTimers();

    renderHook(() => useKeyboardShortcuts({ onToggleTheme, onShowHelp }));

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'g', ctrlKey: false })
    );

    vi.advanceTimersByTime(1100);

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'h', ctrlKey: false })
    );

    expect(mockNavigate).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('modifier keys block single-key shortcuts (Ctrl+g does not trigger go-prefix)', () => {
    renderHook(() => useKeyboardShortcuts({ onToggleTheme, onShowHelp }));

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'g', ctrlKey: true })
    );
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'h', ctrlKey: false })
    );

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
