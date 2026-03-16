import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation, useLazyQuery, SEARCH_LOCATIONS } from '@mycircle/shared';
import type { SearchLocationsQuery } from '@mycircle/shared';

interface DestinationSearchProps {
  value: string;
  onChange: (v: string) => void;
  onSelect: (result: { displayName: string; lat: number; lon: number }) => void;
  placeholder?: string;
  id?: string;
  required?: boolean;
}

export default function DestinationSearch({
  value,
  onChange,
  onSelect,
  placeholder,
  id,
  required,
}: DestinationSearchProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const [searchLocations, { data, loading }] = useLazyQuery<SearchLocationsQuery>(SEARCH_LOCATIONS);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const results = data?.locationSearch ?? [];

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      searchLocations({ variables: { query: value.trim(), limit: 5 } });
      setIsOpen(true);
      setActiveIndex(-1);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, searchLocations]);

  // Open dropdown when we get results
  useEffect(() => {
    if (results.length > 0 && value.trim().length >= 2) {
      setIsOpen(true);
    }
  }, [results, value]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback((result: { displayName: string; lat: number; lon: number }) => {
    onSelect(result);
    onChange(result.displayName);
    setIsOpen(false);
    setActiveIndex(-1);
  }, [onSelect, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < results.length) {
          handleSelect(results[activeIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  }, [isOpen, results, activeIndex, handleSelect]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const listboxId = `${id || 'dest-search'}-listbox`;

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={isOpen && results.length > 0}
        aria-controls={listboxId}
        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
        aria-autocomplete="list"
        aria-label={t('tripPlanner.searchDestination')}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (results.length > 0 && value.trim().length >= 2) setIsOpen(true);
        }}
        required={required}
        aria-required={required ? 'true' : undefined}
        placeholder={placeholder || t('tripPlanner.searchDestination')}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition"
        autoComplete="off"
      />

      {/* Loading indicator */}
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-500 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg"
        >
          {results.map((result, index) => (
            <li
              key={`${result.lat}-${result.lon}-${index}`}
              id={`${listboxId}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              className={`px-3 py-2.5 text-sm cursor-pointer transition ${
                index === activeIndex
                  ? 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onMouseDown={() => handleSelect(result)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <span className="block truncate">{result.displayName}</span>
              <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {result.lat.toFixed(4)}, {result.lon.toFixed(4)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
