import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { MockedProvider } from '@apollo/client/testing/react';
import UseMyLocation from './UseMyLocation';
import { REVERSE_GEOCODE } from '@weather/shared';

const mockNavigate = vi.fn();

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
};

const mocks = [
  {
    request: {
      query: REVERSE_GEOCODE,
      variables: { lat: 51.5074, lon: -0.1278 },
    },
    result: {
      data: {
        reverseGeocode: {
          id: '51.5074,-0.1278',
          name: 'London',
          country: 'GB',
          state: 'England',
          lat: 51.5074,
          lon: -0.1278,
        },
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

describe('UseMyLocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true,
    });
  });

  it('renders Use My Location button', () => {
    renderWithProviders(<UseMyLocation />);

    expect(screen.getByText('Use my current location')).toBeInTheDocument();
  });

  it('shows loading state when clicked', () => {
    mockGeolocation.getCurrentPosition.mockImplementation(() => {
      // Simulate pending geolocation
    });

    renderWithProviders(<UseMyLocation />);

    fireEvent.click(screen.getByText('Use my current location'));

    expect(screen.getByText('Getting location...')).toBeInTheDocument();
  });

  it('handles geolocation not supported', () => {
    Object.defineProperty(navigator, 'geolocation', {
      value: undefined,
      writable: true,
    });

    renderWithProviders(<UseMyLocation />);

    fireEvent.click(screen.getByText('Use my current location'));

    expect(screen.getByText('Geolocation is not supported by your browser')).toBeInTheDocument();
  });

  it('handles permission denied error', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error({
        code: 1, // PERMISSION_DENIED
        message: 'User denied geolocation',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      });
    });

    renderWithProviders(<UseMyLocation />);

    fireEvent.click(screen.getByText('Use my current location'));

    await waitFor(() => {
      expect(screen.getByText(/Location permission denied/)).toBeInTheDocument();
    });
  });

  it('handles position unavailable error', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error({
        code: 2, // POSITION_UNAVAILABLE
        message: 'Position unavailable',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      });
    });

    renderWithProviders(<UseMyLocation />);

    fireEvent.click(screen.getByText('Use my current location'));

    await waitFor(() => {
      expect(screen.getByText('Location information unavailable')).toBeInTheDocument();
    });
  });

  it('handles timeout error', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error({
        code: 3, // TIMEOUT
        message: 'Timeout',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      });
    });

    renderWithProviders(<UseMyLocation />);

    fireEvent.click(screen.getByText('Use my current location'));

    await waitFor(() => {
      expect(screen.getByText('Location request timed out')).toBeInTheDocument();
    });
  });

  it('navigates to weather page on successful location', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 51.5074,
          longitude: -0.1278,
        },
      });
    });

    renderWithProviders(<UseMyLocation />);

    fireEvent.click(screen.getByText('Use my current location'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/weather/51.5074,-0.1278');
    });
  });

  it('button is disabled while loading', () => {
    mockGeolocation.getCurrentPosition.mockImplementation(() => {
      // Keep pending
    });

    renderWithProviders(<UseMyLocation />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(button).toBeDisabled();
  });
});
