import { useState } from 'react';
import { useTranslation, PageContent } from '@mycircle/shared';
import SqlConnectionSection from './SqlConnectionSection';
import NasConnectionSection from './NasConnectionSection';
import EndpointSection from './EndpointSection';
import BackfillSection from './BackfillSection';
import AnalyticsDashboard from './AnalyticsDashboard';
import ChatSearch from './analytics/ChatSearch';
import SqlQueryRunner from './SqlQueryRunner';

export default function Setup() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('connection');

  const tabs = [
    { id: 'connection', label: t('setup.tabs.connection') },
    { id: 'nas', label: t('setup.tabs.nas') },
    { id: 'endpoints', label: t('setup.tabs.endpoints') },
    { id: 'backfill', label: t('setup.tabs.backfill') },
    { id: 'analytics', label: t('setup.tabs.analytics') },
    { id: 'search', label: t('setup.tabs.search') },
    { id: 'query', label: t('setup.tabs.query') },
  ];

  return (
    <PageContent>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          {t('setup.title')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('setup.subtitle')}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto border-b border-gray-200 dark:border-gray-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'connection' && <SqlConnectionSection />}
      {activeTab === 'nas' && <NasConnectionSection />}
      {activeTab === 'endpoints' && <EndpointSection />}
      {activeTab === 'backfill' && <BackfillSection />}
      {activeTab === 'analytics' && <AnalyticsDashboard />}
      {activeTab === 'search' && <ChatSearch />}
      {activeTab === 'query' && <SqlQueryRunner />}
    </PageContent>
  );
}
