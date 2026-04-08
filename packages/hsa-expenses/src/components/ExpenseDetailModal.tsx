import { useTranslation } from '@mycircle/shared';
import { type HSAExpense, HSAExpenseStatus } from '../types';
import { formatAmount, getCategoryColor, getCategoryLabelKey } from '../utils/expenseHelpers';
import ReceiptGrid from './ReceiptGrid';

interface ExpenseDetailModalProps {
  expense: HSAExpense;
  uploadingReceipt: boolean;
  trashingReceipt: boolean;
  deletingReceipt: boolean;
  onClose: () => void;
  onUploadReceipt: (file: File) => void;
  onTrashReceipt: (receiptId: string) => void;
  onRestoreReceipt: (receiptId: string) => void;
  onPermanentlyDeleteReceipt: (receiptId: string) => void;
}

export default function ExpenseDetailModal({
  expense,
  uploadingReceipt,
  trashingReceipt,
  deletingReceipt,
  onClose,
  onUploadReceipt,
  onTrashReceipt,
  onRestoreReceipt,
  onPermanentlyDeleteReceipt,
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

            {/* Receipts */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <ReceiptGrid
                receipts={expense.receipts}
                uploading={uploadingReceipt}
                trashing={trashingReceipt}
                deleting={deletingReceipt}
                onUpload={onUploadReceipt}
                onTrash={onTrashReceipt}
                onRestore={onRestoreReceipt}
                onPermanentlyDelete={onPermanentlyDeleteReceipt}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
