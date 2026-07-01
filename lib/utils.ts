import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval } from 'date-fns';
import { uz } from 'date-fns/locale';
import type { DailyEntry } from './types';

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy-MM-dd');
}

export function formatDisplayDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  return format(d, 'dd MMMM yyyy', { locale: uz });
}

export function today(): string {
  return formatDate(new Date());
}

export function countPrayers(entry: DailyEntry | null): number {
  if (!entry) return 0;
  return [entry.bomdod, entry.peshin, entry.asr, entry.shom, entry.xufton].filter(Boolean).length;
}

export function getMissedPrayers(entry: DailyEntry | null): number {
  return 5 - countPrayers(entry);
}

export function getMonthRange(date: Date = new Date()): { start: string; end: string } {
  return {
    start: formatDate(startOfMonth(date)),
    end: formatDate(endOfMonth(date)),
  };
}

export function getYearRange(date: Date = new Date()): { start: string; end: string } {
  return {
    start: formatDate(startOfYear(date)),
    end: formatDate(endOfYear(date)),
  };
}

export function buildChartData(
  entries: DailyEntry[],
  startDate: string,
  endDate: string
) {
  const entryMap = new Map(entries.map((e) => [e.date, e]));
  const days = eachDayOfInterval({
    start: new Date(startDate + 'T00:00:00'),
    end: new Date(endDate + 'T00:00:00'),
  });

  return days.map((day) => {
    const key = formatDate(day);
    const entry = entryMap.get(key);
    return {
      date: format(day, 'dd/MM'),
      fullDate: key,
      namoz: entry ? countPrayers(entry) : 0,
      qoldirilgan: entry ? getMissedPrayers(entry) : 5,
      dhikr: entry?.dhikr_count || 0,
      salawat: entry?.salawat_count || 0,
    };
  });
}

export function calcTotals(entries: DailyEntry[]) {
  const totalDays = entries.length;
  const totalNamoz = entries.reduce((s, e) => s + countPrayers(e), 0);
  const totalMissed = entries.reduce((s, e) => s + getMissedPrayers(e), 0);
  const totalDhikr = entries.reduce((s, e) => s + (e.dhikr_count || 0), 0);
  const totalSalawat = entries.reduce((s, e) => s + (e.salawat_count || 0), 0);
  const avgNamoz = totalDays ? (totalNamoz / (totalDays * 5)) * 100 : 0;

  return { totalDays, totalNamoz, totalMissed, totalDhikr, totalSalawat, avgNamoz };
}

export function getSession(): { id: string; name: string } | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('namoz_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setSession(user: { id: string; name: string }) {
  localStorage.setItem('namoz_user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('namoz_user');
}
