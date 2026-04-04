import { useTranslation } from '@mycircle/shared';
import { HSAExpenseStatus, type HSAExpense } from '../types';
import { formatAmount, getCategoryColor, getCategoryLabelKey } from '../utils/expenseHelpers';

interface ExpenseCardProps {
  expense: HSAExpense;
  onEdit: (expense: HSAExpense) => void;
  onDelete: (expense: HSAExpense) => void;
  onMarkReimbursed: (expense: HSAExpense) => void;
  onViewDetail: (expense: HSAExpense) => void;
}

export default function ExpenseCard({
  expense,
  onEdit,
  onDelete,
  onMarkReimbursed,
  onViewDetail,
}: ExpenseCardProps) {
  const { t } = useTranslation();
  const isPending = expense.status === HSAExpenseStatus.PENDING;
  const hasReceipt = !!expense.receiptUrl;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header: Amount + Status */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {formatAmount(expense.amountCents)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
            {expense.provider}
          </p>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isPending
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
          }`}
        >
          {isPending
            ? t('hsaExpenses.pending' as any) // eslint-disable-line @typescript-eslint/no-explicit-any
            : t('hsaExpenses.reimbursed' as any) // eslint-disable-line @typescript-eslint/no-explicit-any
          }
        </span>
      </div>

      {/* Category + Date */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`}
        >
          {t(getCategoryLabelKey(expense.category) as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {expense.dateOfService}
        </span>
        {hasReceipt && (
          <span
            className="inline-flex items-center text-xs text-blue-600 dark:text-blue-400"
            title={t('hsaExpenses.receiptAttached' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
          >
            {/* Paperclip icon */}
            <svg className="w-3.5 h-3.5 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            {t('hsaExpenses.receipt' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          </span>
        )}
      </div>

      {/* Description */}
      {expense.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {expense.description}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 pt-2 border-t border-gray-100 dark:border-gray-700">
        <button
          type="button"
          onClick={() => onViewDetail(expense)}
          className="min-h-[44px] min-w-[44px] p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          aria-label={t('hsaExpenses.viewReceipt' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
          title={t('hsaExpenses.viewReceipt' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
        >
          {/* Eye icon */}
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => onMarkReimbursed(expense)}
          className={`min-h-[44px] min-w-[44px] p-2 rounded-lg transition ${
            isPending
              ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30'
              : 'text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/30'
          }`}
          aria-label={
            isPending
              ? t('hsaExpenses.markReimbursed' as any) // eslint-disable-line @typescript-eslint/no-explicit-any
              : t('hsaExpenses.markPending' as any) // eslint-disable-line @typescript-eslint/no-explicit-any
          }
          title={
            isPending
              ? t('hsaExpenses.markReimbursed' as any) // eslint-disable-line @typescript-eslint/no-explicit-any
              : t('hsaExpenses.markPending' as any) // eslint-disable-line @typescript-eslint/no-explicit-any
          }
        >
          {/* Check circle icon */}
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => onEdit(expense)}
          className="min-h-[44px] min-w-[44px] p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
          aria-label={t('hsaExpenses.editExpense' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
          title={t('hsaExpenses.editExpense' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
        >
          {/* Pencil icon */}
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => onDelete(expense)}
          className="min-h-[44px] min-w-[44px] p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
          aria-label={t('hsaExpenses.deleteExpense' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
          title={t('hsaExpenses.deleteExpense' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
        >
          {/* Trash icon */}
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
