import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@weather/shared';
import { usePodcastSearch } from '../hooks/usePodcastData';
import type { Podcast } from '../hooks/usePodcastData';

interface PodcastSearchProps {
  onSelectPodcast: (podcast: Podcast) => void;
}

export default function PodcastSearch({ onSelectPodcast }: PodcastSearchProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data, loading, error } = usePodcastSearch(query);
  const results = data?.feeds ?? [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [results]);

  const handleSelect = (podcast: Podcast) => {
    onSelectPodcast(podcast);
    setQuery('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setHighlightedIndex(-1);
      (e.target as HTMLInputElement).blur();
      return;
    }

    if (results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < results.length) {
          handleSelect(results[highlightedIndex]);
        }
        break;
    }
  };

  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const items = dropdownRef.current.querySelectorAll('[data-dropdown-item]');
      items[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  const showResults = isOpen && query.length >= 2;
  const showNoResults = showResults && !loading && results.length === 0 && !error;

  return (
    <div className="relative max-w-xl mx-auto" ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={t('podcasts.search')}
          className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg"
          role="combobox"
          aria-label={t('podcasts.search')}
          aria-expanded={showResults && results.length > 0}
          aria-activedescendant={
            highlightedIndex >= 0 ? `podcast-option-${highlightedIndex}` : undefined
          }
        />
        <svg
          className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {showResults && loading && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10 border border-gray-200 dark:border-gray-700">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 border-b dark:border-gray-700 last:border-b-0 animate-pulse"
            >
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />
              </div>
            </div>
          ))}
        </div>
      )}

      {showResults && !loading && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10 border border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto"
          role="listbox"
        >
          {results.map((podcast, index) => (
            <button
              key={podcast.id}
              id={`podcast-option-${index}`}
              data-dropdown-item
              onClick={() => handleSelect(podcast)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`w-full text-left px-4 py-3 transition border-b dark:border-gray-700 last:border-b-0 flex items-center gap-3 ${
                index === highlightedIndex
                  ? 'bg-blue-50 dark:bg-gray-700'
                  : 'hover:bg-blue-50 dark:hover:bg-gray-700'
              }`}
              role="option"
              aria-selected={index === highlightedIndex}
            >
              {podcast.artwork ? (
                <img
                  src={podcast.artwork}
                  alt=""
                  className="w-10 h-10 rounded object-cover flex-shrink-0"
                  loading="lazy"
                />
              ) : (
                <div className="w-10 h-10 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {podcast.title}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {podcast.author}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {showNoResults && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10 border border-gray-200 dark:border-gray-700 px-4 py-6 text-center">
          <svg
            className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            {t('podcasts.noResults')}
          </p>
        </div>
      )}

      {showResults && error && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10 border border-gray-200 dark:border-gray-700 px-4 py-6 text-center">
          <p className="text-red-500 dark:text-red-400 text-sm">{t('podcasts.error')}</p>
        </div>
      )}
    </div>
  );
}
