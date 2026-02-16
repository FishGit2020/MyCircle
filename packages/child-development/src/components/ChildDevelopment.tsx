import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation, StorageKeys, WindowEvents, useQuery, GET_BIBLE_PASSAGE } from '@mycircle/shared';
import {
  DOMAINS, AGE_RANGES, MILESTONES,
  getMilestonesByDomain, getMilestonesByDomainAndAge,
  getAgeRangeForMonths, getDomainMeta,
} from '../data/milestones';
import type { DomainId, AgeRangeId } from '../data/milestones';
import { parentingVerses } from '../data/parentingVerses';

function getRandomVerseIndex(): number {
  return Math.floor(Math.random() * parentingVerses.length);
}

/**
 * Encode/decode sensitive values to avoid clear-text storage in localStorage.
 * Uses btoa/atob — minimal obfuscation suitable for client-side storage.
 */
function encodeSensitive(value: string): string {
  try { return btoa(value); } catch { return value; }
}
function decodeSensitive(value: string): string {
  try { return atob(value); } catch { return value; }
}

// ─── Domain Icons ────────────────────────────────────────────────────────────

function DomainIcon({ icon, className = 'w-5 h-5' }: { icon: string; className?: string }) {
  switch (icon) {
    case 'runner':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
    case 'speech-bubble':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
    case 'brain':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
    case 'handshake':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
    case 'muscle':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
    case 'baby':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    default:
      return null;
  }
}

// ─── SVG Progress Ring ───────────────────────────────────────────────────────

function ProgressRing({ percent, color, size = 64 }: { percent: number; color: string; size?: number }) {
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  // Map tailwind color class to stroke color
  const colorMap: Record<string, string> = {
    'bg-blue-500': '#3b82f6',
    'bg-purple-500': '#a855f7',
    'bg-amber-500': '#f59e0b',
    'bg-pink-500': '#ec4899',
    'bg-green-500': '#22c55e',
    'bg-red-500': '#ef4444',
    'bg-teal-500': '#14b8a6',
  };
  const strokeColor = colorMap[color] || '#3b82f6';

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={stroke} fill="none" className="text-gray-200 dark:text-gray-700" />
      <circle cx={size / 2} cy={size / 2} r={radius} stroke={strokeColor} strokeWidth={stroke} fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-500" />
    </svg>
  );
}

// ─── Verse Section ───────────────────────────────────────────────────────────

function VerseSection({ verseIndex, onShuffle }: { verseIndex: number; onShuffle: () => void }) {
  const { t } = useTranslation();
  const verse = parentingVerses[verseIndex];
  const { data } = useQuery(GET_BIBLE_PASSAGE, {
    variables: { reference: verse.reference },
    errorPolicy: 'ignore',
  });

  const text = data?.biblePassage?.text || t(verse.textKey as any);

  return (
    <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-sm italic text-amber-700 dark:text-amber-300 leading-relaxed">
            &ldquo;{text}&rdquo;
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
            — {verse.reference}
          </p>
        </div>
        <button
          type="button"
          onClick={onShuffle}
          className="flex-shrink-0 p-1.5 rounded-lg text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
          aria-label={t('childDev.shuffleVerse' as any)}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Domain Card ─────────────────────────────────────────────────────────────

function DomainCard({
  domain,
  checkedCount,
  totalCount,
  onClick,
}: {
  domain: typeof DOMAINS[number];
  checkedCount: number;
  totalCount: number;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  const percent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full text-left bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-gray-200 dark:border-gray-700 p-5 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all`}
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <ProgressRing percent={percent} color={domain.color} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{percent}%</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center justify-center w-6 h-6 rounded ${domain.color} text-white`}>
              <DomainIcon icon={domain.icon} className="w-3.5 h-3.5" />
            </span>
            <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
              {t(domain.nameKey as any)}
            </h4>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t(domain.descKey as any)}</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
            {t('childDev.viewDetails' as any)} →
          </p>
        </div>
      </div>
    </button>
  );
}

// ─── Milestone Item ──────────────────────────────────────────────────────────

function MilestoneItem({
  milestoneId,
  nameKey,
  isRedFlag,
  isChecked,
  isTracking,
  onToggle,
}: {
  milestoneId: string;
  nameKey: string;
  isRedFlag: boolean;
  isChecked: boolean;
  isTracking: boolean;
  onToggle: (id: string) => void;
}) {
  const { t } = useTranslation();

  if (isTracking) {
    return (
      <label className="flex items-start gap-3 py-2 cursor-pointer group">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={() => onToggle(milestoneId)}
          className="mt-0.5 w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 flex-shrink-0"
        />
        <span className={`text-sm leading-relaxed ${isChecked ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
          {t(nameKey as any)}
        </span>
        {isRedFlag && (
          <span className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium">
            !
          </span>
        )}
      </label>
    );
  }

  return (
    <div className="flex items-start gap-3 py-2">
      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 flex-shrink-0" />
      <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        {t(nameKey as any)}
      </span>
      {isRedFlag && (
        <span className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium" title={t('childDev.redFlagInfo' as any)}>
          {t('childDev.redFlag' as any)}
        </span>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ChildDevelopment() {
  const { t } = useTranslation();

  // State
  const [childName, setChildName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [inputName, setInputName] = useState('');
  const [inputBirthDate, setInputBirthDate] = useState('');
  const [mode, setMode] = useState<'tracking' | 'reference'>('tracking');
  const [activeTab, setActiveTab] = useState<'overview' | DomainId>('overview');
  const [checkedMilestones, setCheckedMilestones] = useState<string[]>([]);
  const [verseIndex, setVerseIndex] = useState(getRandomVerseIndex);
  const [isEditing, setIsEditing] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const storedName = localStorage.getItem(StorageKeys.CHILD_NAME);
    const storedDate = localStorage.getItem(StorageKeys.CHILD_BIRTH_DATE);
    const storedMilestones = localStorage.getItem(StorageKeys.CHILD_MILESTONES);
    if (storedName) { setChildName(storedName); setInputName(storedName); }
    if (storedDate) { const d = decodeSensitive(storedDate); setBirthDate(d); setInputBirthDate(d); }
    if (storedMilestones) {
      try { setCheckedMilestones(JSON.parse(storedMilestones)); } catch { /* ignore */ }
    }
  }, []);

  // Listen for external changes (Firestore sync)
  useEffect(() => {
    function handleDataChanged() {
      const storedName = localStorage.getItem(StorageKeys.CHILD_NAME);
      const storedDate = localStorage.getItem(StorageKeys.CHILD_BIRTH_DATE);
      const storedMilestones = localStorage.getItem(StorageKeys.CHILD_MILESTONES);
      if (storedName) { setChildName(storedName); setInputName(storedName); }
      else { setChildName(''); setInputName(''); }
      if (storedDate) { const d = decodeSensitive(storedDate); setBirthDate(d); setInputBirthDate(d); }
      else { setBirthDate(''); setInputBirthDate(''); }
      if (storedMilestones) {
        try { setCheckedMilestones(JSON.parse(storedMilestones)); } catch { /* ignore */ }
      } else { setCheckedMilestones([]); }
    }
    window.addEventListener(WindowEvents.CHILD_DATA_CHANGED, handleDataChanged);
    return () => window.removeEventListener(WindowEvents.CHILD_DATA_CHANGED, handleDataChanged);
  }, []);

  // Computed
  const ageInMonths = useMemo(() => {
    if (!birthDate) return null;
    const birth = new Date(birthDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
    return Math.max(0, months);
  }, [birthDate]);

  const currentAgeRange = useMemo(() => {
    if (ageInMonths === null) return null;
    return getAgeRangeForMonths(ageInMonths) || null;
  }, [ageInMonths]);

  const ageDisplay = useMemo(() => {
    if (ageInMonths === null) return '';
    if (ageInMonths < 24) {
      return t('childDev.monthsOld' as any).replace('{months}', String(ageInMonths));
    }
    const years = Math.floor(ageInMonths / 12);
    const months = ageInMonths % 12;
    return t('childDev.yearsMonthsOld' as any).replace('{years}', String(years)).replace('{months}', String(months));
  }, [ageInMonths, t]);

  // Actions
  const saveChild = useCallback(() => {
    if (!inputName.trim() || !inputBirthDate) return;
    localStorage.setItem(StorageKeys.CHILD_NAME, inputName.trim());
    localStorage.setItem(StorageKeys.CHILD_BIRTH_DATE, encodeSensitive(inputBirthDate));
    setChildName(inputName.trim());
    setBirthDate(inputBirthDate);
    setIsEditing(false);
    window.dispatchEvent(new Event(WindowEvents.CHILD_DATA_CHANGED));
  }, [inputName, inputBirthDate]);

  const toggleMilestone = useCallback((id: string) => {
    setCheckedMilestones(prev => {
      const next = prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id];
      localStorage.setItem(StorageKeys.CHILD_MILESTONES, JSON.stringify(next));
      window.dispatchEvent(new Event(WindowEvents.CHILD_DATA_CHANGED));
      return next;
    });
  }, []);

  const shuffleVerse = useCallback(() => {
    setVerseIndex(prev => {
      let next = Math.floor(Math.random() * parentingVerses.length);
      while (next === prev && parentingVerses.length > 1) {
        next = Math.floor(Math.random() * parentingVerses.length);
      }
      return next;
    });
  }, []);

  // ─── Setup View ──────────────────────────────────────────────────────────

  if (!birthDate || isEditing) {
    return (
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            {t('childDev.title' as any)}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('childDev.subtitle' as any)}
          </p>
        </div>

        <VerseSection verseIndex={verseIndex} onShuffle={shuffleVerse} />

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="child-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('childDev.childName' as any)}
              </label>
              <input
                id="child-name"
                type="text"
                value={inputName}
                onChange={e => setInputName(e.target.value)}
                placeholder={t('childDev.childNamePlaceholder' as any)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
            <div>
              <label htmlFor="birth-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('childDev.birthDate' as any)}
              </label>
              <input
                id="birth-date"
                type="date"
                value={inputBirthDate}
                onChange={e => setInputBirthDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
            <button
              type="button"
              onClick={saveChild}
              disabled={!inputName.trim() || !inputBirthDate}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {isEditing ? t('childDev.saveChild' as any) : t('childDev.getStarted' as any)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Domain Detail View ──────────────────────────────────────────────────

  if (activeTab !== 'overview') {
    const domainMeta = getDomainMeta(activeTab)!;
    const domainMilestones = getMilestonesByDomain(activeTab);

    return (
      <div className="max-w-2xl mx-auto">
        {/* Back button + header */}
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t('childDev.back' as any)}
        </button>

        <div className="flex items-center gap-3 mb-6">
          <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${domainMeta.color} text-white`}>
            <DomainIcon icon={domainMeta.icon} className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">{t(domainMeta.nameKey as any)}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t(domainMeta.descKey as any)}</p>
          </div>
        </div>

        {/* Milestones grouped by age range */}
        <div className="space-y-4">
          {AGE_RANGES.map(ageRange => {
            const milestones = getMilestonesByDomainAndAge(activeTab, ageRange.id);
            const isCurrent = currentAgeRange?.id === ageRange.id;

            return (
              <div
                key={ageRange.id}
                className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-4 transition-colors ${
                  isCurrent
                    ? 'border-blue-400 dark:border-blue-500 shadow-md'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-semibold text-sm text-gray-800 dark:text-white">
                    {t(ageRange.labelKey as any)}
                  </h4>
                  {isCurrent && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">
                      {t('childDev.currentAge' as any)}
                    </span>
                  )}
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {milestones.map(m => (
                    <MilestoneItem
                      key={m.id}
                      milestoneId={m.id}
                      nameKey={m.nameKey}
                      isRedFlag={m.isRedFlag}
                      isChecked={checkedMilestones.includes(m.id)}
                      isTracking={mode === 'tracking'}
                      onToggle={toggleMilestone}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── Overview Tab ────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            {childName}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">{ageDisplay}</p>
        </div>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="self-start sm:self-auto text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          {t('childDev.editChild' as any)}
        </button>
      </div>

      {/* Verse */}
      <VerseSection verseIndex={verseIndex} onShuffle={shuffleVerse} />

      {/* Mode toggle */}
      <div className="flex items-center gap-2 mb-6">
        <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-100 dark:bg-gray-800">
          <button
            type="button"
            onClick={() => setMode('tracking')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              mode === 'tracking'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {t('childDev.tracking' as any)}
          </button>
          <button
            type="button"
            onClick={() => setMode('reference')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              mode === 'reference'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {t('childDev.reference' as any)}
          </button>
        </div>
      </div>

      {/* Domain cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DOMAINS.map(domain => {
          const domainMilestones = getMilestonesByDomain(domain.id);
          const checkedCount = domainMilestones.filter(m => checkedMilestones.includes(m.id)).length;
          return (
            <DomainCard
              key={domain.id}
              domain={domain}
              checkedCount={checkedCount}
              totalCount={domainMilestones.length}
              onClick={() => setActiveTab(domain.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
