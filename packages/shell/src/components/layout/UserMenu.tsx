import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation, StorageKeys, useUnits } from '@mycircle/shared';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import type { Theme } from '../../context/ThemeContext';
import { logEvent } from '../../lib/firebase';
import type { KnownAccount } from '../../lib/firebase';
import { useNavigate } from 'react-router';
import AuthModal from './AuthModal';

const EXPORT_VERSION = 1;

// Keys to skip during export (sensitive or device-specific)
const SKIP_KEYS = new Set(['known-accounts']);

function exportUserData() {
  const data: Record<string, unknown> = {};
  const allKeys = Object.values(StorageKeys);
  for (const key of allKeys) {
    if (SKIP_KEYS.has(key)) continue;
    const value = localStorage.getItem(key);
    if (value !== null) {
      try { data[key] = JSON.parse(value); } catch { data[key] = value; }
    }
  }
  const exportObj = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
  const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mycircle-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importUserData(file: File): Promise<{ imported: number; skipped: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (!parsed.version || !parsed.data || typeof parsed.data !== 'object') {
          reject(new Error('Invalid backup file format'));
          return;
        }
        const validKeys = new Set(Object.values(StorageKeys));
        let imported = 0;
        let skipped = 0;
        for (const [key, value] of Object.entries(parsed.data)) {
          if (SKIP_KEYS.has(key) || !validKeys.has(key)) { skipped++; continue; }
          localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
          imported++;
        }
        resolve({ imported, skipped });
      } catch {
        reject(new Error('Failed to parse backup file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

function AccountAvatar({ account, size = 'sm' }: { account: { displayName: string | null; email: string | null; photoURL: string | null }; size?: 'sm' | 'md' }) {
  const px = size === 'md' ? 'w-8 h-8' : 'w-6 h-6';
  const textSize = size === 'md' ? 'text-sm' : 'text-xs';
  if (account.photoURL) {
    return (
      <img
        src={account.photoURL}
        alt={account.displayName || 'User'}
        className={`${px} rounded-full flex-shrink-0 object-cover`}
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
  const { user, loading, signOut, updateTheme, updateUnitSystem, knownAccounts, switchToAccount, removeKnownAccount } = useAuth();
  const { theme, setThemeMode } = useTheme();
  const { tempUnit, speedUnit: _speedUnit, distanceUnit, setTempUnit, setSpeedUnit, setDistanceUnit } = useUnits();
  const [isOpen, setIsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [switchingUid, setSwitchingUid] = useState<string | null>(null);
  const [passwordPromptUid, setPasswordPromptUid] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [switchError, setSwitchError] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = useCallback(() => {
    exportUserData();
    logEvent('data_export');
    setIsOpen(false);
  }, []);

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { imported } = await importUserData(file);
      setImportStatus(`${imported} items restored`);
      logEvent('data_import', { imported });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: unknown) {
      setImportStatus(err instanceof Error ? err.message : 'Import failed');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

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

  const handleThemeChange = async (newTheme: Theme) => {
    setThemeMode(newTheme);
    logEvent('theme_toggle', { new_theme: newTheme });
    if (user) {
      try { await updateTheme(newTheme); } catch { /* ignore */ }
    }
  };

  if (!user) {
    // Cycle: auto → light → dark → auto
    const nextTheme: Theme = theme === 'auto' ? 'light' : theme === 'light' ? 'dark' : 'auto';
    return (
      <>
        <button
          type="button"
          onClick={() => handleThemeChange(nextTheme)}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          aria-label={t('theme.label')}
          title={t('theme.label')}
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>
          ) : theme === 'light' ? (
            <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
          ) : (
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
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
            className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-600 flex-shrink-0 object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium flex-shrink-0">
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

          {/* Units preferences */}
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t('settings.units')}</p>
            <div className="flex rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden text-xs w-fit">
              {(['metric', 'us'] as const).map(sys => {
                const isActive = sys === 'us' ? tempUnit === 'F' && distanceUnit === 'mi' : tempUnit === 'C' && distanceUnit === 'km';
                return (
                  <button
                    key={sys}
                    type="button"
                    onClick={() => {
                      const isUS = sys === 'us';
                      setTempUnit(isUS ? 'F' : 'C');
                      setSpeedUnit(isUS ? 'mph' : 'kmh');
                      setDistanceUnit(isUS ? 'mi' : 'km');
                      if (user) updateUnitSystem(sys);
                    }}
                    className={`px-3 py-1 font-medium transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    {sys === 'us' ? t('settings.unitSystemUS') : t('settings.unitSystemMetric')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Theme */}
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t('theme.label')}</p>
            <div className="flex rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden text-xs">
              {(['light', 'auto', 'dark'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleThemeChange(mode)}
                  className={`flex-1 px-2 py-1 font-medium transition-colors ${theme === mode ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  {t(`theme.${mode}` as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                </button>
              ))}
            </div>
          </div>

          {/* Export data */}
          <button
            role="menuitem"
            type="button"
            onClick={handleExport}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {t('settings.exportData')}
          </button>

          {/* Import data */}
          <button
            role="menuitem"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {t('settings.importData')}
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />

          {importStatus && (
            <div className="px-4 py-2 text-xs text-blue-600 dark:text-blue-400">{importStatus}</div>
          )}

          {/* Quota & Billing */}
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              navigate('/quota');
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <rect x="3" y="12" width="4" height="9" rx="1" />
              <rect x="10" y="7" width="4" height="14" rx="1" />
              <rect x="17" y="3" width="4" height="18" rx="1" />
            </svg>
            {t('nav.quotaBilling')}
          </button>

          {/* Setup */}
              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  navigate('/setup');
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                {t('nav.setup')}
              </button>

          {/* Recycle Bin */}
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              navigate('/trash');
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            {t('nav.recycleBin')}
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
