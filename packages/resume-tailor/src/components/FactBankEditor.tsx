import React, { useRef, useState, useMemo } from 'react';
import { useTranslation, useQuery, GET_CLOUD_FILES } from '@mycircle/shared';
import { useFactBank } from '../hooks/useFactBank';
import ExperienceCard from './ExperienceCard';

const SNAPSHOT_PREFIX = 'resume-factbank-';

interface FactBankEditorProps {
  model: string;
  endpointId: string | null;
}

function formatSnapshotDate(fileName: string): string {
  // resume-factbank-2024-01-15T12-30-00-000Z.json → Jan 15, 2024 12:30
  try {
    const iso = fileName
      .replace(SNAPSHOT_PREFIX, '')
      .replace('.json', '')
      .replace(/T(\d{2})-(\d{2})-(\d{2})-\d+Z$/, 'T$1:$2:$3Z')
      .replace(/-(\d{2})-(\d{2})-(\d{2}T)/, '-$1-$2$3'); // restore date dashes
    const d = new Date(iso);
    if (isNaN(d.getTime())) return fileName;
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return fileName;
  }
}

export default function FactBankEditor({ model, endpointId }: FactBankEditorProps) {
  const { t } = useTranslation();
  const {
    factBank,
    loading,
    saveStatus,
    cloudSaveStatus,
    parseStatus,
    parseError,
    uploadAndParse,
    parseFromText,
    parseFromCloudFile,
    saveSnapshotToCloud,
    loadFromCloudSnapshot,
    updateContact,
    addExperience,
    updateExperience,
    deleteExperience,
    addEducation,
    updateEducation,
    deleteEducation,
    updateSkills,
    addProject,
    updateProject,
    deleteProject,
    exportJson,
    importJson,
  } = useFactBank();

  const uploadRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasting, setPasting] = useState(false);
  const [cloudFilePickerOpen, setCloudFilePickerOpen] = useState(false);
  const [importJsonCloudOpen, setImportJsonCloudOpen] = useState(false);
  const [importJsonCloudLoading, setImportJsonCloudLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [autoBannerDismissed, setAutoBannerDismissed] = useState(false);
  const { data: cloudFilesData, refetch: refetchCloudFiles } = useQuery(GET_CLOUD_FILES);

  // All JSON files in cloud files (for import)
  const jsonCloudFiles = useMemo(() => {
    const all = (cloudFilesData?.cloudFiles ?? []) as Array<{ id: string; fileName: string; contentType: string; downloadUrl: string; size: number; uploadedAt?: string }>;
    return all
      .filter(f => f.fileName.endsWith('.json') || f.contentType === 'application/json')
      .sort((a, b) => (b.uploadedAt ?? b.fileName).localeCompare(a.uploadedAt ?? a.fileName));
  }, [cloudFilesData]);

  // Filter cloud files to only fact-bank snapshots, newest first
  const snapshotFiles = useMemo(() => {
    const all = (cloudFilesData?.cloudFiles ?? []) as Array<{ id: string; fileName: string; contentType: string; downloadUrl: string; size: number; uploadedAt?: string }>;
    return all
      .filter(f => f.fileName.startsWith(SNAPSHOT_PREFIX) && f.fileName.endsWith('.json'))
      .sort((a, b) => {
        const ta = a.uploadedAt ?? a.fileName;
        const tb = b.uploadedAt ?? b.fileName;
        return tb.localeCompare(ta);
      });
  }, [cloudFilesData]);

  // Show auto-load banner when GraphQL data is empty but cloud snapshots exist
  const isFactBankEmpty = !loading && factBank.contact.name === '' && factBank.experiences.length === 0 && factBank.education.length === 0 && factBank.skills.length === 0;
  const showAutoLoadBanner = isFactBankEmpty && snapshotFiles.length > 0 && !autoBannerDismissed;

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      await uploadAndParse(file, model, endpointId);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : t('resumeTailor.errors.uploadFailed'));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handlePasteSubmit() {
    if (!pasteText.trim()) return;
    setUploadError(null);
    setPasting(true);
    try {
      await parseFromText(pasteText, model, endpointId);
      setPasteOpen(false);
      setPasteText('');
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : t('resumeTailor.errors.uploadFailed'));
    } finally {
      setPasting(false);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importJson(file);
    } catch {
      // silently ignore malformed JSON
    } finally {
      e.target.value = '';
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" aria-label={t('resumeTailor.loading')} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Upload resume */}
          <input
            ref={uploadRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.md,.html,.rtf,.json"
            onChange={handleUpload}
            className="hidden"
            aria-label={t('resumeTailor.factBank.uploadResume')}
          />
          <button
            type="button"
            onClick={() => uploadRef.current?.click()}
            disabled={uploading}
            className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded min-h-[44px] disabled:opacity-50 transition-colors"
          >
            {uploading ? t('resumeTailor.factBank.parsing') : t('resumeTailor.factBank.uploadResume')}
          </button>

          {/* Paste text */}
          <button
            type="button"
            onClick={() => setPasteOpen(true)}
            disabled={pasting}
            className="px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded min-h-[44px] disabled:opacity-50 transition-colors"
          >
            {pasting ? t('resumeTailor.factBank.parsing') : t('resumeTailor.factBank.pasteText')}
          </button>

          {/* Pick from Cloud Files */}
          <button
            type="button"
            onClick={() => setCloudFilePickerOpen(true)}
            disabled={uploading}
            className="px-3 py-2 text-sm bg-cyan-600 hover:bg-cyan-700 text-white rounded min-h-[44px] disabled:opacity-50 transition-colors"
          >
            {t('resumeTailor.factBank.pickFromFiles')}
          </button>

          {/* Import JSON */}
          <input
            ref={importRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            aria-label={t('resumeTailor.factBank.importJson')}
          />
          <button
            type="button"
            onClick={() => importRef.current?.click()}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 min-h-[44px] transition-colors"
          >
            {t('resumeTailor.factBank.importJson')}
          </button>

          {/* Import JSON from Cloud Files */}
          <button
            type="button"
            onClick={() => { setImportJsonCloudOpen(true); void refetchCloudFiles(); }}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 min-h-[44px] transition-colors"
          >
            {t('resumeTailor.factBank.importJsonFromCloud')}
          </button>

          {/* Export JSON */}
          <button
            type="button"
            onClick={exportJson}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 min-h-[44px] transition-colors"
          >
            {t('resumeTailor.factBank.exportJson')}
          </button>

          {/* Save snapshot to cloud */}
          <button
            type="button"
            onClick={() => saveSnapshotToCloud()}
            disabled={cloudSaveStatus === 'saving' || isFactBankEmpty}
            title={t('resumeTailor.factBank.saveSnapshot')}
            aria-label={t('resumeTailor.factBank.saveSnapshot')}
            className="px-3 py-2 text-sm border border-blue-300 dark:border-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-300 min-h-[44px] transition-colors disabled:opacity-40 flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
            </svg>
            {t('resumeTailor.factBank.saveSnapshot')}
          </button>

          {/* History / versions */}
          {snapshotFiles.length > 0 && (
            <button
              type="button"
              onClick={() => { setHistoryOpen(true); void refetchCloudFiles(); }}
              aria-label={t('resumeTailor.factBank.history')}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 min-h-[44px] transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('resumeTailor.factBank.history')} ({snapshotFiles.length})
            </button>
          )}
        </div>

        {/* Save status */}
        <div className="flex items-center gap-3 text-xs" aria-live="polite">
          {/* Firestore sync status */}
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1 text-blue-500 dark:text-blue-400">
              <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              {t('resumeTailor.factBank.saving')}
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              {t('resumeTailor.factBank.saved')}
            </span>
          )}
          {saveStatus === 'idle' && factBank.experiences.length > 0 && cloudSaveStatus === 'idle' && (
            <span className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
              </svg>
              {t('resumeTailor.factBank.autoSaved')}
            </span>
          )}
          {/* Cloud file save status */}
          {cloudSaveStatus === 'saving' && (
            <span className="flex items-center gap-1 text-blue-500 dark:text-blue-400">
              <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              {t('resumeTailor.factBank.savingToCloud')}
            </span>
          )}
          {cloudSaveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
              {t('resumeTailor.factBank.savedToCloud')}
            </span>
          )}
          {cloudSaveStatus === 'error' && (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              {t('resumeTailor.factBank.cloudSaveError')}
            </span>
          )}
        </div>
      </div>

      {uploadError && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
          {uploadError}
        </p>
      )}

      {/* Auto-load banner: fact bank is empty but cloud history exists */}
      {showAutoLoadBanner && (
        <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg text-sm">
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-blue-800 dark:text-blue-200">
              {t('resumeTailor.factBank.historyFound', { count: snapshotFiles.length } as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </p>
            <p className="text-blue-600 dark:text-blue-400 mt-0.5 text-xs">
              {t('resumeTailor.factBank.historyFoundDesc')}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={async () => {
                if (!snapshotFiles[0]) return;
                setHistoryLoading(true);
                try {
                  await loadFromCloudSnapshot(snapshotFiles[0].downloadUrl);
                  setAutoBannerDismissed(true);
                } catch {
                  // ignore
                } finally {
                  setHistoryLoading(false);
                }
              }}
              disabled={historyLoading}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition disabled:opacity-50 min-h-[36px]"
            >
              {historyLoading ? t('resumeTailor.factBank.loading') : t('resumeTailor.factBank.loadLatest')}
            </button>
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="px-3 py-1.5 border border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 rounded text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-800/30 transition min-h-[36px]"
            >
              {t('resumeTailor.factBank.seeHistory')}
            </button>
            <button
              type="button"
              onClick={() => setAutoBannerDismissed(true)}
              aria-label="Dismiss"
              className="p-1.5 text-blue-400 hover:text-blue-600 dark:hover:text-blue-200 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Parse job status banner */}
      {(parseStatus === 'pending' || parseStatus === 'processing') && (
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {parseStatus === 'pending' ? t('resumeTailor.factBank.parseQueued') : t('resumeTailor.factBank.parseProcessing')}
            </p>
            <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">{t('resumeTailor.factBank.parseWait')}</p>
          </div>
        </div>
      )}
      {parseStatus === 'complete' && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium text-green-700 dark:text-green-300">{t('resumeTailor.factBank.parseComplete')}</p>
        </div>
      )}
      {parseStatus === 'error' && parseError && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-sm font-medium text-red-700 dark:text-red-300">{parseError}</p>
        </div>
      )}

      {/* Paste text modal */}
      {pasteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setPasteOpen(false); setPasteText(''); }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('resumeTailor.factBank.pasteText')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{t('resumeTailor.factBank.pasteTextHint')}</p>
            <textarea
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              placeholder={t('resumeTailor.factBank.pasteTextPlaceholder')}
              className="w-full h-64 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => { setPasteOpen(false); setPasteText(''); }}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 min-h-[44px] transition-colors"
              >
                {t('resumeTailor.factBank.cancel')}
              </button>
              <button
                type="button"
                onClick={handlePasteSubmit}
                disabled={!pasteText.trim() || pasting}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded min-h-[44px] disabled:opacity-50 transition-colors"
              >
                {pasting ? t('resumeTailor.factBank.parsing') : t('resumeTailor.factBank.parseText')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import JSON from Cloud Files modal */}
      {importJsonCloudOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setImportJsonCloudOpen(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('resumeTailor.factBank.importJsonFromCloud')}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('resumeTailor.factBank.importJsonFromCloudDesc')}</p>
              </div>
              <button
                type="button"
                onClick={() => setImportJsonCloudOpen(false)}
                aria-label="Close"
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
              {jsonCloudFiles.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">{t('resumeTailor.factBank.noJsonFilesInCloud')}</p>
              ) : (
                jsonCloudFiles.map(f => (
                  <button
                    key={f.id}
                    type="button"
                    disabled={importJsonCloudLoading}
                    onClick={async () => {
                      setImportJsonCloudLoading(true);
                      try {
                        await loadFromCloudSnapshot(f.downloadUrl);
                        setImportJsonCloudOpen(false);
                      } catch {
                        // silently ignore — malformed JSON
                      } finally {
                        setImportJsonCloudLoading(false);
                      }
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white truncate">{f.fileName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{(f.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </button>
                ))
              )}
            </div>
            <div className="flex justify-end mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setImportJsonCloudOpen(false)}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 min-h-[44px] transition-colors"
              >
                {t('resumeTailor.factBank.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History / versions modal */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setHistoryOpen(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('resumeTailor.factBank.history')}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('resumeTailor.factBank.historyDesc')}</p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                aria-label="Close"
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
              {snapshotFiles.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">{t('resumeTailor.factBank.noHistory')}</p>
              ) : (
                snapshotFiles.map((f, idx) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={async () => {
                      setHistoryLoading(true);
                      try {
                        await loadFromCloudSnapshot(f.downloadUrl);
                        setHistoryOpen(false);
                        setAutoBannerDismissed(true);
                      } catch {
                        // ignore
                      } finally {
                        setHistoryLoading(false);
                      }
                    }}
                    disabled={historyLoading}
                    className="w-full flex items-center gap-3 px-3 py-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white font-medium">
                        {formatSnapshotDate(f.fileName)}
                        {idx === 0 && (
                          <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">
                            {t('resumeTailor.factBank.latest')}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {(f.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </button>
                ))
              )}
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {t('resumeTailor.factBank.historyStoredIn')}
              </p>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 min-h-[44px] transition-colors"
              >
                {t('resumeTailor.factBank.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cloud File picker modal */}
      {cloudFilePickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setCloudFilePickerOpen(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('resumeTailor.factBank.pickFromFiles')}</h3>
            <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
              {(cloudFilesData?.cloudFiles ?? []).length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">{t('cloudFiles.noFiles')}</p>
              ) : (
                (cloudFilesData?.cloudFiles ?? []).map((f: { id: string; fileName: string; contentType: string; downloadUrl: string; size: number }) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={async () => {
                      setCloudFilePickerOpen(false);
                      setUploadError(null);
                      setUploading(true);
                      try {
                        await parseFromCloudFile(f.fileName, f.downloadUrl, f.contentType, model, endpointId);
                      } catch (err) {
                        setUploadError(err instanceof Error ? err.message : t('resumeTailor.errors.uploadFailed'));
                      } finally {
                        setUploading(false);
                      }
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white truncate">{f.fileName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{(f.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </button>
                ))
              )}
            </div>
            <div className="flex justify-end mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setCloudFilePickerOpen(false)}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 min-h-[44px] transition-colors"
              >
                {t('resumeTailor.factBank.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
          {t('resumeTailor.factBank.contact')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(['name', 'email', 'phone', 'location', 'linkedin', 'github', 'website'] as const).map(field => (
            <input
              key={field}
              type="text"
              value={factBank.contact[field] ?? ''}
              onChange={e => updateContact({ ...factBank.contact, [field]: e.target.value })}
              placeholder={t(`resumeTailor.factBank.${field}` as Parameters<typeof t>[0])}
              aria-label={t(`resumeTailor.factBank.${field}` as Parameters<typeof t>[0])}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            />
          ))}
        </div>
      </section>

      {/* Experience */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            {t('resumeTailor.factBank.experience')}
          </h2>
          <button
            type="button"
            onClick={addExperience}
            className="px-3 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 min-h-[44px] transition-colors"
          >
            + {t('resumeTailor.factBank.addExperience')}
          </button>
        </div>
        {factBank.experiences.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">{t('resumeTailor.factBank.noExperience')}</p>
        ) : (
          <div className="space-y-4">
            {factBank.experiences.map(exp => (
              <ExperienceCard
                key={exp.id}
                experience={exp}
                onChange={updateExperience}
                onDelete={deleteExperience}
              />
            ))}
          </div>
        )}
      </section>

      {/* Education */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            {t('resumeTailor.factBank.education')}
          </h2>
          <button
            type="button"
            onClick={addEducation}
            className="px-3 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 min-h-[44px] transition-colors"
          >
            + {t('resumeTailor.factBank.addEducation')}
          </button>
        </div>
        {factBank.education.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">{t('resumeTailor.factBank.noEducation')}</p>
        ) : (
          <div className="space-y-4">
            {factBank.education.map(edu => (
              <div key={edu.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 relative group">
                <button
                  type="button"
                  onClick={() => deleteEducation(edu.id)}
                  aria-label={t('resumeTailor.factBank.deleteEducation')}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity min-h-[44px] min-w-[44px] flex items-center justify-center text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-10">
                  {(['school', 'location', 'degree', 'field', 'startDate', 'endDate'] as const).map(field => (
                    <input
                      key={field}
                      type="text"
                      value={edu[field] ?? ''}
                      onChange={e => updateEducation({ ...edu, [field]: e.target.value })}
                      placeholder={t(`resumeTailor.factBank.${field}` as Parameters<typeof t>[0])}
                      aria-label={t(`resumeTailor.factBank.${field}` as Parameters<typeof t>[0])}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Skills */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
          {t('resumeTailor.factBank.skills')}
        </h2>
        <textarea
          value={factBank.skills.join('\n')}
          onChange={e => updateSkills(e.target.value.split('\n').map(s => s.trim()).filter(Boolean))}
          placeholder={t('resumeTailor.factBank.skillsPlaceholder')}
          aria-label={t('resumeTailor.factBank.skills')}
          rows={5}
          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {t('resumeTailor.factBank.skillsHint')}
        </p>
      </section>

      {/* Projects */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            {t('resumeTailor.factBank.projects')}
          </h2>
          <button
            type="button"
            onClick={addProject}
            className="px-3 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 min-h-[44px] transition-colors"
          >
            + {t('resumeTailor.factBank.addProject')}
          </button>
        </div>
        {factBank.projects.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">{t('resumeTailor.factBank.noProjects')}</p>
        ) : (
          <div className="space-y-4">
            {factBank.projects.map(proj => (
              <div key={proj.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 relative group">
                <button
                  type="button"
                  onClick={() => deleteProject(proj.id)}
                  aria-label={t('resumeTailor.factBank.deleteProject')}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity min-h-[44px] min-w-[44px] flex items-center justify-center text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pr-10 mb-3">
                  <input
                    type="text"
                    value={proj.name}
                    onChange={e => updateProject({ ...proj, name: e.target.value })}
                    placeholder={t('resumeTailor.factBank.projectName')}
                    aria-label={t('resumeTailor.factBank.projectName')}
                    className="col-span-1 md:col-span-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] font-medium"
                  />
                  <input
                    type="text"
                    value={proj.startDate ?? ''}
                    onChange={e => updateProject({ ...proj, startDate: e.target.value })}
                    placeholder={t('resumeTailor.factBank.startDate')}
                    aria-label={t('resumeTailor.factBank.startDate')}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  />
                  <input
                    type="text"
                    value={proj.endDate ?? ''}
                    onChange={e => updateProject({ ...proj, endDate: e.target.value })}
                    placeholder={t('resumeTailor.factBank.endDate')}
                    aria-label={t('resumeTailor.factBank.endDate')}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  />
                </div>
                {/* Project bullets */}
                <div className="space-y-1">
                  {proj.bullets.map((bullet, idx) => (
                    <div key={idx} className="flex items-start gap-2 group/bullet">
                      <span className="mt-3 text-gray-400 text-xs shrink-0">•</span>
                      <textarea
                        value={bullet}
                        onChange={e => {
                          const bullets = [...proj.bullets];
                          bullets[idx] = e.target.value;
                          updateProject({ ...proj, bullets });
                        }}
                        aria-label={`${t('resumeTailor.factBank.bullet')} ${idx + 1}`}
                        rows={2}
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const bullets = proj.bullets.filter((_, i) => i !== idx);
                          updateProject({ ...proj, bullets: bullets.length > 0 ? bullets : [''] });
                        }}
                        aria-label={t('resumeTailor.factBank.deleteBullet')}
                        className="mt-1 min-h-[44px] min-w-[44px] flex items-center justify-center text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 opacity-0 group-hover/bullet:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => updateProject({ ...proj, bullets: [...proj.bullets, ''] })}
                    className="ml-5 text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 min-h-[44px] flex items-center gap-1"
                  >
                    + {t('resumeTailor.factBank.addBullet')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
