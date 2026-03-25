import React, { useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { KeywordReport } from '../hooks/useResumeGeneration';

interface Props {
  report: KeywordReport;
}

export default function KeywordReportPanel({ report }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const total = report.hardSkills.length + report.titleKeywords.length + report.businessContext.length;
  if (total === 0) return null;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-h-[44px]"
        aria-expanded={open}
      >
        <span>{t('resumeTailor.generate.keywordReport')} ({total})</span>
        <svg
          className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 bg-gray-50 dark:bg-gray-800/50">
          <KeywordGroup
            label={t('resumeTailor.generate.hardSkills')}
            keywords={report.hardSkills}
            colorClass="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
          />
          <KeywordGroup
            label={t('resumeTailor.generate.titleKeywords')}
            keywords={report.titleKeywords}
            colorClass="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
          />
          <KeywordGroup
            label={t('resumeTailor.generate.businessContext')}
            keywords={report.businessContext}
            colorClass="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          />
        </div>
      )}
    </div>
  );
}

function KeywordGroup({ label, keywords, colorClass }: { label: string; keywords: string[]; colorClass: string }) {
  if (keywords.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <div className="flex flex-wrap gap-1">
        {keywords.map(kw => (
          <span key={kw} className={`px-2 py-0.5 text-xs rounded-full ${colorClass}`}>
            {kw}
          </span>
        ))}
      </div>
    </div>
  );
}
