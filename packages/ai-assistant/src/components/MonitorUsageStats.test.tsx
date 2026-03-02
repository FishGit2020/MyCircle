import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MonitorUsageStats from './MonitorUsageStats';

const mockUsage = {
  totalCalls: 42,
  totalInputTokens: 10000,
  totalOutputTokens: 5000,
  ollamaCalls: 30,
  geminiCalls: 12,
  avgLatencyMs: 1500,
  errorRate: 0.048,
};

describe('MonitorUsageStats', () => {
  it('shows skeleton cards when loading with no usage data', () => {
    const { container } = render(<MonitorUsageStats loading={true} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(6);
  });

  it('renders nothing when not loading and no usage data', () => {
    const { container } = render(<MonitorUsageStats loading={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders total calls stat', () => {
    render(<MonitorUsageStats usage={mockUsage} loading={false} />);
    expect(screen.getByText('Total Calls')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders input tokens with K formatting', () => {
    render(<MonitorUsageStats usage={mockUsage} loading={false} />);
    expect(screen.getByText('Input Tokens')).toBeInTheDocument();
    expect(screen.getByText('10.0K')).toBeInTheDocument();
  });

  it('renders output tokens with K formatting', () => {
    render(<MonitorUsageStats usage={mockUsage} loading={false} />);
    expect(screen.getByText('Output Tokens')).toBeInTheDocument();
    expect(screen.getByText('5.0K')).toBeInTheDocument();
  });

  it('renders ollama/gemini split', () => {
    render(<MonitorUsageStats usage={mockUsage} loading={false} />);
    expect(screen.getByText('30 / 12')).toBeInTheDocument();
  });

  it('renders average latency in seconds', () => {
    render(<MonitorUsageStats usage={mockUsage} loading={false} />);
    expect(screen.getByText('Avg Latency')).toBeInTheDocument();
    expect(screen.getByText('1.5s')).toBeInTheDocument();
  });

  it('renders error rate as percentage', () => {
    render(<MonitorUsageStats usage={mockUsage} loading={false} />);
    expect(screen.getByText('Error Rate')).toBeInTheDocument();
    expect(screen.getByText('4.8%')).toBeInTheDocument();
  });

  it('renders all 6 stat cards', () => {
    render(<MonitorUsageStats usage={mockUsage} loading={false} />);
    const grid = screen.getByText('42').closest('.grid');
    expect(grid).toBeInTheDocument();
    // Count direct children (stat cards)
    expect(grid!.children.length).toBe(6);
  });

  it('formats millions correctly', () => {
    const bigUsage = { ...mockUsage, totalInputTokens: 2500000 };
    render(<MonitorUsageStats usage={bigUsage} loading={false} />);
    expect(screen.getByText('2.5M')).toBeInTheDocument();
  });

  it('still shows data while loading if usage is available', () => {
    render(<MonitorUsageStats usage={mockUsage} loading={true} />);
    // Should show data, not skeletons
    expect(screen.getByText('42')).toBeInTheDocument();
  });
});
