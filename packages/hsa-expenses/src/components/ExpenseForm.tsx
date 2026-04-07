import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from '@mycircle/shared';
import { HSAExpenseCategory, type HSAExpense, type HSAExpenseInput } from '../types';
import { dollarsToAmountCents, CATEGORY_OPTIONS, isHeicFile, convertHeicToJpeg } from '../utils/expenseHelpers';

interface ExpenseFormProps {
  expense?: HSAExpense | null;
  saving?: boolean;
  onSubmit: (input: HSAExpenseInput, file?: File) => void;
  onCancel: () => void;
}

export default function ExpenseForm({ expense, saving, onSubmit, onCancel }: ExpenseFormProps) {
  const { t } = useTranslation();
  const isEdit = !!expense;

  const [provider, setProvider] = useState('');
  const [dateOfService, setDateOfService] = useState('');
  const [amountDollars, setAmountDollars] = useState('');
  const [category, setCategory] = useState<HSAExpenseCategory>(HSAExpenseCategory.MEDICAL);
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (expense) {
      setProvider(expense.provider);
      setDateOfService(expense.dateOfService);
      setAmountDollars((expense.amountCents / 100).toFixed(2));
      setCategory(expense.category);
      setDescription(expense.description ?? '');
    }
  }, [expense]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, boolean> = {};
    if (!provider.trim()) newErrors.provider = true;
    if (!dateOfService) newErrors.dateOfService = true;
    const cents = dollarsToAmountCents(amountDollars);
    if (cents <= 0) newErrors.amount = true;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [provider, dateOfService, amountDollars]);

  const handleAttachFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (attachInputRef.current) attachInputRef.current.value = '';
    if (!file) return;
    setFileError(null);
    let processedFile = file;
    if (isHeicFile(file)) {
      try {
        processedFile = await convertHeicToJpeg(file);
      } catch {
        setFileError(t('hsaExpenses.invalidFileType' as any)); // eslint-disable-line @typescript-eslint/no-explicit-any
        return;
      }
    }
    const ALLOWED = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!ALLOWED.includes(processedFile.type)) {
      setFileError(t('hsaExpenses.invalidFileType' as any)); // eslint-disable-line @typescript-eslint/no-explicit-any
      return;
    }
    if (processedFile.size > 5 * 1024 * 1024) {
      setFileError(t('hsaExpenses.fileTooLarge' as any)); // eslint-disable-line @typescript-eslint/no-explicit-any
      return;
    }
    setPendingFile(processedFile);
  }, [t]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const input: HSAExpenseInput = {
      provider: provider.trim(),
      dateOfService,
      amountCents: dollarsToAmountCents(amountDollars),
      category,
    };
    if (description.trim()) {
      input.description = description.trim();
    }
    onSubmit(input, pendingFile ?? undefined);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onCancel();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? t('hsaExpenses.editExpense' as any) : t('hsaExpenses.addExpense' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
    >
      <div className="w-full max-w-lg rounded-xl bg-white dark:bg-gray-800 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {isEdit
              ? t('hsaExpenses.editExpense' as any) // eslint-disable-line @typescript-eslint/no-explicit-any
              : t('hsaExpenses.addExpense' as any) // eslint-disable-line @typescript-eslint/no-explicit-any
            }
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Provider */}
            <div>
              <label
                htmlFor="hsa-provider"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('hsaExpenses.provider' as any)} * {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
              </label>
              <input
                id="hsa-provider"
                type="text"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                aria-label={t('hsaExpenses.provider' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
                className={`w-full rounded-lg border px-3 py-2 min-h-[44px] text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.provider
                    ? 'border-red-500 dark:border-red-400'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="e.g. Dr. Smith"
              />
            </div>

            {/* Date of Service */}
            <div>
              <label
                htmlFor="hsa-date"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('hsaExpenses.dateOfService' as any)} * {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
              </label>
              <input
                id="hsa-date"
                type="date"
                value={dateOfService}
                onChange={(e) => setDateOfService(e.target.value)}
                aria-label={t('hsaExpenses.dateOfService' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
                className={`w-full rounded-lg border px-3 py-2 min-h-[44px] text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.dateOfService
                    ? 'border-red-500 dark:border-red-400'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              />
            </div>

            {/* Amount */}
            <div>
              <label
                htmlFor="hsa-amount"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('hsaExpenses.amount' as any)} * {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  $
                </span>
                <input
                  id="hsa-amount"
                  type="text"
                  inputMode="decimal"
                  value={amountDollars}
                  onChange={(e) => setAmountDollars(e.target.value)}
                  aria-label={t('hsaExpenses.amount' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
                  className={`w-full rounded-lg border pl-7 pr-3 py-2 min-h-[44px] text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.amount
                      ? 'border-red-500 dark:border-red-400'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="hsa-category"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('hsaExpenses.category' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
              </label>
              <select
                id="hsa-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as HSAExpenseCategory)}
                aria-label={t('hsaExpenses.category' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 min-h-[44px] text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {t(opt.labelKey as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="hsa-description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('hsaExpenses.description' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
              </label>
              <textarea
                id="hsa-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                aria-label={t('hsaExpenses.description' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Optional notes..."
              />
            </div>

            {/* Receipt attachment — only shown when creating a new expense */}
            {!isEdit && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('hsaExpenses.receipt' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                </p>
                {pendingFile ? (
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                    <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">{pendingFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setPendingFile(null)}
                      className="min-h-[28px] min-w-[28px] flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition"
                      aria-label={t('hsaExpenses.cancel' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => attachInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition"
                    aria-label={t('hsaExpenses.uploadReceipt' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="text-sm">{t('hsaExpenses.uploadReceipt' as any)}</span> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                  </button>
                )}
                <input
                  ref={attachInputRef}
                  type="file"
                  accept="image/jpeg,image/png,application/pdf,image/heic,image/heif,.heic,.heif"
                  onChange={handleAttachFile}
                  className="hidden"
                  aria-hidden="true"
                />
                {fileError && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fileError}</p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="min-h-[44px] min-w-[44px] px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                aria-label={t('hsaExpenses.cancel' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
              >
                {t('hsaExpenses.cancel' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="min-h-[44px] min-w-[44px] px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                aria-label={saving ? t('hsaExpenses.saving' as any) : t('hsaExpenses.save' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
              >
                {saving
                  ? t('hsaExpenses.saving' as any) // eslint-disable-line @typescript-eslint/no-explicit-any
                  : t('hsaExpenses.save' as any) // eslint-disable-line @typescript-eslint/no-explicit-any
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
