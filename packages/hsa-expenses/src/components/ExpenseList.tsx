import { useTranslation } from '@mycircle/shared';
import type { HSAExpense } from '../types';
import ExpenseCard from './ExpenseCard';

interface ExpenseListProps {
  expenses: HSAExpense[];
  onEdit: (expense: HSAExpense) => void;
  onDelete: (expense: HSAExpense) => void;
  onMarkReimbursed: (expense: HSAExpense) => void;
  onViewDetail: (expense: HSAExpense) => void;
  onAdd: () => void;
}

export default function ExpenseList({
  expenses,
  onEdit,
  onDelete,
  onMarkReimbursed,
  onViewDetail,
  onAdd,
}: ExpenseListProps) {
  const { t } = useTranslation();

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        {/* Empty state icon */}
        <svg
          className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
          />
        </svg>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          {t('hsaExpenses.noExpenses' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="min-h-[44px] min-w-[44px] px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
          aria-label={t('hsaExpenses.addExpense' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
        >
          {t('hsaExpenses.addExpense' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {expenses.map((expense) => (
        <ExpenseCard
          key={expense.id}
          expense={expense}
          onEdit={onEdit}
          onDelete={onDelete}
          onMarkReimbursed={onMarkReimbursed}
          onViewDetail={onViewDetail}
        />
      ))}
    </div>
  );
}
