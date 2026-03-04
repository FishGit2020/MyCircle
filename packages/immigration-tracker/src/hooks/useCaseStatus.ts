import { useState, useCallback } from 'react';
import { useLazyQuery, CHECK_CASE_STATUS } from '@mycircle/shared';
import type { CaseStatus } from '../types';

export function useCaseStatus() {
  const [statuses, setStatuses] = useState<Map<string, CaseStatus>>(new Map());
  const [loadingReceipt, setLoadingReceipt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [executeQuery] = useLazyQuery(CHECK_CASE_STATUS, {
    fetchPolicy: 'network-only',
  });

  const fetchStatus = useCallback(async (receiptNumber: string) => {
    setLoadingReceipt(receiptNumber);
    setError(null);
    try {
      const { data, error: gqlError } = await executeQuery({
        variables: { receiptNumber },
      });

      if (gqlError) throw new Error(gqlError.message);
      if (!data?.checkCaseStatus) throw new Error('No data returned');

      const result = data.checkCaseStatus as CaseStatus;
      setStatuses(prev => {
        const next = new Map(prev);
        next.set(receiptNumber, result);
        return next;
      });
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch status');
      return null;
    } finally {
      setLoadingReceipt(null);
    }
  }, [executeQuery]);

  return {
    statuses,
    loadingReceipt,
    error,
    fetchStatus,
  };
}
