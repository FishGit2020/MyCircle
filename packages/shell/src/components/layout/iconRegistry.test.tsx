import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ICON_REGISTRY, getIcon } from './iconRegistry';

describe('iconRegistry', () => {
  it('has entries for common icons', () => {
    expect(ICON_REGISTRY).toHaveProperty('home');
    expect(ICON_REGISTRY).toHaveProperty('weather');
    expect(ICON_REGISTRY).toHaveProperty('stocks');
    expect(ICON_REGISTRY).toHaveProperty('podcasts');
    expect(ICON_REGISTRY).toHaveProperty('bible');
    expect(ICON_REGISTRY).toHaveProperty('worship');
  });

  it('each entry returns an SVG element', () => {
    for (const [key, factory] of Object.entries(ICON_REGISTRY)) {
      const { container } = render(factory('w-5 h-5'));
      const svg = container.querySelector('svg');
      expect(svg, `Icon "${key}" should render an SVG`).not.toBeNull();
    }
  });

  it('getIcon returns icon for known keys', () => {
    const { container } = render(getIcon('home'));
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.classList.contains('w-5')).toBe(true);
  });

  it('getIcon returns fallback dots icon for unknown keys', () => {
    const { container } = render(getIcon('unknown-icon'));
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('getIcon applies custom className', () => {
    const { container } = render(getIcon('home', 'w-8 h-8'));
    const svg = container.querySelector('svg');
    expect(svg?.classList.contains('w-8')).toBe(true);
    expect(svg?.classList.contains('h-8')).toBe(true);
  });
});
