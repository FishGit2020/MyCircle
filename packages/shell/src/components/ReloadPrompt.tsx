import { useRegisterSW } from 'virtual:pwa-register/react';
import { useTranslation } from '@mycircle/shared';

export default function ReloadPrompt() {
  const { t } = useTranslation();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      // Check for SW updates every 60 seconds
      if (registration) {
        setInterval(() => registration.update(), 60_000);
      }
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg bg-blue-600 text-white text-sm max-w-md"
    >
      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      <span className="flex-1">{t('pwa.newVersion')}</span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="px-3 py-1 rounded bg-white text-blue-600 font-medium hover:bg-blue-50 transition"
      >
        {t('pwa.reload')}
      </button>
      <button
        onClick={() => setNeedRefresh(false)}
        className="p-1 rounded hover:bg-blue-500 transition"
        aria-label={t('pwa.dismiss')}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
