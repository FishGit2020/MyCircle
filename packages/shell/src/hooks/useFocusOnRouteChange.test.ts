import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFocusOnRouteChange } from './useFocusOnRouteChange';

let mockPathname = '/';

vi.mock('react-router', () => ({
  useLocation: () => ({ pathname: mockPathname, search: '', hash: '', state: null, key: 'default' }),
}));

beforeEach(() => {
  mockPathname = '/';
  document.body.innerHTML = '<main id="main-content"></main>';
});

describe('useFocusOnRouteChange', () => {
  it('does not focus on initial render', () => {
    const main = document.getElementById('main-content')!;
    const focusSpy = vi.spyOn(main, 'focus');

    renderHook(() => useFocusOnRouteChange());
    expect(focusSpy).not.toHaveBeenCalled();
  });

  it('focuses main content when pathname changes', () => {
    const main = document.getElementById('main-content')!;
    const focusSpy = vi.spyOn(main, 'focus');

    const { rerender } = renderHook(() => useFocusOnRouteChange());
    expect(focusSpy).not.toHaveBeenCalled();

    // Simulate route change
    mockPathname = '/weather';
    rerender();
    expect(focusSpy).toHaveBeenCalled();
  });

  it('sets tabindex=-1 on main content', () => {
    const main = document.getElementById('main-content')!;

    const { rerender } = renderHook(() => useFocusOnRouteChange());
    mockPathname = '/stocks';
    rerender();
    expect(main.getAttribute('tabindex')).toBe('-1');
  });
});
