import React, { useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { ImmigrationCase, CaseStatus } from '../types';
import { getStatusColor, getColorClasses } from '../utils/statusColor';

interface Props {
  caseData: ImmigrationCase;
  status?: CaseStatus;
  loading: boolean;
  onRefresh: (receiptNumber: string) => void;
  onDelete: (id: string) => void;
}

export default function CaseCard({ caseData, status, loading, onRefresh, onDelete }: Props) {
  const { t } = useTranslation();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const color = status ? getStatusColor(status.status) : 'gray';
  const colorCls = getColorClasses(color);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 group">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
              {caseData.receiptNumber}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-medium">
              {caseData.formType}
            </span>
          </div>
          {caseData.nickname && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{caseData.nickname}</p>
          )}
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onRefresh(caseData.receiptNumber)}
            disabled={loading}
            className="p-1.5 text-gray-400 hover:text-blue-500 transition disabled:opacity-50"
            aria-label={t('immigration.refresh')}
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          {confirmDelete ? (
            <button
              type="button"
              onClick={() => { onDelete(caseData.id); setConfirmDelete(false); }}
              className="p-1 text-red-500 hover:text-red-600 transition text-xs font-medium"
            >
              {t('immigration.confirm')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 text-gray-400 hover:text-red-500 transition"
              aria-label={t('immigration.delete')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Status badge */}
      {status ? (
        <div className={`rounded-lg p-3 ${colorCls.bg}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full ${colorCls.dot}`} />
            <span className={`text-sm font-semibold ${colorCls.text}`}>
              {status.status}
            </span>
          </div>
          {status.statusDescription && (
            <p className={`text-xs ${colorCls.text} opacity-80 line-clamp-3`}>
              {status.statusDescription}
            </p>
          )}
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2">
            {t('immigration.lastChecked')}: {new Date(status.checkedAt).toLocaleString()}
          </p>
        </div>
      ) : (
        <div className="rounded-lg p-3 bg-gray-50 dark:bg-gray-700/50">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {loading ? t('immigration.checking') : t('immigration.notChecked')}
          </p>
        </div>
      )}
    </div>
  );
}
