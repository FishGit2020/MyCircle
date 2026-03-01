import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@mycircle/shared';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { logEvent } from '../../lib/firebase';
import type { KnownAccount } from '../../lib/firebase';
import AuthModal from './AuthModal';

function AccountAvatar({ account, size = 'sm' }: { account: { displayName: string | null; email: string | null; photoURL: string | null }; size?: 'sm' | 'md' }) {
  const px = size === 'md' ? 'w-8 h-8' : 'w-6 h-6';
  const textSize = size === 'md' ? 'text-sm' : 'text-xs';
  if (account.photoURL) {
    return (
      <img
        src={account.photoURL}
        alt={account.displayName || 'User'}
        className={`${px} rounded-full flex-shrink-0`}
      />
    );
  }
  return (
    <div className={`${px} rounded-full bg-blue-500 flex items-center justify-center text-white font-medium flex-shrink-0 ${textSize}`}>
      {account.displayName?.charAt(0) || account.email?.charAt(0) || 'U'}
    </div>
  );
}

export default function UserMenu() {
  const { t } = useTranslation();
  const { user, loading, signOut, updateDarkMode, knownAccounts, switchToAccount, removeKnownAccount } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [switchingUid, setSwitchingUid] = useState<string | null>(null);
  const [passwordPromptUid, setPasswordPromptUid] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [switchError, setSwitchError] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setPasswordPromptUid(null);
        setPassword('');
        setSwitchError('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (passwordPromptUid && passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, [passwordPromptUid]);

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
    );
  }

  const handleThemeToggle = async () => {
    const newDarkMode = theme === 'light';
    toggleTheme();
    logEvent('theme_toggle', { new_theme: newDarkMode ? 'dark' : 'light' });
    if (user) {
      try { await updateDarkMode(newDarkMode); } catch { /* ignore */ }
    }
  };

  if (!user) {
    return (
      <>
        <button
          onClick={handleThemeToggle}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? (
            <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
          ) : (
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>
          )}
        </button>
        <button
          onClick={() => setAuthModalOpen(true)}
          className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="hidden sm:inline">{t('auth.signIn')}</span>
        </button>
        <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </>
    );
  }

  const otherAccounts = knownAccounts.filter((a) => a.uid !== user.uid).sort((a, b) => b.lastSignedInAt - a.lastSignedInAt);

  const handleSwitchAccount = async (account: KnownAccount) => {
    if (account.providerId === 'password') {
      setPasswordPromptUid(account.uid);
      setPassword('');
      setSwitchError('');
      return;
    }
    setSwitchingUid(account.uid);
    try {
      await switchToAccount(account);
      setIsOpen(false);
    } catch {
      setSwitchingUid(null);
    }
  };

  const handlePasswordSwitch = async (account: KnownAccount) => {
    setSwitchingUid(account.uid);
    setSwitchError('');
    try {
      await switchToAccount(account, password);
      setIsOpen(false);
      setPasswordPromptUid(null);
      setPassword('');
    } catch {
      setSwitchError(t('auth.errorInvalidCredential'));
      setSwitchingUid(null);
    }
  };

  const handleRemoveAccount = (uid: string) => {
    if (window.confirm(t('auth.accountRemoveConfirm'))) {
      removeKnownAccount(uid);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center p-1.5 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={t('auth.userMenu')}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'User'}
            className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-600"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
            {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
          </div>
        )}
      </button>

      {isOpen && (
        <div role="menu" className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
          {/* Current account */}
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <AccountAvatar account={user} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                  {user.displayName || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
              <span className="text-xs text-green-600 dark:text-green-400 font-medium flex-shrink-0">
                {t('auth.currentAccount')}
              </span>
            </div>
          </div>

          {/* Other accounts */}
          {otherAccounts.length > 0 && (
            <div className="border-b border-gray-200 dark:border-gray-700">
              {otherAccounts.map((account) => (
                <div key={account.uid}>
                  <div className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <button
                      type="button"
                      onClick={() => handleSwitchAccount(account)}
                      disabled={switchingUid === account.uid}
                      className="flex items-center gap-2 min-w-0 flex-1 text-left"
                      aria-label={`Switch to ${account.displayName || account.email}`}
                    >
                      <AccountAvatar account={account} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-800 dark:text-white truncate">
                          {switchingUid === account.uid ? t('auth.switchingAccount') : (account.displayName || 'User')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {account.email}
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveAccount(account.uid)}
                      className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0"
                      aria-label={t('auth.removeAccount')}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Inline password prompt for email accounts */}
                  {passwordPromptUid === account.uid && (
                    <div className="px-4 pb-2">
                      <div className="flex gap-1">
                        <input
                          ref={passwordInputRef}
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && password) handlePasswordSwitch(account);
                            if (e.key === 'Escape') { setPasswordPromptUid(null); setPassword(''); setSwitchError(''); }
                          }}
                          placeholder={t('auth.enterPassword')}
                          className="flex-1 min-w-0 text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400"
                        />
                        <button
                          type="button"
                          onClick={() => handlePasswordSwitch(account)}
                          disabled={!password || switchingUid === account.uid}
                          className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {t('auth.switchButton')}
                        </button>
                      </div>
                      {switchError && (
                        <p className="text-xs text-red-500 mt-1">{switchError}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add another account */}
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              if (knownAccounts.length >= 5) return;
              setAuthModalOpen(true);
              setIsOpen(false);
            }}
            disabled={knownAccounts.length >= 5}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {knownAccounts.length >= 5 ? t('auth.maxAccountsReached') : t('auth.addAnotherAccount')}
          </button>

          {/* Theme toggle */}
          <button
            role="menuitem"
            type="button"
            onClick={handleThemeToggle}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            {theme === 'light' ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
            ) : (
              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>
            )}
            {theme === 'light' ? t('theme.dark') : t('theme.light')}
          </button>

          {/* Sign out */}
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              signOut();
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {t('auth.signOut')}
          </button>
        </div>
      )}
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}
