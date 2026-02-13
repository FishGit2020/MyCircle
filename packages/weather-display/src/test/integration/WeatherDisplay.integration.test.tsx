import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { MockedProvider } from '@apollo/client/testing/react';
import WeatherDisplay from '../../components/WeatherDisplay';
import { GET_WEATHER, WEATHER_UPDATES } from '@mycircle/shared';

const mockWeatherResponse = {
  weather: {
    current: {
      temp: 22,
      feels_like: 20,
      temp_min: 18,
      temp_max: 25,
      pressure: 1013,
      humidity: 65,
      weather: [
        {
          id: 800,
          main: 'Clear',
          description: 'clear sky',
          icon: '01d'
        }
      ],
      wind: {
        speed: 5.5,
        deg: 180,
        gust: 8
      },
      clouds: {
        all: 10
      },
      dt: 1620000000,
      timezone: 0
    },
    forecast: [
      {
        dt: 1620000000,
        temp: { min: 15, max: 22, day: 20, night: 16 },
        weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
        humidity: 60,
        wind_speed: 5,
        pop: 0
      },
      {
        dt: 1620086400,
        temp: { min: 14, max: 20, day: 18, night: 15 },
        weather: [{ id: 500, main: 'Rain', description: 'light rain', icon: '10d' }],
        humidity: 75,
        wind_speed: 8,
        pop: 0.6
      }
    ],
    hourly: [
      {
        dt: 1620000000,
        temp: 22,
        weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
        pop: 0,
        wind_speed: 5
      },
      {
        dt: 1620003600,
        temp: 21,
        weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
        pop: 0,
        wind_speed: 5.5
      }
    ]
  }
};

// Subscription mock with long delay (simulates waiting for push)
const subscriptionMock = {
  request: {
    query: WEATHER_UPDATES,
    variables: { lat: 51.5074, lon: -0.1278 },
  },
  result: {
    data: null,
  },
  delay: 30_000,
};

const successMocks = [
  {
    request: {
      query: GET_WEATHER,
      variables: { lat: 51.5074, lon: -0.1278 },
    },
    result: {
      data: mockWeatherResponse,
    },
  },
  subscriptionMock,
];

const errorMocks = [
  {
    request: {
      query: GET_WEATHER,
      variables: { lat: 51.5074, lon: -0.1278 },
    },
    error: new Error('Failed to fetch weather data'),
  },
  subscriptionMock,
];

const renderWithProviders = (
  initialRoute = '/weather/51.5074,-0.1278?name=London',
  apolloMocks = successMocks
) => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <MockedProvider mocks={apolloMocks} addTypename={false}>
        <Routes>
          <Route path="/weather/:coords" element={<WeatherDisplay />} />
        </Routes>
      </MockedProvider>
    </MemoryRouter>
  );
};

describe('WeatherDisplay Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('shows loading indicator initially', () => {
      renderWithProviders();

      // Component shows skeleton UI with animate-pulse divs during loading
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('Success State', () => {
    it('displays city name from URL params', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText(/London/i)).toBeInTheDocument();
      });
    });

    it('displays current temperature', async () => {
      renderWithProviders();

      await waitFor(() => {
        // Temperature may appear in both current weather and hourly forecast
        const temps = screen.getAllByText('22°C');
        expect(temps.length).toBeGreaterThan(0);
      });
    });

    it('displays weather description', async () => {
      renderWithProviders();

      await waitFor(() => {
        // "clear sky" may appear in multiple sections (current + forecast + hourly)
        const descriptions = screen.getAllByText('clear sky');
        expect(descriptions.length).toBeGreaterThan(0);
      });
    });

    it('displays weather details (humidity, wind, etc)', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('65%')).toBeInTheDocument(); // humidity
        expect(screen.getByText('1013 hPa')).toBeInTheDocument(); // pressure
      });
    });

    it('displays forecast section', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Today')).toBeInTheDocument();
      });
    });

    it('displays micro frontend badge', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText(/Weather Display Micro Frontend/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('displays error message on API failure', async () => {
      renderWithProviders('/weather/51.5074,-0.1278?name=London', errorMocks);

      await waitFor(() => {
        // Error message may be from query or subscription failure
        const errorEl = document.querySelector('.text-red-600, .text-red-400');
        expect(errorEl).toBeInTheDocument();
      });
    });
  });

  describe('URL Handling', () => {
    it('parses coordinates from URL', async () => {
      // Use coordinates that have mocks
      renderWithProviders('/weather/51.5074,-0.1278?name=New%20York');

      await waitFor(() => {
        expect(screen.getByText(/New York/i)).toBeInTheDocument();
      });
    });

    it('shows city name from URL query param', async () => {
      renderWithProviders('/weather/51.5074,-0.1278?name=Test%20City');

      await waitFor(() => {
        // Should show "Test City" from the URL param
        expect(screen.getByText(/Test City/i)).toBeInTheDocument();
      });
    });
  });
});
