import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { NavIcon } from './NavIcon';

describe('NavIcon', () => {
  it('renders an SVG for a known icon key', () => {
    const { container } = render(<NavIcon icon="home" />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('applies default w-5 h-5 class', () => {
    const { container } = render(<NavIcon icon="weather" />);
    const svg = container.querySelector('svg');
    expect(svg?.classList.contains('w-5')).toBe(true);
    expect(svg?.classList.contains('h-5')).toBe(true);
  });

  it('applies custom className when provided', () => {
    const { container } = render(<NavIcon icon="stocks" className="w-8 h-8" />);
    const svg = container.querySelector('svg');
    expect(svg?.classList.contains('w-8')).toBe(true);
  });

  it('renders fallback icon for unknown key', () => {
    const { container } = render(<NavIcon icon="nonexistent" />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });
});
