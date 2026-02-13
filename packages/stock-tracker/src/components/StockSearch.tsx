import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@mycircle/shared';
import { useStockSearch, StockSearchResult } from '../hooks/useStockData';

interface Props {
  onSelect: (symbol: string, description: string) => void;
}

export default function StockSearch({ onSelect }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { results, loading, error } = useStockSearch(query);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setInputFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlighted index when results change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [results]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleResultClick = (result: StockSearchResult) => {
    onSelect(result.symbol, result.description);
    setQuery('');
    setInputFocused(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setInputFocused(false);
      setHighlightedIndex(-1);
      (e.target as HTMLInputElement).blur();
      return;
    }

    if (results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < results.length) {
          handleResultClick(results[highlightedIndex]);
        }
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const items = dropdownRef.current.querySelectorAll('[data-dropdown-item]');
      const item = items[highlightedIndex];
      if (item && typeof item.scrollIntoView === 'function') {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const showResults = inputFocused && results.length > 0 && !loading;
  const showLoading = inputFocused && loading && query.length >= 1;
  const showNoResults = inputFocused && query.length >= 1 && !loading && results.length === 0 && !error;

  return (
    <div className="stock-tracker-container max-w-xl mx-auto" ref={containerRef}>
      <div className="relative">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setInputFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={t('stocks.search')}
            className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-lg"
            role="combobox"
            aria-label={t('stocks.search')}
            aria-expanded={showResults}
            aria-activedescendant={highlightedIndex >= 0 ? `stock-option-${highlightedIndex}` : undefined}
          />
          <svg
            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {showLoading && (
          <div className="stock-search-dropdown absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center px-4 py-3 border-b dark:border-gray-700 last:border-b-0 animate-pulse">
                <div className="flex-1 min-w-0">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20 mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-40" />
                </div>
              </div>
            ))}
          </div>
        )}

        {showResults && (
          <div
            ref={dropdownRef}
            className="stock-search-dropdown absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10 max-h-80 overflow-y-auto"
            role="listbox"
          >
            {results.map((result, index) => (
              <button
                key={result.symbol}
                id={`stock-option-${index}`}
                data-dropdown-item
                onClick={() => handleResultClick(result)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`w-full text-left px-4 py-3 transition border-b dark:border-gray-700 last:border-b-0 flex items-center gap-3 ${
                  index === highlightedIndex
                    ? 'bg-indigo-50 dark:bg-gray-700'
                    : 'hover:bg-indigo-50 dark:hover:bg-gray-700'
                }`}
                role="option"
                aria-selected={index === highlightedIndex}
              >
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/50 rounded min-w-[60px]">
                  {result.displaySymbol}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {result.description}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {result.type}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {showNoResults && (
          <div className="stock-search-dropdown absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10 px-4 py-6 text-center">
            <svg className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{t('stocks.noResults')}</p>
          </div>
        )}

        {error && inputFocused && (
          <div className="stock-search-dropdown absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10 px-4 py-4 text-center">
            <p className="text-red-500 dark:text-red-400 text-sm">{t('stocks.error')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
