import React, { useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import { useFactBank } from '../hooks/useFactBank';
import { useResumeGeneration } from '../hooks/useResumeGeneration';
import { useApplicationsLog } from '../hooks/useApplicationsLog';
import AtsScoreCard from './AtsScoreCard';
import KeywordReportPanel from './KeywordReportPanel';
import GeneratedResumeView from './GeneratedResumeView';

export default function ResumeGenerator() {
  const { t } = useTranslation();
  const { factBank } = useFactBank();
  const {
    jobDescription,
    setJobDescription,
    jobUrl,
    setJobUrl,
    generatedResume,
    status,
    errorMsg,
    scrapeUrl,
    generate,
    boost,
    updateGeneratedBullets,
    updateGeneratedSkills,
  } = useResumeGeneration();
  const { saveApplication, saving } = useApplicationsLog();

  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [saved, setSaved] = useState(false);

  async function handleScrape() {
    if (jobUrl.trim()) await scrapeUrl(jobUrl.trim());
  }

  async function handleSave() {
    if (!generatedResume) return;
    await saveApplication({
      jobTitle,
      company,
      jobDescription,
      resumeSnapshot: JSON.stringify(generatedResume),
      atsScore: generatedResume.atsScore.overall,
      status: 'applied',
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const isGenerating = status === 'generating';
  const isBoosting = status === 'boosting';
  const isScraping = status === 'scraping';

  return (
    <div className="space-y-4 pb-8">
      {/* Job info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="text"
          value={jobTitle}
          onChange={e => setJobTitle(e.target.value)}
          placeholder={t('resumeTailor.generate.jobTitle')}
          aria-label={t('resumeTailor.generate.jobTitle')}
          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
        />
        <input
          type="text"
          value={company}
          onChange={e => setCompany(e.target.value)}
          placeholder={t('resumeTailor.generate.company')}
          aria-label={t('resumeTailor.generate.company')}
          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
        />
      </div>

      {/* URL scrape */}
      <div className="flex gap-2">
        <input
          type="url"
          value={jobUrl}
          onChange={e => setJobUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleScrape()}
          placeholder={t('resumeTailor.generate.jobUrlPlaceholder')}
          aria-label={t('resumeTailor.generate.jobUrl')}
          className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
        />
        <button
          type="button"
          onClick={handleScrape}
          disabled={!jobUrl.trim() || isScraping}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 min-h-[44px] disabled:opacity-50 transition-colors shrink-0"
        >
          {isScraping ? t('resumeTailor.generate.scraping') : t('resumeTailor.generate.scrapeUrl')}
        </button>
      </div>

      {/* Job description */}
      <textarea
        value={jobDescription}
        onChange={e => setJobDescription(e.target.value)}
        placeholder={t('resumeTailor.generate.jobDescriptionPlaceholder')}
        aria-label={t('resumeTailor.generate.jobDescription')}
        rows={8}
        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
      />

      {/* Generate button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => generate(factBank)}
          disabled={!jobDescription.trim() || isGenerating || isBoosting}
          className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded min-h-[44px] disabled:opacity-50 transition-colors"
        >
          {isGenerating ? t('resumeTailor.generate.generating') : t('resumeTailor.generate.generate')}
        </button>
        {factBank.experiences.length === 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400">{t('resumeTailor.errors.noFactBank')}</p>
        )}
      </div>

      {errorMsg && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
          {errorMsg}
        </p>
      )}

      {/* Results */}
      {generatedResume && (
        <div className="space-y-4">
          {/* ATS score + keyword report side panel on md+ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <div className="md:col-span-1 space-y-3 print:hidden">
              <AtsScoreCard
                score={generatedResume.atsScore}
                onBoost={() => boost(factBank)}
                boosting={isBoosting}
              />
              <KeywordReportPanel report={generatedResume.keywordReport} />
              {saved && (
                <p className="text-sm text-green-600 dark:text-green-400">{t('resumeTailor.applications.saved')}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <GeneratedResumeView
                resume={generatedResume}
                onUpdateBullet={updateGeneratedBullets}
                onUpdateSkills={updateGeneratedSkills}
                onSave={handleSave}
                saving={saving}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
