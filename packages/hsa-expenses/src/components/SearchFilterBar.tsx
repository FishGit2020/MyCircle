import { useMemo } from 'react';
import { useTranslation } from '@mycircle/shared';
import { HSAExpenseCategory, HSAExpenseStatus, type HSAExpense } from '../types';
import { CATEGORY_OPTIONS } from '../utils/expenseHelpers';

interface SearchFilterBarProps {
  expenses: HSAExpense[];
  search: string;
  onSearchChange: (value: string) => void;
  categoryFilter: HSAExpenseCategory | '';
  onCategoryFilterChange: (value: HSAExpenseCategory | '') => void;
  yearFilter: string;
  onYearFilterChange: (value: string) => void;
  statusFilter: HSAExpenseStatus | '';
  onStatusFilterChange: (value: HSAExpenseStatus | '') => void;
}

export default function SearchFilterBar({
  expenses,
  search,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  yearFilter,
  onYearFilterChange,
  statusFilter,
  onStatusFilterChange,
}: SearchFilterBarProps) {
  const { t } = useTranslation();

  const years = useMemo(() => {
    const yearSet = new Set<string>();
    expenses.forEach((exp) => {
      const year = exp.dateOfService?.substring(0, 4);
      if (year) yearSet.add(year);
    });
    return Array.from(yearSet).sort().reverse();
  }, [expenses]);

  return (
    <div className="flex flex-col md:flex-row gap-3 mb-4">
      {/* Search input */}
      <div className="flex-1">
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('hsaExpenses.searchPlaceholder' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
          aria-label={t('hsaExpenses.searchPlaceholder' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 min-h-[44px] text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Category filter */}
      <select
        value={categoryFilter}
        onChange={(e) => onCategoryFilterChange(e.target.value as HSAExpenseCategory | '')}
        aria-label={t('hsaExpenses.filterCategory' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
        className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 min-h-[44px] text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">
          {t('hsaExpenses.allCategories' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </option>
        {CATEGORY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {t(opt.labelKey as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          </option>
        ))}
      </select>

      {/* Year filter */}
      <select
        value={yearFilter}
        onChange={(e) => onYearFilterChange(e.target.value)}
        aria-label={t('hsaExpenses.filterYear' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
        className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 min-h-[44px] text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">
          {t('hsaExpenses.allYears' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </option>
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>

      {/* Status filter */}
      <select
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value as HSAExpenseStatus | '')}
        aria-label={t('hsaExpenses.filterStatus' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
        className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 min-h-[44px] text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">
          {t('hsaExpenses.allStatuses' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </option>
        <option value={HSAExpenseStatus.PENDING}>
          {t('hsaExpenses.pending' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </option>
        <option value={HSAExpenseStatus.REIMBURSED}>
          {t('hsaExpenses.reimbursed' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </option>
      </select>
    </div>
  );
}
