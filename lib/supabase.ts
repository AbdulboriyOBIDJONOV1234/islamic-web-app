import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { User, DailyEntry } from './types';

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env variables are not set');
  _client = createClient(url, key);
  return _client;
}

// --- User functions ---

export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await getClient()
    .from('users')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getUserByName(name: string): Promise<User | null> {
  const { data, error } = await getClient()
    .from('users')
    .select('*')
    .ilike('name', name)
    .single();
  if (error) return null;
  return data;
}

export async function createUser(name: string): Promise<User> {
  const { data, error } = await getClient()
    .from('users')
    .insert({ name: name.trim() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// --- Entry functions ---

export async function getEntryByDate(userId: string, date: string): Promise<DailyEntry | null> {
  const { data, error } = await getClient()
    .from('daily_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .single();
  if (error) return null;
  return data;
}

export async function upsertEntry(
  userId: string,
  date: string,
  entry: Partial<DailyEntry>
): Promise<DailyEntry> {
  const { data, error } = await getClient()
    .from('daily_entries')
    .upsert(
      {
        user_id: userId,
        date,
        ...entry,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,date' }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getEntriesByRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<DailyEntry[]> {
  const { data, error } = await getClient()
    .from('daily_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getAllEntries(userId: string): Promise<DailyEntry[]> {
  const { data, error } = await getClient()
    .from('daily_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) throw error;
  return data || [];
}
