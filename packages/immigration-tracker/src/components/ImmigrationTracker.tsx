import React, { useState, useEffect } from 'react';
import { useTranslation, PageContent } from '@mycircle/shared';
import { useCases } from '../hooks/useCases';
import { useCaseStatus } from '../hooks/useCaseStatus';
import AddCaseForm from './AddCaseForm';
import CaseCard from './CaseCard';

export default function ImmigrationTracker() {
  const { t } = useTranslation();
  const { cases, loading, isAuthenticated, authChecked, addCase, deleteCase } = useCases();
  const { statuses, loadingReceipt, error, fetchStatus } = useCaseStatus();
  const [showAddForm, setShowAddForm] = useState(false);

  // Auto-fetch status for all cases on mount
  useEffect(() => {
    if (isAuthenticated && cases.length > 0) {
      cases.forEach(c => {
        if (!statuses.has(c.receiptNumber)) {
          fetchStatus(c.receiptNumber);
        }
      });
    }
  }, [isAuthenticated, cases.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!authChecked || loading) {
    return (
      <PageContent>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('immigration.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('immigration.subtitle')}</p>
        </div>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </PageContent>
    );
  }

  if (!isAuthenticated) {
    return (
      <PageContent>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{t('immigration.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400">{t('immigration.signInRequired')}</p>
      </PageContent>
    );
  }

  return (
    <PageContent>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('immigration.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('immigration.subtitle')}</p>
        </div>
        {!showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {t('immigration.addCase')}
          </button>
        )}
      </div>

      {/* Add case form */}
      {showAddForm && (
        <div className="mb-6">
          <AddCaseForm
            onAdd={async (data) => {
              window.__logAnalyticsEvent?.('immigration_case_save', { case_type: data.caseType || 'unknown' });
              await addCase(data);
              setShowAddForm(false);
            }}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg">
          {error}
        </div>
      )}

      {/* Case list */}
      {cases.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">{t('immigration.noCases')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map(c => (
            <CaseCard
              key={c.id}
              caseData={c}
              status={statuses.get(c.receiptNumber)}
              loading={loadingReceipt === c.receiptNumber}
              onRefresh={fetchStatus}
              onDelete={deleteCase}
            />
          ))}
        </div>
      )}
    </PageContent>
  );
}
