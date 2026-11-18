import { addDaysFromToday, toDateKey } from '../../core/utils/date-key';
import type { ReportGroupBy } from '../../core/models/report.model';

export type ReportPreset = 'today' | '7d' | '30d' | 'month' | 'lastMonth' | 'year' | 'custom';

export const REPORT_PRESETS: readonly ReportPreset[] = ['today', '7d', '30d', 'month', 'lastMonth', 'year', 'custom'];

/** The inclusive day range a preset stands for (local calendar days; the server reads them in the branch's timezone). */
export function presetRange(preset: Exclude<ReportPreset, 'custom'>): { from: Date; to: Date } {
  const today = addDaysFromToday(0);
  switch (preset) {
    case 'today':
      return { from: today, to: today };
    case '7d':
      return { from: addDaysFromToday(-6), to: today };
    case '30d':
      return { from: addDaysFromToday(-29), to: today };
    case 'month':
      return { from: new Date(today.getFullYear(), today.getMonth(), 1), to: today };
    case 'lastMonth':
      return { from: new Date(today.getFullYear(), today.getMonth() - 1, 1), to: new Date(today.getFullYear(), today.getMonth(), 0) };
    case 'year':
      return { from: new Date(today.getFullYear(), 0, 1), to: today };
  }
}

export { toDateKey };

/** "17 Nov", "Week of 17 Nov", "Nov 2026" — the label of a chart / table bucket. */
export function bucketLabel(key: string, groupBy: ReportGroupBy, locale: string, weekWord: string): string {
  if (groupBy === 'month') {
    const [y, m] = key.split('-').map(Number);
    return new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).format(new Date(y, m - 1, 1));
  }
  const [y, m, d] = key.split('-').map(Number);
  const text = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(y, m - 1, d));
  return groupBy === 'week' ? `${weekWord} ${text}` : text;
}

export function dateLabel(key: string, locale: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(y, m - 1, d));
}

/** 85 → "1h 25m", 40 → "40m", null → "—". */
export function minutesText(m: number | null | undefined): string {
  if (m === null || m === undefined) return '—';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h}h ${rest}m` : `${h}h`;
}

/** Change from the previous period as a whole-number percentage; null when there is nothing to compare with. */
export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Escapes one CSV cell (quotes, commas, newlines) and neutralises spreadsheet formulas. */
export function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function downloadCsv(filename: string, headers: string[], rows: unknown[][]): void {
  const csv = [headers, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
  // BOM so Excel opens UTF-8 (Urdu names) correctly.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Chart.js defaults shared by every report chart: quiet grid, integer counts, no legend clutter. */
export function barOptions(stacked = false): Record<string, unknown> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } } },
    scales: {
      x: { stacked, grid: { display: false } },
      y: { stacked, beginAtZero: true, ticks: { precision: 0 }, grid: { color: 'rgba(127,127,127,0.15)' } },
    },
  };
}

export const REPORT_COLORS = {
  checkIns: '#16a34a',
  checkOuts: '#d97706',
  cleaned: '#2563eb',
  requested: '#94a3b8',
  occupancy: '#6366f1',
  guests: '#0891b2',
  newGuests: '#7c3aed',
} as const;
