import React, { useState, useCallback } from 'react';
import { useTranslation } from '@mycircle/shared';

const ONBOARDING_KEY = 'mycircle-onboarding-complete';

function hasCompletedOnboarding(): boolean {
  try { return localStorage.getItem(ONBOARDING_KEY) === 'true'; } catch { return false; }
}

function markOnboardingComplete(): void {
  try { localStorage.setItem(ONBOARDING_KEY, 'true'); } catch { /* ignore */ }
}

const STEPS = [
  {
    titleKey: 'onboarding.step1Title' as const,
    descKey: 'onboarding.step1Desc' as const,
    icon: (
      <svg className="w-16 h-16 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    ),
    color: 'from-blue-500/10 to-cyan-500/10',
  },
  {
    titleKey: 'onboarding.step2Title' as const,
    descKey: 'onboarding.step2Desc' as const,
    icon: (
      <svg className="w-16 h-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    color: 'from-green-500/10 to-emerald-500/10',
  },
  {
    titleKey: 'onboarding.step3Title' as const,
    descKey: 'onboarding.step3Desc' as const,
    icon: (
      <svg className="w-16 h-16 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
    color: 'from-purple-500/10 to-pink-500/10',
  },
  {
    titleKey: 'onboarding.step4Title' as const,
    descKey: 'onboarding.step4Desc' as const,
    icon: (
      <svg className="w-16 h-16 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    color: 'from-amber-500/10 to-orange-500/10',
  },
  {
    titleKey: 'onboarding.step5Title' as const,
    descKey: 'onboarding.step5Desc' as const,
    icon: (
      <svg className="w-16 h-16 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    ),
    color: 'from-indigo-500/10 to-violet-500/10',
  },
  {
    titleKey: 'onboarding.step6Title' as const,
    descKey: 'onboarding.step6Desc' as const,
    icon: (
      <svg className="w-16 h-16 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    color: 'from-emerald-500/10 to-teal-500/10',
  },
  {
    titleKey: 'onboarding.step7Title' as const,
    descKey: 'onboarding.step7Desc' as const,
    icon: (
      <svg className="w-16 h-16 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    color: 'from-rose-500/10 to-pink-500/10',
  },
];

export default function Onboarding() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(() => !hasCompletedOnboarding());
  const [step, setStep] = useState(0);

  const dismiss = useCallback(() => {
    markOnboardingComplete();
    setVisible(false);
  }, []);

  const nextStep = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      dismiss();
    }
  }, [step, dismiss]);

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Gradient header */}
        <div className={`bg-gradient-to-br ${current.color} px-8 pt-10 pb-8 flex flex-col items-center text-center`}>
          {step === 0 && (
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {t('onboarding.welcome')}
            </h2>
          )}
          <div className="mb-4">{current.icon}</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t(current.titleKey)}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t(current.descKey)}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 py-4">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === step
                  ? 'bg-blue-500 scale-110'
                  : i < step
                  ? 'bg-blue-300 dark:bg-blue-600'
                  : 'bg-gray-200 dark:bg-gray-600'
              }`}
              aria-label={t('onboarding.stepOf').replace('{current}', String(i + 1)).replace('{total}', String(STEPS.length))}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-6 pb-6">
          <button
            onClick={dismiss}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            {t('onboarding.skip')}
          </button>
          <button
            onClick={nextStep}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {step === STEPS.length - 1 ? t('onboarding.getStarted') : t('onboarding.next')}
          </button>
        </div>
      </div>
    </div>
  );
}
