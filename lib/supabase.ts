import type { User, DailyEntry } from './types';

const base = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${base}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// --- User functions ---

export async function getAllUsers(): Promise<User[]> {
  return get<User[]>('/api/users');
}

export async function getUserByName(name: string): Promise<User | null> {
  return get<User | null>(`/api/users?name=${encodeURIComponent(name)}`);
}

export async function createUser(name: string): Promise<User> {
  return post<User>('/api/users', { name });
}

// --- Entry functions ---

export async function getEntryByDate(userId: string, date: string): Promise<DailyEntry | null> {
  return get<DailyEntry | null>(`/api/entries?userId=${userId}&date=${date}`);
}

export async function upsertEntry(
  userId: string,
  date: string,
  entry: Partial<DailyEntry>
): Promise<DailyEntry> {
  return post<DailyEntry>('/api/entries', { userId, date, ...entry });
}

export async function getEntriesByRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<DailyEntry[]> {
  return get<DailyEntry[]>(`/api/entries?userId=${userId}&start=${startDate}&end=${endDate}`);
}

export async function getAllEntries(userId: string): Promise<DailyEntry[]> {
  return get<DailyEntry[]>(`/api/entries?userId=${userId}&all=true`);
}
