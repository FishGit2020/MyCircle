import { useState, useEffect, useCallback, type RefObject } from 'react';

/**
 * Observes a flex container and returns how many direct children fit
 * before overflowing. Reserves space for an overflow button when not
 * all items fit.
 */
export function useOverflowNav(
  containerRef: RefObject<HTMLElement | null>,
  itemCount: number,
  overflowButtonWidth = 44,
): number {
  const [visibleCount, setVisibleCount] = useState(itemCount);

  const measure = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const children = Array.from(el.children) as HTMLElement[];
    // Last child may be the overflow button itself — only measure nav items
    const navChildren = children.slice(0, itemCount);
    if (navChildren.length === 0) return;

    const containerWidth = el.clientWidth;
    // In SSR / jsdom the container has no layout — show all items
    if (containerWidth === 0) {
      setVisibleCount(itemCount);
      return;
    }
    let usedWidth = 0;
    let fits = 0;

    for (let i = 0; i < navChildren.length; i++) {
      const childWidth = navChildren[i].offsetWidth;
      // If not all items have been counted yet, reserve overflow button space
      const remaining = i < navChildren.length - 1 ? overflowButtonWidth : 0;
      if (usedWidth + childWidth + remaining <= containerWidth) {
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
