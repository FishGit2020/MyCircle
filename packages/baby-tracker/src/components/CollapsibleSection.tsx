import React, { useState, useCallback } from 'react';
import { useTranslation } from '@mycircle/shared';

interface CollapsibleSectionProps {
  titleKey: string;
  storageKey: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

export default function CollapsibleSection({
  titleKey,
  storageKey,
  defaultExpanded = false,
  children,
}: CollapsibleSectionProps) {
  const { t } = useTranslation();

  const [expanded, setExpanded] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored !== null ? stored === 'true' : defaultExpanded;
    } catch {
      return defaultExpanded;
    }
  });

  const toggle = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(storageKey, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, [storageKey]);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={expanded}
        className="w-full flex items-center justify-between px-5 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 min-h-[44px]"
      >
        <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {t(titleKey as Parameters<typeof t>[0])}
        </span>
        <svg
          className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-5 py-4">
          {children}
        </div>
      )}
    </div>
  );
}
