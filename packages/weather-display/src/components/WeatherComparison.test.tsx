import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing/react';
import { MemoryRouter } from 'react-router';
import WeatherComparison from './WeatherComparison';

// Mock @mycircle/shared — identity t(), metric units, passthrough helpers
vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    locale: 'en',
  }),
  useUnits: () => ({
    tempUnit: 'C' as const,
    speedUnit: 'ms' as const,
    setTempUnit: vi.fn(),
    setSpeedUnit: vi.fn(),
  }),
  GET_CURRENT_WEATHER: {
    kind: 'Document',
    definitions: [],
  },
  GET_FORECAST: {
    kind: 'Document',
    definitions: [],
  },
  SEARCH_CITIES: {
    kind: 'Document',
    definitions: [{
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'SearchCities' },
      variableDefinitions: [],
      selectionSet: { kind: 'SelectionSet', selections: [] },
    }],
  },
  getWeatherIconUrl: (icon: string) => `https://openweathermap.org/img/wn/${icon}@2x.png`,
  getWindDirection: (deg: number) => {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(deg / 45) % 8];
  },
  formatTemperature: (temp: number) => `${Math.round(temp)}\u00B0C`,
  formatWindSpeed: (speed: number) => `${Math.round(speed)} m/s`,
  convertTemp: (temp: number) => Math.round(temp),
  tempUnitSymbol: () => '\u00B0C',
}));

const currentCity = { id: '1', name: 'London', lat: 51.5, lon: -0.12 };

const otherCity = { id: '2', name: 'Paris', lat: 48.85, lon: 2.35 };

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <MockedProvider mocks={[]} addTypename={false}>
      <MemoryRouter>{ui}</MemoryRouter>
    </MockedProvider>,
  );
}

describe('WeatherComparison', () => {
  it('renders collapsed toggle when no other cities are available', () => {
    renderWithProviders(
      <WeatherComparison
        currentCity={currentCity}
        availableCities={[currentCity]}
      />,
    );

    // Component renders a toggle button but no city count badge
    expect(screen.getByRole('button', { name: /compare\.title/ })).toBeInTheDocument();
    // Comparison is collapsed (no combobox/select visible)
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('renders the "Compare Weather" button when other cities are available', () => {
    renderWithProviders(
      <WeatherComparison
        currentCity={currentCity}
        availableCities={[currentCity, otherCity]}
      />,
    );

    // The button text comes from t('compare.title') + city count badge
    expect(screen.getByRole('button', { name: /compare\.title/ })).toBeInTheDocument();
  });

  it('auto-expands comparison and shows city select dropdown when other cities exist', () => {
    renderWithProviders(
      <WeatherComparison
        currentCity={currentCity}
        availableCities={[currentCity, otherCity]}
      />,
    );

    // Comparison auto-expands when other cities are available
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();

    // The dropdown should contain the placeholder and the other city as options
    const options = screen.getAllByRole('option');
    // First option is the placeholder from t('compare.chooseCity')
    expect(options[0]).toHaveTextContent('compare.chooseCity');
    // Second option is the other city
    expect(options[1]).toHaveTextContent('Paris');
  });

  it('collapses comparison when toggle button is clicked', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <WeatherComparison
        currentCity={currentCity}
        availableCities={[currentCity, otherCity]}
      />,
    );

    // Initially expanded
    expect(screen.getByRole('combobox')).toBeInTheDocument();

    // Click the toggle button to collapse
    await user.click(screen.getByRole('button', { name: /compare\.title/ }));

    // After collapsing, select should not be visible
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});
