import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing/react';
import { GET_EARNINGS_CALENDAR } from '@mycircle/shared';
import EarningsCalendar from './EarningsCalendar';

function getWeekRange(offset: number) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + offset * 7);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(monday), to: fmt(friday) };
}

const { from: thisWeekFrom, to: thisWeekTo } = getWeekRange(0);
const { from: nextWeekFrom, to: nextWeekTo } = getWeekRange(1);

const mockEarnings = [
  {
    date: thisWeekFrom,
    epsActual: null,
    epsEstimate: 1.25,
    revenueActual: null,
    revenueEstimate: 5000000000,
    symbol: 'AAPL',
    hour: 'amc',
    quarter: 1,
    year: 2026,
  },
  {
    date: thisWeekFrom,
    epsActual: 2.1,
    epsEstimate: 1.95,
    revenueActual: 12000000000,
    revenueEstimate: 11500000000,
    symbol: 'MSFT',
    hour: 'bmo',
    quarter: 1,
    year: 2026,
  },
  {
    date: thisWeekTo,
    epsActual: null,
    epsEstimate: 0.8,
    revenueActual: null,
    revenueEstimate: 2000000000,
    symbol: 'GOOGL',
    hour: null,
    quarter: 1,
    year: 2026,
  },
];

function createMock(from: string, to: string, data = mockEarnings) {
  return {
    request: {
      query: GET_EARNINGS_CALENDAR,
      variables: { from, to },
    },
    result: {
      data: { earningsCalendar: data },
    },
  };
}

function createErrorMock(from: string, to: string) {
  return {
    request: {
      query: GET_EARNINGS_CALENDAR,
      variables: { from, to },
    },
    error: new Error('Network error'),
  };
}

describe('EarningsCalendar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeleton initially', () => {
    render(
      <MockedProvider mocks={[createMock(thisWeekFrom, thisWeekTo)]} addTypename={false}>
        <EarningsCalendar />
      </MockedProvider>
    );

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders earnings events after loading', async () => {
    render(
      <MockedProvider mocks={[createMock(thisWeekFrom, thisWeekTo)]} addTypename={false}>
        <EarningsCalendar />
      </MockedProvider>
    );

    expect(await screen.findByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('MSFT')).toBeInTheDocument();
    expect(screen.getByText('GOOGL')).toBeInTheDocument();
  });

  it('shows "This Week" label by default', async () => {
    render(
      <MockedProvider mocks={[createMock(thisWeekFrom, thisWeekTo)]} addTypename={false}>
        <EarningsCalendar />
      </MockedProvider>
    );

    expect(screen.getByText('This Week')).toBeInTheDocument();
  });

  it('shows Before Open / After Close labels', async () => {
    render(
      <MockedProvider mocks={[createMock(thisWeekFrom, thisWeekTo)]} addTypename={false}>
        <EarningsCalendar />
      </MockedProvider>
    );

    expect(await screen.findByText('After Close')).toBeInTheDocument();
    expect(screen.getByText('Before Open')).toBeInTheDocument();
  });

  it('shows EPS estimate and actual with beat highlighting', async () => {
    render(
      <MockedProvider mocks={[createMock(thisWeekFrom, thisWeekTo)]} addTypename={false}>
        <EarningsCalendar />
      </MockedProvider>
    );

    // MSFT beat: actual 2.10 > estimate 1.95
    expect(await screen.findByText('Actual $2.10')).toBeInTheDocument();
    expect(screen.getByText('Est. $1.95')).toBeInTheDocument();
  });

  it('shows quarter and year label', async () => {
    render(
      <MockedProvider mocks={[createMock(thisWeekFrom, thisWeekTo)]} addTypename={false}>
        <EarningsCalendar />
      </MockedProvider>
    );

    await screen.findByText('AAPL');
    const quarterLabels = screen.getAllByText(/Q1 2026/);
    expect(quarterLabels.length).toBeGreaterThan(0);
  });

  it('navigates to next week', async () => {
    render(
      <MockedProvider mocks={[
        createMock(thisWeekFrom, thisWeekTo),
        createMock(nextWeekFrom, nextWeekTo, []),
      ]} addTypename={false}>
        <EarningsCalendar />
      </MockedProvider>
    );

    await screen.findByText('AAPL');

    const nextButton = screen.getByLabelText('Next week');
    await act(async () => {
      await userEvent.click(nextButton);
    });

    expect(await screen.findByText('Next Week')).toBeInTheDocument();
  });

  it('shows empty state when no earnings', async () => {
    render(
      <MockedProvider mocks={[createMock(thisWeekFrom, thisWeekTo, [])]} addTypename={false}>
        <EarningsCalendar />
      </MockedProvider>
    );

    expect(await screen.findByText('No earnings reports this week')).toBeInTheDocument();
  });

  it('shows error message on failure', async () => {
    render(
      <MockedProvider mocks={[createErrorMock(thisWeekFrom, thisWeekTo)]} addTypename={false}>
        <EarningsCalendar />
      </MockedProvider>
    );

    expect(await screen.findByText('Failed to load earnings data')).toBeInTheDocument();
  });

  it('calls onSymbolClick when symbol is clicked', async () => {
    const handleClick = vi.fn();

    render(
      <MockedProvider mocks={[createMock(thisWeekFrom, thisWeekTo)]} addTypename={false}>
        <EarningsCalendar onSymbolClick={handleClick} />
      </MockedProvider>
    );

    const aaplButton = await screen.findByText('AAPL');
    await act(async () => {
      await userEvent.click(aaplButton);
    });

    expect(handleClick).toHaveBeenCalledWith('AAPL');
  });

  it('groups events by date with formatted headers', async () => {
    render(
      <MockedProvider mocks={[createMock(thisWeekFrom, thisWeekTo)]} addTypename={false}>
        <EarningsCalendar />
      </MockedProvider>
    );

    await screen.findByText('AAPL');

    // Should have table elements
    const tables = document.querySelectorAll('[role="table"]');
    expect(tables.length).toBeGreaterThanOrEqual(1);
  });

  it('has accessible table structure', async () => {
    render(
      <MockedProvider mocks={[createMock(thisWeekFrom, thisWeekTo)]} addTypename={false}>
        <EarningsCalendar />
      </MockedProvider>
    );

    await screen.findByText('AAPL');

    const tables = screen.getAllByRole('table');
    expect(tables.length).toBeGreaterThanOrEqual(1);
  });
});
