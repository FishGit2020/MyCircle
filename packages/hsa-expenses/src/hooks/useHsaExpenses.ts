import { useCallback } from 'react';
import {
  useQuery,
  useMutation,
  GET_HSA_EXPENSES,
  ADD_HSA_EXPENSE,
  UPDATE_HSA_EXPENSE,
  DELETE_HSA_EXPENSE,
  MARK_HSA_EXPENSE_REIMBURSED,
  UPLOAD_HSA_RECEIPT,
  DELETE_HSA_RECEIPT,
} from '@mycircle/shared';
import type { HSAExpense, HSAExpenseInput, HSAExpenseUpdateInput } from '../types';
import { fileToBase64, isFileTooLarge } from '../utils/expenseHelpers';

export function useHsaExpenses() {
  const { data, loading, error, refetch } = useQuery(GET_HSA_EXPENSES, {
    fetchPolicy: 'cache-and-network',
  });

  const [addMutation, { loading: adding }] = useMutation(ADD_HSA_EXPENSE, {
    refetchQueries: [{ query: GET_HSA_EXPENSES }],
  });

  const [updateMutation, { loading: updating }] = useMutation(UPDATE_HSA_EXPENSE, {
    refetchQueries: [{ query: GET_HSA_EXPENSES }],
  });

  const [deleteMutation, { loading: deleting }] = useMutation(DELETE_HSA_EXPENSE, {
    refetchQueries: [{ query: GET_HSA_EXPENSES }],
  });

  const [markMutation] = useMutation(MARK_HSA_EXPENSE_REIMBURSED, {
    refetchQueries: [{ query: GET_HSA_EXPENSES }],
  });

  const [uploadReceiptMutation, { loading: uploadingReceipt }] = useMutation(UPLOAD_HSA_RECEIPT, {
    refetchQueries: [{ query: GET_HSA_EXPENSES }],
  });

  const [deleteReceiptMutation] = useMutation(DELETE_HSA_RECEIPT, {
    refetchQueries: [{ query: GET_HSA_EXPENSES }],
  });

  const expenses: HSAExpense[] = data?.hsaExpenses ?? [];

  const addExpense = useCallback(
    async (input: HSAExpenseInput) => {
      const result = await addMutation({ variables: { input } });
      return result.data?.addHsaExpense ?? null;
    },
    [addMutation]
  );

  const updateExpense = useCallback(
    async (id: string, input: HSAExpenseUpdateInput) => {
      await updateMutation({ variables: { id, input } });
    },
    [updateMutation]
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      await deleteMutation({ variables: { id } });
    },
    [deleteMutation]
  );

  const markReimbursed = useCallback(
    async (id: string, reimbursed: boolean) => {
      await markMutation({ variables: { id, reimbursed } });
    },
    [markMutation]
  );

  const uploadReceipt = useCallback(
    async (expenseId: string, file: File) => {
      if (isFileTooLarge(file, 5)) {
        throw new Error('File too large');
      }
      const fileBase64 = await fileToBase64(file);
      await uploadReceiptMutation({
        variables: { expenseId, fileBase64, fileName: file.name, contentType: file.type },
      });
    },
    [uploadReceiptMutation]
  );

  const deleteReceipt = useCallback(
    async (expenseId: string) => {
      await deleteReceiptMutation({ variables: { expenseId } });
    },
    [deleteReceiptMutation]
  );

  return {
    expenses,
    loading,
    error,
    adding,
    updating,
    deleting,
    uploadingReceipt,
    addExpense,
    updateExpense,
    deleteExpense,
    markReimbursed,
    uploadReceipt,
    deleteReceipt,
    refetch,
  };
}
