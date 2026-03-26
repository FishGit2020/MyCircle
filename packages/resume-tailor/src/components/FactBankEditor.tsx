import React, { useRef, useState } from 'react';
import { useTranslation, useQuery, GET_CLOUD_FILES } from '@mycircle/shared';
import { useFactBank } from '../hooks/useFactBank';
import ExperienceCard from './ExperienceCard';

interface FactBankEditorProps {
  model: string;
  endpointId: string | null;
}

export default function FactBankEditor({ model, endpointId }: FactBankEditorProps) {
  const { t } = useTranslation();
  const {
    factBank,
    loading,
    saveStatus,
    parseStatus,
    parseError,
    uploadAndParse,
    parseFromText,
    parseFromCloudFile,
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
  const { data: cloudFilesData } = useQuery(GET_CLOUD_FILES);

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

          {/* Export JSON */}
          <button
            type="button"
            onClick={exportJson}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 min-h-[44px] transition-colors"
          >
            {t('resumeTailor.factBank.exportJson')}
          </button>
        </div>

        {/* Save status */}
        <div className="flex items-center gap-1.5 text-xs" aria-live="polite">
          {saveStatus === 'saving' && (
            <>
              <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-blue-500 dark:text-blue-400">{t('resumeTailor.factBank.saving')}</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <span className="text-green-600 dark:text-green-400">{t('resumeTailor.factBank.saved')}</span>
            </>
          )}
          {saveStatus === 'idle' && factBank.experiences.length > 0 && (
            <>
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
              </svg>
              <span className="text-gray-400 dark:text-gray-500">{t('resumeTailor.factBank.autoSaved')}</span>
            </>
          )}
        </div>
      </div>

      {uploadError && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
          {uploadError}
        </p>
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
