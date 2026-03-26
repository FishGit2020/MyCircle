import React, { useRef } from 'react';
import { useTranslation } from '@mycircle/shared';
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
    uploadAndParse,
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
            accept=".pdf,.doc,.docx,.txt"
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
        <div className="text-xs text-gray-500 dark:text-gray-400" aria-live="polite">
          {saveStatus === 'saving' && t('resumeTailor.factBank.saving')}
          {saveStatus === 'saved' && t('resumeTailor.factBank.saved')}
        </div>
      </div>

      {uploadError && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
          {uploadError}
        </p>
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
