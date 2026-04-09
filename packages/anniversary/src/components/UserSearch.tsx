import { useState, useEffect, useRef } from 'react';
import { useTranslation, useLazyQuery, SEARCH_USERS } from '@mycircle/shared';
import type { SearchUsersQuery, SearchUsersQueryVariables } from '@mycircle/shared';

interface UserSearchProps {
  onSelect: (uid: string) => void;
  excludeUids?: string[];
}

export default function UserSearch({ onSelect, excludeUids = [] }: UserSearchProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [searchUsers, { data, loading }] = useLazyQuery<SearchUsersQuery, SearchUsersQueryVariables>(SEARCH_USERS);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (email.length >= 3) {
      timerRef.current = setTimeout(() => {
        searchUsers({ variables: { query: email } });
        setShowDropdown(true);
      }, 300);
    } else {
      setShowDropdown(false);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [email, searchUsers]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const results = (data?.searchUsers ?? []).filter(u => !excludeUids.includes(u.uid));

  return (
    <div ref={containerRef} className="relative">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t('anniversary.searchByEmail' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
        aria-label={t('anniversary.searchByEmail' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
        className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
      />

      {showDropdown && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {loading && (
            <p className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              {t('anniversary.searching' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </p>
          )}
          {!loading && results.length === 0 && (
            <p className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              {t('anniversary.noResults' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </p>
          )}
          {results.map((user) => (
            <button
              key={user.uid}
              type="button"
              onClick={() => {
                onSelect(user.uid);
                setEmail('');
                setShowDropdown(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px]"
            >
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {user.displayName ?? user.email}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
