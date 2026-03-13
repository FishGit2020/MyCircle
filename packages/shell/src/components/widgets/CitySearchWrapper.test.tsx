import { describe, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import CitySearchWrapper from './CitySearchWrapper';

vi.mock('citySearch/CitySearch', () => ({ default: () => <div>CitySearch</div> }));
vi.mock('../common', () => ({
  Loading: () => <div>Loading</div>,
  ErrorBoundary: ({ children }: any) => <>{children}</>,
}));

describe('CitySearchWrapper', () => {
  it('renders without crashing', () => {
    render(<CitySearchWrapper />);
  });
});
