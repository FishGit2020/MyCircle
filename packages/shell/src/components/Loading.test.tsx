import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Loading from './Loading';

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
});
