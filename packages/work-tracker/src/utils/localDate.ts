/**
 * Return today's date as a YYYY-MM-DD string in the user's local timezone.
 *
 * IMPORTANT: Do NOT use `new Date().toISOString().split('T')[0]` — that gives
 * the UTC date, which can be a day ahead for users in western timezones during
 * the afternoon/evening.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
