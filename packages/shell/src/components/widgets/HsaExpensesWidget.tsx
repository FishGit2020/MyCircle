import React from 'react';
import { useTranslation } from '@mycircle/shared';
import { useNavigate } from 'react-router';

const HsaExpensesWidget = React.memo(function HsaExpensesWidget() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate('/hsa-expenses')}
      className="w-full text-left"
    >
      <div className="flex items-center justify-between mb-1">
        <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.hsaExpenses' as any)}</h4> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.hsaExpensesDesc' as any)}</p> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{t('hsaExpenses.pending' as any)}: 0</p> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
    </button>
  );
});

export default HsaExpensesWidget;
