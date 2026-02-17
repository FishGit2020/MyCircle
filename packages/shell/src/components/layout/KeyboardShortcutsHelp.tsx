import { useEffect, useRef } from 'react';
import { useTranslation } from '@mycircle/shared';

interface Props {
  open: boolean;
  onClose: () => void;
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600">
      {children}
    </kbd>
  );
}

function ShortcutRow({ keys, label }: { keys: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      <span className="flex items-center gap-1 ml-4">{keys}</span>
    </div>
  );
}

export default function KeyboardShortcutsHelp({ open, onClose }: Props) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Focus trap
  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const isMac = navigator.platform?.toLowerCase().includes('mac');
  const modKey = isMac ? '⌘' : 'Ctrl';

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('shortcuts.title')}
        tabIndex={-1}
        className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden focus:outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('shortcuts.title')}</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={t('shortcuts.closeModal')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
          {/* Actions */}
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
            {t('shortcuts.actions')}
          </h3>
          <ShortcutRow keys={<><Kbd>{modKey}</Kbd><span className="text-gray-400">+</span><Kbd>K</Kbd></>} label={t('shortcuts.commandPalette')} />
          <ShortcutRow keys={<><Kbd>{modKey}</Kbd><span className="text-gray-400">+</span><Kbd>D</Kbd></>} label={t('shortcuts.toggleTheme')} />
          <ShortcutRow keys={<Kbd>?</Kbd>} label={t('shortcuts.showShortcuts')} />
          <ShortcutRow keys={<Kbd>Esc</Kbd>} label={t('shortcuts.closeModal')} />

          <div className="my-3 border-t border-gray-200 dark:border-gray-700" />

          {/* Navigation */}
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
            {t('shortcuts.navigation')}
          </h3>
          <ShortcutRow keys={<><Kbd>g</Kbd><Kbd>h</Kbd></>} label={t('shortcuts.goHome')} />
          <ShortcutRow keys={<><Kbd>g</Kbd><Kbd>w</Kbd></>} label={t('shortcuts.goWeather')} />
          <ShortcutRow keys={<><Kbd>g</Kbd><Kbd>s</Kbd></>} label={t('shortcuts.goStocks')} />
          <ShortcutRow keys={<><Kbd>g</Kbd><Kbd>p</Kbd></>} label={t('shortcuts.goPodcasts')} />
          <ShortcutRow keys={<><Kbd>g</Kbd><Kbd>b</Kbd></>} label={t('shortcuts.goBible')} />
          <ShortcutRow keys={<><Kbd>g</Kbd><Kbd>o</Kbd></>} label={t('shortcuts.goWorship')} />
          <ShortcutRow keys={<><Kbd>g</Kbd><Kbd>n</Kbd></>} label={t('shortcuts.goNotebook')} />
          <ShortcutRow keys={<><Kbd>g</Kbd><Kbd>y</Kbd></>} label={t('shortcuts.goBaby')} />
          <ShortcutRow keys={<><Kbd>g</Kbd><Kbd>e</Kbd></>} label={t('shortcuts.goEnglish')} />
          <ShortcutRow keys={<><Kbd>g</Kbd><Kbd>c</Kbd></>} label={t('shortcuts.goChinese')} />
          <ShortcutRow keys={<><Kbd>g</Kbd><Kbd>a</Kbd></>} label={t('shortcuts.goAi')} />
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500 text-center">
          {t('commandPalette.hint')}
        </div>
      </div>
    </div>
  );
}
