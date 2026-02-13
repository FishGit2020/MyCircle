import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing/react';
import StockSearch from './StockSearch';
import { SEARCH_STOCKS } from '@mycircle/shared';

const mockSearchResults = [
  {
    description: 'APPLE INC',
    displaySymbol: 'AAPL',
    symbol: 'AAPL',
    type: 'Common Stock',
  },
  {
    description: 'APPLIED MATERIALS INC',
    displaySymbol: 'AMAT',
    symbol: 'AMAT',
    type: 'Common Stock',
  },
];

function createSearchMock(query: string, results = mockSearchResults): MockedResponse {
  return {
    request: {
      query: SEARCH_STOCKS,
      variables: { query },
    },
    result: {
      data: { searchStocks: results },
    },
  };
}

// Helper to flush Apollo's async mock delivery
async function flushPromises() {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });
}

describe('StockSearch', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders search input with placeholder', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <StockSearch onSelect={mockOnSelect} />
      </MockedProvider>
    );

    const input = screen.getByPlaceholderText('Search stocks...');
    expect(input).toBeInTheDocument();
  });

  it('displays search results after typing', async () => {
    const mocks = [createSearchMock('AAPL')];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <StockSearch onSelect={mockOnSelect} />
      </MockedProvider>
    );

    const input = screen.getByPlaceholderText('Search stocks...');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'AAPL' } });

    // Advance past debounce
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    // Flush Apollo mock delivery
    await flushPromises();

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('APPLE INC')).toBeInTheDocument();
    });
  });

  it('calls onSelect when a result is clicked', async () => {
    const mocks = [createSearchMock('AAPL')];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <StockSearch onSelect={mockOnSelect} />
      </MockedProvider>
    );

    const input = screen.getByPlaceholderText('Search stocks...');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'AAPL' } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });
    await flushPromises();

    await waitFor(() => {
      expect(screen.getByText('APPLE INC')).toBeInTheDocument();
    });

    const option = screen.getAllByRole('option')[0];
    fireEvent.click(option);

    expect(mockOnSelect).toHaveBeenCalledWith('AAPL', 'APPLE INC');
  });

  it('clears input after selection', async () => {
    const mocks = [createSearchMock('AAPL')];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <StockSearch onSelect={mockOnSelect} />
      </MockedProvider>
    );

    const input = screen.getByPlaceholderText('Search stocks...') as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'AAPL' } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });
    await flushPromises();

    await waitFor(() => {
      expect(screen.getByText('APPLE INC')).toBeInTheDocument();
    });

    const option = screen.getAllByRole('option')[0];
    fireEvent.click(option);

    expect(input.value).toBe('');
  });

  it('debounces search requests', async () => {
    const mocks = [createSearchMock('AAP')];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <StockSearch onSelect={mockOnSelect} />
      </MockedProvider>
    );

    const input = screen.getByPlaceholderText('Search stocks...');
    fireEvent.focus(input);

    // Type characters rapidly
    fireEvent.change(input, { target: { value: 'A' } });
    await act(async () => { vi.advanceTimersByTime(100); });
    fireEvent.change(input, { target: { value: 'AA' } });
    await act(async () => { vi.advanceTimersByTime(100); });
    fireEvent.change(input, { target: { value: 'AAP' } });

    // After debounce timer fires, the query for 'AAP' should execute
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });
    await flushPromises();

    await waitFor(() => {
      expect(screen.getByText('APPLE INC')).toBeInTheDocument();
    });
  });

  it('supports keyboard navigation', async () => {
    const mocks = [createSearchMock('A')];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <StockSearch onSelect={mockOnSelect} />
      </MockedProvider>
    );

    const input = screen.getByPlaceholderText('Search stocks...');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'A' } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });
    await flushPromises();

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument();
    });

    // Arrow down to first item
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    const firstOption = screen.getAllByRole('option')[0];
    expect(firstOption).toHaveAttribute('aria-selected', 'true');

    // Enter to select
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockOnSelect).toHaveBeenCalledWith('AAPL', 'APPLE INC');
  });

  it('shows no results message when search returns empty', async () => {
    const mocks: MockedResponse[] = [createSearchMock('xyz', [])];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <StockSearch onSelect={mockOnSelect} />
      </MockedProvider>
    );

    const input = screen.getByPlaceholderText('Search stocks...');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'xyz' } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });
    await flushPromises();

    await waitFor(() => {
      expect(screen.getByText('No stocks found')).toBeInTheDocument();
    });
  });
});
