import React, { useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import { useApplicationsLog } from '../hooks/useApplicationsLog';
import type { ResumeApplication } from '../hooks/useApplicationsLog';

const STATUS_COLORS: Record<ResumeApplication['status'], string> = {
  applied:   'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  interview: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  offer:     'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  rejected:  'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  withdrawn: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
};

export default function ApplicationsLog() {
  const { t } = useTranslation();
  const { applications, loading, deleteApplication, updateApplication } = useApplicationsLog();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" aria-label={t('resumeTailor.loading')} />
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
        {t('resumeTailor.applications.emptyState')}
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-8">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {applications.length} {t('resumeTailor.applications.count')}
      </p>
      {applications.map(app => (
        <ApplicationRow
          key={app.id}
          app={app}
          expanded={expandedId === app.id}
          onToggle={() => setExpandedId(id => id === app.id ? null : app.id)}
          onDelete={deleteApplication}
          onStatusChange={(id, status) => updateApplication(id, { status })}
          onNotesChange={(id, notes) => updateApplication(id, { notes })}
        />
      ))}
    </div>
  );
}

interface RowProps {
  app: ResumeApplication;
  expanded: boolean;
  onToggle: () => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: ResumeApplication['status']) => void;
  onNotesChange: (id: string, notes: string) => void;
}

function ApplicationRow({ app, expanded, onToggle, onDelete, onStatusChange, onNotesChange }: RowProps) {
  const { t } = useTranslation();

  const appliedDate = new Date(app.appliedAt).toLocaleDateString();

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Row header */}
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
        <button
          type="button"
          onClick={onToggle}
          className="flex-1 flex items-center gap-3 text-left min-h-[44px]"
          aria-expanded={expanded}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {app.jobTitle || t('resumeTailor.generate.jobTitle')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {app.company} · {appliedDate}
            </p>
          </div>
          {app.atsScore !== undefined && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
              app.atsScore >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
              app.atsScore >= 60 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            }`}>
              {app.atsScore}
            </span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[app.status]}`}>
            {t(`resumeTailor.applications.status.${app.status}` as Parameters<typeof t>[0])}
          </span>
          <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => onDelete(app.id)}
          aria-label={t('resumeTailor.applications.delete')}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-200 dark:border-gray-700 space-y-3">
          {/* Status selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 dark:text-gray-400">{t('resumeTailor.applications.updateStatus')}</span>
            {(['applied', 'interview', 'offer', 'rejected', 'withdrawn'] as ResumeApplication['status'][]).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => onStatusChange(app.id, s)}
                className={`px-2 py-1 text-xs rounded-full border transition-colors min-h-[32px] ${
                  app.status === s
                    ? STATUS_COLORS[s] + ' border-current font-semibold'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400'
                }`}
              >
                {t(`resumeTailor.applications.status.${s}` as Parameters<typeof t>[0])}
              </button>
            ))}
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{t('resumeTailor.applications.notes')}</label>
            <textarea
              defaultValue={app.notes ?? ''}
              onBlur={e => onNotesChange(app.id, e.target.value)}
              placeholder={t('resumeTailor.applications.notesPlaceholder')}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
