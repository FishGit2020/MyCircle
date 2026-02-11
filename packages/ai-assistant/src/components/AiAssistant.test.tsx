import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import AiAssistant from './AiAssistant';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock useAiChat at module level to avoid import issues
vi.mock('../hooks/useAiChat', () => {
  const mockSendMessage = vi.fn();
  const mockClearChat = vi.fn();
  return {
    useAiChat: vi.fn(() => ({
      messages: [],
      loading: false,
      error: null,
      sendMessage: mockSendMessage,
      clearChat: mockClearChat,
    })),
    __mockSendMessage: mockSendMessage,
    __mockClearChat: mockClearChat,
  };
});

import { useAiChat } from '../hooks/useAiChat';
const mockUseAiChat = vi.mocked(useAiChat);

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <MemoryRouter>{ui}</MemoryRouter>
  );
};

describe('AiAssistant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAiChat.mockReturnValue({
      messages: [],
      loading: false,
      error: null,
      sendMessage: vi.fn(),
      clearChat: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the AI assistant title', () => {
    renderWithProviders(<AiAssistant />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('AI Assistant');
  });

  it('renders the chat input', () => {
    renderWithProviders(<AiAssistant />);
    expect(screen.getByPlaceholderText('Ask me about weather, stocks, or anything...')).toBeInTheDocument();
  });

  it('shows empty state when no messages', () => {
    renderWithProviders(<AiAssistant />);
    expect(screen.getByText('Start a conversation')).toBeInTheDocument();
  });

  it('renders messages when present', () => {
    mockUseAiChat.mockReturnValue({
      messages: [
        { id: '1', role: 'user', content: 'What is the weather?', timestamp: Date.now() },
        { id: '2', role: 'assistant', content: 'The weather is sunny.', timestamp: Date.now() },
      ],
      loading: false,
      error: null,
      sendMessage: vi.fn(),
      clearChat: vi.fn(),
    });

    renderWithProviders(<AiAssistant />);
    expect(screen.getByText('What is the weather?')).toBeInTheDocument();
    expect(screen.getByText('The weather is sunny.')).toBeInTheDocument();
  });

  it('shows loading indicator when processing', () => {
    mockUseAiChat.mockReturnValue({
      messages: [{ id: '1', role: 'user', content: 'Hello', timestamp: Date.now() }],
      loading: true,
      error: null,
      sendMessage: vi.fn(),
      clearChat: vi.fn(),
    });

    renderWithProviders(<AiAssistant />);
    expect(screen.getByText('Thinking...')).toBeInTheDocument();
  });

  it('shows error message when present', () => {
    mockUseAiChat.mockReturnValue({
      messages: [],
      loading: false,
      error: 'Something went wrong',
      sendMessage: vi.fn(),
      clearChat: vi.fn(),
    });

    renderWithProviders(<AiAssistant />);
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
  });

  it('shows clear chat button when messages exist', () => {
    mockUseAiChat.mockReturnValue({
      messages: [{ id: '1', role: 'user', content: 'Hello', timestamp: Date.now() }],
      loading: false,
      error: null,
      sendMessage: vi.fn(),
      clearChat: vi.fn(),
    });

    renderWithProviders(<AiAssistant />);
    expect(screen.getByText('Clear chat')).toBeInTheDocument();
  });

  it('does not show clear chat button when no messages', () => {
    renderWithProviders(<AiAssistant />);
    expect(screen.queryByText('Clear chat')).not.toBeInTheDocument();
  });

  it('calls sendMessage when form is submitted', async () => {
    const mockSend = vi.fn();
    mockUseAiChat.mockReturnValue({
      messages: [],
      loading: false,
      error: null,
      sendMessage: mockSend,
      clearChat: vi.fn(),
    });

    const user = userEvent.setup();
    renderWithProviders(<AiAssistant />);

    const input = screen.getByPlaceholderText('Ask me about weather, stocks, or anything...');
    await user.type(input, 'Hello{Enter}');

    expect(mockSend).toHaveBeenCalledWith('Hello');
  });

  it('displays tool calls on assistant messages', () => {
    mockUseAiChat.mockReturnValue({
      messages: [
        {
          id: '1',
          role: 'assistant',
          content: 'The weather in Tokyo is sunny.',
          toolCalls: [{ name: 'getWeather', args: { city: 'Tokyo' } }],
          timestamp: Date.now(),
        },
      ],
      loading: false,
      error: null,
      sendMessage: vi.fn(),
      clearChat: vi.fn(),
    });

    renderWithProviders(<AiAssistant />);
    expect(screen.getByText('Weather lookup')).toBeInTheDocument();
    expect(screen.getByText('(Tokyo)')).toBeInTheDocument();
  });

  it('has accessible chat messages container', () => {
    renderWithProviders(<AiAssistant />);
    const chatArea = screen.getByRole('list', { name: 'Chat messages' });
    expect(chatArea).toBeInTheDocument();
    expect(chatArea).toHaveAttribute('aria-live', 'polite');
  });

  it('does not show scrollbar on empty chat (overflow-hidden)', () => {
    renderWithProviders(<AiAssistant />);
    const chatArea = screen.getByRole('list', { name: 'Chat messages' });
    expect(chatArea.className).toContain('overflow-hidden');
    expect(chatArea.className).not.toContain('overflow-y-auto');
  });

  it('shows scrollbar when messages are present (overflow-y-auto)', () => {
    mockUseAiChat.mockReturnValue({
      messages: [{ id: '1', role: 'user', content: 'Hello', timestamp: Date.now() }],
      loading: false,
      error: null,
      sendMessage: vi.fn(),
      clearChat: vi.fn(),
    });

    renderWithProviders(<AiAssistant />);
    const chatArea = screen.getByRole('list', { name: 'Chat messages' });
    expect(chatArea.className).toContain('overflow-y-auto');
    expect(chatArea.className).not.toContain('overflow-hidden');
  });
});
