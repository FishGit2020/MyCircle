import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import ChatInput from './ChatInput';

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <MemoryRouter>{ui}</MemoryRouter>
  );
};

describe('ChatInput', () => {
  it('renders textarea with placeholder', () => {
    renderWithProviders(<ChatInput onSend={vi.fn()} />);
    expect(screen.getByPlaceholderText('Ask me about weather, stocks, or anything...')).toBeInTheDocument();
  });

  it('renders send button', () => {
    renderWithProviders(<ChatInput onSend={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Send message' })).toBeInTheDocument();
  });

  it('calls onSend when Enter is pressed', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<ChatInput onSend={onSend} />);

    const input = screen.getByPlaceholderText('Ask me about weather, stocks, or anything...');
    await user.type(input, 'Hello{Enter}');

    expect(onSend).toHaveBeenCalledWith('Hello');
  });

  it('does not send empty messages', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<ChatInput onSend={onSend} />);

    const input = screen.getByPlaceholderText('Ask me about weather, stocks, or anything...');
    await user.type(input, '{Enter}');

    expect(onSend).not.toHaveBeenCalled();
  });

  it('clears input after sending', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<ChatInput onSend={onSend} />);

    const input = screen.getByPlaceholderText('Ask me about weather, stocks, or anything...') as HTMLTextAreaElement;
    await user.type(input, 'Hello{Enter}');

    expect(input.value).toBe('');
  });

  it('disables input when disabled prop is true', () => {
    renderWithProviders(<ChatInput onSend={vi.fn()} disabled />);
    expect(screen.getByPlaceholderText('Ask me about weather, stocks, or anything...')).toBeDisabled();
  });

  it('allows Shift+Enter for newlines without sending', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<ChatInput onSend={onSend} />);

    const input = screen.getByPlaceholderText('Ask me about weather, stocks, or anything...');
    await user.type(input, 'Line 1{Shift>}{Enter}{/Shift}Line 2');

    expect(onSend).not.toHaveBeenCalled();
  });

  it('has accessible label', () => {
    renderWithProviders(<ChatInput onSend={vi.fn()} />);
    expect(screen.getByLabelText('Ask me about weather, stocks, or anything...')).toBeInTheDocument();
  });
});

describe('ChatInput - Voice Input', () => {
  let lastInstance: {
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    abort: ReturnType<typeof vi.fn>;
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((event: unknown) => void) | null;
    onend: (() => void) | null;
    onerror: (() => void) | null;
  };

  beforeEach(() => {
    // Use a real class so `new` works
    (window as unknown as Record<string, unknown>).SpeechRecognition = class {
      start = vi.fn();
      stop = vi.fn();
      abort = vi.fn();
      continuous = false;
      interimResults = false;
      lang = '';
      onresult: ((event: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor() {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        lastInstance = this;
      }
    };
  });

  afterEach(() => {
    delete (window as unknown as Record<string, unknown>).SpeechRecognition;
    vi.restoreAllMocks();
  });

  it('renders voice input button when SpeechRecognition is available', () => {
    renderWithProviders(<ChatInput onSend={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Voice input' })).toBeInTheDocument();
  });

  it('starts listening when voice button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatInput onSend={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Voice input' }));

    expect(lastInstance.start).toHaveBeenCalled();
  });

  it('populates textarea with transcript on recognition result', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatInput onSend={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Voice input' }));

    // Simulate a speech recognition result (wrapped in act for state updates)
    const event = {
      results: [[{ transcript: 'hello world' }]],
    };
    act(() => {
      lastInstance.onresult?.(event);
      lastInstance.onend?.();
    });

    const textarea = screen.getByPlaceholderText('Ask me about weather, stocks, or anything...') as HTMLTextAreaElement;
    expect(textarea.value).toBe('hello world');
  });

  it('shows listening state with aria-label change', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatInput onSend={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Voice input' }));

    expect(screen.getByRole('button', { name: 'Listening...' })).toBeInTheDocument();
  });

  it('disables voice button when disabled prop is true', () => {
    renderWithProviders(<ChatInput onSend={vi.fn()} disabled />);
    expect(screen.getByRole('button', { name: 'Voice input' })).toBeDisabled();
  });
});
