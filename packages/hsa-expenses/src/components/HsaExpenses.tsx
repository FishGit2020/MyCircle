import { useState, useMemo, useCallback } from 'react';
import { PageContent, useTranslation, useQuery, GET_NAS_CONNECTION_STATUS } from '@mycircle/shared';
import { useHsaExpenses } from '../hooks/useHsaExpenses';
import {
  HSAExpenseCategory,
  HSAExpenseStatus,
  type HSAExpense,
  type HSAExpenseInput,
} from '../types';
import ExpenseForm from './ExpenseForm';
import ExpenseList from './ExpenseList';
import ExpenseDetailModal from './ExpenseDetailModal';
import SearchFilterBar from './SearchFilterBar';
import ExpenseSummary from './ExpenseSummary';

declare global {
  interface Window {
    __currentUid?: string | null;
  }
}

export default function HsaExpenses() {
  const { t } = useTranslation();
  const {
    expenses,
    loading,
    error,
    adding,
    updating,
    deleting,
    uploadingReceipt,
    trashingReceipt,
    deletingReceipt,
    addExpense,
    updateExpense,
    deleteExpense,
    markReimbursed,
    uploadReceipt,
    trashReceipt,
    restoreReceipt,
    permanentlyDeleteReceipt,
    backupToNas,
    backingUpToNas,
  } = useHsaExpenses();

  // NAS connection status
  const { data: nasData } = useQuery(GET_NAS_CONNECTION_STATUS);
  const nasConnected = nasData?.nasConnectionStatus?.status === 'connected';
  const [backupResult, setBackupResult] = useState<{ totalExpenses: number; totalReceipts: number } | null>(null);

  // UI state
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<HSAExpense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<HSAExpense | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<HSAExpense | null>(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<HSAExpenseCategory | ''>('');
  const [yearFilter, setYearFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<HSAExpenseStatus | ''>('');

  // Auth check (read at call-time, not cached)
  const isAuthenticated = !!window.__currentUid;

  // Client-side filtering
  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    // Search by provider
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (exp) =>
          exp.provider.toLowerCase().includes(q) ||
          (exp.description && exp.description.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (categoryFilter) {
      result = result.filter((exp) => exp.category === categoryFilter);
    }

    // Year filter
    if (yearFilter) {
      result = result.filter((exp) => exp.dateOfService?.startsWith(yearFilter));
    }

    // Status filter
    if (statusFilter) {
      result = result.filter((exp) => exp.status === statusFilter);
    }

    // Sort by date descending
    result.sort((a, b) => b.dateOfService.localeCompare(a.dateOfService));

    return result;
  }, [expenses, search, categoryFilter, yearFilter, statusFilter]);

  // Handlers
  const handleAdd = useCallback(() => {
    setEditingExpense(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((expense: HSAExpense) => {
    setEditingExpense(expense);
    setShowForm(true);
  }, []);

  const handleFormSubmit = useCallback(
    async (input: HSAExpenseInput, file?: File) => {
      if (editingExpense) {
        await updateExpense(editingExpense.id, input);
      } else {
        const newExpense = await addExpense(input);
        if (file && newExpense?.id) {
          await uploadReceipt(newExpense.id, file);
        }
      }
      setShowForm(false);
      setEditingExpense(null);
    },
    [editingExpense, updateExpense, addExpense, uploadReceipt]
  );

  const handleFormCancel = useCallback(() => {
    setShowForm(false);
    setEditingExpense(null);
  }, []);

  const handleDelete = useCallback((expense: HSAExpense) => {
    setDeleteConfirm(expense);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (deleteConfirm) {
      await deleteExpense(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  }, [deleteConfirm, deleteExpense]);

  const handleMarkReimbursed = useCallback(
    async (expense: HSAExpense) => {
      const newReimbursed = expense.status === HSAExpenseStatus.PENDING;
      await markReimbursed(expense.id, newReimbursed);
    },
    [markReimbursed]
  );

  const handleViewDetail = useCallback((expense: HSAExpense) => {
    setViewingExpense(expense);
  }, []);

  const handleUploadReceipt = useCallback(
    async (file: File) => {
      if (viewingExpense) {
        await uploadReceipt(viewingExpense.id, file);
      }
    },
    [viewingExpense, uploadReceipt],
  );

  const handleTrashReceipt = useCallback(
    async (receiptId: string) => {
      if (viewingExpense) {
        await trashReceipt(viewingExpense.id, receiptId);
      }
    },
    [viewingExpense, trashReceipt],
  );

  const handleRestoreReceipt = useCallback(
    async (receiptId: string) => {
      if (viewingExpense) {
        await restoreReceipt(viewingExpense.id, receiptId);
      }
    },
    [viewingExpense, restoreReceipt],
  );

  const handlePermanentlyDeleteReceipt = useCallback(
    async (receiptId: string) => {
      if (viewingExpense) {
        await permanentlyDeleteReceipt(viewingExpense.id, receiptId);
      }
    },
    [viewingExpense, permanentlyDeleteReceipt],
  );

  const handleBackupToNas = useCallback(async () => {
    setBackupResult(null);
    const result = await backupToNas();
    if (result) {
      setBackupResult({ totalExpenses: result.totalExpenses, totalReceipts: result.totalReceipts });
    }
  }, [backupToNas]);

  // Keep viewingExpense in sync with refetched data
  const currentViewingExpense = useMemo(() => {
    if (!viewingExpense) return null;
    return expenses.find((e) => e.id === viewingExpense.id) || viewingExpense;
  }, [viewingExpense, expenses]);

  // Loading state
  if (loading && expenses.length === 0) {
    return (
      <PageContent>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('hsaExpenses.title' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          </h1>
        </div>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </PageContent>
    );
  }

  // Auth gate
  if (!isAuthenticated) {
    return (
      <PageContent>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('hsaExpenses.title' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Sign in to track your HSA expenses.
        </p>
      </PageContent>
    );
  }

  return (
    <PageContent>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('hsaExpenses.title' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </h1>
        <div className="flex items-center gap-2">
          {nasConnected && expenses.length > 0 && (
            <button
              type="button"
              onClick={handleBackupToNas}
              disabled={backingUpToNas}
              className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] text-sm font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition disabled:opacity-50"
              aria-label={t('hsaExpenses.backupToNas' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
            >
              {backingUpToNas ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              )}
              {backingUpToNas ? t('hsaExpenses.backingUp' as any) : t('hsaExpenses.backupToNas' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </button>
          )}
          <button
            type="button"
            onClick={handleAdd}
            className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            aria-label={t('hsaExpenses.addExpense' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {t('hsaExpenses.addExpense' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          </button>
        </div>
      </div>

      {/* Backup success message */}
      {backupResult && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-sm flex items-center justify-between">
          <span>
            {(t('hsaExpenses.backupSuccess' as any) as string) // eslint-disable-line @typescript-eslint/no-explicit-any
              .replace('{expenses}', String(backupResult.totalExpenses))
              .replace('{receipts}', String(backupResult.totalReceipts))}
          </span>
          <button type="button" onClick={() => setBackupResult(null)} className="text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-200 min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Dismiss">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
          {error.message}
        </div>
      )}

      {/* Search & Filters */}
      <SearchFilterBar
        expenses={expenses}
        search={search}
        onSearchChange={setSearch}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        yearFilter={yearFilter}
        onYearFilterChange={setYearFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {/* Summary */}
      <ExpenseSummary expenses={filteredExpenses} />

      {/* Expense List */}
      <ExpenseList
        expenses={filteredExpenses}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onMarkReimbursed={handleMarkReimbursed}
        onViewDetail={handleViewDetail}
        onAdd={handleAdd}
      />

      {/* Add/Edit Form Modal */}
      {showForm && (
        <ExpenseForm
          expense={editingExpense}
          saving={adding || updating || uploadingReceipt || trashingReceipt}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}

      {/* Detail Modal */}
      {currentViewingExpense && (
        <ExpenseDetailModal
          expense={currentViewingExpense}
          uploadingReceipt={uploadingReceipt}
          trashingReceipt={trashingReceipt}
          deletingReceipt={deletingReceipt}
          onClose={() => setViewingExpense(null)}
          onUploadReceipt={handleUploadReceipt}
          onTrashReceipt={handleTrashReceipt}
          onRestoreReceipt={handleRestoreReceipt}
          onPermanentlyDeleteReceipt={handlePermanentlyDeleteReceipt}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteConfirm(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-label={t('hsaExpenses.deleteExpense' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
        >
          <div className="w-full max-w-sm rounded-xl bg-white dark:bg-gray-800 shadow-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {t('hsaExpenses.deleteExpense' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('hsaExpenses.deleteConfirm' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="min-h-[44px] min-w-[44px] px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                aria-label={t('hsaExpenses.cancel' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
              >
                {t('hsaExpenses.cancel' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="min-h-[44px] min-w-[44px] px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
                aria-label={t('hsaExpenses.deleteExpense' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
              >
                {deleting
                  ? t('hsaExpenses.saving' as any) // eslint-disable-line @typescript-eslint/no-explicit-any
                  : t('hsaExpenses.deleteExpense' as any) // eslint-disable-line @typescript-eslint/no-explicit-any
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContent>
  );
}
