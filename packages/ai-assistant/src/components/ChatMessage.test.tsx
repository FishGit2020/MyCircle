import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChatMessage from './ChatMessage';
import type { ChatMessage as ChatMessageType } from '../hooks/useAiChat';

// Mock child components to isolate tests
vi.mock('./MarkdownText', () => ({
  default: ({ content }: { content: string }) => <div data-testid="markdown-text">{content}</div>,
}));

vi.mock('./ToolCallDisplay', () => ({
  default: ({ toolCalls, debugMode }: { toolCalls: unknown[]; debugMode?: boolean }) => (
    <div data-testid="tool-call-display" data-debug={debugMode}>
      {toolCalls.length} tool calls
    </div>
  ),
}));

describe('ChatMessage', () => {
  const userMessage: ChatMessageType = {
    id: 'msg-1',
    role: 'user',
    content: 'What is the weather?',
    timestamp: Date.now(),
  };

  const assistantMessage: ChatMessageType = {
    id: 'msg-2',
    role: 'assistant',
    content: 'The weather is sunny today.',
    timestamp: Date.now(),
  };

  const assistantWithTools: ChatMessageType = {
    id: 'msg-3',
    role: 'assistant',
    content: 'Here is the weather for Tokyo.',
    toolCalls: [{ name: 'getWeather', args: { city: 'Tokyo' } }],
    timestamp: Date.now(),
  };

  it('renders user message content as plain text', () => {
    render(<ChatMessage message={userMessage} />);
    expect(screen.getByText('What is the weather?')).toBeInTheDocument();
  });

  it('shows "You" label for user messages', () => {
    render(<ChatMessage message={userMessage} />);
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('shows "AI" label for assistant messages', () => {
    render(<ChatMessage message={assistantMessage} />);
    expect(screen.getByText('AI')).toBeInTheDocument();
  });

  it('renders assistant message with MarkdownText', () => {
    render(<ChatMessage message={assistantMessage} />);
    expect(screen.getByTestId('markdown-text')).toBeInTheDocument();
    expect(screen.getByTestId('markdown-text')).toHaveTextContent('The weather is sunny today.');
  });

  it('does not render MarkdownText for user messages', () => {
    render(<ChatMessage message={userMessage} />);
    expect(screen.queryByTestId('markdown-text')).not.toBeInTheDocument();
  });

  it('shows copy button for assistant messages', () => {
    render(<ChatMessage message={assistantMessage} />);
    expect(screen.getByRole('button', { name: 'Copy message' })).toBeInTheDocument();
  });

  it('does not show copy button for user messages', () => {
    render(<ChatMessage message={userMessage} />);
    expect(screen.queryByRole('button', { name: 'Copy message' })).not.toBeInTheDocument();
  });

  it('renders tool calls when present on assistant message', () => {
    render(<ChatMessage message={assistantWithTools} />);
    expect(screen.getByTestId('tool-call-display')).toBeInTheDocument();
    expect(screen.getByTestId('tool-call-display')).toHaveTextContent('1 tool calls');
  });

  it('does not render tool call display when no tool calls', () => {
    render(<ChatMessage message={assistantMessage} />);
    expect(screen.queryByTestId('tool-call-display')).not.toBeInTheDocument();
  });

  it('passes debugMode to ToolCallDisplay', () => {
    render(<ChatMessage message={assistantWithTools} debugMode={true} />);
    expect(screen.getByTestId('tool-call-display')).toHaveAttribute('data-debug', 'true');
  });

  it('renders with role="listitem"', () => {
    render(<ChatMessage message={userMessage} />);
    expect(screen.getByRole('listitem')).toBeInTheDocument();
  });

  it('applies user message styling (justify-end)', () => {
    render(<ChatMessage message={userMessage} />);
    const listitem = screen.getByRole('listitem');
    expect(listitem.className).toContain('justify-end');
  });

  it('applies assistant message styling (justify-start)', () => {
    render(<ChatMessage message={assistantMessage} />);
    const listitem = screen.getByRole('listitem');
    expect(listitem.className).toContain('justify-start');
  });
});
