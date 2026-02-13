import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { MockedProvider } from '@apollo/client/testing/react';
import CitySearch from '../../components/CitySearch';
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
    id: '40.7128,-74.006',
    name: 'New York',
    country: 'US',
    state: 'New York',
    lat: 40.7128,
    lon: -74.006,
  },
];

const successMocks = [
  {
    request: {
      query: SEARCH_CITIES,
      variables: { query: 'London', limit: 5 },
    },
    result: {
      data: {
        searchCities: [mockCities[0]],
      },
    },
  },
  {
    request: {
      query: SEARCH_CITIES,
      variables: { query: 'New York', limit: 5 },
    },
    result: {
      data: {
        searchCities: [mockCities[1]],
      },
    },
  },
];

const errorMocks = [
  {
    request: {
      query: SEARCH_CITIES,
      variables: { query: 'Error', limit: 5 },
    },
    error: new Error('Network error'),
  },
];

const emptyMocks = [
  {
    request: {
      query: SEARCH_CITIES,
      variables: { query: 'Unknown', limit: 5 },
    },
    result: {
      data: {
        searchCities: [],
      },
    },
  },
];

const renderWithProviders = (apolloMocks: any[] = successMocks) => {
  return render(
    <MemoryRouter>
      <MockedProvider mocks={apolloMocks} addTypename={false}>
        <CitySearch />
      </MockedProvider>
    </MemoryRouter>
  );
};

describe('CitySearch Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Search Flow', () => {
    it('completes full search and selection flow', async () => {
      renderWithProviders();

      // Type in search
      const input = screen.getByPlaceholderText('Search for a city...');
      fireEvent.change(input, { target: { value: 'London' } });

      // Wait for debounce
      await vi.advanceTimersByTimeAsync(300);

      // Wait for results
      await waitFor(() => {
        expect(screen.getByText('London')).toBeInTheDocument();
      });

      // Click on result
      fireEvent.click(screen.getByRole('option', { name: /London/i }));

      // Should navigate
      expect(mockNavigate).toHaveBeenCalledWith(
        '/weather/51.5074,-0.1278?name=London'
      );
    });

    it('handles multiple sequential searches', async () => {
      renderWithProviders();

      const input = screen.getByPlaceholderText('Search for a city...');

      // First search
      fireEvent.change(input, { target: { value: 'London' } });
      await vi.advanceTimersByTimeAsync(300);

      await waitFor(() => {
        expect(screen.getByText('London')).toBeInTheDocument();
      });

      // Clear and search again
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.change(input, { target: { value: 'New York' } });
      await vi.advanceTimersByTimeAsync(300);

      await waitFor(() => {
        expect(screen.getByText('New York')).toBeInTheDocument();
      });
    });
  });

  describe('Event Bus Integration', () => {
    it('publishes CITY_SELECTED event when city is clicked', async () => {
      const eventSpy = vi.fn();
      const unsubscribe = eventBus.subscribe(MFEvents.CITY_SELECTED, eventSpy);

      renderWithProviders();

      const input = screen.getByPlaceholderText('Search for a city...');
      fireEvent.change(input, { target: { value: 'London' } });
      await vi.advanceTimersByTimeAsync(300);

      await waitFor(() => {
        expect(screen.getByText('London')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('option', { name: /London/i }));

      expect(eventSpy).toHaveBeenCalledWith({ city: mockCities[0] });

      unsubscribe();
    });
  });

  describe('Empty Results', () => {
    it('shows no results for unknown cities', async () => {
      renderWithProviders(emptyMocks);

      const input = screen.getByPlaceholderText('Search for a city...');
      fireEvent.change(input, { target: { value: 'Unknown' } });
      await vi.advanceTimersByTimeAsync(300);

      await waitFor(() => {
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
      });
    });
  });

  describe('User Experience', () => {
    it('shows search icon in input', () => {
      renderWithProviders();

      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('input clears after selection', async () => {
      renderWithProviders();

      const input = screen.getByPlaceholderText('Search for a city...') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'London' } });
      await vi.advanceTimersByTimeAsync(300);

      await waitFor(() => {
        expect(screen.getByText('London')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('option', { name: /London/i }));

      expect(input.value).toBe('');
    });

    it('results dropdown disappears after selection', async () => {
      renderWithProviders();

      const input = screen.getByPlaceholderText('Search for a city...');
      fireEvent.change(input, { target: { value: 'London' } });
      await vi.advanceTimersByTimeAsync(300);

      await waitFor(() => {
        expect(screen.getByText('London')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('option', { name: /London/i }));

      await waitFor(() => {
        expect(screen.queryByText('England, GB')).not.toBeInTheDocument();
      });
    });
  });
});
