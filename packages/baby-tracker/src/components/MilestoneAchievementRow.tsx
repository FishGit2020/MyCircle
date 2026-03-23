import React, { useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { Milestone } from '../../../child-development/src/data/milestones';
import type { InfantAchievement } from '../hooks/useInfantAchievements';

interface MilestoneAchievementRowProps {
  milestone: Milestone;
  achievement: InfantAchievement | undefined;
  onLog: (milestoneId: string, achievedDate: string, note?: string | null) => Promise<void>;
  onUpdate: (id: string, updates: { achievedDate?: string; note?: string | null }) => Promise<void>;
  onClear: (id: string) => Promise<void>;
}

export default function MilestoneAchievementRow({
  milestone,
  achievement,
  onLog,
  onUpdate,
  onClear,
}: MilestoneAchievementRowProps) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [dateInput, setDateInput] = useState(achievement?.achievedDate ?? '');
  const [noteInput, setNoteInput] = useState(achievement?.note ?? '');
  const [saving, setSaving] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const isAchieved = !!achievement;

  const handleCheck = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const today = new Date().toISOString().substring(0, 10);
      setDateInput(today);
      setEditing(true);
    } else {
      if (achievement) setConfirmClear(true);
    }
  };

  const handleSave = async () => {
    if (!dateInput) return;
    setSaving(true);
    try {
      if (achievement) {
        await onUpdate(achievement.id, { achievedDate: dateInput, note: noteInput || null });
      } else {
        await onLog(milestone.id, dateInput, noteInput || null);
      }
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!achievement) return;
    setSaving(true);
    try {
      await onClear(achievement.id);
      setDateInput('');
      setNoteInput('');
      setConfirmClear(false);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 py-1">
        <input
          type="checkbox"
          checked={isAchieved}
          onChange={handleCheck}
          id={`ms-${milestone.id}`}
          className="w-5 h-5 rounded accent-pink-600 cursor-pointer"
        />
        <label
          htmlFor={`ms-${milestone.id}`}
          className={`flex-1 text-sm cursor-pointer ${
            isAchieved
              ? 'text-gray-500 dark:text-gray-400 line-through'
              : 'text-gray-800 dark:text-gray-200'
          }`}
        >
          {t(milestone.nameKey as Parameters<typeof t>[0])}
          {milestone.isRedFlag && (
            <span
              title={t('babyJournal.milestones.redFlag')}
              className="ml-1 text-amber-500"
              aria-label={t('babyJournal.milestones.redFlag')}
            >
              ⚠
            </span>
          )}
        </label>
        {isAchieved && !editing && (
          <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
            {achievement.achievedDate}
          </span>
        )}
        {isAchieved && !editing && (
          <button
            type="button"
            onClick={() => {
              setDateInput(achievement.achievedDate);
              setNoteInput(achievement.note ?? '');
              setEditing(true);
            }}
            aria-label={t('babyJournal.myMoments.edit')}
            className="p-1.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
      </div>

      {editing && (
        <div className="ml-8 space-y-2">
          <input
            type="date"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            aria-label={t('babyJournal.milestones.datePlaceholder')}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:text-gray-100"
          />
          <textarea
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder={t('babyJournal.milestones.notePlaceholder')}
            maxLength={500}
            rows={2}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:text-gray-100 resize-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !dateInput}
              className="px-3 py-1.5 rounded-lg bg-pink-600 text-white text-sm font-medium hover:bg-pink-700 disabled:opacity-50 min-h-[44px]"
            >
              {t('babyJournal.myMoments.save')}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 min-h-[44px]"
            >
              {t('babyJournal.myMoments.cancel')}
            </button>
          </div>
        </div>
      )}

      {confirmClear && (
        <div className="ml-8 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 space-y-2">
          <p className="text-xs text-red-700 dark:text-red-300">{t('babyJournal.milestones.clearConfirm')}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClear}
              disabled={saving}
              className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50 min-h-[44px]"
            >
              {t('babyJournal.milestones.clear')}
            </button>
            <button
              type="button"
              onClick={() => setConfirmClear(false)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 min-h-[44px]"
            >
              {t('babyJournal.myMoments.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
