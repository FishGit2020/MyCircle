import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ICON_REGISTRY, getIcon } from './iconRegistry';

describe('iconRegistry', () => {
  it('returns an SVG for known icons', () => {
    const { container } = render(getIcon('weather'));
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('returns a fallback SVG for unknown icons', () => {
    const { container } = render(getIcon('nonexistent-icon-xyz'));
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('has entries in the registry', () => {
    expect(Object.keys(ICON_REGISTRY).length).toBeGreaterThan(0);
  });

  it('applies custom className', () => {
    const { container } = render(getIcon('weather', 'w-8 h-8'));
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('w-8', 'h-8');
  });
});
