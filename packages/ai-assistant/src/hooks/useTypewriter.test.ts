import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTypewriter } from './useTypewriter';

describe('useTypewriter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns full text immediately when disabled', () => {
    const { result } = renderHook(() =>
      useTypewriter({ text: 'Hello world foo', enabled: false })
    );
    expect(result.current.displayedText).toBe('Hello world foo');
    expect(result.current.isTyping).toBe(false);
  });

  it('reveals text word by word when enabled', () => {
    const { result } = renderHook(() =>
      useTypewriter({ text: 'One Two Three', speed: 50, enabled: true })
    );

    // Initially empty
    expect(result.current.displayedText).toBe('');
    expect(result.current.isTyping).toBe(false);

    // After first tick
    act(() => { vi.advanceTimersByTime(50); });
    expect(result.current.displayedText).toBe('One');
    expect(result.current.isTyping).toBe(true);

    // After second tick
    act(() => { vi.advanceTimersByTime(50); });
    expect(result.current.displayedText).toBe('One Two');

    // After third tick — complete
    act(() => { vi.advanceTimersByTime(50); });
    expect(result.current.displayedText).toBe('One Two Three');
    expect(result.current.isTyping).toBe(false);
  });

  it('shows empty string for empty text', () => {
    const { result } = renderHook(() =>
      useTypewriter({ text: '', enabled: true })
    );
    expect(result.current.displayedText).toBe('');
    expect(result.current.isTyping).toBe(false);
  });

  it('resets when text changes', () => {
    const { result, rerender } = renderHook(
      ({ text }) => useTypewriter({ text, speed: 30, enabled: true }),
      { initialProps: { text: 'Hello world' } }
    );

    // Reveal first word
    act(() => { vi.advanceTimersByTime(30); });
    expect(result.current.displayedText).toBe('Hello');

    // Change text
    rerender({ text: 'New message here' });

    // Should reset and start from beginning
    act(() => { vi.advanceTimersByTime(30); });
    expect(result.current.displayedText).toBe('New');
  });
});
