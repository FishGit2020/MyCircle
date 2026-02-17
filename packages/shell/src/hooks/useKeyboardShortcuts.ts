import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';

interface UseKeyboardShortcutsOptions {
  onToggleTheme: () => void;
  onShowHelp: () => void;
}

export function useKeyboardShortcuts({ onToggleTheme, onShowHelp }: UseKeyboardShortcutsOptions) {
  const navigate = useNavigate();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Skip if user is typing in an input/textarea/contenteditable
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    ) {
      return;
    }

    // Ctrl/Cmd+D → toggle dark mode
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      onToggleTheme();
      return;
    }

    // ? → show keyboard shortcuts help
    if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      onShowHelp();
      return;
    }

    // g then letter → go-to navigation (only if no modifier keys)
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    // Single-key navigation shortcuts
    switch (e.key) {
      case 'g':
        // Set up listener for next key press
        handleGoPrefix();
        break;
    }
  }, [navigate, onToggleTheme, onShowHelp]);

  const handleGoPrefix = useCallback(() => {
    const onNextKey = (e: KeyboardEvent) => {
      window.removeEventListener('keydown', onNextKey);
      clearTimeout(timeout);

      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      switch (e.key) {
        case 'h': e.preventDefault(); navigate('/'); break;
        case 'w': e.preventDefault(); navigate('/weather'); break;
        case 's': e.preventDefault(); navigate('/stocks'); break;
        case 'p': e.preventDefault(); navigate('/podcasts'); break;
        case 'b': e.preventDefault(); navigate('/bible'); break;
        case 'o': e.preventDefault(); navigate('/worship'); break;
        case 'n': e.preventDefault(); navigate('/notebook'); break;
        case 'y': e.preventDefault(); navigate('/baby'); break;
        case 'e': e.preventDefault(); navigate('/english'); break;
        case 'c': e.preventDefault(); navigate('/chinese'); break;
        case 'a': e.preventDefault(); navigate('/ai'); break;
      }
    };

    // Cancel go-prefix if no second key pressed within 1 second
    const timeout = setTimeout(() => {
      window.removeEventListener('keydown', onNextKey);
    }, 1000);

    window.addEventListener('keydown', onNextKey, { once: true });
  }, [navigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
