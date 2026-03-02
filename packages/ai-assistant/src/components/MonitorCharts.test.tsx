import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MonitorCharts from './MonitorCharts';

const dailyBreakdown = [
  { date: '2026-02-28', calls: 20, avgLatencyMs: 1200, tokens: 8000, errors: 1 },
  { date: '2026-03-01', calls: 22, avgLatencyMs: 1800, tokens: 7000, errors: 1 },
  { date: '2026-03-02', calls: 10, avgLatencyMs: 4500, tokens: 3000, errors: 0 },
];

describe('MonitorCharts', () => {
  it('shows no-data message when dailyBreakdown is undefined', () => {
    render(<MonitorCharts />);
    expect(screen.getByText('No data available for charts')).toBeInTheDocument();
  });

  it('shows no-data message when dailyBreakdown is empty', () => {
    render(<MonitorCharts dailyBreakdown={[]} />);
    expect(screen.getByText('No data available for charts')).toBeInTheDocument();
  });

  it('renders calls-per-day chart label', () => {
    render(<MonitorCharts dailyBreakdown={dailyBreakdown} />);
    expect(screen.getByText('Calls Per Day')).toBeInTheDocument();
  });

  it('renders latency trend chart label', () => {
    render(<MonitorCharts dailyBreakdown={dailyBreakdown} />);
    expect(screen.getByText('Latency Trend')).toBeInTheDocument();
  });

  it('renders bar elements for each day in calls chart', () => {
    const { container } = render(<MonitorCharts dailyBreakdown={dailyBreakdown} />);
    // Each day creates a bar with title containing date and calls
    const bars = container.querySelectorAll('[title*="calls"]');
    expect(bars.length).toBe(3);
  });

  it('renders latency dots for each day', () => {
    const { container } = render(<MonitorCharts dailyBreakdown={dailyBreakdown} />);
    // Latency dots have rounded-full class
    const dots = container.querySelectorAll('.rounded-full');
    expect(dots.length).toBe(3);
  });

  it('uses green color for fast latency (<2000ms)', () => {
    const { container } = render(<MonitorCharts dailyBreakdown={dailyBreakdown} />);
    // 1200ms and 1800ms should both have green class
    const greenDots = container.querySelectorAll('.bg-green-400');
    expect(greenDots.length).toBeGreaterThanOrEqual(1);
  });

  it('uses yellow color for medium latency (2000-5000ms)', () => {
    const { container } = render(<MonitorCharts dailyBreakdown={dailyBreakdown} />);
    // 4500ms should have yellow class
    const yellowDots = container.querySelectorAll('.bg-yellow-400');
    expect(yellowDots.length).toBeGreaterThanOrEqual(1);
  });

  it('renders day labels', () => {
    render(<MonitorCharts dailyBreakdown={dailyBreakdown} />);
    // Day labels are abbreviated weekday names rendered in both charts
    const dayLabels = screen.getAllByText(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/);
    expect(dayLabels.length).toBeGreaterThanOrEqual(3);
  });
});
