import { useState, useEffect, useCallback, useRef, type RefObject } from 'react';

/**
 * Observes a flex container and returns how many direct children fit
 * before overflowing. Reserves space for an overflow button when not
 * all items fit.
 *
 * Nav items must have `data-nav-item` attribute so the hook can
 * distinguish them from the overflow button and cache their widths.
 */
export function useOverflowNav(
  containerRef: RefObject<HTMLElement | null>,
  itemCount: number,
  overflowButtonWidth = 44,
): number {
  const [visibleCount, setVisibleCount] = useState(itemCount);
  // Cache widths so we can calculate even when items are removed from DOM
  const widthsRef = useRef<number[]>([]);

  const measure = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const containerWidth = el.clientWidth;
    // In SSR / jsdom the container has no layout — show all items
    if (containerWidth === 0) {
      setVisibleCount(itemCount);
      return;
    }

    // Measure only actual nav items (not the overflow button) and cache widths
    const navItems = el.querySelectorAll('[data-nav-item]');
    navItems.forEach((item, i) => {
      widthsRef.current[i] = (item as HTMLElement).offsetWidth;
    });

    // Wait until we've measured all items at least once
    if (widthsRef.current.length < itemCount) {
      return;
    }

    let usedWidth = 0;
    let fits = 0;

    for (let i = 0; i < itemCount; i++) {
      const childWidth = widthsRef.current[i];
      // Reserve overflow button space unless this is the last item
      const reserve = i < itemCount - 1 ? overflowButtonWidth : 0;
      if (usedWidth + childWidth + reserve <= containerWidth) {
        usedWidth += childWidth;
        fits++;
      } else {
        break;
      }
    }

    setVisibleCount(fits);
  }, [containerRef, itemCount, overflowButtonWidth]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let rafId: number;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(measure);
    });

    observer.observe(el);
    measure(); // initial measurement

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [containerRef, measure]);

  return visibleCount;
}
