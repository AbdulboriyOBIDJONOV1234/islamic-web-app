// All client-side localStorage utilities — no DB changes needed

export function getNiyat(userId: string, date: string): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(`niyat_${userId}_${date}`) || '';
}

export function setNiyat(userId: string, date: string, text: string): void {
  localStorage.setItem(`niyat_${userId}_${date}`, text);
}

export interface MonthlyGoals {
  namoz: number;
  dhikr: number;
  salawat: number;
  pages: number;
}

const DEFAULT_GOALS: MonthlyGoals = { namoz: 25, dhikr: 3000, salawat: 3000, pages: 100 };

export function getGoals(userId: string, yearMonth: string): MonthlyGoals {
  if (typeof window === 'undefined') return DEFAULT_GOALS;
  const raw = localStorage.getItem(`goals_${userId}_${yearMonth}`);
  if (!raw) return DEFAULT_GOALS;
  try { return { ...DEFAULT_GOALS, ...JSON.parse(raw) }; } catch { return DEFAULT_GOALS; }
}

export function setGoals(userId: string, yearMonth: string, goals: MonthlyGoals): void {
  localStorage.setItem(`goals_${userId}_${yearMonth}`, JSON.stringify(goals));
}

export interface QuranProgress {
  read: number[]; // surah indices 0-113 that have been read this khatm
  khatmCount: number;
}

export function getQuranProgress(userId: string): QuranProgress {
  if (typeof window === 'undefined') return { read: [], khatmCount: 0 };
  const raw = localStorage.getItem(`quran_${userId}`);
  if (!raw) return { read: [], khatmCount: 0 };
  try { return JSON.parse(raw); } catch { return { read: [], khatmCount: 0 }; }
}

export function setQuranProgress(userId: string, progress: QuranProgress): void {
  localStorage.setItem(`quran_${userId}`, JSON.stringify(progress));
}

export interface DuaChecklist {
  morning: number[];
  evening: number[];
}

export function getDuaChecklist(userId: string, date: string): DuaChecklist {
  if (typeof window === 'undefined') return { morning: [], evening: [] };
  const raw = localStorage.getItem(`dua_${userId}_${date}`);
  if (!raw) return { morning: [], evening: [] };
  try { return JSON.parse(raw); } catch { return { morning: [], evening: [] }; }
}

export function setDuaChecklist(userId: string, date: string, checklist: DuaChecklist): void {
  localStorage.setItem(`dua_${userId}_${date}`, JSON.stringify(checklist));
}

export function getNotifEnabled(userId: string): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(`notif_${userId}`) === 'true';
}

export function setNotifEnabled(userId: string, enabled: boolean): void {
  localStorage.setItem(`notif_${userId}`, enabled ? 'true' : 'false');
}
