import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastProvider, useToast } from './Toast';

function TestConsumer() {
  const { addToast, toasts } = useToast();
  return (
    <div>
      <button onClick={() => addToast('Test message', 'success')}>Add Success</button>
      <button onClick={() => addToast('Error msg', 'error')}>Add Error</button>
      <button onClick={() => addToast('Info msg', 'info')}>Add Info</button>
      <button onClick={() => addToast('Warning msg', 'warning')}>Add Warning</button>
      <span data-testid="count">{toasts.length}</span>
    </div>
  );
}

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders children without toasts initially', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );
    expect(screen.getByTestId('count').textContent).toBe('0');
  });

  it('adds a toast and displays it', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Add Success'));

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('adds multiple toasts', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Add Success'));
    fireEvent.click(screen.getByText('Add Error'));

    expect(screen.getAllByRole('alert')).toHaveLength(2);
  });

  it('removes toast when dismiss button is clicked', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Add Success'));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Click dismiss
    fireEvent.click(screen.getByLabelText('Dismiss'));

    // After exit animation (300ms)
    act(() => { vi.advanceTimersByTime(300); });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('auto-dismisses toast after duration', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Add Info'));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Default duration 3000ms + 300ms exit animation
    act(() => { vi.advanceTimersByTime(3300); });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('useToast outside provider', () => {
  it('returns safe defaults when used outside ToastProvider', () => {
    function Standalone() {
      const { addToast, toasts } = useToast();
      return (
        <div>
          <button onClick={() => addToast('test')}>Add</button>
          <span data-testid="count">{toasts.length}</span>
        </div>
      );
    }

    render(<Standalone />);
    expect(screen.getByTestId('count').textContent).toBe('0');

    // Should not throw
    fireEvent.click(screen.getByText('Add'));
    expect(screen.getByTestId('count').textContent).toBe('0');
  });
});
