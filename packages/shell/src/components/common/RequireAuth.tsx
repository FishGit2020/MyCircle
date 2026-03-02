import React, { useState, useEffect } from 'react';
import { useTranslation, WindowEvents } from '@mycircle/shared';
import { useAuth } from '../../context/AuthContext';
import Loading from './Loading';

interface Props {
  children: React.ReactNode;
}

export default function RequireAuth({ children }: Props) {
  const { t } = useTranslation();
  const { user, loading, signIn } = useAuth();

  // Also check the __getFirebaseIdToken bridge used by MFEs and e2e tests
  const [hasToken, setHasToken] = useState(false);
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const token = await (window as any).__getFirebaseIdToken?.();
        if (mounted) setHasToken(!!token);
      } catch {
        if (mounted) setHasToken(false);
      }
    };
    check();
    window.addEventListener(WindowEvents.AUTH_STATE_CHANGED, check);
    return () => { mounted = false; window.removeEventListener(WindowEvents.AUTH_STATE_CHANGED, check); };
  }, []);

  if (loading) return <Loading />;

  if (!user && !hasToken) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
          {t('auth.signInToAccess')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
          {t('auth.signInPrompt')}
        </p>
        <button
          type="button"
          onClick={() => signIn()}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
          </svg>
          {t('auth.continueWithGoogle')}
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
