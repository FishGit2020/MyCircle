import { useState, useCallback } from 'react';
import { useTranslation, PageContent } from '@mycircle/shared';
import {
  useCrawlJobs,
  useCrawlJobDetail,
  useStartCrawl,
  useStopCrawl,
  useDeleteCrawlJob,
} from '../hooks/useCrawler';

type Tab = 'jobs' | 'documents' | 'tracing';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  running: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  stopped: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  stopping: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function WebCrawler() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { t } = useTranslation() as { t: (key: string) => string };
  const [url, setUrl] = useState('');
  const [maxDepth, setMaxDepth] = useState(2);
  const [maxPages, setMaxPages] = useState(20);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('jobs');

  const { jobs, loading: jobsLoading } = useCrawlJobs();
  const { detail, loading: detailLoading } = useCrawlJobDetail(selectedJobId);
  const { startCrawl, loading: starting, error: startError } = useStartCrawl();
  const { stopCrawl, loading: stopping } = useStopCrawl();
  const { deleteCrawlJob, loading: deleting } = useDeleteCrawlJob();

  const handleStartCrawl = useCallback(async () => {
    if (!url.trim()) return;
    const job = await startCrawl(url.trim(), maxDepth, maxPages);
    if (job) {
      setUrl('');
      setSelectedJobId(job.id);
      setActiveTab('tracing');
    }
  }, [url, maxDepth, maxPages, startCrawl]);

  const handleStop = useCallback(
    async (id: string) => {
      await stopCrawl(id);
    },
    [stopCrawl],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!window.confirm(t('webCrawler.confirmDelete'))) return;
      await deleteCrawlJob(id);
      if (selectedJobId === id) {
        setSelectedJobId(null);
        setActiveTab('jobs');
      }
    },
    [deleteCrawlJob, selectedJobId, t],
  );

  const handleSelectJob = useCallback((id: string) => {
    setSelectedJobId(id);
    setActiveTab('documents');
  }, []);

  const hasActiveJob = jobs.some((j) => j.status === 'running' || j.status === 'pending');

  return (
    <PageContent maxWidth="5xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('webCrawler.title')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('webCrawler.subtitle')}
        </p>
      </div>

      {/* Start crawl form */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col gap-3">
          {/* URL + Start button */}
          <div className="flex gap-2">
            <input
              id="crawler-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStartCrawl()}
              placeholder="https://example.com"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label={t('webCrawler.urlLabel')}
            />
            <button
              type="button"
              onClick={handleStartCrawl}
              disabled={starting || !url.trim()}
              className="px-4 py-2 min-h-[44px] bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 whitespace-nowrap"
              aria-label={t('webCrawler.startCrawl')}
            >
              {starting ? t('webCrawler.startingCrawl') : t('webCrawler.startCrawl')}
            </button>
          </div>

          {/* Options row */}
          <div className="flex gap-4 items-center">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              {t('webCrawler.maxDepth')}
              <input
                type="number"
                min={1}
                max={5}
                value={maxDepth}
                onChange={(e) => setMaxDepth(Number(e.target.value))}
                className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              {t('webCrawler.maxPages')}
              <input
                type="number"
                min={1}
                max={100}
                value={maxPages}
                onChange={(e) => setMaxPages(Number(e.target.value))}
                className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </label>
          </div>

          {startError && (
            <p className="text-sm text-red-600 dark:text-red-400">{startError}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
        <nav className="flex gap-4" aria-label="Tabs">
          {(['jobs', 'documents', 'tracing'] as Tab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {t(`webCrawler.tabs.${tab}`)}
              {tab === 'jobs' && jobs.length > 0 && (
                <span className="ml-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-1.5 py-0.5">
                  {jobs.length}
                </span>
              )}
              {tab === 'documents' && detail && (
                <span className="ml-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-1.5 py-0.5">
                  {detail.documents.length}
                </span>
              )}
              {tab === 'tracing' && detail && (
                <span className="ml-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-1.5 py-0.5">
                  {detail.traces.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'jobs' && (
        <JobsList
          jobs={jobs}
          loading={jobsLoading}
          selectedJobId={selectedJobId}
          hasActiveJob={hasActiveJob}
          stopping={stopping}
          deleting={deleting}
          onSelect={handleSelectJob}
          onStop={handleStop}
          onDelete={handleDelete}
          t={t}
        />
      )}

      {activeTab === 'documents' && (
        <DocumentsPanel
          detail={detail}
          loading={detailLoading}
          selectedJobId={selectedJobId}
          onBack={() => setActiveTab('jobs')}
          t={t}
        />
      )}

      {activeTab === 'tracing' && (
        <TracingPanel
          detail={detail}
          loading={detailLoading}
          selectedJobId={selectedJobId}
          onBack={() => setActiveTab('jobs')}
          t={t}
        />
      )}
    </PageContent>
  );
}

// ─── Jobs List ──────────────────────────────────────────────
interface CrawlJob {
  id: string;
  url: string;
  status: string;
  maxDepth: number;
  maxPages: number;
  pagesVisited: number;
  createdAt: string;
  updatedAt: string;
}

function JobsList({
  jobs,
  loading,
  selectedJobId,
  hasActiveJob: _hasActiveJob,
  stopping,
  deleting,
  onSelect,
  onStop,
  onDelete,
  t,
}: {
  jobs: CrawlJob[];
  loading: boolean;
  selectedJobId: string | null;
  hasActiveJob: boolean;
  stopping: boolean;
  deleting: boolean;
  onSelect: (id: string) => void;
  onStop: (id: string) => void;
  onDelete: (id: string) => void;
  t: (key: string) => string;
}) {
  if (loading && jobs.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400 py-12">
        {t('webCrawler.noJobs')}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => {
        const isActive = job.status === 'running' || job.status === 'pending' || job.status === 'stopping';
        const isSelected = selectedJobId === job.id;
        return (
          <div
            key={job.id}
            className={`bg-white dark:bg-gray-800 rounded-xl border p-4 transition-colors cursor-pointer ${
              isSelected
                ? 'border-blue-500 dark:border-blue-400 ring-1 ring-blue-500 dark:ring-blue-400'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            onClick={() => onSelect(job.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelect(job.id)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      STATUS_COLORS[job.status] || STATUS_COLORS.pending
                    }`}
                  >
                    {isActive && job.status !== 'stopping' && (
                      <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                    )}
                    {t(`webCrawler.status.${job.status}`)}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {job.pagesVisited}/{job.maxPages} {t('webCrawler.pagesVisited')}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {job.url}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {t('webCrawler.maxDepth')}: {job.maxDepth} &middot; {formatTime(job.createdAt)}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {(job.status === 'running' || job.status === 'pending') && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStop(job.id);
                    }}
                    disabled={stopping}
                    className="px-3 py-1.5 min-h-[36px] text-xs font-medium bg-orange-100 hover:bg-orange-200 text-orange-700 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 dark:text-orange-300 rounded-lg transition-colors"
                    aria-label={t('webCrawler.stopCrawl')}
                  >
                    {t('webCrawler.stopCrawl')}
                  </button>
                )}
                {!isActive && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(job.id);
                    }}
                    disabled={deleting}
                    className="px-3 py-1.5 min-h-[36px] text-xs font-medium bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300 rounded-lg transition-colors"
                    aria-label={t('webCrawler.deleteJob')}
                  >
                    {t('webCrawler.deleteJob')}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Documents Panel ────────────────────────────────────────
interface CrawlJobDetail {
  job: CrawlJob;
  documents: Array<{
    id: string;
    jobId: string;
    url: string;
    title: string | null;
    contentPreview: string | null;
    statusCode: number;
    contentType: string | null;
    crawledAt: string;
    size: number;
    depth: number;
  }>;
  traces: Array<{
    id: string;
    jobId: string;
    timestamp: string;
    level: string;
    message: string;
    url: string | null;
    durationMs: number | null;
  }>;
}

function DocumentsPanel({
  detail,
  loading,
  selectedJobId,
  onBack,
  t,
}: {
  detail: CrawlJobDetail | null;
  loading: boolean;
  selectedJobId: string | null;
  onBack: () => void;
  t: (key: string) => string;
}) {
  if (!selectedJobId) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400 py-12">
        {t('webCrawler.noDocuments')}
      </p>
    );
  }

  if (loading && !detail) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const docs = detail?.documents ?? [];

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
      >
        &larr; {t('webCrawler.backToJobs')}
      </button>

      {detail?.job && (
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              STATUS_COLORS[detail.job.status] || STATUS_COLORS.pending
            }`}
          >
            {detail.job.status === 'running' && (
              <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
            )}
            {t(`webCrawler.status.${detail.job.status}`)}
          </span>
          <span className="truncate">{detail.job.url}</span>
          <span>&middot; {docs.length} {t('webCrawler.documents').toLowerCase()}</span>
        </div>
      )}

      {docs.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
          {t('webCrawler.noDocuments')}
        </p>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {doc.title || doc.url}
                  </p>
                  {doc.title && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 truncate">{doc.url}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 shrink-0">
                  <span
                    className={`px-1.5 py-0.5 rounded ${
                      doc.statusCode >= 200 && doc.statusCode < 300
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : doc.statusCode >= 400
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {doc.statusCode || 'ERR'}
                  </span>
                  <span>{formatBytes(doc.size)}</span>
                  <span>d{doc.depth}</span>
                </div>
              </div>
              {doc.contentPreview && (
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                  {doc.contentPreview}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tracing Panel ──────────────────────────────────────────
function TracingPanel({
  detail,
  loading,
  selectedJobId,
  onBack,
  t,
}: {
  detail: CrawlJobDetail | null;
  loading: boolean;
  selectedJobId: string | null;
  onBack: () => void;
  t: (key: string) => string;
}) {
  if (!selectedJobId) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400 py-12">
        {t('webCrawler.noLogs')}
      </p>
    );
  }

  if (loading && !detail) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const traces = detail?.traces ?? [];

  const LEVEL_COLORS: Record<string, string> = {
    info: 'text-blue-600 dark:text-blue-400',
    warn: 'text-yellow-600 dark:text-yellow-400',
    error: 'text-red-600 dark:text-red-400',
  };

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
      >
        &larr; {t('webCrawler.backToJobs')}
      </button>

      {detail?.job && (
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              STATUS_COLORS[detail.job.status] || STATUS_COLORS.pending
            }`}
          >
            {detail.job.status === 'running' && (
              <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
            )}
            {t(`webCrawler.status.${detail.job.status}`)}
          </span>
          <span className="truncate">{detail.job.url}</span>
        </div>
      )}

      {traces.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
          {t('webCrawler.noLogs')}
        </p>
      ) : (
        <div className="bg-gray-900 dark:bg-gray-950 rounded-xl border border-gray-700 p-4 font-mono text-xs overflow-auto max-h-[600px]">
          {traces.map((trace) => (
            <div key={trace.id} className="flex gap-2 py-0.5 hover:bg-gray-800/50">
              <span className="text-gray-500 shrink-0 w-20">
                {formatTime(trace.timestamp)}
              </span>
              <span
                className={`shrink-0 w-12 uppercase font-bold ${
                  LEVEL_COLORS[trace.level] || LEVEL_COLORS.info
                }`}
              >
                {trace.level}
              </span>
              <span className="text-gray-200 break-all">
                {trace.message}
                {trace.durationMs != null && (
                  <span className="text-gray-500 ml-2">({trace.durationMs}ms)</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
