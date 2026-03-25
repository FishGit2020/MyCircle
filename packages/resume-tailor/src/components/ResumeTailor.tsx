import React, { lazy, Suspense, useState } from 'react';
import { useTranslation, PageContent } from '@mycircle/shared';
import FactBankEditor from './FactBankEditor';

const ResumeGenerator = lazy(() => import('./ResumeGenerator'));
const ApplicationsLog = lazy(() => import('./ApplicationsLog'));

type Tab = 'factBank' | 'generate' | 'applications';

export default function ResumeTailor() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('factBank');

  return (
    <PageContent>
      <div className="flex flex-col min-h-0 flex-1">
        {/* Tab bar */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
          {(['factBank', 'generate', 'applications'] as Tab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors min-h-[44px] ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
              aria-selected={activeTab === tab}
              role="tab"
            >
              {t(`resumeTailor.tabs.${tab}` as Parameters<typeof t>[0])}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 min-h-0 overflow-auto">
          {activeTab === 'factBank' && <FactBankTab />}
          {activeTab === 'generate' && (
            <Suspense fallback={<LoadingSpinner />}>
              <GenerateTab />
            </Suspense>
          )}
          {activeTab === 'applications' && (
            <Suspense fallback={<LoadingSpinner />}>
              <ApplicationsTab />
            </Suspense>
          )}
        </div>
      </div>
    </PageContent>
  );
}

function FactBankTab() {
  return <FactBankEditor />;
}

function GenerateTab() {
  return <ResumeGenerator />;
}

function ApplicationsTab() {
  return <ApplicationsLog />;
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
