import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ToolCallDisplay from './ToolCallDisplay';
import type { ToolCall } from '../hooks/useAiChat';

describe('ToolCallDisplay', () => {
  const basicToolCalls: ToolCall[] = [
    { name: 'getWeather', args: { city: 'Tokyo' }, result: '{"temp": 22}' },
    { name: 'getStockQuote', args: { symbol: 'AAPL' }, result: '{"price": 180}' },
  ];

  it('renders tool call buttons with translated names', () => {
    render(<ToolCallDisplay toolCalls={basicToolCalls} />);
    expect(screen.getByText('Weather lookup')).toBeInTheDocument();
    expect(screen.getByText('Stock quote')).toBeInTheDocument();
  });

  it('shows tool call arguments in button', () => {
    render(<ToolCallDisplay toolCalls={basicToolCalls} />);
    expect(screen.getByText('(Tokyo)')).toBeInTheDocument();
    expect(screen.getByText('(AAPL)')).toBeInTheDocument();
  });

  it('returns null for empty tool calls', () => {
    const { container } = render(<ToolCallDisplay toolCalls={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('expands tool call details on click', async () => {
    const user = userEvent.setup({ delay: null });
    render(<ToolCallDisplay toolCalls={basicToolCalls} />);

    // Initially collapsed
    expect(screen.queryByText('Arguments')).not.toBeInTheDocument();

    // Click the first tool call button
    await user.click(screen.getByText('Weather lookup'));

    // Should show args details
    expect(screen.getByText('Arguments')).toBeInTheDocument();
    expect(screen.getByText('Result')).toBeInTheDocument();
  });

  it('collapses tool call details on second click', async () => {
    const user = userEvent.setup({ delay: null });
    render(<ToolCallDisplay toolCalls={basicToolCalls} />);

    await user.click(screen.getByText('Weather lookup'));
    expect(screen.getByText('Arguments')).toBeInTheDocument();

    await user.click(screen.getByText('Weather lookup'));
    expect(screen.queryByText('Arguments')).not.toBeInTheDocument();
  });

  it('shows all tool calls expanded in debugMode', () => {
    render(<ToolCallDisplay toolCalls={basicToolCalls} debugMode={true} />);
    // In debug mode, all are expanded
    const argsLabels = screen.getAllByText('Arguments');
    expect(argsLabels.length).toBe(2);
    const resultLabels = screen.getAllByText('Result');
    expect(resultLabels.length).toBe(2);
  });

  it('shows no-result message when result is undefined', () => {
    const toolCalls: ToolCall[] = [
      { name: 'getWeather', args: { city: 'Tokyo' } },
    ];
    render(<ToolCallDisplay toolCalls={toolCalls} debugMode={true} />);
    expect(screen.getByText('No result returned')).toBeInTheDocument();
  });

  it('shows no-result message when result is empty string', () => {
    const toolCalls: ToolCall[] = [
      { name: 'getWeather', args: { city: 'Tokyo' }, result: '' },
    ];
    render(<ToolCallDisplay toolCalls={toolCalls} debugMode={true} />);
    expect(screen.getByText('No result returned')).toBeInTheDocument();
  });

  it('renders generic label for unknown tool names', () => {
    const toolCalls: ToolCall[] = [
      { name: 'unknownTool', args: {} },
    ];
    render(<ToolCallDisplay toolCalls={toolCalls} />);
    expect(screen.getByText('Tool')).toBeInTheDocument();
  });

  it('sets aria-expanded correctly', async () => {
    const user = userEvent.setup({ delay: null });
    render(<ToolCallDisplay toolCalls={basicToolCalls} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveAttribute('aria-expanded', 'false');

    await user.click(buttons[0]);
    expect(buttons[0]).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders with list role and items', () => {
    render(<ToolCallDisplay toolCalls={basicToolCalls} />);
    expect(screen.getByRole('list', { name: 'Tools used' })).toBeInTheDocument();
    const items = screen.getAllByRole('listitem');
    expect(items.length).toBe(2);
  });

  it('does not show args section when args is empty', () => {
    const toolCalls: ToolCall[] = [
      { name: 'getCryptoPrices', args: {}, result: '{"btc": 95000}' },
    ];
    render(<ToolCallDisplay toolCalls={toolCalls} debugMode={true} />);
    // No args section since args is empty object
    expect(screen.queryByText('Arguments')).not.toBeInTheDocument();
    // But result should still show
    expect(screen.getByText('Result')).toBeInTheDocument();
  });
});
