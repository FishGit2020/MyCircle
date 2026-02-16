import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Loading from './Loading';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('Loading', () => {
  it('renders a loading spinner', () => {
    render(<Loading />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('has proper styling classes', () => {
    render(<Loading />);
    const container = document.querySelector('.flex.items-center.justify-center');
    expect(container).toBeInTheDocument();
  });

  it('has role="status" for screen reader announcement', () => {
    render(<Loading />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has aria-live="polite"', () => {
    render(<Loading />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('provides sr-only loading text', () => {
    render(<Loading />);
    expect(screen.getByText('app.loading')).toBeInTheDocument();
    expect(screen.getByText('app.loading')).toHaveClass('sr-only');
  });
});
