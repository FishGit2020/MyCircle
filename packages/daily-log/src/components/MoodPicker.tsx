import { useTranslation } from '@mycircle/shared';
import type { MoodValue } from '../types';

const MOODS: { value: MoodValue; emoji: string; labelKey: string }[] = [
  { value: 'happy',      emoji: '😊', labelKey: 'dailyLog.mood.happy' },
  { value: 'neutral',    emoji: '😐', labelKey: 'dailyLog.mood.neutral' },
  { value: 'sad',        emoji: '😔', labelKey: 'dailyLog.mood.sad' },
  { value: 'frustrated', emoji: '😤', labelKey: 'dailyLog.mood.frustrated' },
  { value: 'energized',  emoji: '🔥', labelKey: 'dailyLog.mood.energized' },
];

interface MoodPickerProps {
  value?: MoodValue;
  onChange: (mood: MoodValue | undefined) => void;
}

export default function MoodPicker({ value, onChange }: MoodPickerProps) {
  const { t } = useTranslation();

  return (
    <div className="flex gap-1 items-center" role="group" aria-label={t('dailyLog.moodLabel')}>
      {MOODS.map(({ value: mood, emoji, labelKey }) => (
        <button
          key={mood}
          type="button"
          aria-label={t(labelKey as Parameters<typeof t>[0])}
          aria-pressed={value === mood}
          onClick={() => onChange(value === mood ? undefined : mood)}
          className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-xl transition ${
            value === mood
              ? 'bg-blue-100 dark:bg-blue-900/40 ring-2 ring-blue-400 dark:ring-blue-500'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
