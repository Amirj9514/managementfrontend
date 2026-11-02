/**
 * A calendar day as "YYYY-MM-DD" in the user's local time. Reports send days in this form so the
 * server reads them in the branch's own timezone (an ISO instant would shift the day by the
 * browser's UTC offset).
 */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Today ± `days`, at local midnight. */
export function addDaysFromToday(days: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}
