import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { MockedProvider } from '@apollo/client/testing/react';
import CitySearch from './CitySearch';
import { SEARCH_CITIES, eventBus, MFEvents } from '@mycircle/shared';

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

const mockNewYork = {
  id: '40.7128,-74.006',
  name: 'New York',
  country: 'US',
  state: 'New York',
  lat: 40.7128,
  lon: -74.006,
};

const mocks = [
  {
    request: {
      query: SEARCH_CITIES,
      variables: { query: 'London', limit: 5 },
    },
    result: {
      data: { searchCities: mockCities },
    },
  },
  {
    request: {
      query: SEARCH_CITIES,
      variables: { query: 'New York', limit: 5 },
    },
    result: {
      data: { searchCities: [mockNewYork] },
    },
  },
  {
    request: {
      query: SEARCH_CITIES,
      variables: { query: 'xyznonexistent', limit: 5 },
    },
    result: {
      data: { searchCities: [] },
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
  });

  it('renders search input and micro frontend badge', () => {
    renderWithProviders(<CitySearch />);

    expect(screen.getByPlaceholderText('Search for a city...')).toBeInTheDocument();
    expect(screen.getByText('City Search Micro Frontend')).toBeInTheDocument();
  });

  it('does not search with less than 2 characters', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<CitySearch />);

    const input = screen.getByPlaceholderText('Search for a city...');
    await user.type(input, 'L');
    vi.advanceTimersByTime(500);

    expect(document.querySelector('.animate-pulse')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  describe('Debounce Behavior', () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('shows loading state while searching', async () => {
      renderWithProviders(<CitySearch />);

      const input = screen.getByPlaceholderText('Search for a city...');
      fireEvent.change(input, { target: { value: 'London' } });
      await vi.advanceTimersByTimeAsync(300);

      await waitFor(() => {
        expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
      });
    });

    it('debounces rapid input', async () => {
      renderWithProviders(<CitySearch />);

      const input = screen.getByPlaceholderText('Search for a city...');
      fireEvent.change(input, { target: { value: 'L' } });
      vi.advanceTimersByTime(100);
      fireEvent.change(input, { target: { value: 'Lo' } });
      vi.advanceTimersByTime(100);
      fireEvent.change(input, { target: { value: 'Lon' } });
      vi.advanceTimersByTime(100);

      expect(document.querySelector('.city-search-dropdown .animate-pulse')).not.toBeInTheDocument();

      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(input).toHaveValue('Lon');
      });
    });
  });

  describe('Search & Selection Flow', () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('displays results and navigates on selection', async () => {
      renderWithProviders(<CitySearch />);

      const input = screen.getByPlaceholderText('Search for a city...');
      fireEvent.change(input, { target: { value: 'London' } });
      await vi.advanceTimersByTimeAsync(300);

      await waitFor(() => {
        expect(screen.getByText('London')).toBeInTheDocument();
        expect(screen.getByText('England, GB')).toBeInTheDocument();
      });

      const cityButton = screen.getAllByRole('option', { name: /London/i })[0];
      fireEvent.click(cityButton);

      expect(mockNavigate).toHaveBeenCalledWith('/weather/51.5074,-0.1278?name=London');
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

    it('clears input and hides dropdown after selection', async () => {
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
      await waitFor(() => {
        expect(screen.queryByText('England, GB')).not.toBeInTheDocument();
      });
    });

    it('shows "No cities found" for empty results', async () => {
      renderWithProviders(<CitySearch />);

      const input = screen.getByPlaceholderText('Search for a city...');
      fireEvent.change(input, { target: { value: 'xyznonexistent' } });
      await vi.advanceTimersByTimeAsync(300);

      await waitFor(() => {
        expect(screen.getByText('No cities found')).toBeInTheDocument();
        expect(screen.getByText('Try a different search term')).toBeInTheDocument();
      });
    });

    it('handles multiple sequential searches', async () => {
      renderWithProviders(<CitySearch />);

      const input = screen.getByPlaceholderText('Search for a city...');

      fireEvent.change(input, { target: { value: 'London' } });
      await vi.advanceTimersByTimeAsync(300);

      await waitFor(() => {
        expect(screen.getByText('London')).toBeInTheDocument();
      });

      fireEvent.change(input, { target: { value: '' } });
      fireEvent.change(input, { target: { value: 'New York' } });
      await vi.advanceTimersByTimeAsync(300);

      await waitFor(() => {
        expect(screen.getByText('New York')).toBeInTheDocument();
      });
    });
  });

  describe('Event Bus Integration', () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('publishes CITY_SELECTED event when city is clicked', async () => {
      const eventSpy = vi.fn();
      const unsubscribe = eventBus.subscribe(MFEvents.CITY_SELECTED, eventSpy);

      renderWithProviders(<CitySearch />);

      const input = screen.getByPlaceholderText('Search for a city...');
      fireEvent.change(input, { target: { value: 'London' } });
      await vi.advanceTimersByTimeAsync(300);

      await waitFor(() => {
        expect(screen.getByText('London')).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByRole('option', { name: /London/i })[0]);

      expect(eventSpy).toHaveBeenCalledWith({ city: mockCities[0] });

      unsubscribe();
    });
  });
});
