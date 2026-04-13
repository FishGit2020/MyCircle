import { useState } from 'react';
import { useTranslation, FLOATING_PRESETS, resolveFloatingDate } from '@mycircle/shared';
import type { FloatingPreset } from '@mycircle/shared';
import { useCreateAnniversary } from '../hooks/useAnniversaryMutations';

interface AnniversaryFormProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
}

const MONTH_KEYS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

const WEEKDAY_KEYS: Record<number, string> = {
  0: 'anniversary.sunday', 1: 'anniversary.monday', 2: 'anniversary.tuesday',
  3: 'anniversary.wednesday', 4: 'anniversary.thursday', 5: 'anniversary.friday',
  6: 'anniversary.saturday',
};

const ORDINAL_KEYS: Record<number, string> = {
  1: 'anniversary.ordinal1', 2: 'anniversary.ordinal2', 3: 'anniversary.ordinal3',
  4: 'anniversary.ordinal4', 5: 'anniversary.ordinal5', '-1': 'anniversary.ordinalLast',
};

const PRESET_TITLE_KEYS: Record<string, string> = {
  mlkDay: 'anniversary.presetMlkDay',
  presidentsDay: 'anniversary.presetPresidentsDay',
  memorialDay: 'anniversary.presetMemorialDay',
  mothersDay: 'anniversary.presetMothersDay',
  fathersDay: 'anniversary.presetFathersDay',
  laborDay: 'anniversary.presetLaborDay',
  columbusDay: 'anniversary.presetColumbusDay',
  thanksgiving: 'anniversary.presetThanksgiving',
};

// Fixed-date US holidays (month is 1-indexed for display, day is the date)
const FIXED_HOLIDAYS: Array<{ key: string; titleKey: string; month: number; day: number }> = [
  { key: 'newYears', titleKey: 'anniversary.presetNewYears', month: 1, day: 1 },
  { key: 'valentines', titleKey: 'anniversary.presetValentines', month: 2, day: 14 },
  { key: 'independence', titleKey: 'anniversary.presetIndependence', month: 7, day: 4 },
  { key: 'halloween', titleKey: 'anniversary.presetHalloween', month: 10, day: 31 },
  { key: 'veterans', titleKey: 'anniversary.presetVeterans', month: 11, day: 11 },
  { key: 'christmas', titleKey: 'anniversary.presetChristmas', month: 12, day: 25 },
];

function presetResolvedDate(preset: FloatingPreset, locale: string): string {
  const d = resolveFloatingDate(preset, new Date().getFullYear());
  try {
    return d.toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return d.toDateString();
  }
}

export default function AnniversaryForm({ open, onClose, onCreated }: AnniversaryFormProps) {
  const { t, locale } = useTranslation();
  const [createAnniversary, { loading }] = useCreateAnniversary();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const [dateMode, setDateMode] = useState<'fixed' | 'floating'>('fixed');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customRule, setCustomRule] = useState({ month: 0, weekday: 0, ordinal: 1 });
  const [showCustom, setShowCustom] = useState(false);
  const [startYear, setStartYear] = useState('');

  const activeRule = selectedPreset
    ? FLOATING_PRESETS.find(p => p.key === selectedPreset)!
    : showCustom ? customRule : null;

  const isValid = dateMode === 'fixed'
    ? title.trim() && date
    : title.trim() && activeRule;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isValid) return;

    try {
      const input: Record<string, unknown> = { title: title.trim() };

      if (dateMode === 'fixed') {
        input.originalDate = date;
      } else if (activeRule) {
        input.floatingRule = { month: activeRule.month, weekday: activeRule.weekday, ordinal: activeRule.ordinal };
        // Use start year for originalDate so "years together" calculates correctly
        const year = startYear ? Number(startYear) : new Date().getFullYear();
        const resolved = resolveFloatingDate(activeRule, year);
        input.originalDate = resolved.toISOString().split('T')[0];
      }

      const result = await createAnniversary({ variables: { input } });
      const newId = result.data?.createAnniversary?.id;
      resetForm();
      onClose();
      if (newId && onCreated) onCreated(newId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create anniversary');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDate('');
    setError('');
    setDateMode('fixed');
    setSelectedPreset(null);
    setShowCustom(false);
    setCustomRule({ month: 0, weekday: 0, ordinal: 1 });
    setStartYear('');
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const handlePresetSelect = (preset: FloatingPreset) => {
    setSelectedPreset(preset.key);
    setShowCustom(false);
    setTitle(t(PRESET_TITLE_KEYS[preset.key] as never));
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label={t('anniversary.createNew')}
    >
      <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {t('anniversary.createNew')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date mode toggle */}
          <div role="radiogroup" aria-label={t('anniversary.dateLabel')} className="flex rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden">
            <button
              type="button"
              role="radio"
              aria-checked={dateMode === 'fixed'}
              onClick={() => { setDateMode('fixed'); setSelectedPreset(null); setShowCustom(false); }}
              className={`flex-1 min-h-[44px] px-3 py-2 text-sm font-medium transition-colors ${
                dateMode === 'fixed'
                  ? 'bg-blue-600 text-white dark:bg-blue-500'
                  : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {t('anniversary.fixedDate')}
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={dateMode === 'floating'}
              onClick={() => setDateMode('floating')}
              className={`flex-1 min-h-[44px] px-3 py-2 text-sm font-medium transition-colors ${
                dateMode === 'floating'
                  ? 'bg-blue-600 text-white dark:bg-blue-500'
                  : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {t('anniversary.floatingHoliday')}
            </button>
          </div>

          {/* Title */}
          <div>
            <label
              htmlFor="anniversary-title"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t('anniversary.titleLabel')} *
            </label>
            <input
              id="anniversary-title"
              type="text"
              required
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
              aria-label={t('anniversary.titleLabel')}
            />
          </div>

          {/* Fixed date input */}
          {dateMode === 'fixed' && (
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="anniversary-date"
                  className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {t('anniversary.dateLabel')} *
                </label>
                <input
                  id="anniversary-date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  aria-label={t('anniversary.dateLabel')}
                />
              </div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('anniversary.quickFillHoliday')}</p>
              <div className="grid grid-cols-3 gap-1.5">
                {FIXED_HOLIDAYS.map((h) => {
                  const thisYearDate = `${new Date().getFullYear()}-${String(h.month).padStart(2, '0')}-${String(h.day).padStart(2, '0')}`;
                  const isSelected = date === thisYearDate && title === t(h.titleKey as never);
                  return (
                    <button
                      key={h.key}
                      type="button"
                      onClick={() => {
                        setDate(thisYearDate);
                        if (!title.trim()) setTitle(t(h.titleKey as never));
                      }}
                      className={`min-h-[36px] rounded-md border px-2 py-1 text-xs transition-colors ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      {t(h.titleKey as never)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Floating holiday picker */}
          {dateMode === 'floating' && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('anniversary.selectPreset')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {FLOATING_PRESETS.map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className={`min-h-[44px] rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                      selectedPreset === preset.key
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:border-gray-500'
                    }`}
                    aria-pressed={selectedPreset === preset.key}
                  >
                    <span className="block font-medium">{t(PRESET_TITLE_KEYS[preset.key] as never)}</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">
                      {presetResolvedDate(preset, locale)}
                    </span>
                  </button>
                ))}
              </div>

              {/* Custom rule toggle */}
              <button
                type="button"
                onClick={() => { setShowCustom(!showCustom); setSelectedPreset(null); }}
                className={`w-full min-h-[44px] rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                  showCustom
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:border-gray-500'
                }`}
                aria-expanded={showCustom}
              >
                {t('anniversary.customRule')}
              </button>

              {/* Custom rule dropdowns */}
              {showCustom && (
                <div className="space-y-2 rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-700/50">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label htmlFor="floating-ordinal" className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                        {t('anniversary.ordinalSelect')}
                      </label>
                      <select
                        id="floating-ordinal"
                        value={customRule.ordinal}
                        onChange={(e) => setCustomRule({ ...customRule, ordinal: Number(e.target.value) })}
                        className="w-full min-h-[44px] rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      >
                        {[1, 2, 3, 4, 5, -1].map((o) => (
                          <option key={o} value={o}>{t(ORDINAL_KEYS[o] as never)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="floating-weekday" className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                        {t('anniversary.weekdaySelect')}
                      </label>
                      <select
                        id="floating-weekday"
                        value={customRule.weekday}
                        onChange={(e) => setCustomRule({ ...customRule, weekday: Number(e.target.value) })}
                        className="w-full min-h-[44px] rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      >
                        {[0, 1, 2, 3, 4, 5, 6].map((w) => (
                          <option key={w} value={w}>{t(WEEKDAY_KEYS[w] as never)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="floating-month" className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                        {t('anniversary.monthSelect')}
                      </label>
                      <select
                        id="floating-month"
                        value={customRule.month}
                        onChange={(e) => setCustomRule({ ...customRule, month: Number(e.target.value) })}
                        className="w-full min-h-[44px] rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      >
                        {MONTH_KEYS.map((m, i) => (
                          <option key={i} value={i}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('anniversary.resolvedDate', {
                      date: resolveFloatingDate(customRule, new Date().getFullYear())
                        .toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' }),
                    })}
                  </p>
                </div>
              )}

              {/* Show resolved date for selected preset */}
              {selectedPreset && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('anniversary.resolvedDate', {
                    date: presetResolvedDate(FLOATING_PRESETS.find(p => p.key === selectedPreset)!, locale),
                  })}
                </p>
              )}

              {/* Start year (optional) */}
              {(selectedPreset || showCustom) && (
                <div>
                  <label htmlFor="anniversary-start-year" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('anniversary.startYear')}
                  </label>
                  <input
                    id="anniversary-start-year"
                    type="number"
                    min={1900}
                    max={new Date().getFullYear()}
                    placeholder={String(new Date().getFullYear())}
                    value={startYear}
                    onChange={(e) => setStartYear(e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                  />
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{t('anniversary.startYearHint')}</p>
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              aria-label={t('anniversary.cancel')}
            >
              {t('anniversary.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || !isValid}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
              aria-label={t('anniversary.create')}
            >
              {loading ? '...' : t('anniversary.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
