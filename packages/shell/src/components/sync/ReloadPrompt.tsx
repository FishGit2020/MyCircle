import { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useTranslation, createLogger, isNativePlatform } from '@mycircle/shared';

const log = createLogger('ReloadPrompt');

export default function ReloadPrompt() {
  const { t } = useTranslation();
  const [reloading, setReloading] = useState(false);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      // Service workers are not supported in Capacitor's WKWebView
      if (registration && !isNativePlatform()) {
        // Safely call update — registration.update() throws InvalidStateError
        // if the SW was unregistered or evicted (common on iOS Safari)
        const tryUpdate = () => {
          registration.update().catch(() => {});
        };
        // Check for SW updates every 30 seconds
        setInterval(tryUpdate, 30_000);
        // Check for updates when user returns to the tab
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            tryUpdate();
          }
        });
      }
    },
    onRegisterError(error) {
      // Suppress SW registration errors in native (expected — WKWebView has no SW support)
      if (isNativePlatform()) return;
      log.warn('Service worker registration failed', error);
    },
  });

  const handleReload = async () => {
    setReloading(true);
    try {
      // Delete all SW caches first — prevents the still-active SW from
      // serving stale index.html (with old chunk hashes) during reload
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      const reg = await navigator.serviceWorker?.getRegistration();
      await reg?.unregister();
    } catch {
      // ignore
    }
    window.location.reload();
  };

  if (!needRefresh || isNativePlatform()) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg shadow-lg bg-blue-600 text-white text-sm w-[calc(100vw-2rem)] md:w-auto md:max-w-md"
      style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      <span className="flex-1 min-w-0">{t('pwa.newVersion')}</span>
      <button
        onClick={handleReload}
        disabled={reloading}
        className="px-3 py-1 rounded bg-white text-blue-600 font-medium hover:bg-blue-50 transition flex-shrink-0 disabled:opacity-70"
      >
        {reloading ? t('pwa.reloading') : t('pwa.reload')}
      </button>
      {!reloading && (
        <button
          onClick={() => setNeedRefresh(false)}
          className="p-1 rounded hover:bg-blue-500 transition flex-shrink-0"
          aria-label={t('pwa.dismiss')}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
