import React, { useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { ResumeExperience, ResumeVersion } from '../hooks/useFactBank';

interface Props {
  experience: ResumeExperience;
  onChange: (updated: ResumeExperience) => void;
  onDelete: (id: string) => void;
}

export default function ExperienceCard({ experience, onChange, onDelete }: Props) {
  const { t } = useTranslation();
  const [activeVersionId, setActiveVersionId] = useState(experience.versions[0]?.id ?? '');

  const activeVersion = experience.versions.find(v => v.id === activeVersionId) ?? experience.versions[0];

  function updateField(field: keyof ResumeExperience, value: string) {
    onChange({ ...experience, [field]: value });
  }

  function updateVersion(updated: ResumeVersion) {
    onChange({
      ...experience,
      versions: experience.versions.map(v => v.id === updated.id ? updated : v),
    });
  }

  function addVersion() {
    const newVer: ResumeVersion = {
      id: `ver-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: '',
      bullets: [''],
    };
    const updated = { ...experience, versions: [...experience.versions, newVer] };
    onChange(updated);
    setActiveVersionId(newVer.id);
  }

  function deleteVersion(id: string) {
    const remaining = experience.versions.filter(v => v.id !== id);
    if (remaining.length === 0) return; // always keep at least one
    onChange({ ...experience, versions: remaining });
    if (activeVersionId === id) setActiveVersionId(remaining[0].id);
  }

  function updateBullet(index: number, value: string) {
    if (!activeVersion) return;
    const bullets = [...activeVersion.bullets];
    bullets[index] = value;
    updateVersion({ ...activeVersion, bullets });
  }

  function addBullet() {
    if (!activeVersion) return;
    updateVersion({ ...activeVersion, bullets: [...activeVersion.bullets, ''] });
  }

  function deleteBullet(index: number) {
    if (!activeVersion) return;
    const bullets = activeVersion.bullets.filter((_, i) => i !== index);
    updateVersion({ ...activeVersion, bullets: bullets.length > 0 ? bullets : [''] });
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 relative group">
      {/* Delete card button — hover-reveal */}
      <button
        type="button"
        onClick={() => onDelete(experience.id)}
        aria-label={t('resumeTailor.factBank.deleteExperience')}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity min-h-[44px] min-w-[44px] flex items-center justify-center text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Header fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 pr-10">
        <input
          type="text"
          value={experience.company}
          onChange={e => updateField('company', e.target.value)}
          placeholder={t('resumeTailor.factBank.company')}
          aria-label={t('resumeTailor.factBank.company')}
          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
        />
        <input
          type="text"
          value={experience.location ?? ''}
          onChange={e => updateField('location', e.target.value)}
          placeholder={t('resumeTailor.factBank.location')}
          aria-label={t('resumeTailor.factBank.location')}
          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
        />
        <input
          type="text"
          value={experience.startDate}
          onChange={e => updateField('startDate', e.target.value)}
          placeholder={t('resumeTailor.factBank.startDate')}
          aria-label={t('resumeTailor.factBank.startDate')}
          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
        />
        <input
          type="text"
          value={experience.endDate}
          onChange={e => updateField('endDate', e.target.value)}
          placeholder={t('resumeTailor.factBank.endDate')}
          aria-label={t('resumeTailor.factBank.endDate')}
          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
        />
      </div>

      {/* Version tabs */}
      <div className="flex items-center gap-1 flex-wrap mb-3">
        {experience.versions.map(ver => (
          <div key={ver.id} className="relative group/ver flex items-center">
            <button
              type="button"
              onClick={() => setActiveVersionId(ver.id)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors min-h-[32px] ${
                activeVersionId === ver.id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-blue-400'
              }`}
            >
              {ver.title || t('resumeTailor.factBank.untitledVersion')}
            </button>
            {experience.versions.length > 1 && (
              <button
                type="button"
                onClick={() => deleteVersion(ver.id)}
                aria-label={t('resumeTailor.factBank.deleteVersion')}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover/ver:opacity-100 transition-opacity"
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addVersion}
          aria-label={t('resumeTailor.factBank.addVersion')}
          className="px-2 py-1 text-xs rounded-full border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 min-h-[32px] transition-colors"
        >
          + {t('resumeTailor.factBank.addVersion')}
        </button>
      </div>

      {/* Active version editor */}
      {activeVersion && (
        <div className="space-y-2">
          <input
            type="text"
            value={activeVersion.title}
            onChange={e => updateVersion({ ...activeVersion, title: e.target.value })}
            placeholder={t('resumeTailor.factBank.jobTitle')}
            aria-label={t('resumeTailor.factBank.jobTitle')}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] font-medium"
          />
          {/* Bullets */}
          <div className="space-y-1 mt-2">
            {activeVersion.bullets.map((bullet, idx) => (
              <div key={idx} className="flex items-start gap-2 group/bullet">
                <span className="mt-3 text-gray-400 text-xs shrink-0">•</span>
                <textarea
                  value={bullet}
                  onChange={e => updateBullet(idx, e.target.value)}
                  aria-label={`${t('resumeTailor.factBank.bullet')} ${idx + 1}`}
                  rows={2}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <button
                  type="button"
                  onClick={() => deleteBullet(idx)}
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
              onClick={addBullet}
              className="ml-5 text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 min-h-[44px] flex items-center gap-1"
            >
              + {t('resumeTailor.factBank.addBullet')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
