import React, { useState } from 'react';
import { useTranslation } from '@mycircle/shared';

interface Props {
  onAdd: (data: { receiptNumber: string; formType: string; nickname: string }) => Promise<void>;
  onCancel: () => void;
}

const FORM_TYPES = ['I-485', 'I-765', 'I-131', 'I-140', 'I-130', 'I-20', 'I-539', 'Other'];

export default function AddCaseForm({ onAdd, onCancel }: Props) {
  const { t } = useTranslation();
  const [receiptNumber, setReceiptNumber] = useState('');
  const [formType, setFormType] = useState('I-485');
  const [nickname, setNickname] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = receiptNumber.trim().toUpperCase();
    if (!trimmed) return;

    // Basic validation: USCIS receipt numbers are 3 letters + 10 digits (e.g., IOE0912345678)
    if (!/^[A-Z]{3}\d{10}$/.test(trimmed)) {
      setError(t('immigration.invalidReceipt'));
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onAdd({ receiptNumber: trimmed, formType, nickname: nickname.trim() });
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setError(err.message || t('immigration.addError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div>
        <label htmlFor="receipt-number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('immigration.receiptNumber')}
        </label>
        <input
          id="receipt-number"
          type="text"
          value={receiptNumber}
          onChange={e => setReceiptNumber(e.target.value)}
          placeholder="IOE0912345678"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
          maxLength={13}
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="form-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('immigration.formType')}
          </label>
          <select
            id="form-type"
            value={formType}
            onChange={e => setFormType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {FORM_TYPES.map(ft => (
              <option key={ft} value={ft}>{ft}</option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label htmlFor="case-nickname" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('immigration.nickname')}
          </label>
          <input
            id="case-nickname"
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder={t('immigration.nicknamePlaceholder')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
        >
          {t('immigration.cancel')}
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {submitting ? t('immigration.adding') : t('immigration.addCase')}
        </button>
      </div>
    </form>
  );
}
