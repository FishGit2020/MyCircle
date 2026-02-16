import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

/**
 * Moves focus to the main content area on route change.
 * This ensures screen reader users are aware that the page content has changed
 * after navigation (WCAG 2.1 — meaningful focus management).
 */
export function useFocusOnRouteChange() {
  const location = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip the initial render to avoid stealing focus on page load
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const main = document.getElementById('main-content');
    if (main) {
      // tabIndex -1 allows programmatic focus without adding to tab order
      main.setAttribute('tabindex', '-1');
      main.focus({ preventScroll: false });
    }
  }, [location.pathname]);
}
