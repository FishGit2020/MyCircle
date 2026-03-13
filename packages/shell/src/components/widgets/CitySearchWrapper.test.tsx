import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CitySearchWrapper from './CitySearchWrapper';

vi.mock('../common', () => ({
  Loading: () => <div>Loading...</div>,
  ErrorBoundary: ({ children }: any) => <div>{children}</div>,
}));

describe('CitySearchWrapper', () => {
  it('renders the lazy-loaded CitySearch component', async () => {
    render(<CitySearchWrapper />);
    expect(await screen.findByTestId('city-search-mock')).toBeInTheDocument();
  });
});
