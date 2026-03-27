import React, { useCallback, useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { GeneratedResume } from '../hooks/useResumeGeneration';
import { downloadDocx, downloadPdf } from '../utils/exportResume';

interface Props {
  resume: GeneratedResume;
  onUpdateBullet: (expIdx: number, bulletIdx: number, value: string) => void;
  onUpdateSkills?: (skills: string[]) => void;
  onSave?: () => void;
  saving?: boolean;
}

export default function GeneratedResumeView({ resume, onUpdateBullet, onUpdateSkills: _onUpdateSkills, onSave, saving }: Props) {
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(false);

  const handlePdf = useCallback(() => downloadPdf(), []);

  const handleDocx = useCallback(async () => {
    setExporting(true);
    try {
      await downloadDocx(resume);
    } finally {
      setExporting(false);
    }
  }, [resume]);

  return (
    <>
      {/* Print action bar — hidden in print */}
      <div className="flex items-center gap-2 mb-4 print:hidden">
        <button
          type="button"
          onClick={handlePdf}
          className="px-4 py-2 text-sm bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 rounded hover:bg-gray-700 dark:hover:bg-gray-300 min-h-[44px] transition-colors"
        >
          {t('resumeTailor.generate.downloadPdf')}
        </button>
        <button
          type="button"
          onClick={handleDocx}
          disabled={exporting}
          className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded min-h-[44px] disabled:opacity-50 transition-colors"
        >
          {exporting ? t('resumeTailor.generate.exporting') : t('resumeTailor.generate.downloadDocx')}
        </button>
        {onSave && (
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 min-h-[44px] disabled:opacity-50 transition-colors"
          >
            {saving ? t('resumeTailor.applications.saving') : t('resumeTailor.applications.saveToLog')}
          </button>
        )}
      </div>

      {/* Resume document */}
      <div
        id="resume-printable"
        className="bg-white dark:bg-white text-gray-900 border border-gray-200 rounded-lg p-8 space-y-5 print:border-none print:p-0 print:shadow-none max-w-[800px] mx-auto"
      >
        {/* Contact */}
        <header className="text-center border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">{resume.contact.name}</h1>
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1 text-sm text-gray-600">
            {resume.contact.email && <span>{resume.contact.email}</span>}
            {resume.contact.phone && <span>{resume.contact.phone}</span>}
            {resume.contact.location && <span>{resume.contact.location}</span>}
            {resume.contact.linkedin && <a href={resume.contact.linkedin} className="text-blue-600 underline print:no-underline">{resume.contact.linkedin}</a>}
            {resume.contact.github && <a href={resume.contact.github} className="text-blue-600 underline print:no-underline">{resume.contact.github}</a>}
            {resume.contact.website && <a href={resume.contact.website} className="text-blue-600 underline print:no-underline">{resume.contact.website}</a>}
          </div>
        </header>

        {/* Experience */}
        {resume.experiences.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 border-b border-gray-200 pb-1 mb-3">
              {t('resumeTailor.factBank.experience')}
            </h2>
            <div className="space-y-4">
              {resume.experiences.map((exp, expIdx) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-start flex-wrap gap-1">
                    <div>
                      <span className="font-semibold text-gray-900">{exp.title}</span>
                      <span className="text-gray-600"> — {exp.company}</span>
                      {exp.location && <span className="text-gray-500">, {exp.location}</span>}
                    </div>
                    <span className="text-sm text-gray-500 shrink-0">{exp.startDate} – {exp.endDate}</span>
                  </div>
                  <ul className="mt-1 space-y-1 list-none">
                    {exp.bullets.map((bullet, bulletIdx) => (
                      <li key={bulletIdx} className="flex items-start gap-2 group/bullet">
                        <span className="shrink-0 mt-0.5 text-gray-400">•</span>
                        {/* Inline editable bullet */}
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={e => onUpdateBullet(expIdx, bulletIdx, e.currentTarget.textContent ?? '')}
                          className="flex-1 text-sm text-gray-800 outline-none focus:bg-yellow-50 focus:ring-1 focus:ring-yellow-300 rounded px-0.5 print:focus:bg-transparent print:focus:ring-0 cursor-text"
                          role="textbox"
                          aria-label={`${t('resumeTailor.factBank.bullet')} ${bulletIdx + 1}`}
                          aria-multiline="false"
                        >
                          {bullet}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {resume.education.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 border-b border-gray-200 pb-1 mb-3">
              {t('resumeTailor.factBank.education')}
            </h2>
            <div className="space-y-2">
              {resume.education.map(edu => (
                <div key={edu.id} className="flex justify-between items-start flex-wrap gap-1">
                  <div>
                    <span className="font-semibold text-gray-900">{edu.degree} in {edu.field}</span>
                    <span className="text-gray-600"> — {edu.school}</span>
                    {edu.location && <span className="text-gray-500">, {edu.location}</span>}
                  </div>
                  {(edu.startDate || edu.endDate) && (
                    <span className="text-sm text-gray-500 shrink-0">
                      {edu.startDate}{edu.startDate && edu.endDate ? ' – ' : ''}{edu.endDate}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {resume.skills.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 border-b border-gray-200 pb-1 mb-3">
              {t('resumeTailor.factBank.skills')}
            </h2>
            <div className="text-sm text-gray-800 space-y-0.5">
              {resume.skills.map((skill, i) => (
                <p key={i}>{skill}</p>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {resume.projects.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 border-b border-gray-200 pb-1 mb-3">
              {t('resumeTailor.factBank.projects')}
            </h2>
            <div className="space-y-3">
              {resume.projects.map(proj => (
                <div key={proj.id}>
                  <div className="flex justify-between items-start flex-wrap gap-1">
                    <span className="font-semibold text-gray-900">{proj.name}</span>
                    {(proj.startDate || proj.endDate) && (
                      <span className="text-sm text-gray-500 shrink-0">
                        {proj.startDate}{proj.startDate && proj.endDate ? ' – ' : ''}{proj.endDate}
                      </span>
                    )}
                  </div>
                  <ul className="mt-1 space-y-0.5">
                    {proj.bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-800">
                        <span className="shrink-0 text-gray-400">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Print styles injected globally */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #resume-printable, #resume-printable * { visibility: visible; }
          #resume-printable {
            position: fixed;
            top: 0; left: 0;
            width: 100%;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </>
  );
}
