import React, { useState } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation, createLogger } from '@mycircle/shared';

const logger = createLogger('ShareButton');

export default function ShareButton({ weatherRef }: { weatherRef: React.RefObject<HTMLDivElement | null> }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [searchParams] = useSearchParams();
  const cityName = searchParams.get('name') || 'Weather';

  const handleShareLink = async () => {
    const url = window.location.href;
    const text = `Check out the weather in ${cityName}!`;

    if (navigator.share) {
      try {
        await navigator.share({ title: `${cityName} Weather`, text, url });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
    }
  };

  const handleShareImage = async () => {
    if (!weatherRef.current || capturing) return;
    setCapturing(true);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(weatherRef.current, {
        backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        pixelRatio: 2,
      });

      // Try native share with file if supported
      if (navigator.share && navigator.canShare) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `${cityName}-weather.png`, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: `${cityName} Weather` });
            return;
          } catch { /* fall through to download */ }
        }
      }

      // Download as fallback
      const link = document.createElement('a');
      link.download = `${cityName}-weather.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      logger.error('Failed to capture weather image:', err);
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleShareLink}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
        title={t('share.shareLink')}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        <span className="hidden sm:inline">{copied ? t('share.copied') : t('share.share')}</span>
      </button>
      <button
        onClick={handleShareImage}
        disabled={capturing}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition disabled:opacity-50"
        title={t('share.saveAsImage')}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="hidden sm:inline">{capturing ? t('share.saving') : t('share.image')}</span>
      </button>
    </div>
  );
}
