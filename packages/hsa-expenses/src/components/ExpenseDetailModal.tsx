import { useTranslation } from '@mycircle/shared';
import { type HSAExpense, HSAExpenseStatus } from '../types';
import { formatAmount, getCategoryColor, getCategoryLabelKey } from '../utils/expenseHelpers';
import ReceiptUpload from './ReceiptUpload';

interface ExpenseDetailModalProps {
  expense: HSAExpense;
  uploadingReceipt: boolean;
  onClose: () => void;
  onUploadReceipt: (file: File) => void;
  onDeleteReceipt: () => void;
}

export default function ExpenseDetailModal({
  expense,
  uploadingReceipt,
  onClose,
  onUploadReceipt,
  onDeleteReceipt,
}: ExpenseDetailModalProps) {
  const { t } = useTranslation();
  const isPending = expense.status === HSAExpenseStatus.PENDING;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={expense.provider}
    >
      <div className="w-full max-w-lg rounded-xl bg-white dark:bg-gray-800 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {expense.provider}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {expense.dateOfService}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              aria-label={t('hsaExpenses.cancel' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Details */}
          <div className="space-y-4">
            {/* Amount */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t('hsaExpenses.amount' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
              </span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatAmount(expense.amountCents)}
              </span>
            </div>

            {/* Category */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t('hsaExpenses.category' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`}
              >
                {t(getCategoryLabelKey(expense.category) as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
              </span>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t('hsaExpenses.status' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
              </span>
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

            {/* Description */}
            {expense.description && (
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400 block mb-1">
                  {t('hsaExpenses.description' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                </span>
                <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  {expense.description}
                </p>
              </div>
            )}

            {/* Receipt Section */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              {expense.receiptUrl && expense.receiptContentType?.startsWith('image/') ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('hsaExpenses.receipt' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                  </p>
                  <img
                    src={expense.receiptUrl}
                    alt={t('hsaExpenses.receipt' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
                    className="max-w-full rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={expense.receiptUrl}
                      download
                      className="inline-flex items-center gap-2 px-3 py-2 min-h-[44px] text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
                      aria-label={t('hsaExpenses.downloadReceipt' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {t('hsaExpenses.downloadReceipt' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                    </a>
                    <button
                      type="button"
                      onClick={onDeleteReceipt}
                      className="min-h-[44px] min-w-[44px] px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                      aria-label={t('hsaExpenses.deleteExpense' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
                    >
                      {t('hsaExpenses.deleteExpense' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                    </button>
                  </div>
                </div>
              ) : expense.receiptUrl && expense.receiptContentType === 'application/pdf' ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('hsaExpenses.receipt' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                  </p>
                  <a
                    href={expense.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
                    aria-label={t('hsaExpenses.viewReceipt' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {t('hsaExpenses.viewReceipt' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                  </a>
                  <button
                    type="button"
                    onClick={onDeleteReceipt}
                    className="min-h-[44px] min-w-[44px] ml-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                    aria-label={t('hsaExpenses.deleteExpense' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
                  >
                    {t('hsaExpenses.deleteExpense' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                  </button>
                </div>
              ) : (
                <ReceiptUpload
                  receiptUrl={null}
                  receiptContentType={null}
                  uploading={uploadingReceipt}
                  onUpload={onUploadReceipt}
                  onDelete={onDeleteReceipt}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
