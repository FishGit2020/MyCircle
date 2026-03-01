import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MonitorRecentLogs from './MonitorRecentLogs';

const mockLogs = [
  {
    id: 'log-1',
    timestamp: '2026-03-01T10:00:00Z',
    provider: 'ollama',
    model: 'gemma2:2b',
    inputTokens: 200,
    outputTokens: 100,
    latencyMs: 800,
    toolCalls: [{ name: 'getWeather', durationMs: 300, error: null }],
    questionPreview: 'Weather in Tokyo?',
    answerPreview: 'It is sunny in Tokyo.',
    status: 'success',
    error: null,
  },
  {
    id: 'log-2',
    timestamp: '2026-03-01T09:30:00Z',
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    inputTokens: 500,
    outputTokens: 200,
    latencyMs: 3500,
    toolCalls: [],
    questionPreview: 'Tell me a joke',
    answerPreview: 'Why did the developer quit?',
    status: 'success',
    error: null,
  },
  {
    id: 'log-3',
    timestamp: '2026-03-01T09:00:00Z',
    provider: 'ollama',
    model: 'gemma2:2b',
    inputTokens: 100,
    outputTokens: 0,
    latencyMs: 6000,
    toolCalls: [],
    questionPreview: 'Broken request',
    answerPreview: '',
    status: 'error',
    error: 'Model timeout',
  },
];

describe('MonitorRecentLogs', () => {
  it('renders loading skeleton when loading with no data', () => {
    const { container } = render(<MonitorRecentLogs logs={undefined} loading={true} />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('shows no-logs message when empty', () => {
    render(<MonitorRecentLogs logs={[]} loading={false} />);
    expect(screen.getByText('No logs yet')).toBeInTheDocument();
  });

  it('renders all log entries', () => {
    render(<MonitorRecentLogs logs={mockLogs} loading={false} />);
    expect(screen.getByText('Weather in Tokyo?')).toBeInTheDocument();
    expect(screen.getByText('Tell me a joke')).toBeInTheDocument();
    expect(screen.getByText('Broken request')).toBeInTheDocument();
  });

  it('displays provider badges correctly', () => {
    render(<MonitorRecentLogs logs={mockLogs} loading={false} />);
    const ollamaBadges = screen.getAllByText('ollama');
    const geminiBadges = screen.getAllByText('gemini');
    expect(ollamaBadges.length).toBe(2);
    expect(geminiBadges.length).toBe(1);
  });

  it('shows latency with correct color coding (green < 2s)', () => {
    render(<MonitorRecentLogs logs={mockLogs} loading={false} />);
    // 0.8s should be green
    const fastLatency = screen.getByText('0.8s');
    expect(fastLatency.className).toContain('text-green');
  });

  it('shows latency with yellow for 2-5s range', () => {
    render(<MonitorRecentLogs logs={mockLogs} loading={false} />);
    const medLatency = screen.getByText('3.5s');
    expect(medLatency.className).toContain('text-yellow');
  });

  it('shows latency with red for >5s', () => {
    render(<MonitorRecentLogs logs={mockLogs} loading={false} />);
    const slowLatency = screen.getByText('6.0s');
    expect(slowLatency.className).toContain('text-red');
  });

  it('expands and collapses log details on click', async () => {
    const user = userEvent.setup();
    render(<MonitorRecentLogs logs={mockLogs} loading={false} />);

    // Initially not expanded
    expect(screen.queryByText('It is sunny in Tokyo.')).not.toBeInTheDocument();

    // Click to expand first log
    const buttons = screen.getAllByRole('button');
    await user.click(buttons[0]);

    // Now shows expanded details
    expect(screen.getByText('It is sunny in Tokyo.')).toBeInTheDocument();
    // getWeather appears in both chip and expanded details
    const weatherTexts = screen.getAllByText('getWeather');
    expect(weatherTexts.length).toBe(2);

    // Click again to collapse
    await user.click(buttons[0]);
    expect(screen.queryByText('It is sunny in Tokyo.')).not.toBeInTheDocument();
  });

  it('shows error status icon for failed logs', () => {
    render(<MonitorRecentLogs logs={mockLogs} loading={false} />);
    // Error log should have ✗ symbol
    const errorIcons = screen.getAllByTitle('Error');
    expect(errorIcons.length).toBe(1);
  });

  it('shows success status icons for successful logs', () => {
    render(<MonitorRecentLogs logs={mockLogs} loading={false} />);
    const successIcons = screen.getAllByTitle('Success');
    expect(successIcons.length).toBe(2);
  });

  it('sets aria-expanded on expandable buttons', async () => {
    const user = userEvent.setup();
    render(<MonitorRecentLogs logs={mockLogs} loading={false} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveAttribute('aria-expanded', 'false');

    await user.click(buttons[0]);
    expect(buttons[0]).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows tool call chips for logs with tools', () => {
    render(<MonitorRecentLogs logs={mockLogs} loading={false} />);
    // First log has getWeather tool call — chip shows tool name in collapsed row
    const chips = screen.getAllByText('getWeather');
    expect(chips.length).toBeGreaterThanOrEqual(1);
  });
});
