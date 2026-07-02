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

// True zikr count: sum individual fields (more accurate), fallback to dhikr_count for old data
export function entryZikr(entry: DailyEntry): number {
  const individual =
    (entry.subhanallah_count || 0) +
    (entry.alhamdulillah_count || 0) +
    (entry.allahu_akbar_count || 0) +
    (entry.la_ilaha_count || 0) +
    (entry.astaghfirullah_count || 0);
  return individual > 0 ? individual : (entry.dhikr_count || 0);
}

export function buildChartData(
  entries: DailyEntry[],
  startDate: string,
  endDate: string
) {
  const entryMap = new Map(entries.map((e) => [String(e.date).substring(0, 10), e]));
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
      dhikr: entry ? entryZikr(entry) : 0,
      salawat: entry?.salawat_count || 0,
    };
  });
}

export function calcTotals(entries: DailyEntry[]) {
  const totalDays = entries.length;
  const totalNamoz = entries.reduce((s, e) => s + countPrayers(e), 0);
  const totalMissed = entries.reduce((s, e) => s + getMissedPrayers(e), 0);
  const totalDhikr = entries.reduce((s, e) => s + entryZikr(e), 0);
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

export function calcStreak(entries: DailyEntry[]): number {
  if (!entries.length) return 0;
  const entryMap = new Map(entries.map((e) => [String(e.date).substring(0, 10), e]));
  const todayStr = today();

  let checkDate = todayStr;
  // If today doesn't have 5/5, start streak check from yesterday
  const todayEntry = entryMap.get(todayStr);
  if (!todayEntry || countPrayers(todayEntry) < 5) {
    const d = new Date(todayStr + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    checkDate = formatDate(d);
  }

  let streak = 0;
  while (true) {
    const entry = entryMap.get(checkDate);
    if (!entry || countPrayers(entry) < 5) break;
    streak++;
    const d = new Date(checkDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    checkDate = formatDate(d);
  }
  return streak;
}

export interface Badge {
  id: string;
  icon: string;
  name: string;
  desc: string;
  earned: boolean;
}

export function calcBadges(entries: DailyEntry[], streak: number): Badge[] {
  const totalDhikr = entries.reduce((s, e) => s + entryZikr(e), 0);
  const totalSalawat = entries.reduce((s, e) => s + (e.salawat_count || 0), 0);
  const totalPages = entries.reduce((s, e) => s + (e.morning_pages || 0) + (e.evening_pages || 0), 0);
  const daysWithAll5 = entries.filter((e) => countPrayers(e) === 5).length;
  const maxDhikrDay = entries.reduce((max, e) => Math.max(max, entryZikr(e)), 0);

  return [
    { id: 'first', icon: '🌱', name: 'Birinchi qadam', desc: 'Birinchi marotaba ma\'lumot kiriting', earned: entries.length > 0 },
    { id: 'streak3', icon: '🔥', name: '3 kunlik streak', desc: '3 kun ketma-ket 5/5 namoz', earned: streak >= 3 },
    { id: 'streak7', icon: '🔥🔥', name: '7 kunlik streak', desc: '7 kun ketma-ket 5/5 namoz', earned: streak >= 7 },
    { id: 'streak30', icon: '⚡', name: '30 kunlik streak', desc: '30 kun ketma-ket 5/5 namoz', earned: streak >= 30 },
    { id: 'all5_10', icon: '🕌', name: 'Namozchi', desc: '10 kun 5/5 namoz o\'qish', earned: daysWithAll5 >= 10 },
    { id: 'all5_25', icon: '🕌✨', name: 'Komil Namozchi', desc: '25 kun 5/5 namoz o\'qish', earned: daysWithAll5 >= 25 },
    { id: 'dhikr1000', icon: '📿', name: 'Zikrchi', desc: 'Bir kunda 1000+ zikr', earned: maxDhikrDay >= 1000 },
    { id: 'dhikr_total', icon: '💎', name: 'Zikr Ustasi', desc: 'Jami 10,000+ zikr', earned: totalDhikr >= 10000 },
    { id: 'salawat500', icon: '💚', name: 'Salovat Ustasi', desc: 'Jami 3000+ salovat', earned: totalSalawat >= 3000 },
    { id: 'pages100', icon: '📚', name: 'O\'quvchi', desc: 'Jami 100+ sahifa o\'qish', earned: totalPages >= 100 },
    { id: 'pages500', icon: '📚✨', name: 'Kitobxon', desc: 'Jami 500+ sahifa o\'qish', earned: totalPages >= 500 },
  ];
}
