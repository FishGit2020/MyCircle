export interface FloatingRule {
  month: number;   // 0-11 (Jan=0)
  weekday: number; // 0-6 (Sun=0)
  ordinal: number; // 1-5 for "1st-5th", -1 for "last"
}

/**
 * Compute the Nth weekday of a given month/year.
 * e.g. 2nd Sunday of May 2026 → May 10, 2026
 */
export function resolveFloatingDate(rule: FloatingRule, year: number): Date {
  const { month, weekday, ordinal } = rule;

  if (ordinal === -1) {
    // "Last <weekday> of <month>"
    const lastDay = new Date(year, month + 1, 0); // last day of the month
    const diff = (lastDay.getDay() - weekday + 7) % 7;
    lastDay.setDate(lastDay.getDate() - diff);
    return lastDay;
  }

  // "Nth <weekday> of <month>"
  const first = new Date(year, month, 1);
  const firstDayOfWeek = first.getDay();
  const daysUntilFirst = (weekday - firstDayOfWeek + 7) % 7;
  const day = 1 + daysUntilFirst + (ordinal - 1) * 7;
  return new Date(year, month, day);
}

/** Days until the next occurrence of a floating holiday. */
export function daysUntilNextFloating(rule: FloatingRule): number {
  const now = new Date();
  const thisYear = now.getFullYear();
  const today = new Date(thisYear, now.getMonth(), now.getDate());
  let next = resolveFloatingDate(rule, thisYear);
  if (next <= today) {
    next = resolveFloatingDate(rule, thisYear + 1);
  }
  const diff = next.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/** Days until the next occurrence of a fixed-date anniversary. */
export function daysUntilNextFixed(originalDate: string): number {
  const d = new Date(originalDate);
  const now = new Date();
  const thisYear = now.getFullYear();
  const today = new Date(thisYear, now.getMonth(), now.getDate());
  let next = new Date(thisYear, d.getMonth(), d.getDate());
  if (next <= today) {
    next = new Date(thisYear + 1, d.getMonth(), d.getDate());
  }
  const diff = next.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/** Years elapsed since an original date. */
export function yearsElapsed(originalDate: string): number {
  const d = new Date(originalDate);
  const now = new Date();
  let years = now.getFullYear() - d.getFullYear();
  const monthDiff = now.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < d.getDate())) {
    years--;
  }
  return Math.max(0, years);
}

/** Format a Date to locale-specific string. */
export function formatDateLocale(dateStr: string, locale: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export interface FloatingPreset {
  key: string;
  month: number;
  weekday: number;
  ordinal: number;
}

export const FLOATING_PRESETS: FloatingPreset[] = [
  { key: 'mothersDay',    month: 4,  weekday: 0, ordinal: 2  },
  { key: 'fathersDay',    month: 5,  weekday: 0, ordinal: 3  },
  { key: 'thanksgiving',  month: 10, weekday: 4, ordinal: 4  },
  { key: 'laborDay',      month: 8,  weekday: 1, ordinal: 1  },
  { key: 'memorialDay',   month: 4,  weekday: 1, ordinal: -1 },
  { key: 'mlkDay',        month: 0,  weekday: 1, ordinal: 3  },
  { key: 'presidentsDay', month: 1,  weekday: 1, ordinal: 3  },
];
