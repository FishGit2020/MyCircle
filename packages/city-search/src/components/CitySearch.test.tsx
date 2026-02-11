import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { MockedProvider } from '@apollo/client/testing/react';
import CitySearch from './CitySearch';
import { SEARCH_CITIES } from '@weather/shared';

const mockNavigate = vi.fn();

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockCities = [
  {
    id: '51.5074,-0.1278',
    name: 'London',
    country: 'GB',
    state: 'England',
    lat: 51.5074,
    lon: -0.1278,
  },
  {
    id: '51.5142,-0.0931',
    name: 'London Bridge',
    country: 'GB',
    state: null,
    lat: 51.5142,
    lon: -0.0931,
  },
];

const mocks = [
  {
    request: {
      query: SEARCH_CITIES,
      variables: { query: 'London', limit: 5 },
    },
    result: {
      data: {
        searchCities: mockCities,
      },
    },
  },
  {
    request: {
      query: SEARCH_CITIES,
      variables: { query: 'Pa', limit: 5 },
    },
    result: {
      data: {
        searchCities: [
          {
            id: '48.8566,2.3522',
            name: 'Paris',
            country: 'FR',
            state: null,
            lat: 48.8566,
            lon: 2.3522,
          },
        ],
      },
    },
  },
  {
    request: {
      query: SEARCH_CITIES,
      variables: { query: 'xyznonexistent', limit: 5 },
    },
    result: {
      data: {
        searchCities: [],
      },
    },
  },
];

const renderWithProviders = (ui: React.ReactElement, apolloMocks = mocks) => {
  return render(
    <MemoryRouter>
      <MockedProvider mocks={apolloMocks} addTypename={false}>
        {ui}
      </MockedProvider>
    </MemoryRouter>
  );
};

describe('CitySearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders search input', () => {
    renderWithProviders(<CitySearch />);

    expect(screen.getByPlaceholderText('Search for a city...')).toBeInTheDocument();
  });

  it('renders micro frontend badge', () => {
    renderWithProviders(<CitySearch />);

    expect(screen.getByText('City Search Micro Frontend')).toBeInTheDocument();
  });

  it('does not search with less than 2 characters', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<CitySearch />);

    const input = screen.getByPlaceholderText('Search for a city...');
    await user.type(input, 'L');

    vi.advanceTimersByTime(500);

    // No loading skeleton should appear for single character
    expect(document.querySelector('.animate-pulse')).not.toBeInTheDocument();
  });

  it('shows loading state while searching', async () => {
    renderWithProviders(<CitySearch />);

    const input = screen.getByPlaceholderText('Search for a city...');
    fireEvent.change(input, { target: { value: 'London' } });

    await vi.advanceTimersByTimeAsync(300);

    await waitFor(() => {
      // Component shows skeleton loading cards (animate-pulse divs) during search
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  it('displays search results', async () => {
    renderWithProviders(<CitySearch />);

    const input = screen.getByPlaceholderText('Search for a city...');
    fireEvent.change(input, { target: { value: 'London' } });

    await vi.advanceTimersByTimeAsync(300);

    await waitFor(() => {
      expect(screen.getByText('London')).toBeInTheDocument();
      expect(screen.getByText('England, GB')).toBeInTheDocument();
    });
  });

  it('navigates to weather page when city is clicked', async () => {
    renderWithProviders(<CitySearch />);

    const input = screen.getByPlaceholderText('Search for a city...');
    fireEvent.change(input, { target: { value: 'London' } });

    await vi.advanceTimersByTimeAsync(300);

    await waitFor(() => {
      expect(screen.getByText('London')).toBeInTheDocument();
    });

    const cityButton = screen.getAllByRole('option', { name: /London/i })[0];
    fireEvent.click(cityButton);

    expect(mockNavigate).toHaveBeenCalledWith(
      '/weather/51.5074,-0.1278?name=London'
    );
  });

  it('calls onCitySelect callback when provided', async () => {
    const onCitySelect = vi.fn();
    renderWithProviders(<CitySearch onCitySelect={onCitySelect} />);

    const input = screen.getByPlaceholderText('Search for a city...');
    fireEvent.change(input, { target: { value: 'London' } });

    await vi.advanceTimersByTimeAsync(300);

    await waitFor(() => {
      expect(screen.getByText('London')).toBeInTheDocument();
    });

    const cityButton = screen.getAllByRole('option', { name: /London/i })[0];
    fireEvent.click(cityButton);

    expect(onCitySelect).toHaveBeenCalledWith(mockCities[0]);
  });

  it('clears input and results after city selection', async () => {
    renderWithProviders(<CitySearch />);

    const input = screen.getByPlaceholderText('Search for a city...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'London' } });

    await vi.advanceTimersByTimeAsync(300);

    await waitFor(() => {
      expect(screen.getByText('London')).toBeInTheDocument();
    });

    const cityButton = screen.getAllByRole('option', { name: /London/i })[0];
    fireEvent.click(cityButton);

    expect(input.value).toBe('');
  });

  it('shows "No cities found" when search returns empty results', async () => {
    renderWithProviders(<CitySearch />);

    const input = screen.getByPlaceholderText('Search for a city...');
    fireEvent.change(input, { target: { value: 'xyznonexistent' } });

    await vi.advanceTimersByTimeAsync(300);

    await waitFor(() => {
      expect(screen.getByText('No cities found')).toBeInTheDocument();
      expect(screen.getByText('Try a different search term')).toBeInTheDocument();
    });
  });

  it('debounces search requests', async () => {
    renderWithProviders(<CitySearch />);

    const input = screen.getByPlaceholderText('Search for a city...');

    // Type characters rapidly
    fireEvent.change(input, { target: { value: 'L' } });
    vi.advanceTimersByTime(100);
    fireEvent.change(input, { target: { value: 'Lo' } });
    vi.advanceTimersByTime(100);
    fireEvent.change(input, { target: { value: 'Lon' } });
    vi.advanceTimersByTime(100);

    // Should not have loading skeleton yet (debounce hasn't fired)
    expect(document.querySelector('.city-search-dropdown .animate-pulse')).not.toBeInTheDocument();

    // After debounce timer
    vi.advanceTimersByTime(300);

    // Now should search
    await waitFor(() => {
      expect(input).toHaveValue('Lon');
    });
  });
});
