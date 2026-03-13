import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { NavIcon } from './NavIcon';

vi.mock('./iconRegistry', () => ({
  getIcon: (key: string, cls: string) => <svg data-testid="icon" data-key={key} className={cls} />,
}));

describe('NavIcon', () => {
  it('renders without crashing', () => {
    const { container } = render(<NavIcon icon="weather" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('passes icon key to getIcon', () => {
    const { getByTestId } = render(<NavIcon icon="weather" />);
    expect(getByTestId('icon')).toHaveAttribute('data-key', 'weather');
  });

  it('uses default className when none provided', () => {
    const { getByTestId } = render(<NavIcon icon="home" />);
    expect(getByTestId('icon')).toHaveClass('w-5', 'h-5');
  });

  it('passes custom className', () => {
    const { getByTestId } = render(<NavIcon icon="home" className="w-8 h-8" />);
    expect(getByTestId('icon')).toHaveClass('w-8', 'h-8');
  });
});
