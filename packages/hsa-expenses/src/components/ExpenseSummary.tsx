import { useState, useMemo } from 'react';
import { useTranslation } from '@mycircle/shared';
import { HSAExpenseStatus, type HSAExpense } from '../types';
import { formatAmount, getCategoryColor, CATEGORY_OPTIONS } from '../utils/expenseHelpers';

interface ExpenseSummaryProps {
  expenses: HSAExpense[];
}

export default function ExpenseSummary({ expenses }: ExpenseSummaryProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const stats = useMemo(() => {
    let total = 0;
    let pendingTotal = 0;
    let reimbursedTotal = 0;
    const categoryTotals = new Map<string, number>();

    expenses.forEach((exp) => {
      total += exp.amountCents;
      if (exp.status === HSAExpenseStatus.PENDING) {
        pendingTotal += exp.amountCents;
      } else {
        reimbursedTotal += exp.amountCents;
      }
      const current = categoryTotals.get(exp.category) || 0;
      categoryTotals.set(exp.category, current + exp.amountCents);
    });

    return { total, pendingTotal, reimbursedTotal, categoryTotals };
  }, [expenses]);

  if (expenses.length === 0) return null;

  const countText = (t('hsaExpenses.expenseCount' as any) as string).replace('{count}', String(expenses.length)); // eslint-disable-line @typescript-eslint/no-explicit-any

  return (
    <div className="mb-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      {/* Summary Header (always visible) */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 min-h-[44px] text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
        aria-label={t('hsaExpenses.summary' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t('hsaExpenses.summary' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {countText}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {formatAmount(stats.total)}
          </span>
          <svg
            className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-gray-700 pt-3">
          {/* Pending / Reimbursed row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-3">
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                {t('hsaExpenses.pendingTotal' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
              </p>
              <p className="text-lg font-bold text-yellow-800 dark:text-yellow-200">
                {formatAmount(stats.pendingTotal)}
              </p>
            </div>
            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3">
              <p className="text-xs text-green-600 dark:text-green-400">
                {t('hsaExpenses.reimbursedTotal' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
              </p>
              <p className="text-lg font-bold text-green-800 dark:text-green-200">
                {formatAmount(stats.reimbursedTotal)}
              </p>
            </div>
          </div>

          {/* Category breakdown */}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              {t('hsaExpenses.categoryBreakdown' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </p>
            <div className="space-y-1.5">
              {CATEGORY_OPTIONS.filter((opt) => stats.categoryTotals.has(opt.value)).map((opt) => {
                const amount = stats.categoryTotals.get(opt.value) || 0;
                const pct = stats.total > 0 ? (amount / stats.total) * 100 : 0;
                return (
                  <div key={opt.value} className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium min-w-[80px] justify-center ${getCategoryColor(opt.value)}`}
                    >
                      {t(opt.labelKey as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 dark:bg-blue-400 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 min-w-[70px] text-right">
                      {formatAmount(amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
