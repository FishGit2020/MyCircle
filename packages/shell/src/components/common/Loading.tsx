import React from 'react';
import { useTranslation } from '@mycircle/shared';

export default function Loading() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      <span className="sr-only">{t('app.loading')}</span>
    </div>
  );
}
