import { useState, useCallback, useRef } from 'react';
import { useTranslation, useMutation, useQuery, useLazyQuery, INGEST_KNOWLEDGE_DOC, INGEST_KNOWLEDGE_FILE, INGEST_CLOUD_FILE, DUMP_KNOWLEDGE_TO_SQL, OFFLOAD_KNOWLEDGE_TO_SQL, GET_KNOWLEDGE_SOURCES, GET_CLOUD_FILES, RAG_SEARCH, GET_BENCHMARK_ENDPOINTS, GET_BENCHMARK_ENDPOINT_MODELS, GET_OLLAMA_MODELS } from '@mycircle/shared';

const ENDPOINT_STORAGE_KEY = 'mycircle-ai-endpoint';
const EMBED_MODEL_KEY = 'mycircle-kb-embed-model';

const SUPPORTED_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'text/markdown',
  'application/json',
]);

interface KnowledgeBaseProps {
  onAskAi?: (context: string) => void;
}

export default function KnowledgeBase({ onAskAi }: KnowledgeBaseProps) {
  const { t } = useTranslation();

  // ─── Endpoint / Model selectors ───────────────────────────────────
  const { data: endpointsData } = useQuery(GET_BENCHMARK_ENDPOINTS, { fetchPolicy: 'cache-and-network' });
  const endpoints: Array<{ id: string; url: string; name: string }> = endpointsData?.benchmarkEndpoints ?? [];

  const [selectedEndpoint, setSelectedEndpoint] = useState(() => {
    try { return localStorage.getItem(ENDPOINT_STORAGE_KEY) || ''; } catch { return ''; }
  });
  const [fetchModels, { data: modelsData, loading: modelsLoading }] = useLazyQuery(GET_BENCHMARK_ENDPOINT_MODELS);
  const models: string[] = modelsData?.benchmarkEndpointModels ?? [];
  const { data: defaultModelsData } = useQuery(GET_OLLAMA_MODELS);
  const defaultModels: string[] = defaultModelsData?.ollamaModels ?? [];
  const displayModels = selectedEndpoint && models.length > 0 ? models : defaultModels;

  const [embedModel, setEmbedModel] = useState(() => {
    try { return localStorage.getItem(EMBED_MODEL_KEY) || ''; } catch { return ''; }
  });

  const handleEndpointChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedEndpoint(id);
    try { localStorage.setItem(ENDPOINT_STORAGE_KEY, id); } catch { /* */ }
    if (id) fetchModels({ variables: { endpointId: id } });
  }, [fetchModels]);

  if (!selectedEndpoint && endpoints.length > 0) {
    setSelectedEndpoint(endpoints[0].id);
    try { localStorage.setItem(ENDPOINT_STORAGE_KEY, endpoints[0].id); } catch { /* */ }
    fetchModels({ variables: { endpointId: endpoints[0].id } });
  }

  if (!embedModel && displayModels.length > 0) {
    const defaultEmbed = displayModels.find(m => m.includes('embed')) || displayModels[0];
    setEmbedModel(defaultEmbed);
    try { localStorage.setItem(EMBED_MODEL_KEY, defaultEmbed); } catch { /* */ }
  }

  const handleModelChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setEmbedModel(e.target.value);
    try { localStorage.setItem(EMBED_MODEL_KEY, e.target.value); } catch { /* */ }
  }, []);

  // ─── Ingest (paste text) ──────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [ingestMessage, setIngestMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [ingestMutation, { loading: ingesting }] = useMutation(INGEST_KNOWLEDGE_DOC);

  const handleIngest = useCallback(async () => {
    setIngestMessage(null);
    if (!title.trim()) { setIngestMessage({ type: 'error', text: t('ai.knowledgeBase.titleRequired') }); return; }
    if (!content.trim() || content.trim().length < 50) { setIngestMessage({ type: 'error', text: t('ai.knowledgeBase.contentTooShort') }); return; }
    try {
      const { data } = await ingestMutation({
        variables: { title: title.trim(), content: content.trim(), sourceUrl: sourceUrl.trim() || undefined, endpointId: selectedEndpoint || undefined, embedModel },
        refetchQueries: ['GetKnowledgeSources'],
      });
      setIngestMessage({ type: 'success', text: t('ai.knowledgeBase.ingestSuccess', { count: data?.ingestKnowledgeDoc?.chunkCount ?? 0 }) });
      setTitle(''); setContent(''); setSourceUrl('');
    } catch {
      setIngestMessage({ type: 'error', text: t('ai.knowledgeBase.ingestError') });
    }
  }, [title, content, sourceUrl, selectedEndpoint, embedModel, ingestMutation, t]);

  // ─── File Upload ──────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ingestFileMutation, { loading: uploadingFile }] = useMutation(INGEST_KNOWLEDGE_FILE);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!SUPPORTED_TYPES.has(file.type) && !file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
      setIngestMessage({ type: 'error', text: 'Unsupported file type. Use PDF, DOCX, or TXT.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setIngestMessage({ type: 'error', text: 'File must be under 5MB.' });
      return;
    }
    setIngestMessage(null);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const { data } = await ingestFileMutation({
          variables: { fileName: file.name, fileBase64: base64, contentType: file.type || 'text/plain', endpointId: selectedEndpoint || undefined, embedModel },
          refetchQueries: ['GetKnowledgeSources'],
        });
        setIngestMessage({ type: 'success', text: t('ai.knowledgeBase.ingestSuccess', { count: data?.ingestKnowledgeFile?.chunkCount ?? 0 }) });
      } catch {
        setIngestMessage({ type: 'error', text: t('ai.knowledgeBase.ingestError') });
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [selectedEndpoint, embedModel, ingestFileMutation, t]);

  // ─── Cloud Files Import ───────────────────────────────────────────
  const { data: cloudFilesData } = useQuery(GET_CLOUD_FILES, { fetchPolicy: 'cache-and-network' });
  const cloudFiles: Array<{ id: string; fileName: string; contentType: string; size: number }> = cloudFilesData?.cloudFiles ?? [];
  const importableFiles = cloudFiles.filter(f => SUPPORTED_TYPES.has(f.contentType) || f.fileName.endsWith('.txt') || f.fileName.endsWith('.md'));

  const [ingestCloudFileMutation, { loading: importingCloudFile }] = useMutation(INGEST_CLOUD_FILE);

  const handleCloudFileImport = useCallback(async (fileId: string) => {
    setIngestMessage(null);
    try {
      const { data } = await ingestCloudFileMutation({
        variables: { fileId, endpointId: selectedEndpoint || undefined, embedModel },
        refetchQueries: ['GetKnowledgeSources'],
      });
      setIngestMessage({ type: 'success', text: t('ai.knowledgeBase.ingestSuccess', { count: data?.ingestCloudFile?.chunkCount ?? 0 }) });
    } catch {
      setIngestMessage({ type: 'error', text: t('ai.knowledgeBase.ingestError') });
    }
  }, [selectedEndpoint, embedModel, ingestCloudFileMutation, t]);

  // ─── SQL Operations ───────────────────────────────────────────────
  const [sqlMessage, setSqlMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [dumpMutation, { loading: dumping }] = useMutation(DUMP_KNOWLEDGE_TO_SQL);
  const [offloadMutation, { loading: offloading }] = useMutation(OFFLOAD_KNOWLEDGE_TO_SQL);

  const handleDumpToSql = useCallback(async () => {
    setSqlMessage(null);
    try {
      await dumpMutation();
      setSqlMessage({ type: 'success', text: t('ai.knowledgeBase.dumpSuccess') });
    } catch {
      setSqlMessage({ type: 'error', text: t('ai.knowledgeBase.sqlError') });
    }
  }, [dumpMutation, t]);

  const handleOffloadToSql = useCallback(async () => {
    setSqlMessage(null);
    try {
      await offloadMutation({ refetchQueries: ['GetKnowledgeSources'] });
      setSqlMessage({ type: 'success', text: t('ai.knowledgeBase.offloadSuccess') });
    } catch {
      setSqlMessage({ type: 'error', text: t('ai.knowledgeBase.sqlError') });
    }
  }, [offloadMutation, t]);

  // ─── Search ───────────────────────────────────────────────────────
  const [question, setQuestion] = useState('');
  const [topK, setTopK] = useState(5);
  const [searchResults, setSearchResults] = useState<Array<{ id: string; text: string; sourceTitle: string; sourceUrl: string | null; score: number }>>([]);
  const [expandedChunks, setExpandedChunks] = useState<Set<string>>(new Set());

  const [executeSearch, { loading: searching }] = useLazyQuery(RAG_SEARCH, {
    fetchPolicy: 'no-cache',
    onCompleted: (data) => { setSearchResults(data?.ragSearch ?? []); },
  });

  const handleSearch = useCallback(() => {
    if (!question.trim()) return;
    setSearchResults([]);
    executeSearch({ variables: { question: question.trim(), endpointId: selectedEndpoint || undefined, embedModel, topK } });
  }, [question, selectedEndpoint, embedModel, topK, executeSearch]);

  const toggleChunk = useCallback((id: string) => {
    setExpandedChunks(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }, []);

  // ─── Sources ──────────────────────────────────────────────────────
  const { data: sourcesData } = useQuery(GET_KNOWLEDGE_SOURCES, { fetchPolicy: 'cache-and-network' });
  const sources = sourcesData?.knowledgeSources ?? [];

  // ─── Ask AI ───────────────────────────────────────────────────────
  const handleAskAi = useCallback(() => {
    if (!searchResults.length || !onAskAi) return;
    const contextParts = searchResults.map((r, i) =>
      `[${i + 1}] (Source: ${r.sourceTitle}${r.sourceUrl ? `, ${r.sourceUrl}` : ''}, Score: ${Math.round(r.score * 100)}%)\n${r.text}`
    );
    onAskAi(`Use the following knowledge base excerpts to answer the user's question:\n\n${contextParts.join('\n\n---\n\n')}`);
  }, [searchResults, onAskAi]);

  const hasModelMismatch = searchResults.length > 0 && sources.some(
    (s: { embedModel: string }) => s.embedModel !== embedModel
  );

  const anyIngesting = ingesting || uploadingFile || importingCloudFile;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto space-y-6">
      {/* Endpoint / Embed Model selectors */}
      <div className="flex flex-wrap items-center gap-2">
        {endpoints.length > 0 && (
          <>
            <label className="sr-only" htmlFor="kb-endpoint-select">{t('ai.endpointLabel')}</label>
            <select
              id="kb-endpoint-select"
              value={selectedEndpoint}
              onChange={handleEndpointChange}
              className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-400 max-w-[160px] truncate"
            >
              {endpoints.map(ep => <option key={ep.id} value={ep.id}>{ep.name}</option>)}
            </select>
            <label className="sr-only" htmlFor="kb-embed-model-select">{t('ai.knowledgeBase.embedModelLabel')}</label>
            <select
              id="kb-embed-model-select"
              value={embedModel}
              onChange={handleModelChange}
              disabled={modelsLoading || displayModels.length === 0}
              className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50 max-w-[180px] truncate"
            >
              {modelsLoading ? (
                <option value="">{t('app.loading')}</option>
              ) : displayModels.length === 0 ? (
                <option value="">{t('benchmark.runner.noModels')}</option>
              ) : (
                displayModels.map(m => <option key={m} value={m}>{m}</option>)
              )}
            </select>
          </>
        )}
      </div>

      {/* ─── Ingest Panel ──────────────────────────────────────────── */}
      <section aria-labelledby="kb-ingest-heading">
        <h2 id="kb-ingest-heading" className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
          {t('ai.knowledgeBase.ingestTitle')}
        </h2>
        <div className="space-y-2">
          <div>
            <label htmlFor="kb-title" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('ai.knowledgeBase.titleLabel')}</label>
            <input id="kb-title" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('ai.knowledgeBase.titlePlaceholder')} maxLength={200}
              className="w-full px-3 py-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
          <div>
            <label htmlFor="kb-content" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('ai.knowledgeBase.contentLabel')}</label>
            <textarea id="kb-content" value={content} onChange={e => setContent(e.target.value)} placeholder={t('ai.knowledgeBase.contentPlaceholder')} rows={6}
              className="w-full px-3 py-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-y" />
          </div>
          <div>
            <label htmlFor="kb-source-url" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('ai.knowledgeBase.sourceUrlLabel')}</label>
            <input id="kb-source-url" type="url" value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder={t('ai.knowledgeBase.sourceUrlPlaceholder')}
              className="w-full px-3 py-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={handleIngest} disabled={anyIngesting || !title.trim() || !content.trim() || !embedModel}
              className="px-4 py-2 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]">
              {ingesting ? t('ai.knowledgeBase.ingesting') : t('ai.knowledgeBase.addButton')}
            </button>

            {/* File Upload */}
            <label className="px-4 py-2 text-sm font-medium rounded bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 cursor-pointer transition-colors min-h-[44px] flex items-center gap-1 disabled:opacity-50">
              {uploadingFile ? t('ai.knowledgeBase.uploading') : t('ai.knowledgeBase.uploadFile')}
              <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.txt,.md,.json" onChange={handleFileUpload} className="hidden" disabled={anyIngesting || !embedModel} />
            </label>

            {/* Cloud Files Import */}
            {importableFiles.length > 0 && (
              <select
                onChange={e => { if (e.target.value) handleCloudFileImport(e.target.value); e.target.value = ''; }}
                disabled={anyIngesting || !embedModel}
                className="text-sm px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50 max-w-[220px] truncate min-h-[44px]"
                value=""
                aria-label={t('ai.knowledgeBase.importCloudFile')}
              >
                <option value="">{importingCloudFile ? t('ai.knowledgeBase.importing') : t('ai.knowledgeBase.importCloudFile')}</option>
                {importableFiles.map(f => <option key={f.id} value={f.id}>{f.fileName}</option>)}
              </select>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">{t('ai.knowledgeBase.uploadHint')}</p>
          {ingestMessage && (
            <p className={`text-sm ${ingestMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {ingestMessage.text}
            </p>
          )}
        </div>
      </section>

      {/* ─── Search Panel ──────────────────────────────────────────── */}
      <section aria-labelledby="kb-search-heading">
        <h2 id="kb-search-heading" className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('ai.knowledgeBase.searchTitle')}</h2>
        <div className="flex flex-col md:flex-row gap-2 mb-2">
          <input type="text" value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
            placeholder={t('ai.knowledgeBase.searchPlaceholder')} aria-label={t('ai.knowledgeBase.searchTitle')}
            className="flex-1 px-3 py-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-400" />
          <div className="flex items-center gap-2">
            <label htmlFor="kb-topk" className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{t('ai.knowledgeBase.topKLabel')}</label>
            <select id="kb-topk" value={topK} onChange={e => setTopK(Number(e.target.value))}
              className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-400">
              {[3, 5, 10, 20].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <button type="button" onClick={handleSearch} disabled={searching || !question.trim() || !embedModel}
              className="px-4 py-2 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]">
              {searching ? t('ai.knowledgeBase.searching') : t('ai.knowledgeBase.searchButton')}
            </button>
          </div>
        </div>

        {hasModelMismatch && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">{t('ai.knowledgeBase.modelMismatchWarning')}</p>
        )}

        {searchResults.length > 0 && (
          <div className="space-y-3">
            {searchResults.map(result => {
              const isExpanded = expandedChunks.has(result.id);
              const displayText = isExpanded ? result.text : result.text.slice(0, 200);
              return (
                <div key={result.id} className="p-3 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {t('ai.knowledgeBase.resultSource')}: {result.sourceTitle}
                      {result.sourceUrl && (<> &middot; <a href={result.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 dark:text-blue-400 hover:underline">{result.sourceUrl}</a></>)}
                    </span>
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{t('ai.knowledgeBase.resultScore', { score: Math.round(result.score * 100) })}</span>
                  </div>
                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{displayText}{!isExpanded && result.text.length > 200 && '...'}</p>
                  {result.text.length > 200 && (
                    <button type="button" onClick={() => toggleChunk(result.id)} className="text-xs text-blue-500 dark:text-blue-400 hover:underline mt-1">
                      {isExpanded ? t('ai.monitor.collapse') : t('ai.monitor.expand')}
                    </button>
                  )}
                </div>
              );
            })}
            <button type="button" onClick={handleAskAi} disabled={!onAskAi || searchResults.length === 0}
              className="px-4 py-2 text-sm font-medium rounded bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
              title={!onAskAi || searchResults.length === 0 ? t('ai.knowledgeBase.askAiDisabled') : undefined}>
              {t('ai.knowledgeBase.askAiButton')}
            </button>
          </div>
        )}

        {!searching && searchResults.length === 0 && question.trim() && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('ai.knowledgeBase.noResults')}</p>
        )}
      </section>

      {/* ─── Sources List ──────────────────────────────────────────── */}
      <section aria-labelledby="kb-sources-heading">
        <h2 id="kb-sources-heading" className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('ai.knowledgeBase.sourcesTitle')}</h2>
        {sources.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('ai.knowledgeBase.sourcesEmpty')}</p>
        ) : (
          <div className="space-y-2">
            {sources.map((source: { id: string; title: string; sourceUrl: string | null; chunkCount: number; embedModel: string; createdAt: string }) => (
              <div key={source.id} className="flex flex-col md:flex-row md:items-center md:justify-between p-3 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 gap-1">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{source.title}</p>
                  {source.sourceUrl && (
                    <a href={source.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 dark:text-blue-400 hover:underline truncate block">{source.sourceUrl}</a>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 shrink-0">
                  <span>{t('ai.knowledgeBase.sourcesChunks', { count: source.chunkCount })}</span>
                  <span>{t('ai.knowledgeBase.sourcesModel')}: {source.embedModel}</span>
                  <span>{t('ai.knowledgeBase.sourcesDate')}: {new Date(source.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── SQL Operations ────────────────────────────────────────── */}
      <section aria-labelledby="kb-sql-heading">
        <h2 id="kb-sql-heading" className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">SQL Storage</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={handleDumpToSql} disabled={dumping || offloading}
            className="px-4 py-2 text-sm font-medium rounded bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
            title={t('ai.knowledgeBase.dumpToSqlHint')}>
            {dumping ? t('ai.knowledgeBase.dumping') : t('ai.knowledgeBase.dumpToSql')}
          </button>
          <button type="button" onClick={handleOffloadToSql} disabled={dumping || offloading}
            className="px-4 py-2 text-sm font-medium rounded bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
            title={t('ai.knowledgeBase.offloadToSqlHint')}>
            {offloading ? t('ai.knowledgeBase.offloading') : t('ai.knowledgeBase.offloadToSql')}
          </button>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('ai.knowledgeBase.offloadToSqlHint')}</p>
        {sqlMessage && (
          <p className={`text-sm mt-1 ${sqlMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {sqlMessage.text}
          </p>
        )}
      </section>
    </div>
  );
}
