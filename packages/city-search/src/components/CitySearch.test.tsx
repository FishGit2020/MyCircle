import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { MockedProvider } from '@apollo/client/testing/react';
import CitySearch from './CitySearch';
import { SEARCH_CITIES, eventBus, MFEvents, StorageKeys } from '@mycircle/shared';

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
  {
    request: {
      query: SEARCH_CITIES,
      variables: { query: 'Tok', limit: 5 },
    },
    result: {
      data: { searchCities: [{ id: '35.68,139.69', name: 'Tokyo', country: 'JP', state: null, lat: 35.6762, lon: 139.6503 }] },
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
    localStorage.clear();
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
      // Use a delayed mock so loading state persists long enough for assertion
      const delayedMocks = [
        {
          request: { query: SEARCH_CITIES, variables: { query: 'London', limit: 5 } },
          result: { data: { searchCities: mockCities } },
          delay: 30000,
        },
      ];
      renderWithProviders(<CitySearch />, delayedMocks);

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

  describe('Recent Cities & Autocomplete', () => {
    const recentCities = [
      { id: '35.68,139.69', name: 'Tokyo', country: 'JP', lat: 35.6762, lon: 139.6503, searchedAt: Date.now() - 3600000 },
      { id: '48.86,2.35', name: 'Paris', country: 'FR', lat: 48.8566, lon: 2.3522, searchedAt: Date.now() - 7200000 },
    ];

    it('shows recent cities in dropdown when input focused with empty query', () => {
      renderWithProviders(<CitySearch recentCities={recentCities} />);
      const input = screen.getByPlaceholderText('Search for a city...');
      fireEvent.focus(input);

      expect(screen.getByText('Recent Searches')).toBeInTheDocument();
      expect(screen.getByText('Tokyo')).toBeInTheDocument();
      expect(screen.getByText('Paris')).toBeInTheDocument();
    });

    it('shows "Clear all" button when recent cities are present', () => {
      renderWithProviders(<CitySearch recentCities={recentCities} />);
      const input = screen.getByPlaceholderText('Search for a city...');
      fireEvent.focus(input);

      expect(screen.getByText('Clear all')).toBeInTheDocument();
    });

    it('calls onClearRecents when "Clear all" is clicked', () => {
      const onClearRecents = vi.fn();
      renderWithProviders(<CitySearch recentCities={recentCities} onClearRecents={onClearRecents} />);
      const input = screen.getByPlaceholderText('Search for a city...');
      fireEvent.focus(input);

      fireEvent.click(screen.getByText('Clear all'));
      expect(onClearRecents).toHaveBeenCalled();
    });

    it('does not show "Clear all" when showing popular cities', () => {
      renderWithProviders(<CitySearch recentCities={[]} />);
      const input = screen.getByPlaceholderText('Search for a city...');
      fireEvent.focus(input);

      expect(screen.getByText('Popular Cities')).toBeInTheDocument();
      expect(screen.queryByText('Clear all')).not.toBeInTheDocument();
    });

    it('shows matching recent cities inline during search with "Recent" badge', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      renderWithProviders(<CitySearch recentCities={recentCities} />);

      const input = screen.getByPlaceholderText('Search for a city...');
      fireEvent.change(input, { target: { value: 'Tok' } });
      await vi.advanceTimersByTimeAsync(300);

      await waitFor(() => {
        expect(screen.getByText('Tokyo')).toBeInTheDocument();
        expect(screen.getByText('Recent')).toBeInTheDocument();
      });

      vi.useRealTimers();
    });

    it('removes individual recent city via remove button', () => {
      const onRemoveCity = vi.fn();
      renderWithProviders(<CitySearch recentCities={recentCities} onRemoveCity={onRemoveCity} />);
      const input = screen.getByPlaceholderText('Search for a city...');
      fireEvent.focus(input);

      const removeBtn = screen.getByLabelText('Remove Tokyo from recent searches');
      fireEvent.click(removeBtn);
      expect(onRemoveCity).toHaveBeenCalledWith('35.68,139.69');
    });

    it('shows popular cities when no recents exist', () => {
      renderWithProviders(<CitySearch />);
      const input = screen.getByPlaceholderText('Search for a city...');
      fireEvent.focus(input);

      expect(screen.getByText('Popular Cities')).toBeInTheDocument();
      expect(screen.getByText('New York')).toBeInTheDocument();
    });
  });

  describe('localStorage Fallback', () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('saves selected city to localStorage', async () => {
      renderWithProviders(<CitySearch />);

      const input = screen.getByPlaceholderText('Search for a city...');
      fireEvent.change(input, { target: { value: 'London' } });
      await vi.advanceTimersByTimeAsync(300);

      await waitFor(() => {
        expect(screen.getByText('London')).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByRole('option', { name: /London/i })[0]);

      const stored = JSON.parse(localStorage.getItem(StorageKeys.RECENT_CITIES) || '[]');
      expect(stored).toHaveLength(1);
      expect(stored[0].name).toBe('London');
      expect(stored[0].searchedAt).toBeDefined();
    });

    it('loads local recents on mount when no prop recents', () => {
      localStorage.setItem(StorageKeys.RECENT_CITIES, JSON.stringify([
        { id: '40.71,-74.01', name: 'New York', country: 'US', lat: 40.7128, lon: -74.006, searchedAt: Date.now() },
      ]));

      renderWithProviders(<CitySearch />);
      const input = screen.getByPlaceholderText('Search for a city...');
      fireEvent.focus(input);

      expect(screen.getByText('Recent Searches')).toBeInTheDocument();
      expect(screen.getByText('New York')).toBeInTheDocument();
    });

    it('prefers prop recents over local recents', () => {
      localStorage.setItem(StorageKeys.RECENT_CITIES, JSON.stringify([
        { id: '40.71,-74.01', name: 'New York', country: 'US', lat: 40.7128, lon: -74.006, searchedAt: Date.now() },
      ]));

      const propRecents = [
        { id: '35.68,139.69', name: 'Tokyo', country: 'JP', lat: 35.6762, lon: 139.6503 },
      ];

      renderWithProviders(<CitySearch recentCities={propRecents} />);
      const input = screen.getByPlaceholderText('Search for a city...');
      fireEvent.focus(input);

      expect(screen.getByText('Tokyo')).toBeInTheDocument();
    });

    it('clears local recents when Clear all is clicked without auth', () => {
      localStorage.setItem(StorageKeys.RECENT_CITIES, JSON.stringify([
        { id: '40.71,-74.01', name: 'New York', country: 'US', lat: 40.7128, lon: -74.006, searchedAt: Date.now() },
      ]));

      renderWithProviders(<CitySearch />);
      const input = screen.getByPlaceholderText('Search for a city...');
      fireEvent.focus(input);

      expect(screen.getByText('Recent Searches')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Clear all'));

      const stored = JSON.parse(localStorage.getItem(StorageKeys.RECENT_CITIES) || '[]');
      expect(stored).toHaveLength(0);
    });
  });
});
